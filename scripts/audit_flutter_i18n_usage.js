const fs = require('fs');
const path = require('path');

const lib = 'c:/Users/HP/Desktop/pfe/pricipaux/MAROC-LOC/mobile-app/lib';
const arbDir = 'c:/Users/HP/Desktop/pfe/pricipaux/MAROC-LOC/mobile-app/lib/l10n';

const arb = JSON.parse(fs.readFileSync(path.join(arbDir, 'app_fr.arb'), 'utf8'));
const arbKeys = Object.keys(arb).filter((k) => !k.startsWith('@'));

const used = new Set();

function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p);
    else if (/\.dart$/.test(f)) {
      const txt = fs.readFileSync(p, 'utf8');
      // AppLocalizations.of(context).key or l10n.key or .t('key')
      const re = /(?:AppLocalizations\.of\(context\)|l10n|\bt)\(['"`]?([^'"`\(\)\.\s]+)['"`]?\)?/g;
      let m;
      while ((m = re.exec(txt)) !== null) {
        used.add(m[1]);
      }
      // also catch property access after AppLocalizations.of(context)!
      const re2 = /AppLocalizations\.of\(context\)!?\.([a-zA-Z_][a-zA-Z0-9_]*)/g;
      let m2;
      while ((m2 = re2.exec(txt)) !== null) {
        used.add(m2[1]);
      }
      // catch l10n.key and l10n?.key patterns
      const re3 = /(?:\bl10n|\bAppLocalizations\.of\(context\))!?\.([a-zA-Z_][a-zA-Z0-9_]*)/g;
      let m3;
      while ((m3 = re3.exec(txt)) !== null) {
        used.add(m3[1]);
      }
    }
  }
}

walk(lib);

const unused = arbKeys.filter((k) => !used.has(k));
const missing = [...used].filter((k) => !arbKeys.includes(k));

console.log('ARB keys:', arbKeys.length);
console.log('Unique keys used:', used.size);
console.log('Unused ARB keys:', unused.length);
console.log('Used but missing:', missing.length);
if (unused.length) console.log('sample unused:', unused.slice(0, 20));
if (missing.length) console.log('sample missing:', missing.slice(0, 20));
