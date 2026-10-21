const fs = require('fs');
const path = require('path');

const src = 'c:/Users/HP/Desktop/pfe/pricipaux/MAROC-LOC/frontend/src';
const fr = JSON.parse(fs.readFileSync('c:/Users/HP/Desktop/pfe/pricipaux/MAROC-LOC/frontend/src/i18n/locales/fr.json', 'utf8'));

function flatten(obj, prefix = '') {
  const out = {};
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(out, flatten(v, prefix + k + '.'));
    } else {
      out[prefix + k] = v;
    }
  }
  return out;
}

const flat = flatten(fr);
const keys = Object.keys(flat);

const usedKeys = new Set();
const tCalls = [];
const hardcodedMatches = [];
const hardRe = />\s*([A-ZÉÀÈÙÂÊÎÔÛÄËÏÖÜÇ][^<]{2,120})\s*</g;

function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    const st = fs.statSync(p);
    if (st.isDirectory()) {
      walk(p);
    } else if (/\.(tsx|ts)$/.test(f)) {
      const txt = fs.readFileSync(p, 'utf8');
      const re = /t\(['"`]([^'"`]+)['"`]/g;
      let m;
      while ((m = re.exec(txt)) !== null) {
        tCalls.push(m[1]);
        usedKeys.add(m[1]);
      }
      let hm;
      while ((hm = hardRe.exec(txt)) !== null) {
        hardcodedMatches.push({ file: p.replace(src + '/', ''), text: hm[1].replace(/\s+/g, ' ').trim() });
      }
    }
  }
}

walk(src);

const missing = keys.filter((k) => !usedKeys.has(k));
const undefinedUsed = [...usedKeys].filter((k) => !keys.includes(k));

console.log('total keys FR:', keys.length);
console.log('t() calls:', tCalls.length);
console.log('unique keys used:', usedKeys.size);
console.log('keys declared but unused:', missing.length);
console.log('keys used but missing:', undefinedUsed.length);
console.log('hardcoded text fragments:', hardcodedMatches.length);
if (missing.length) console.log('sample unused:', missing.slice(0, 10));
if (undefinedUsed.length) console.log('sample undefined used:', undefinedUsed.slice(0, 10));
if (hardcodedMatches.length) console.log('sample hardcoded:', hardcodedMatches.slice(0, 5));
