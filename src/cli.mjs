import {validateBundle, readJson, preview} from './bundle.mjs';
import {assessRepositoryMatch, assessScreenshotCoverage} from './acquisition.mjs';
import {planUpdate} from './updates.mjs';

try {
  const [command, root, inventory, revision, ...extra] = process.argv.slice(2);
  if (extra.length || !root || !['validate', 'preview', 'match-preview', 'capture-preview', 'update-preview'].includes(command) || command === 'validate' && (inventory || revision) || ['preview','match-preview','update-preview'].includes(command) && (!inventory || !revision) || command === 'capture-preview' && (!inventory || revision)) throw new Error('Usage: validate BUNDLE | preview BUNDLE INVENTORY COMMIT | match-preview REQUEST CANDIDATE REVIEWED_EVIDENCE | capture-preview NAMES CAPTURES | update-preview BASELINE LOCAL_FILES CANDIDATE');
  let result;
  if (command === 'match-preview') result = assessRepositoryMatch(readJson(root), readJson(inventory), readJson(revision));
  else if (command === 'capture-preview') result = assessScreenshotCoverage(readJson(root), readJson(inventory));
  else if (command === 'update-preview') result = planUpdate(readJson(root), readJson(inventory), readJson(revision));
  else {
    const bundle = validateBundle(root);
    result = command === 'validate' ? {valid: true, files: bundle.payloads.length, totalBytes: bundle.totalBytes, accountWrites: false, nativeCompatibility: 'unverified'} : preview(bundle, readJson(inventory), revision);
  }
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  if (result.blocked) process.exitCode = 2;
} catch (error) {
  process.stderr.write(JSON.stringify({valid: false, error: error.message, accountWrites: false}) + '\n');
  process.exitCode = 1;
}
