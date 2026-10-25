#!/usr/bin/env node
// Validate the local edition's actual public documentation, independently of upstream's harness.
import fs from 'node:fs';
import path from 'node:path';
const root = process.env.DEMO_DOCS_ROOT ?? path.resolve(import.meta.dirname, '..');
const required = ['README.md','BUILDING.md','PRIVACY.md','SECURITY.md','CONTRIBUTING.md','CHANGELOG.md','ASSETS.md','LOCAL-CAPTIONS.md','docs/AI-SETUP.md'];
const errors=[];
for (const name of required) {
 const file=path.join(root,name);
 if (!fs.existsSync(file)) { errors.push(`missing: ${name}`); continue; }
 const source=fs.readFileSync(file,'utf8');
 if (!source.trim()) errors.push(`empty: ${name}`);
 for (const match of source.matchAll(/\]\(([^)\s]+)\)/g)) {
  const link=match[1];
  if (/^(https?:|mailto:|#)/.test(link)) continue;
  const resolved=path.resolve(path.dirname(file),decodeURIComponent(link.split('#')[0]));
  if (!fs.existsSync(resolved)) errors.push(`${name}: broken link ${link}`);
 }
}
if (errors.length) { console.error(errors.join('\n'));process.exit(1); }
console.log(`check-docs: OK (${required.length} required documents and their local links)`);
