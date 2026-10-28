import fs from 'node:fs';
import path from 'node:path';
import {read, readJson, sha256, LIMITS} from './bundle.mjs';

const fold = value => value.normalize('NFKC').trim().toLowerCase();
const label = value => typeof value === 'string' && value.trim().length > 0 && value.length <= 512 && !/[\r\n\0]/.test(value);
const filename = value => typeof value === 'string' && /^[a-z][a-z0-9-]{0,100}\.md$/.test(value) && !/^(con|prn|aux|nul|com[1-9]|lpt[1-9])\.md$/.test(value);

// Candidates require human review for prose, examples, aliases and conditional use.
export function skillReferences(body, installedNames = []) {
  const prefixes = new Set(installedNames.map(name => /^([a-z][a-z0-9]*)-/.exec(name)?.[1]).filter(Boolean));
  const found = [];
  body.split(/\r?\n/).forEach((text, index) => {
    const patterns = [
      /\b(?:load|use|invoke|run|require|requires)\s+(?:the\s+)?(?:skill\s+)?(?:`([^`]+)`|"([^"]+)"|'([^']+)'|([a-z][a-z0-9]*(?:(?:[-/][a-z0-9]+)+(?:-\*)?|-\*)))/gi,
      /\[[^\]]+\]\((?:\.\/)?(?:skills\/)([a-z][a-z0-9-]*(?:-\*)?)\/(?:SKILL\.md)\)/gi,
      /\[[^\]]+\]\((?:\.\/)?(?:skills\/)([a-z][a-z0-9-]*(?:-\*)?)\.md\)/gi
    ];
    for (const pattern of patterns) for (const match of text.matchAll(pattern)) {
      const name = match.slice(1).find(Boolean).trim();
      if (!found.some(item => item.line === index + 1 && fold(item.name) === fold(name))) found.push({name, line: index + 1, text});
    }
    // Tables, arrows and semicolon lists often name skills without an adjacent verb.
    // Prefer an explicit candidate over silence, including in examples and URLs.
    for (const match of text.matchAll(/\b[a-z][a-z0-9]*(?:(?:-[a-z0-9]+)+(?:-\*)?|-\*)/g)) {
      const name = match[0];
      if (prefixes.has(name.split('-')[0]) && !found.some(item => item.line === index + 1 && fold(item.name) === fold(name))) found.push({name, line: index + 1, text});
    }
  });
  return found;
}

export function parseSkillFile(content) {
  const wrapper = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(content);
  if (!wrapper) throw new Error('Expected JSON or name:/description: frontmatter between --- delimiters');
  const header = wrapper[1];
  let metadata;
  if (header.trim().startsWith('{')) metadata = JSON.parse(header);
  else {
    metadata = {};
    const lines = header.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const field = /^(name|description):[ \t]*(.*)$/.exec(lines[i]);
      if (!field) continue;
      const [, key, raw] = field;
      if (Object.hasOwn(metadata, key)) throw new Error(`Duplicate frontmatter ${key}`);
      let value = raw.trim();
      if (/^[>|]-?$/.test(value)) {
        const parts = [];
        while (i + 1 < lines.length && /^(?:[ \t]+\S|\s*$)/.test(lines[i + 1])) parts.push(lines[++i].trim());
        value = value.startsWith('>') ? parts.join(' ') : parts.join('\n');
      } else if (value.startsWith('"')) {
        const quoted = /^"(?:[^"\\]|\\.)*"/.exec(value);
        if (!quoted || !/^\s*(?:#.*)?$/.test(value.slice(quoted[0].length))) throw new Error(`Invalid quoted ${key}`);
        value = JSON.parse(quoted[0]);
      } else if (value.startsWith("'")) {
        const quoted = /^'((?:[^']|'')*)'/.exec(value);
        if (!quoted || !/^\s*(?:#.*)?$/.test(value.slice(quoted[0].length))) throw new Error(`Invalid quoted ${key}`);
        value = quoted[1].replace(/''/g, "'");
      } else {
        if (/^[!&*\[\]{]|^(?:null|true|false|~)$/.test(value)) throw new Error(`Unsupported frontmatter ${key}`);
        value = value.replace(/\s+#.*$/, '').trimEnd();
      }
      metadata[key] = value;
    }
  }
  if (!metadata || !label(metadata.name) || !label(metadata.description)) throw new Error('Invalid file name/description metadata');
  return {metadata, body: content.slice(wrapper[0].length)};
}

function buildInventory(root) {
  const directory = fs.opendirSync(root), skills = [];
  let entry, count = 0, total = 0;
  try {
    while ((entry = directory.readSync()) !== null) {
      if (++count > LIMITS.entries) throw new Error('Audit directory entry limit');
      if (!entry.isFile() || entry.isSymbolicLink() || !filename(entry.name)) throw new Error(`Cannot derive inventory from unsafe or unexpected entry: ${entry.name}`);
      if (skills.length >= LIMITS.files) throw new Error('Exported skill count limit');
      const bytes = read(path.join(root, entry.name), LIMITS.file);
      total += bytes.length;
      if (total > LIMITS.total) throw new Error('Aggregate export byte limit');
      const {metadata} = parseSkillFile(bytes.toString('utf8'));
      skills.push({name: metadata.name, description: metadata.description, path: entry.name, bytes: bytes.length});
    }
  } finally { directory.closeSync(); }
  if (!skills.length) throw new Error('No exported skill files found');
  skills.sort((a, b) => a.path.localeCompare(b.path));
  checkNames(skills, 'exported');
  const inventory = {schemaVersion: 1, botName: path.basename(root), complete: false, inventorySource: 'derived-from-files', skills};
  const serialized = JSON.stringify(inventory, null, 2) + '\n';
  if (Buffer.byteLength(serialized) > LIMITS.json) throw new Error('Derived inventory byte limit');
  // Explicit audit invocation authorizes this local metadata file. Preserve exports
  // and any inventory that appeared since the initial check.
  fs.writeFileSync(path.join(root, 'inventory.json'), serialized, {encoding: 'utf8', flag: 'wx'});
  return inventory;
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
  if (expected !== null) checkNames(expected, 'expected');
  const inventoryPath = path.join(root, 'inventory.json');
  let inventory, inventoryCreated = false;
  try { fs.lstatSync(inventoryPath); }
  catch (error) {
    if (error.code !== 'ENOENT') throw error;
    inventory = buildInventory(root);
    inventoryCreated = true;
  }
  inventory ??= readJson(inventoryPath);
  if (inventory.schemaVersion !== 1 || !label(inventory.botName) || typeof inventory.complete !== 'boolean') throw new Error('Invalid export inventory');
  checkNames(inventory.skills, 'exported');
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
  const installedNames = inventory.skills.flatMap(skill => [skill.name, ...(skill.path ? [skill.path.slice(0, -3)] : [])]);
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
      const {metadata, body} = parseSkillFile(content);
      Object.assign(file, {bodyBytes: Buffer.byteLength(body), bodySha256: sha256(Buffer.from(body))});
      const issues = [];
      if (bytes.length !== skill.bytes) issues.push(`byte count differs: bot ${skill.bytes}, file ${bytes.length}`);
      if (metadata.name !== skill.name || metadata.description !== skill.description) issues.push('file metadata differs from inventory');
      if (!body.trim()) issues.push('empty skill body');
      add(issues.length ? 'FAIL' : 'PASS', skill.name, issues.length ? issues.join('; ') : inventory.inventorySource === 'derived-from-files' ? 'Parsed name/description and measured saved bytes; inventory derived locally' : 'Export file, name, description and reported bytes agree');
      for (const reference of skillReferences(body, installedNames)) references.push({sourceSkill: skill.name, ...reference});
    } catch (error) { add('FAIL', skill.name, `Export unreadable: ${error.message}`); }
  }
  const installed = new Set(installedNames.map(fold));
  const matchesInstalled = name => {
    const reference = fold(name);
    if (!reference.endsWith('-*')) return installed.has(reference);
    const prefix = reference.slice(0, -1);
    return installedNames.some(name => {
      const candidate = fold(name);
      return candidate.startsWith(prefix) && candidate.length > prefix.length;
    });
  };
  const missingReferences = references.filter(ref => !matchesInstalled(ref.name)).map(ref => ({
    ...ref,
    status: inventory.complete ? 'referenced but not installed' : 'reference installation unverified',
    basis: `${inventory.inventorySource === 'derived-from-files' ? 'Inventory derived from exported files' : 'Bot-reported inventory'}; review the quoted body line before treating this candidate as a dependency`
  }));
  for (const ref of missingReferences) add('FAIL', ref.name, `${ref.status}; unresolved candidate in ${ref.sourceSkill} body line ${ref.line}`);
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
  if (!inventory.complete) add('UNVERIFIED', 'Installed inventory', inventory.inventorySource === 'derived-from-files' ? 'Inventory derived from files; complete native enumeration unverified' : 'Bot reports partial enumeration; absence cannot be established');
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
    inventorySource: inventory.inventorySource ?? 'bot-reported', inventoryCreated,
    accountWrites: false, fileWrites: inventoryCreated, requiresSeparateApproval: false,
    nativeChangesRequireSeparateApproval: true};
}
