const fs = require('fs');
const path = require('path');

const lib = 'c:/Users/HP/Desktop/pfe/pricipaux/MAROC-LOC/mobile-app/lib';

const counts = {
  Semantics: 0,
  Tooltip: 0,
  label: 0,
  hint: 0,
  textScaleFactor: 0,
  MediaQueryTextScale: 0,
  ExcludeSemantics: 0,
  MergeSemantics: 0,
};

function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p);
    else if (/\.dart$/.test(f)) {
      const txt = fs.readFileSync(p, 'utf8');
      counts.Semantics += (txt.match(/\bSemantics\(/g) || []).length;
      counts.Tooltip += (txt.match(/\bTooltip\(/g) || []).length;
      counts.label += (txt.match(/label:\s*['"]/g) || []).length;
      counts.hint += (txt.match(/hint:\s*['"]/g) || []).length;
      counts.textScaleFactor += (txt.match(/textScaleFactor:/g) || []).length;
      counts.MediaQueryTextScale += (txt.match(/MediaQuery\.textScaleFactorOf/g) || []).length;
      counts.ExcludeSemantics += (txt.match(/\bExcludeSemantics\(/g) || []).length;
      counts.MergeSemantics += (txt.match(/\bMergeSemantics\(/g) || []).length;
    }
  }
}

walk(lib);
console.log(counts);
