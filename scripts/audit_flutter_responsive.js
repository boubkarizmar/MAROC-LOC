const fs = require('fs');
const path = require('path');

const lib = 'c:/Users/HP/Desktop/pfe/pricipaux/MAROC-LOC/mobile-app/lib';

const counts = {
  OrientationBuilder: 0,
  LayoutBuilder: 0,
  SafeArea: 0,
  SingleChildScrollView: 0,
  fixedHeight: 0, // height: number
  fixedWidth: 0,
  MediaQuery: 0,
  Expanded: 0,
  Flexible: 0,
};

function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p);
    else if (/\.dart$/.test(f)) {
      const txt = fs.readFileSync(p, 'utf8');
      counts.OrientationBuilder += (txt.match(/\bOrientationBuilder\(/g) || []).length;
      counts.LayoutBuilder += (txt.match(/\bLayoutBuilder\(/g) || []).length;
      counts.SafeArea += (txt.match(/\bSafeArea\(/g) || []).length;
      counts.SingleChildScrollView += (txt.match(/\bSingleChildScrollView\(/g) || []).length;
      counts.fixedHeight += (txt.match(/\bheight\s*:\s*\d+\b/g) || []).length;
      counts.fixedWidth += (txt.match(/\bwidth\s*:\s*\d+\b/g) || []).length;
      counts.MediaQuery += (txt.match(/\bMediaQuery\b/g) || []).length;
      counts.Expanded += (txt.match(/\bExpanded\(/g) || []).length;
      counts.Flexible += (txt.match(/\bFlexible\(/g) || []).length;
    }
  }
}

walk(lib);
console.log(counts);
