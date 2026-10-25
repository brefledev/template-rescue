import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateBundle, preview} from '../src/bundle.mjs';

const root = fileURLToPath(new URL('../bot/', import.meta.url));
const demo = fileURLToPath(new URL('../examples/demo/', import.meta.url));
const revision = 'a'.repeat(40); // Synthetic offline claim.
const inventory = items => ({scope: 'account-wide', complete: true, capturedAt: '2026-10-25T00:00:00Z', items});
const native = (file, overrides = {}) => ({id: file.id, name: file.name, kind: file.kind, content: file.content, enabled: false, ...overrides});

function manifestFixture(t, mutate) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'unfinished-botness-rebrand-'));
  fs.cpSync(root, dir, {recursive: true});
  t.after(() => {
    assert.equal(path.dirname(dir), path.resolve(os.tmpdir()));
    assert.ok(path.basename(dir).startsWith('unfinished-botness-rebrand-'));
    fs.rmSync(dir, {recursive: true, force: true});
  });
  const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
  mutate(manifest);
  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest));
  return dir;
}

test('helper display names change while all eight stable identities remain recognized', () => {
  const bundle = validateBundle(root);
  assert.equal(bundle.manifest.namespace, 'template-rescue');
  assert.deepEqual(bundle.payloads.map(f => f.id), [
    'template-rescue/getting-started', 'template-rescue/verify-template-source',
    'template-rescue/reconstruct-screenshots', 'template-rescue/review-and-update',
    'template-rescue/bot-instructions', 'template-rescue/routine-policy',
    'template-rescue/self-reference', 'template-rescue/export-creator-bot'
  ]);
  for (const file of bundle.payloads) {
    assert.ok(file.name.startsWith('Patch Cassidy / '));
    assert.deepEqual(file.legacyNames, [file.name.replace('Patch Cassidy / ', 'template-rescue / ')]);
    if (file.kind === 'skill') assert.ok(file.content.startsWith(`# ${file.name}\n`));
  }
  const reference = JSON.parse(bundle.payloads.find(f => f.kind === 'reference').content);
  assert.equal(reference.projectName, 'Unfinished Botness');
  assert.equal(reference.helperName, 'Patch Cassidy');
  const plan = preview(bundle, inventory([]), revision);
  assert.equal(plan.blocked, false);
  assert.equal(plan.operations.filter(o => o.action === 'propose-create-only').length, 5);
  assert.ok(plan.operations.every(o => o.name.startsWith('Patch Cassidy / ')));
});

test('older manifests without legacyNames and namespace-prefixed display names still validate', () => {
  const bundle = validateBundle(demo);
  assert.ok(bundle.payloads.every(f => !Object.hasOwn(f, 'legacyNames')));
  assert.equal(preview(bundle, inventory([]), revision).blocked, false);
});

test('empty aliases and multiple distinct former names are supported', t => {
  const empty = manifestFixture(t, m => {m.files[0].legacyNames = [];});
  assert.deepEqual(validateBundle(empty).payloads[0].legacyNames, []);
  const dir = manifestFixture(t, m => {m.files[0].legacyNames.push('Template Rescue: Getting started');});
  const bundle = validateBundle(dir), file = bundle.payloads[0];
  const op = preview(bundle, inventory([native(file, {id: 'older-native', name: file.legacyNames[1]})]), revision).operations[0];
  assert.equal(op.action, 'blocked-collision');
});

test('display names are independent of stable namespaces while IDs remain namespaced', t => {
  const dir = manifestFixture(t, m => {m.files[0].name = 'An authored display name';});
  assert.equal(validateBundle(dir).payloads[0].name, 'An authored display name');
  const bad = manifestFixture(t, m => {m.files[0].id = 'patch-cassidy/getting-started';});
  assert.throws(() => validateBundle(bad), /namespaced ID/);
});

for (const enabled of [false, true]) {
  test(`legacy names with opaque native IDs block duplicate creation (enabled=${enabled})`, () => {
    const bundle = validateBundle(root);
    const files = bundle.payloads.filter(f => f.kind === 'skill');
    const items = files.map((f, index) => native(f, {id: `native-${index}`, name: f.legacyNames[0], enabled}));
    const before = structuredClone(items);
    const plan = preview(bundle, inventory(items), revision);
    assert.equal(plan.blocked, true);
    assert.equal(plan.accountWrites, false);
    for (const item of items) {
      const op = plan.operations.find(o => o.existingMatches.some(m => m.id === item.id));
      assert.equal(op.action, 'blocked-collision');
      assert.equal(op.currentEnabled, enabled);
      assert.deepEqual(op.existingMatches, [{id: item.id, name: item.name, kind: item.kind}]);
    }
    assert.deepEqual(items, before);
  });
}

test('stable ID catches an existing skill even after a user renames it', () => {
  const bundle = validateBundle(root), file = bundle.payloads[0];
  const op = preview(bundle, inventory([native(file, {name: 'My custom helper'})]), revision).operations[0];
  assert.equal(op.action, 'blocked-collision');
  assert.equal(op.existingMatches[0].id, file.id);
});

test('legacy name matching normalizes Unicode, surrounding whitespace and case', () => {
  const bundle = validateBundle(root), file = bundle.payloads[0];
  const name = '  TEMPLATE-RESCUE / ＧＥＴＴＩＮＧ ＳＴＡＲＴＥＤ  ';
  assert.equal(preview(bundle, inventory([native(file, {id: 'opaque', name})]), revision).operations[0].action, 'blocked-collision');
});

test('unknown, changed or wrong-kind legacy assets all block creation', () => {
  const bundle = validateBundle(root), file = bundle.payloads[0];
  for (const overrides of [{content: null}, {content: 'User edits'}, {kind: 'routine'}]) {
    const item = native(file, {id: 'opaque', name: file.legacyNames[0], ...overrides});
    const plan = preview(bundle, inventory([item]), revision);
    assert.equal(plan.blocked, true);
    assert.equal(plan.operations[0].action, 'blocked-collision');
  }
});

test('current exact identity and content remain a no-op with enabled state preserved', () => {
  const bundle = validateBundle(root), file = bundle.payloads[0];
  const op = preview(bundle, inventory([native(file, {enabled: true})]), revision).operations[0];
  assert.equal(op.action, 'no-op');
  assert.equal(op.proposedEnabled, true);
});

test('current display name with an opaque native ID blocks creation', () => {
  const bundle = validateBundle(root), file = bundle.payloads[0];
  assert.equal(preview(bundle, inventory([native(file, {id: 'opaque'})]), revision).operations[0].action, 'blocked-collision');
});

test('split stable-ID, current-name and legacy-name matches report every collision with stable replay', () => {
  const bundle = validateBundle(root), file = bundle.payloads[0];
  const items = [native(file, {name: 'Custom'}), native(file, {id: 'native-current'}), native(file, {id: 'native-old', name: file.legacyNames[0]})];
  const first = preview(bundle, inventory(items), revision);
  const second = preview(bundle, inventory([...items].reverse()), revision);
  assert.equal(first.operations[0].action, 'blocked-collision');
  assert.equal(first.operations[0].existingMatches.length, 3);
  assert.equal(first.planDigest, second.planDigest);
});

test('partial installation proposes only genuinely absent helper skills', () => {
  const bundle = validateBundle(root), file = bundle.payloads[0];
  const plan = preview(bundle, inventory([native(file, {id: 'old-native', name: file.legacyNames[0]})]), revision);
  assert.equal(plan.operations[0].action, 'blocked-collision');
  assert.equal(plan.operations.filter(o => o.action === 'propose-create-only').length, 4);
  assert.equal(plan.blocked, true);
});

test('malformed or excessive aliases and blank/multiline names are rejected', t => {
  for (const value of [null, 'Old name', [null], [''], ['   '], ['line\nbreak'], ['x'.repeat(161)], Array(17).fill('Old name')]) {
    assert.throws(() => validateBundle(manifestFixture(t, m => {m.files[0].legacyNames = value;})), /legacy names/);
  }
  for (const value of ['', '  ', '\t', 'line\nbreak', 'line\rbreak', 'line\u2028break', 'x'.repeat(161)]) {
    assert.throws(() => validateBundle(manifestFixture(t, m => {m.files[0].name = value;})), /display name/);
  }
});

test('current/legacy and legacy/legacy overlaps are rejected within and across entries', t => {
  const mutations = [
    m => {m.files[0].legacyNames = [m.files[0].name];},
    m => {m.files[0].legacyNames.push('  TEMPLATE-RESCUE / ＧＥＴＴＩＮＧ ＳＴＡＲＴＥＤ  ');},
    m => {m.files[1].name = m.files[0].legacyNames[0];},
    m => {m.files[1].legacyNames = [m.files[0].name];},
    m => {m.files[1].legacyNames = m.files[0].legacyNames;}
  ];
  for (const mutate of mutations) assert.throws(() => validateBundle(manifestFixture(t, mutate)), /Duplicate/);
});

test('legacyNames remain the only new optional file field and required fields stay required', t => {
  assert.throws(() => validateBundle(manifestFixture(t, m => {m.files[0].aliases = ['Unreviewed'];})), /fields/);
  assert.throws(() => validateBundle(manifestFixture(t, m => {delete m.files[0].name;})), /fields/);
});
