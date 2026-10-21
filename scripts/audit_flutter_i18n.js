const fs = require('fs');
const path = require('path');

const lib = 'c:/Users/HP/Desktop/pfe/pricipaux/MAROC-LOC/mobile-app/lib';
const arbDir = 'c:/Users/HP/Desktop/pfe/pricipaux/MAROC-LOC/mobile-app/lib/l10n';

const arb = JSON.parse(fs.readFileSync(path.join(arbDir, 'app_fr.arb'), 'utf8'));
const arbKeys = Object.keys(arb);

const frenchWordRe = /[A-ZÉÀÈÙÂÊÎÔÛÄËÏÖÜÇ][A-Za-zÉÀÈÙÂÊÎÔÛÄËÏÖÜÇàéèùâêîôûäëïöüç\s\d]{2,60}/;
const hardRe = /Text\(['"]([^'"]+)['"]\)|hintText:\s*['"]([^'"]+)['"]|labelText:\s*['"]([^'"]+)['"]|title:\s*['"]([^'"]+)['"]|content:\s*['"]([^'"]+)['"]/g;

let hardCount = 0;
const files = new Set();
const tCalls = new Set();
const hardSamples = [];

function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p);
    else if (/\.dart$/.test(f)) {
      const txt = fs.readFileSync(p, 'utf8');
      // t('key') or AppLocalizations.of(context).key
      const tRe = /\.t\(['"`]([^'"`]+)['"`]\)|l10n\.([a-zA-Z0-9_]+)/g;
      let m;
      while ((m = tRe.exec(txt)) !== null) {
        tCalls.add(m[1] || m[2]);
      }
      let hm;
      while ((hm = hardRe.exec(txt)) !== null) {
        const s = hm[1] || hm[2] || hm[3] || hm[4] || hm[5];
        if (s && s.trim().length > 1 && frenchWordRe.test(s)) {
          hardCount++;
          files.add(p);
          if (hardSamples.length < 8) hardSamples.push({ file: p.replace(lib + '/', ''), text: s });
        }
      }
    }
  }
}

walk(lib);

const usedArb = [...tCalls];
const unusedArb = arbKeys.filter((k) => !usedArb.includes(k) && !k.startsWith('@'));
const missingUsed = usedArb.filter((k) => !arbKeys.includes(k));

console.log('ARB keys:', arbKeys.filter(k => !k.startsWith('@')).length);
console.log('l10n usages:', usedArb.length);
console.log('ARB unused:', unusedArb.length);
console.log('l10n keys missing from ARB:', missingUsed.length);
console.log('Hardcoded UI strings (Text/hint/label/title/content):', hardCount);
console.log('files with hardcoded:', files.size);
console.log('sample hardcoded:', hardSamples);
