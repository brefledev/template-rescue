import fs from 'node:fs';
import path from 'node:path';
import {read, readJson, sha256, LIMITS} from './bundle.mjs';

const fold = value => value.normalize('NFKC').trim().toLowerCase();
const label = value => typeof value === 'string' && value.trim().length > 0 && value.length <= 512 && !/[\r\n\0]/.test(value);
const filename = value => typeof value === 'string' && /^[a-z][a-z0-9-]{0,100}\.md$/.test(value) && !/^(con|prn|aux|nul|com[1-9]|lpt[1-9])\.md$/.test(value);

// Candidates require human review for prose, examples, aliases and conditional use.
export function skillReferences(body) {
  const found = [];
  body.split(/\r?\n/).forEach((text, index) => {
    const patterns = [
      /\b(?:load|use|invoke|run|require|requires)\s+(?:the\s+)?(?:skill\s+)?(?:`([^`]+)`|"([^"]+)"|'([^']+)'|([a-z][a-z0-9]*(?:[-/][a-z0-9]+)+))/gi,
      /\[[^\]]+\]\((?:\.\/)?(?:skills\/)([a-z][a-z0-9-]*)\/(?:SKILL\.md)\)/gi,
      /\[[^\]]+\]\((?:\.\/)?(?:skills\/)([a-z][a-z0-9-]*)\.md\)/gi
    ];
    for (const pattern of patterns) for (const match of text.matchAll(pattern)) {
      const name = match.slice(1).find(Boolean).trim();
      if (!found.some(item => item.line === index + 1 && fold(item.name) === fold(name))) found.push({name, line: index + 1, text});
    }
  });
  return found;
}

function checkNames(items, kind) {
  if (!Array.isArray(items) || items.length > LIMITS.files) throw new Error(`Invalid ${kind} list`);
  const names = new Set();
  for (const item of items) {
    if (!item || !label(item.name) || !label(item.description)) throw new Error(`Missing ${kind} name/description`);
    if (names.has(fold(item.name))) throw new Error(`Duplicate ${kind} name: ${item.name}`);
    names.add(fold(item.name));
  }
}

export function auditImportedBot(root, expected = null) {
  root = path.resolve(root);
  if (fs.lstatSync(root).isSymbolicLink() || !fs.lstatSync(root).isDirectory()) throw new Error('Unsafe audit root');
  const inventory = readJson(path.join(root, 'inventory.json'));
  if (inventory.schemaVersion !== 1 || !label(inventory.botName) || typeof inventory.complete !== 'boolean') throw new Error('Invalid export inventory');
  checkNames(inventory.skills, 'exported');
  if (expected !== null) checkNames(expected, 'expected');
  const paths = new Set(['inventory.json']);
  let declaredBytes = 0;
  for (const skill of inventory.skills) {
    if (skill.error !== undefined) {
      if (!label(skill.error) || skill.path !== null || skill.bytes !== null) throw new Error('Unreadable skills require error, null path and null bytes');
    } else {
      if (!filename(skill.path) || paths.has(skill.path) || !Number.isSafeInteger(skill.bytes) || skill.bytes < 1 || skill.bytes > LIMITS.file) throw new Error('Unsafe, duplicate or oversized skill path/bytes');
      paths.add(skill.path);
      declaredBytes += skill.bytes;
    }
  }
  if (declaredBytes > LIMITS.total) throw new Error('Aggregate export byte limit');
  const checks = [], files = [], references = [];
  const add = (status, name, detail) => checks.push({status, name, detail});
  const directory = fs.opendirSync(root);
  let entry, entryCount = 0;
  try {
    while ((entry = directory.readSync()) !== null) {
      if (++entryCount > LIMITS.entries) throw new Error('Audit directory entry limit');
      if (!paths.has(entry.name) || !entry.isFile() || entry.isSymbolicLink()) add('FAIL', entry.name, 'Unexpected or unsafe export entry; skipped');
    }
  } finally { directory.closeSync(); }
  let totalBytes = 0;
  for (const skill of inventory.skills) {
    if (skill.error) { add('UNVERIFIED', skill.name, `Installed according to bot; body unavailable: ${skill.error}`); continue; }
    try {
      const bytes = read(path.join(root, skill.path), LIMITS.file);
      totalBytes += bytes.length;
      if (totalBytes > LIMITS.total) throw new Error('Aggregate export byte limit');
      const content = bytes.toString('utf8');
      const file = {name: skill.name, path: skill.path, bytes: bytes.length, sha256: sha256(bytes)};
      files.push(file);
      const match = /^---\r?\n([^\r\n]+)\r?\n---\r?\n/.exec(content);
      if (!match) throw new Error('Expected one JSON metadata line between --- delimiters');
      const metadata = JSON.parse(match[1]);
      if (!label(metadata.name) || !label(metadata.description)) throw new Error('Invalid file metadata');
      const body = content.slice(match[0].length);
      Object.assign(file, {bodyBytes: Buffer.byteLength(body), bodySha256: sha256(Buffer.from(body))});
      const issues = [];
      if (bytes.length !== skill.bytes) issues.push(`byte count differs: bot ${skill.bytes}, file ${bytes.length}`);
      if (metadata.name !== skill.name || metadata.description !== skill.description) issues.push('file metadata differs from inventory');
      if (!body.trim()) issues.push('empty skill body');
      add(issues.length ? 'FAIL' : 'PASS', skill.name, issues.length ? issues.join('; ') : 'Export file, name, description and reported bytes agree');
      for (const reference of skillReferences(body)) references.push({sourceSkill: skill.name, ...reference});
    } catch (error) { add('FAIL', skill.name, `Export unreadable: ${error.message}`); }
  }
  const installed = new Set(inventory.skills.flatMap(skill => [fold(skill.name), ...(skill.path ? [fold(skill.path.slice(0, -3))] : [])]));
  const missingReferences = references.filter(ref => !installed.has(fold(ref.name))).map(ref => ({
    ...ref,
    status: inventory.complete ? 'referenced but not installed' : 'reference installation unverified',
    basis: 'Bot-reported inventory; review the quoted body line before treating this candidate as a dependency'
  }));
  for (const ref of missingReferences) add(inventory.complete ? 'FAIL' : 'UNVERIFIED', ref.name, `${ref.status}; ${ref.sourceSkill} body line ${ref.line}`);
  const missingSkills = [];
  const extraSkills = expected === null ? [] : inventory.skills.filter(skill => !expected.some(item => fold(item.name) === fold(skill.name))).map(skill => skill.name);
  for (const name of extraSkills) add('PASS', name, 'Present in bot-reported inventory; outside the supplied expected list');
  if (expected === null) add('UNVERIFIED', 'Expected template list', 'No expected list supplied; original template completeness unverified');
  else for (const item of expected) {
    const actual = inventory.skills.find(skill => fold(skill.name) === fold(item.name));
    if (!actual) {
      missingSkills.push({name: item.name, status: inventory.complete ? 'missing from bot-reported installed inventory' : 'installation unverified'});
      add(inventory.complete ? 'FAIL' : 'UNVERIFIED', item.name, missingSkills.at(-1).status);
    } else {
      const same = actual.name === item.name && actual.description === item.description;
      add(same ? 'PASS' : 'FAIL', item.name, same ? 'Name and description match supplied list' : 'Name or description differs from supplied list');
    }
  }
  if (!inventory.complete) add('UNVERIFIED', 'Installed inventory', 'Bot reports partial enumeration; absence cannot be established');
  const unverified = [
    'Template bodies before import and equality to original marketplace source',
    'Bot-reported inventory completeness and native enabled state',
    'Instructions, memories and routines outside this skill-only export',
    'References expressed outside the scanner patterns; helper must read every full body'
  ];
  const failed = checks.some(item => item.status === 'FAIL');
  const checkSummary = failed ? 'Checks failed.' : checks.some(item => item.status === 'UNVERIFIED') ? 'Some checks remain unverified.' : 'File checks passed.';
  const summary = `${files.length} skill files read; ${missingSkills.length} expected skills absent from the export inventory; ${missingReferences.length} unresolved reference candidates. ${checkSummary} Original template completeness and other bot settings remain unverified.`;
  return {botName: inventory.botName, status: failed ? 'FAIL' : 'UNVERIFIED', blocked: failed,
    files, checks, missingSkills, extraSkills, missingReferences, unverified, summary,
    accountWrites: false, fileWrites: false, requiresSeparateApproval: true};
}
