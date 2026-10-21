const fs = require('fs');
const path = require('path');

const lib = 'c:/Users/HP/Desktop/pfe/pricipaux/MAROC-LOC/mobile-app/lib';
const counts = [];

function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p);
    else if (/\.dart$/.test(f) && !p.includes('/generated/')) {
      const txt = fs.readFileSync(p, 'utf8');
      const c = (txt.match(/\bColors\./g) || []).length;
      const colorFn = (txt.match(/\bColor\(0xFF[0-9a-fA-F]{6,8}\)/g) || []).length;
      if (c + colorFn > 0) {
        counts.push({ file: p.replace(lib + '/', '').replace(/\\/g, '/'), colors: c, colorFn });
      }
    }
  }
}

walk(lib);
counts.sort((a, b) => (b.colors + b.colorFn) - (a.colors + a.colorFn));
console.log('Files with direct Colors/Color():', counts.length);
counts.forEach((x) => console.log(`${(x.colors + x.colorFn).toString().padStart(3)}  ${x.file} (Colors.: ${x.colors}, Color(): ${x.colorFn})`));
