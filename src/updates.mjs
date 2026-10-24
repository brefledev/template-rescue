import {repositoryUrl} from './acquisition.mjs';
import {sha256, LIMITS} from './bundle.mjs';

function snapshot(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).length > LIMITS.files) throw new Error('Bounded file snapshot required');
  let total = 0;
  for (const [path, content] of Object.entries(value)) {
    if (path.length > 200 || path.split('/').length > 16 || !/^[A-Za-z0-9_/-]+\.(md|json)$/.test(path) || path.startsWith('/') || path.split('/').some(p => !p || p === '..' || /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(p))) throw new Error('Unsafe update path');
    if (typeof content !== 'string' || Buffer.byteLength(content) > LIMITS.file) throw new Error('Update file byte limit');
    total += Buffer.byteLength(content);
    if (total > LIMITS.total) throw new Error('Update snapshot byte limit');
  }
  return value;
}
const commit = value => typeof value === 'string' && /^[a-f0-9]{40}$/.test(value) && !/^0+$/.test(value);
const digest = value => value === undefined ? null : sha256(value);

export function planUpdateCheck(preferences = {}) {
  const cadence = preferences.cadence ?? 'weekly';
  if (!['manual', 'daily', 'weekly', 'monthly'].includes(cadence)) throw new Error('Choose a supported proposed cadence');
  if (preferences.timezone != null) new Intl.DateTimeFormat('en', {timeZone: preferences.timezone});
  if (preferences.time != null && !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(preferences.time)) throw new Error('Valid local HH:mm required');
  return {state: 'off-until-user-consents', proposedCadence: cadence, proposedDay: preferences.day ?? null, proposedTime: preferences.time ?? null, proposedTimezone: preferences.timezone ?? null, requiresScheduleConsent: true, requiresSeparateApplyApproval: true, nativeScheduleCreated: false, fallback: 'manual-check', accountWrites: false};
}

export function planUpdate(baseline, localFiles, candidate) {
  if (!baseline || !candidate || !commit(baseline.commit) || !commit(candidate.commit)) throw new Error('Known immutable baseline and candidate commits required');
  const repo = repositoryUrl(baseline.repositoryUrl);
  if (repositoryUrl(candidate.repositoryUrl) !== repo) throw new Error('Candidate must come from the recorded canonical repository');
  const base = snapshot(baseline.files), local = snapshot(localFiles), incoming = snapshot(candidate.files);
  const paths = [...new Set([...Object.keys(base), ...Object.keys(local), ...Object.keys(incoming)])].sort();
  if (baseline.commit === candidate.commit && JSON.stringify(Object.entries(base).sort()) !== JSON.stringify(Object.entries(incoming).sort())) throw new Error('Same immutable commit has inconsistent source snapshots');
  const changes = paths.map(path => {
    const b = base[path], l = local[path], n = incoming[path];
    let action;
    if (n === b) action = l === b ? 'unchanged' : 'preserve-local';
    else if (l === n) action = 'already-matches';
    else if (l === b) action = n === undefined ? 'manual-source-removal-review' : 'propose-update';
    else action = 'conflict-needs-user';
    const diff = ['propose-update', 'conflict-needs-user', 'manual-source-removal-review'].includes(action) ? [...(l === undefined ? [] : l.split('\n').map(line => '-' + line)), ...(n === undefined ? [] : n.split('\n').map(line => '+' + line))] : [];
    return {path, action, baseSha256: digest(b), localSha256: digest(l), incomingSha256: digest(n), proposedSource: n ?? null, contentTrust: 'untrusted-data', diff};
  });
  const conflict = changes.some(c => ['conflict-needs-user', 'manual-source-removal-review'].includes(c.action));
  const available = changes.some(c => c.action === 'propose-update');
  return {repositoryUrl: repo, baselineCommit: baseline.commit, candidateCommit: candidate.commit, status: conflict ? 'conflict-needs-user' : available ? 'update-available' : 'unchanged', notify: conflict || available, changes, requiresUserPermissionToApply: true, checkConsentGrantsApplyPermission: false, accountWrites: false, schedulerChanges: false, permissionsExpandedByTool: false, substantivePermissionReviewRequired: true, backupAndRestore: 'Before any separately approved apply, preserve exact current content and native IDs. Restore only approved transaction changes after checking current state; never delete preexisting resources.', review: 'Explain substantive instruction, permission, tool and scheduling changes and conflicts. Source metadata is supplied, not authenticated by this offline planner.'};
}
