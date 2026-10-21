const fs = require('fs');
const path = require('path');

const lib = 'c:/Users/HP/Desktop/pfe/pricipaux/MAROC-LOC/mobile-app/lib';

let colorsDirect = 0;
let oldDesignImports = 0;
let newDesignImports = 0;
let filesOld = 0;
let filesNew = 0;

function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p);
    else if (/\.dart$/.test(f)) {
      const txt = fs.readFileSync(p, 'utf8');
      const c = (txt.match(/\bColors\./g) || []).length;
      colorsDirect += c;
      if (/['"]package:maroc_loc\/design_system/.test(txt) || /['"]\.\.\/..\/design_system/.test(txt)) {
        oldDesignImports++;
        filesOld++;
      }
      if (/['"]package:maroc_loc\/core\/design_system/.test(txt) || /core\/design_system/.test(txt)) {
        newDesignImports++;
        filesNew++;
      }
    }
  }
}

walk(lib);
console.log('Colors. references:', colorsDirect);
console.log('old design_system imports (files):', filesOld);
console.log('new core/design_system imports (files):', filesNew);
