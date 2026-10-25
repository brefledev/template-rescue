import test from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {validateBundle, preview, sha256} from '../src/bundle.mjs';

const root=fileURLToPath(new URL('../examples/creator/',import.meta.url));
const inventory={scope:'account-wide',complete:true,capturedAt:'2026-10-25T00:00:00Z',items:[]};
const revision='a'.repeat(40);

test('creator bundle preserves full profile, skill fields, timing and explicit omissions',()=>{
  const b=validateBundle(root), config=JSON.parse(b.payloads.find(f=>f.path==='configuration.json').content);
  assert.equal(b.payloads.length,5);
  assert.equal(config.exportCompleteness.status,'partial');
  assert.equal(config.profileFields.avatar,null);
  assert.equal(config.skillAssociations[0].enabledForSelectedBot,true);
  assert.equal(config.routineReviewOnly[0].schedule,'0 9 * * 1');
  assert.equal(config.routineReviewOnly[0].timezone,'Etc/UTC');
  assert.equal(JSON.parse(b.payloads.find(f=>f.kind==='routine').content).enabled,false);
  assert.equal(config.optionalCompanion.included,false);
  assert.equal(config.optionalCompanion.creatorApproved,false);
  assert.deepEqual(b.manifest.dependencies,[]);
  assert.ok(b.payloads.find(f=>f.kind==='skill').description);
});
test('partial export blocks complete-profile plan and preserves source-only review',()=>{
  const p=preview(validateBundle(root),inventory,revision);
  assert.equal(p.blocked,true);
  assert.match(p.blockReason,/partial or unknown/);
  assert.equal(p.exportCompleteness.completeProfileClaimAllowed,false);
  assert.equal(p.operations.find(f=>f.path==='configuration.json').action,'review-source-only');
  assert.equal(p.operations.find(f=>f.path==='PROFILE.md').action,'review-source-only');
  assert.equal(p.accountWrites,false);
});
test('declared complete export still needs native permission and independent verification',()=>{
  const b=validateBundle(root), f=b.payloads.find(f=>f.kind==='reference'), config=JSON.parse(f.content);
  config.exportCompleteness={status:'complete',omissions:[]}; f.content=JSON.stringify(config);
  const p=preview(b,inventory,revision);
  assert.equal(p.blocked,false);
  assert.equal(p.requiresSeparateApproval,true);
  assert.equal(p.exportCompleteness.independentlyVerified,false);
  assert.equal(p.exportCompleteness.completeProfileClaimAllowed,false);
  assert.equal(p.operations.find(f=>f.kind==='routine').proposedEnabled,false);
});
test('unknown export completeness blocks without inventing missing fields',()=>{
  const b=validateBundle(root),f=b.payloads.find(f=>f.kind==='reference'),config=JSON.parse(f.content);
  config.exportCompleteness={status:'unknown',omissions:['Inventory API unavailable']};f.content=JSON.stringify(config);
  assert.equal(preview(b,inventory,revision).blocked,true);
});
test('complete declarations with omissions and malformed completeness reports are rejected',t=>{
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'creator-export-'));
  fs.cpSync(root,tmp,{recursive:true});
  t.after(()=>{assert.equal(path.dirname(tmp),path.resolve(os.tmpdir()));assert.ok(path.basename(tmp).startsWith('creator-export-'));fs.rmSync(tmp,{recursive:true,force:true});});
  const config=JSON.parse(fs.readFileSync(path.join(tmp,'configuration.json')));
  const manifest=JSON.parse(fs.readFileSync(path.join(tmp,'manifest.json')));
  for(const report of [{status:'complete',omissions:['Unreadable profile']},{status:'invented',omissions:[]},{status:'complete',omissions:[],trustMe:true}]){
    config.exportCompleteness=report;
    const body=JSON.stringify(config);fs.writeFileSync(path.join(tmp,'configuration.json'),body);
    const f=manifest.files.find(f=>f.kind==='reference');f.bytes=Buffer.byteLength(body);f.sha256=sha256(body);
    fs.writeFileSync(path.join(tmp,'manifest.json'),JSON.stringify(manifest));
    assert.throws(()=>validateBundle(tmp),/completeness/);
  }
});
test('optional companion cannot be included without creator approval and adds no dependency',t=>{
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'creator-export-'));
  fs.cpSync(root,tmp,{recursive:true});
  t.after(()=>{assert.equal(path.dirname(tmp),path.resolve(os.tmpdir()));assert.ok(path.basename(tmp).startsWith('creator-export-'));fs.rmSync(tmp,{recursive:true,force:true});});
  const config=JSON.parse(fs.readFileSync(path.join(tmp,'configuration.json'))),manifest=JSON.parse(fs.readFileSync(path.join(tmp,'manifest.json')));
  function save(){const body=JSON.stringify(config);fs.writeFileSync(path.join(tmp,'configuration.json'),body);const f=manifest.files.find(f=>f.kind==='reference');f.bytes=Buffer.byteLength(body);f.sha256=sha256(body);fs.writeFileSync(path.join(tmp,'manifest.json'),JSON.stringify(manifest));}
  config.optionalCompanion.included=true;save();
  assert.throws(()=>validateBundle(tmp),/creator approval/);
  config.optionalCompanion.creatorApproved=true;save();
  const b=validateBundle(tmp),p=preview(b,inventory,revision);
  assert.deepEqual(b.manifest.dependencies,[]);
  assert.equal(p.operations.find(f=>f.kind==='reference').action,'review-source-only');
  assert.equal(p.accountWrites,false);
});
