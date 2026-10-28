// Offline consistency checks. Evidence review and source ownership are external facts.
const fail = message => { throw new Error(message); };
const text = value => typeof value === 'string' && value.length > 0 && value.length <= 2048;
function https(value) {
  if (!text(value)) fail('Expected a bounded HTTPS evidence URL');
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password) fail('Expected a credential-free HTTPS URL');
  return url.href;
}
export function repositoryUrl(value) {
  const url = new URL(https(value));
  if (url.hostname !== 'github.com' || url.search || url.hash || !/^\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/?$/.test(url.pathname)) fail('Expected an exact GitHub repository URL');
  return `https://github.com${url.pathname.replace(/\/$/, '').replace(/\.git$/, '')}`.toLowerCase();
}
function identity(request) {
  if (!request || !text(request.templateId) || !text(request.creatorProfileUrl) || !text(request.templateUrl)) fail('Exact template ID, link and creator profile are required');
  return {id: request.templateId, url: https(request.templateUrl), creator: https(request.creatorProfileUrl), version: text(request.version) && !/^(?:latest|current|main|master|unknown)$/i.test(request.version) ? request.version : null};
}
export function assessRepositoryMatch(request, candidate, reviewedEvidence = []) {
  const source = identity(request);
  if (!Array.isArray(reviewedEvidence) || reviewedEvidence.length > 32) fail('Bounded independent evidence review required');
  const fallback = reason => ({status: 'audit-imported-bot', reason, authenticityGuaranteed: false, accountWrites: false, instruction: 'After Add Bot, obtain the named bot inventory directly, review the exact file-write plan, then request its full skill export by direct messaging after approval. Audit shared files yourself. Screenshots are a last resort when export fails or is refused and original source is unavailable.'});
  if (!candidate || !source.version) return fallback(!candidate ? 'No repository candidate supplied' : 'Exact source version is unverified');
  const repo = repositoryUrl(candidate.repositoryUrl);
  if (candidate.templateId !== source.id || candidate.templateUrl !== source.url || candidate.version !== source.version) return fallback('Candidate does not establish the exact template identity and version');
  const evidence = reviewedEvidence.filter(item => {
    if (!item || item.reviewedByOperator !== true || !['creator-controlled-crosslink', 'original-creator-confirmation'].includes(item.kind)) return false;
    if (!text(item.url) || !text(item.creatorProfileUrl) || !text(item.repositoryUrl)) return false;
    try {
      return https(item.creatorProfileUrl) === source.creator && repositoryUrl(item.repositoryUrl) === repo && item.templateId === source.id && item.templateUrl === source.url && item.version === source.version && https(item.url).length > 0;
    } catch { return false; }
  });
  if (!evidence.length) return fallback('No independently reviewed same-creator crosslink or original-creator confirmation for this exact template/version');
  return {status: 'match-supported-by-reviewed-evidence', repositoryUrl: repo, templateId: source.id, version: source.version, evidenceUrls: evidence.map(e => https(e.url)), verificationBasis: 'Operator-supplied independent review; this offline check does not authenticate ownership or fetch evidence', authenticityGuaranteed: false, rightsToRedistribute: 'not-established-by-a-match', accountWrites: false};
}

export function assessScreenshotCoverage(expectedNames, captures) {
  if (!Array.isArray(expectedNames) || expectedNames.length < 1 || expectedNames.length > 64 || !expectedNames.every(text) || new Set(expectedNames).size !== expectedNames.length) fail('Unique expected skill names required');
  if (!Array.isArray(captures) || captures.length > 256) fail('Capture review count limit');
  const issues = [];
  for (const capture of captures) {
    if (!capture || !text(capture.skillName) || !Number.isSafeInteger(capture.sequence) || capture.sequence < 1 || !text(capture.sourceImageId)) fail('Capture identity and positive sequence required');
    if (!expectedNames.includes(capture.skillName)) issues.push(`Unexpected skill: ${capture.skillName}`);
  }
  for (const name of expectedNames) {
    const frames = captures.filter(c => c.skillName === name).sort((a, b) => a.sequence - b.sequence);
    if (!frames.length) { issues.push(`Missing skill: ${name}`); continue; }
    if (frames[0].startsAtBeginning !== true) issues.push(`Missing beginning: ${name}`);
    if (frames.at(-1).endsAtEnd !== true) issues.push(`Missing end: ${name}`);
    frames.forEach((frame, index) => {
      if (frame.sequence !== index + 1) issues.push(`Duplicate or missing sequence: ${name}`);
      if (index > 0 && frame.overlapReviewed !== true) issues.push(`Unreviewed overlap: ${name} frame ${frame.sequence}`);
      if (frame.uncertainText !== false) issues.push(`Uncertain transcription: ${name} frame ${frame.sequence}`);
    });
  }
  return {status: issues.length ? 'incomplete-needs-user' : 'ready-for-human-content-review', issues, exactOriginalBytesVerified: false, nativeInstallationVerified: false, captureAutomationImplemented: false, accountWrites: false};
}
