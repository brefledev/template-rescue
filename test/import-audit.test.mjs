import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {auditImportedBot, skillReferences, parseSkillFile} from '../src/import-audit.mjs';
import {sha256} from '../src/bundle.mjs';

const repo = fileURLToPath(new URL('../', import.meta.url));
function fixture(t, body = 'Read the note.\n') {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'unfinished-botness-audit-'));
  t.after(() => {
    assert.equal(path.dirname(root), path.resolve(os.tmpdir()));
    assert.ok(path.basename(root).startsWith('unfinished-botness-audit-'));
    fs.rmSync(root, {recursive: true, force: true});
  });
  const metadata = {name: 'Review note', description: 'Review the supplied note.'};
  const content = `---\n${JSON.stringify(metadata)}\n---\n${body}`;
  fs.writeFileSync(path.join(root, 'review-note.md'), content);
  const inventory = {schemaVersion: 1, botName: 'Example Bot', complete: true,
    skills: [{...metadata, path: 'review-note.md', bytes: Buffer.byteLength(content)}]};
  const save = () => fs.writeFileSync(path.join(root, 'inventory.json'), JSON.stringify(inventory));
  save();
  return {root, metadata, inventory, save, content};
}

test('full UTF-8 bodies are hashed from bytes and matching metadata passes without fidelity claims', t => {
  const body = 'Read café and 🦉.\r\n'.repeat(1000);
  const f = fixture(t, body);
  const r = auditImportedBot(f.root, [f.metadata]);
  assert.ok(r.checks.every(c => c.status === 'PASS'));
  assert.equal(r.files[0].sha256, sha256(Buffer.from(f.content)));
  assert.equal(r.files[0].bodySha256, sha256(Buffer.from(body)));
  assert.equal(r.files[0].bodyBytes, Buffer.byteLength(body));
  assert.equal(r.status, 'UNVERIFIED');
  assert.equal(r.accountWrites, false);
  assert.equal(r.fileWrites, false);
  assert.equal(r.requiresSeparateApproval, false);
  assert.equal(r.nativeChangesRequireSeparateApproval, true);
});

test('missing listed skill, changed description and missing reference produce separate failures', t => {
  const f = fixture(t, 'Load video-format-movie.\n');
  const r = auditImportedBot(f.root, [{...f.metadata, description: 'Original description'}, {name: 'Missing skill', description: 'Original purpose'}]);
  assert.equal(r.status, 'FAIL');
  assert.deepEqual(r.missingSkills.map(x => x.name), ['Missing skill']);
  assert.deepEqual(r.extraSkills, []);
  assert.equal(r.missingReferences[0].status, 'referenced but not installed');
  assert.equal(r.missingReferences[0].name, 'video-format-movie');
  assert.equal(r.missingReferences[0].line, 1);
  assert.ok(r.checks.some(x => x.detail.includes('description differs')));
});

test('missing bytes and metadata tampering fail while other bodies still get scanned', t => {
  const f = fixture(t, 'Use video-format-movie.\n');
  f.inventory.skills[0].bytes++;
  f.inventory.skills[0].description = 'Changed';
  f.inventory.skills.push({name: 'Lost file', description: 'Unreadable file', path: 'lost-file.md', bytes: 20});
  f.save();
  const r = auditImportedBot(f.root);
  assert.equal(r.files.length, 1);
  assert.equal(r.checks.filter(c => c.status === 'FAIL').length, 3);
  assert.ok(r.checks.some(c => c.detail.includes('byte count differs')));
});

test('partial inventory and unavailable body remain unknown instead of establishing absence', t => {
  const f = fixture(t, 'load video-format-movie');
  f.inventory.complete = false;
  f.inventory.skills.push({name: 'Unreadable', description: 'Present with unavailable text', path: null, bytes: null, error: 'Native read unsupported'});
  f.save();
  const r = auditImportedBot(f.root, [{name: 'Maybe missing', description: 'Expected'}]);
  assert.equal(r.missingReferences[0].status, 'reference installation unverified');
  assert.equal(r.missingSkills[0].status, 'installation unverified');
  assert.ok(r.checks.some(c => c.name === 'Unreadable' && c.status === 'UNVERIFIED'));
  assert.equal(r.blocked, true);
  assert.deepEqual(r.extraSkills, ['Review note', 'Unreadable']);
});

test('known installed names and filename aliases satisfy references even when a body is unavailable', t => {
  const f = fixture(t, 'Load review-note. Use `Review note`. Invoke "Unreadable".');
  f.inventory.skills.push({name: 'Unreadable', description: 'Installed', path: null, bytes: null, error: 'Read unavailable'});
  f.save();
  assert.deepEqual(auditImportedBot(f.root).missingReferences, []);
});

test('scanner covers quoted display names, links and final body line with precise source evidence', () => {
  const refs = skillReferences('Use `Movie Format`.\n[format](skills/video-format-movie/SKILL.md)\n[note](skills/note-review.md)\ninvoke final-helper');
  assert.deepEqual(refs.map(r => r.name), ['Movie Format', 'video-format-movie', 'note-review', 'final-helper']);
  assert.equal(refs.at(-1).line, 4);
  assert.equal(refs.at(-1).text, 'invoke final-helper');
});

test('absence of expected list explicitly limits comparison', t => {
  const f = fixture(t);
  assert.ok(auditImportedBot(f.root).checks.some(c => c.name === 'Expected template list' && c.status === 'UNVERIFIED'));
});

test('empty and malformed bodies cannot pass as exported skills', t => {
  const empty = fixture(t, '');
  assert.equal(auditImportedBot(empty.root).status, 'FAIL');
  fs.writeFileSync(path.join(empty.root, 'review-note.md'), 'Short description only');
  assert.equal(auditImportedBot(empty.root).files.length, 1);
  assert.equal(auditImportedBot(empty.root).status, 'FAIL');
});

test('unsafe paths and duplicate names/paths are rejected before reading exports', t => {
  for (const value of ['../outside.md', 'C:/outside.md', '/outside.md', 'con.md']) {
    const f = fixture(t);
    f.inventory.skills[0].path = value; f.save();
    assert.throws(() => auditImportedBot(f.root), /Unsafe/);
  }
  const f = fixture(t);
  f.inventory.skills.push({...f.inventory.skills[0], name: 'ＲＥＶＩＥＷ ＮＯＴＥ'}); f.save();
  assert.throws(() => auditImportedBot(f.root), /Duplicate exported name/);
  f.inventory.skills[1].name = 'Distinct'; f.save();
  assert.throws(() => auditImportedBot(f.root), /duplicate/);
});

test('unexpected entries, oversize and invalid UTF-8 exports fail safely', t => {
  const f = fixture(t);
  fs.mkdirSync(path.join(f.root, 'unexpected'));
  assert.equal(auditImportedBot(f.root).status, 'FAIL');
  fs.writeFileSync(path.join(f.root, 'review-note.md'), Buffer.from([0xff]));
  assert.equal(auditImportedBot(f.root).files.length, 0);
  fs.writeFileSync(path.join(f.root, 'review-note.md'), Buffer.alloc(65537));
  assert.equal(auditImportedBot(f.root).files.length, 0);
});

test('CLI emits the file set, pass/fail checks, missing references and summary without writes', t => {
  const f = fixture(t, 'Load video-format-movie.');
  const before = fs.readdirSync(f.root);
  const run = spawnSync(process.execPath, ['src/cli.mjs', 'audit-import', f.root], {cwd: repo, encoding: 'utf8'});
  assert.equal(run.status, 2, run.stderr);
  const r = JSON.parse(run.stdout);
  assert.equal(r.files.length, 1);
  assert.ok(r.checks.some(c => c.status === 'PASS'));
  assert.equal(r.missingReferences.length, 1);
  assert.match(r.summary, /1 skill files read/);
  assert.deepEqual(fs.readdirSync(f.root), before);
  assert.equal(fs.readFileSync(path.join(f.root, 'review-note.md'), 'utf8'), f.content);
});

test('startup routes use the direct-export audit and keep original-only repair and native approval rules', () => {
  const recipe = fs.readFileSync(path.join(repo, 'bot/skills/audit-imported-bot.md'), 'utf8');
  assert.match(recipe, /one export message covering every selected skill/);
  assert.match(recipe, /audit <bot>/);
  assert.match(recipe, /authorizes local audit writes/);
  assert.match(recipe, /Native changes require separate/);
  assert.match(recipe, /Never ask the user to copy or relay/);
  assert.match(recipe, /real original full text and description/);
  assert.match(recipe, /bug-report summary/);
  for (const file of ['bot/INSTRUCTIONS.md', 'bot/skills/getting-started.md', 'GETTING_STARTED.md']) {
    const text = fs.readFileSync(path.join(repo, file), 'utf8');
    assert.match(text, /audit-imported-bot\.md/);
    assert.match(text, /last resort/);
    assert.doesNotMatch(text, /If no exact same-creator repository is verified, ask me for ordered/);
  }
});

// Exact excerpt supplied in the bug report; later examples below are synthetic.
const directorLine = 'Load the matching format skill: music video → video-format-music-video; acted story → video-format-movie; …';

test('Director arrow/semicolon regression catches the absent format without an adjacent load/use verb', () => {
  const installed = ['video-director', 'video-format-music-video'];
  const absent = skillReferences(directorLine, installed).filter(ref => !installed.includes(ref.name));
  assert.deepEqual(absent.map(ref => ref.name), ['video-format-movie']);
  assert.equal(absent[0].text, directorLine);
});

test('same-prefix references anywhere in prose are conservative candidates; installed tokens are excluded by audit', t => {
  const f = fixture(t, directorLine + '\nshort drama → video-format-microdrama; product ad → video-format-ugc-ad; video-format-movie\n');
  f.inventory.skills.push({name: 'video-format-music-video', description: 'Installed format', path: null, bytes: null, error: 'Body unavailable in this fixture'});
  f.save();
  const result = auditImportedBot(f.root);
  assert.deepEqual([...new Set(result.missingReferences.map(ref => ref.name))].sort(), ['video-format-microdrama', 'video-format-movie', 'video-format-ugc-ad']);
  assert.equal(result.status, 'FAIL');
  assert.ok(result.missingReferences.every(ref => ref.status === 'referenced but not installed'));
  assert.ok(result.missingReferences.every(ref => ref.text.includes('→')));
});

test('frontmatter accepts JSON, plain YAML, quoted scalars, folded descriptions and CRLF without changing bodies', () => {
  for (const header of [
    '{"name":"video-director","description":"Plan a scene: choose a format."}',
    'name: video-director\ndescription: Plan a scene: choose a format.',
    'name: "video-director" # a comment\ndescription: \'Plan a scene: choose a format.\'',
    'name: video-director\ndescription: >-\n  Plan a scene:\n  choose a format.'
  ]) {
    const body = 'Read café.\r\nKeep 🦉 bytes.';
    const parsed = parseSkillFile('---\r\n' + header.replaceAll('\n', '\r\n') + '\r\n---\r\n' + body);
    assert.deepEqual(parsed.metadata, {name: 'video-director', description: 'Plan a scene: choose a format.'});
    assert.equal(parsed.body, body);
  }
  assert.equal(parseSkillFile("---\nname: video-director\ndescription: 'It''s a scene.'\n---\nBody").metadata.description, "It's a scene.");
});

test('ten YAML exports without inventory produce a measured inventory and all three missing-format candidates', t => {
  const f = fixture(t);
  // Replace only this fixture's inventory with ten freshly authored synthetic exports.
  fs.unlinkSync(path.join(f.root, 'inventory.json'));
  const names = ['video-director', 'video-format-music-video', ...Array.from({length: 7}, (_, i) => `video-helper-${i}`)];
  for (const name of names) {
    const body = name === 'video-director' ? directorLine + '\nshort drama → video-format-microdrama; product ad → video-format-ugc-ad' : 'Read the supplied source.';
    fs.writeFileSync(path.join(f.root, `${name}.md`), `---\nname: ${name}\ndescription: Synthetic audit fixture.\n---\n${body}`);
  }
  const before = new Map(fs.readdirSync(f.root).map(name => [name, fs.readFileSync(path.join(f.root, name))]));
  const run = spawnSync(process.execPath, ['src/cli.mjs', 'audit-import', f.root], {cwd: repo, encoding: 'utf8'});
  assert.equal(run.status, 2, run.stderr);
  const r = JSON.parse(run.stdout);
  assert.equal(r.files.length, 10);
  assert.equal(r.inventoryCreated, true);
  assert.equal(r.fileWrites, true);
  assert.equal(r.accountWrites, false);
  assert.equal(r.inventorySource, 'derived-from-files');
  assert.deepEqual([...new Set(r.missingReferences.map(ref => ref.name))].sort(), ['video-format-microdrama', 'video-format-movie', 'video-format-ugc-ad']);
  assert.ok(r.missingReferences.every(ref => ref.status === 'reference installation unverified'));
  const inventoryPath = path.join(f.root, 'inventory.json');
  const saved = fs.readFileSync(inventoryPath, 'utf8');
  const inventory = JSON.parse(saved);
  assert.equal(inventory.complete, false);
  assert.equal(inventory.skills.length, 10);
  for (const skill of inventory.skills) assert.equal(skill.bytes, fs.statSync(path.join(f.root, skill.path)).size);
  for (const [name, bytes] of before) assert.deepEqual(fs.readFileSync(path.join(f.root, name)), bytes);
  const replay = auditImportedBot(f.root);
  assert.equal(replay.inventoryCreated, false);
  assert.equal(replay.fileWrites, false);
  assert.equal(fs.readFileSync(inventoryPath, 'utf8'), saved);
});

test('malformed YAML and duplicate derived names fail before creating inventory', t => {
  for (const header of ['name: video-director\nname: another\ndescription: Example', 'name: video-director\ndescription: "unterminated', 'name: video-director\ndescription: !run unsafe']) {
    assert.throws(() => parseSkillFile(`---\n${header}\n---\nBody`));
  }
  const f = fixture(t);
  fs.unlinkSync(path.join(f.root, 'inventory.json'));
  fs.writeFileSync(path.join(f.root, 'duplicate.md'), f.content);
  assert.throws(() => auditImportedBot(f.root), /Duplicate exported name/);
  assert.equal(fs.existsSync(path.join(f.root, 'inventory.json')), false);
});

test('audit preserves a malformed existing inventory instead of rebuilding over it', t => {
  const f = fixture(t);
  const inventoryPath = path.join(f.root, 'inventory.json');
  fs.writeFileSync(inventoryPath, '{bad JSON');
  assert.throws(() => auditImportedBot(f.root));
  assert.equal(fs.readFileSync(inventoryPath, 'utf8'), '{bad JSON');
});
