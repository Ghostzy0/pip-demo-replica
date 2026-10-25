import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {describe,it,expect} from 'vitest';
const root=path.resolve(import.meta.dirname,'..');
const script=path.join(root,'scripts/check-docs.mjs');
function run(at=root) {
 try {return {code:0,out:execFileSync(process.execPath,[script],{encoding:'utf8',env:{...process.env,DEMO_DOCS_ROOT:at},stdio:'pipe'})};}
 catch(e) {return {code:e.status,out:String(e.stderr)};}
}
describe('public documentation integrity',()=>{
 it('checks the actual public docs and links',()=>{expect(run().code).toBe(0);});
 it('rejects an incomplete distribution',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'demo-docs-'));
  try {fs.writeFileSync(path.join(dir,'README.md'),'# Sample\n[Missing](missing.md)');const r=run(dir);expect(r.code).toBe(1);expect(r.out).toContain('broken link missing.md');expect(r.out).toContain('missing: BUILDING.md');}
  finally{fs.rmSync(dir,{recursive:true,force:true});}
 });
});
