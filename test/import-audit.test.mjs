import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {auditImportedBot, skillReferences} from '../src/import-audit.mjs';
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
  assert.equal(r.requiresSeparateApproval, true);
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
  assert.equal(r.blocked, false);
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

test('startup routes use the direct-export audit and keep original-only repair and approval rules', () => {
  const recipe = fs.readFileSync(path.join(repo, 'bot/skills/audit-imported-bot.md'), 'utf8');
  assert.match(recipe, /one export message covering every approved skill/);
  assert.match(recipe, /Before any write, show the exact planned file list/);
  assert.match(recipe, /wait for approval/);
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
