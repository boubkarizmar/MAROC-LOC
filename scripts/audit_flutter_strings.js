const fs = require('fs');
const path = require('path');

const lib = 'c:/Users/HP/Desktop/pfe/pricipaux/MAROC-LOC/mobile-app/lib';

const frenchStop = ['le ', 'la ', 'les ', 'de ', 'des ', 'du ', 'et ', 'un ', 'une ', 'en ', 'au ', 'aux ', 'pour ', 'par ', 'sur ', 'dans ', 'ce ', 'cette ', 'se ', 'qui ', 'que ', 'avec ', 'est ', 'sont ', 'a ', 'je ', 'tu ', 'il ', 'elle ', 'nous ', 'vous ', 'ils ', 'elles '];
const skipRe = /^(https?:|\/|assets\/|[a-z_][a-z0-9_]*$|#[0-9a-fA-F]{3,8}$|true|false|null|\d+$)/;

let count = 0;
const files = new Set();
const samples = [];

function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p);
    else if (/\.dart$/.test(f)) {
      const txt = fs.readFileSync(p, 'utf8');
      // remove imports and comments
      const clean = txt
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*$/gm, '');
      const re = /['"]([^'"]{3,120})['"]/g;
      let m;
      while ((m = re.exec(clean)) !== null) {
        const s = m[1].trim();
        if (skipRe.test(s)) continue;
        if (/[A-ZÉÀÈÙÂÊÎÔÛÄËÏÖÜÇ]/.test(s) && (s.match(/[éèàùâêîôûëïüç]/i) || frenchStop.some((w) => s.toLowerCase().includes(w)))) {
          count++;
          files.add(p);
          if (samples.length < 10) samples.push({ file: p.replace(lib + '/', ''), text: s });
        }
      }
    }
  }
}

walk(lib);
console.log('Potential hardcoded French strings:', count);
console.log('files:', files.size);
console.log(samples);
