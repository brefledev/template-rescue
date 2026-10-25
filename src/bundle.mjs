import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const LIMITS = Object.freeze({json: 65536, file: 65536, total: 1048576, files: 64, entries: 128});
export const sha256 = data => crypto.createHash('sha256').update(data).digest('hex');
const fail = message => { throw new Error(message); };
const object = value => value && typeof value === 'object' && !Array.isArray(value);
function keys(value, required, label, optional = []) {
  if (!object(value) || required.some(key => !Object.hasOwn(value, key)) || Object.keys(value).some(key => !required.includes(key) && !optional.includes(key))) fail(`Invalid ${label} fields`);
}
const text = (value, max = 512) => typeof value === 'string' && value.length > 0 && value.length <= max;
const slug = value => typeof value === 'string' && /^[a-z][a-z0-9-]{0,63}$/.test(value);
const foldName = value => value.normalize('NFKC').trim().toLowerCase();
const displayName = value => text(value, 160) && foldName(value).length > 0 && !/[\p{Cc}\p{Zl}\p{Zp}]/u.test(value);
const version = value => typeof value === 'string' && /^\d+\.\d+\.\d+$/.test(value);
const stable = value => Array.isArray(value) ? value.map(stable) : object(value) ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])])) : value;
function read(file, limit) {
  const stat = fs.lstatSync(file);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size > limit) fail('Unsafe file or size limit exceeded');
  const descriptor = fs.openSync(file, fs.constants.O_RDONLY | fs.constants.O_NONBLOCK);
  let buffer;
  try {
    const opened = fs.fstatSync(descriptor);
    if (!opened.isFile() || opened.size > limit) fail('Unsafe opened file or size limit exceeded');
    const bounded = Buffer.alloc(limit + 1);
    let length = 0, count;
    while (length <= limit && (count = fs.readSync(descriptor, bounded, length, bounded.length - length, null)) > 0) length += count;
    if (length > limit) fail('Size limit exceeded');
    buffer = bounded.subarray(0, length);
  } finally { fs.closeSync(descriptor); }
  new TextDecoder('utf-8', {fatal: true}).decode(buffer);
  return buffer;
}
export function readJson(file) { return JSON.parse(read(file, LIMITS.json).toString('utf8')); }
function safePath(value) {
  if (!text(value, 200) || !/^[a-zA-Z0-9_/-]+\.(md|json)$/.test(value) || value.startsWith('/') || value.split('/').some(p => !p || p === '.' || p === '..') || value.split('/').length > 16) fail('Unsafe payload path');
  if (value.split('/').some(part => /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part))) fail('Unsafe reserved payload path');
}
export function obviousSecret(value) {
  return /-----BEGIN (?:[A-Z ]+)?PRIVATE KEY-----|\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9_-]{20,})\b|(?:api[_ -]?key|password|access[_ -]?token)\s*[:=]\s*["']?[^\s"']{8,}/i.test(value);
}
export function validateBundle(root) {
  root = path.resolve(root);
  if (!fs.lstatSync(root).isDirectory() || fs.lstatSync(root).isSymbolicLink()) fail('Unsafe bundle root');
  const manifest = readJson(path.join(root, 'manifest.json'));
  keys(manifest, ['schemaVersion', 'namespace', 'version', 'role', 'dependencies', 'files'], 'manifest');
  if (manifest.schemaVersion !== 1 || !slug(manifest.namespace) || !version(manifest.version)) fail('Invalid manifest version or namespace');
  if (obviousSecret(JSON.stringify(manifest))) fail('Possible secret requires source review');
  if (!text(manifest.role, 2048) || obviousSecret(manifest.role) || !Array.isArray(manifest.dependencies) || manifest.dependencies.length > 16) fail('Invalid role or dependencies');
  const dependencies = new Set();
  for (const dependency of manifest.dependencies) {
    keys(dependency, ['id', 'version', 'reason'], 'dependency');
    if (!text(dependency.id, 130) || !/^[a-z][a-z0-9-]*\/[a-z][a-z0-9-]*$/.test(dependency.id) || !version(dependency.version) || !text(dependency.reason, 512) || dependencies.has(dependency.id)) fail('Invalid or duplicate dependency');
    dependencies.add(dependency.id);
  }
  if (!Array.isArray(manifest.files) || !manifest.files.length || manifest.files.length > LIMITS.files) fail('Invalid file count');
  const ids = new Set(), names = new Set(), paths = new Set(['manifest.json']), payloads = [];
  let total = 0, entries = 0;
  for (const file of manifest.files) {
    keys(file, ['id', 'name', 'description', 'kind', 'path', 'bytes', 'sha256', 'rights'], 'file', ['legacyNames']);
    safePath(file.path);
    if (!text(file.id, 130) || !file.id.startsWith(`${manifest.namespace}/`) || !slug(file.id.slice(manifest.namespace.length + 1))) fail('Invalid namespaced ID');
    if (!displayName(file.name)) fail('Invalid display name');
    if (Object.hasOwn(file, 'legacyNames') && (!Array.isArray(file.legacyNames) || file.legacyNames.length > 16 || !file.legacyNames.every(displayName))) fail('Invalid legacy names');
    if (!text(file.description, 512) || /[\r\n]/.test(file.description)) fail('Authored one-line description required');
    if (!['skill', 'routine', 'instructions', 'policy', 'reference'].includes(file.kind) || !file.path.endsWith(['routine','reference'].includes(file.kind) ? '.json' : '.md')) fail('Unsupported payload kind');
    if (!Number.isSafeInteger(file.bytes) || file.bytes < 1 || file.bytes > LIMITS.file || !/^[a-f0-9]{64}$/.test(file.sha256)) fail('Invalid size or hash');
    keys(file.rights, ['status', 'license', 'source', 'evidence'], 'rights');
    if (!['original', 'authorized'].includes(file.rights.status) || !['license', 'source', 'evidence'].every(k => text(file.rights[k], 1024))) fail('Redistribution rights required');
    if (ids.has(file.id) || [...paths].some(p => p.toLowerCase() === file.path.toLowerCase())) fail('Duplicate ID, name or path');
    for (const name of [file.name, ...(file.legacyNames ?? [])]) {
      if (names.has(foldName(name))) fail('Duplicate display or legacy name');
      names.add(foldName(name));
    }
    ids.add(file.id); paths.add(file.path);
  }
  function walk(dir, prefix = '', depth = 0) {
    if (depth > 16) fail('Directory depth limit');
    const directory = fs.opendirSync(dir);
    try { let entry;
    while ((entry = directory.readSync()) !== null) {
      const name = entry.name;
      if (++entries > LIMITS.entries) fail('Filesystem entry limit');
      const rel = prefix + name, full = path.join(dir, name), stat = fs.lstatSync(full);
      if (stat.isSymbolicLink()) fail('Symlink rejected');
      if (stat.isDirectory()) {
        if (![...paths].some(p => p.startsWith(rel + '/'))) fail('Unlisted directory');
        walk(full, rel + '/', depth + 1);
      } else if (!stat.isFile() || !paths.has(rel)) fail('Unlisted file');
    }
    } finally { directory.closeSync(); }
  }
  walk(root);
  for (const file of manifest.files) {
    const buffer = read(path.join(root, file.path), LIMITS.file);
    total += buffer.length;
    if (total > LIMITS.total) fail('Aggregate byte limit');
    if (buffer.length !== file.bytes || sha256(buffer) !== file.sha256) fail(`Byte length/checksum mismatch: ${file.path}`);
    const content = buffer.toString('utf8');
    if (obviousSecret(content) || obviousSecret(JSON.stringify(file.rights))) fail('Possible secret requires source review');
    if (file.kind === 'routine') {
      const routine = JSON.parse(content);
      keys(routine, ['id', 'prompt', 'enabled'], 'routine');
      if (routine.id !== file.id || !text(routine.prompt, LIMITS.file) || routine.enabled !== false) fail('Routine must match ID and remain disabled');
    }
    if (file.kind === 'reference') {
      const reference = JSON.parse(content);
      if (object(reference) && Object.hasOwn(reference, 'exportCompleteness')) {
        const report = reference.exportCompleteness;
        keys(report, ['status', 'omissions'], 'export completeness');
        if (!['complete', 'partial', 'unknown'].includes(report.status) || !Array.isArray(report.omissions) || report.omissions.length > 64 || !report.omissions.every(x => text(x, 1024)) || report.status === 'complete' && report.omissions.length) fail('Invalid export completeness declaration');
      }
      if (object(reference) && Object.hasOwn(reference, 'optionalCompanion')) {
        const companion = reference.optionalCompanion;
        keys(companion, ['included', 'creatorApproved', 'sourceUrl', 'note'], 'optional companion');
        if (typeof companion.included !== 'boolean' || typeof companion.creatorApproved !== 'boolean' || companion.included && !companion.creatorApproved || !text(companion.note, 1024)) fail('Optional companion inclusion requires creator approval');
        const url = new URL(companion.sourceUrl);
        if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) fail('Invalid companion source URL');
      }
    }
    payloads.push({...file, content});
  }
  return {manifest, payloads, totalBytes: total};
}

export function validateInventory(inventory) {
  keys(inventory, ['scope', 'complete', 'capturedAt', 'items'], 'inventory');
  if (Buffer.byteLength(JSON.stringify(inventory)) > LIMITS.json) fail('Inventory byte limit');
  if (inventory.scope !== 'account-wide' || inventory.complete !== true || !text(inventory.capturedAt, 40) || !/^\d{4}-\d{2}-\d{2}T/.test(inventory.capturedAt) || !Number.isFinite(Date.parse(inventory.capturedAt)) || !Array.isArray(inventory.items) || inventory.items.length > 256) fail('Complete dated account-wide inventory required');
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(inventory.capturedAt) || new Date(inventory.capturedAt).toISOString().replace('.000Z', 'Z') !== inventory.capturedAt.replace('.000Z', 'Z')) fail('Canonical UTC inventory timestamp required');
  const ids = new Set(), names = new Set();
  for (const item of inventory.items) {
    keys(item, ['id', 'name', 'kind', 'enabled', 'content'], 'inventory item');
    if (!text(item.id, 160) || !text(item.name, 160) || !['skill', 'routine'].includes(item.kind) || typeof item.enabled !== 'boolean' || !(item.content === null || typeof item.content === 'string' && Buffer.byteLength(item.content) <= LIMITS.file)) fail('Invalid inventory item');
    if (ids.has(item.id) || names.has(foldName(item.name))) fail('Ambiguous inventory IDs or names');
    ids.add(item.id); names.add(foldName(item.name));
  }
  return inventory;
}

export function preview(bundle, inventory, revision) {
  validateInventory(inventory);
  if (!/^[a-f0-9]{40}$/.test(revision) || /^0+$/.test(revision)) fail('Independently reviewed immutable commit claim required');
  const completenessReports = bundle.payloads.filter(f => f.kind === 'reference').map(f => ({path:f.path, report:JSON.parse(f.content)?.exportCompleteness})).filter(f => f.report);
  const incompleteExport = completenessReports.some(f => f.report.status !== 'complete');
  const operations = bundle.payloads.map(file => {
    const native = ['skill','routine'].includes(file.kind);
    const recognizedNames = new Set([file.name, ...(file.legacyNames ?? [])].map(foldName));
    const matches = native ? inventory.items.filter(i => i.id === file.id || recognizedNames.has(foldName(i.name))).sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0) : [];
    const existing = matches.length === 1 ? matches[0] : null;
    const same = existing && existing.id === file.id && existing.name === file.name && existing.kind === file.kind && existing.content !== null && existing.content === file.content;
    const state = !native ? 'source-only' : matches.length === 0 ? 'absent' : same ? existing.enabled ? 'present-enabled' : 'present-disabled' : 'conflict-or-unknown';
    const action = !native ? 'review-source-only' : matches.length === 0 ? 'propose-create-only' : same ? 'no-op' : 'blocked-collision';
    // A simple full-line replacement diff preserves exact bytes separately in sourceContent.
    const before = existing?.content;
    const diff = same ? [] : [...(typeof before === 'string' ? before.split('\n').map(line => '-' + line) : []), ...file.content.split('\n').map(line => '+' + line)];
    return {id: file.id, name: file.name, description: file.description, kind: file.kind, path: file.path, sha256: file.sha256, state, action, existingMatches: matches.map(({id, name, kind}) => ({id, name, kind})), currentEnabled: existing?.enabled ?? null, proposedEnabled: action === 'no-op' ? existing.enabled : action === 'propose-create-only' && file.kind === 'routine' ? false : null, routineStateWarning: file.kind === 'routine' && existing?.enabled ? 'Existing routine is active. No pause, activation or run is proposed.' : null, accountWideEffect: action === 'propose-create-only' ? 'Would add account-visible source; native scope requires verification' : 'No change', sourceContent: file.content, contentTrust: 'untrusted-data', diff};
  });
  const canonicalInventory = {...inventory, items: [...inventory.items].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0)};
  const plan = {schemaVersion: 1, bundleVersion: bundle.manifest.version, role: bundle.manifest.role, dependencies: bundle.manifest.dependencies, dependencyStatus: bundle.manifest.dependencies.length ? 'manual-review-required' : 'none', revisionClaim: revision, revisionAuthenticated: false, inventoryCapturedAt: inventory.capturedAt, inventoryDigest: sha256(JSON.stringify(stable(canonicalInventory))), inventoryCompleteness: 'declared-not-independently-verified', accountWrites: false, networkRequests: 0, requiresSeparateApproval: true, nativeFormatVerified: false, blocked: bundle.manifest.dependencies.length > 0 || operations.some(o => o.action === 'blocked-collision'), operations, restore: 'No account changes made. Future transactions must journal their own created IDs and preserve preexisting assets.'};
  plan.exportCompleteness = {declaredReports:completenessReports, independentlyVerified:false, completeProfileClaimAllowed:false};
  if (incompleteExport) {
    plan.blocked = true;
    plan.blockReason = 'Export source is partial or unknown. Review omissions; do not claim complete profile restoration.';
  }
  return {...plan, planDigest: sha256(JSON.stringify(stable(plan)))};
}
