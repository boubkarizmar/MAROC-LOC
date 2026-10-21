const fs = require('fs');
const path = require('path');

const src = 'c:/Users/HP/Desktop/pfe/pricipaux/MAROC-LOC/frontend/src';
const hardRe = />\s*([A-ZÉÀÈÙÂÊÎÔÛÄËÏÖÜÇ][^<]{2,120})\s*</g;
const byFile = {};

function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p);
    else if (/\.(tsx|ts)$/.test(f)) {
      const txt = fs.readFileSync(p, 'utf8');
      let m;
      while ((m = hardRe.exec(txt)) !== null) {
        const rel = p.replace(src + '/', '');
        byFile[rel] = (byFile[rel] || 0) + 1;
      }
    }
  }
}

walk(src);
const sorted = Object.entries(byFile).sort((a, b) => b[1] - a[1]);
console.log('Remaining hardcoded fragments:', sorted.reduce((s, [, n]) => s + n, 0));
console.log('Files:');
sorted.forEach(([f, n]) => console.log(`${n}\t${f}`));
