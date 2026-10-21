const fs = require('fs');
const path = require('path');

const lib = 'c:/Users/HP/Desktop/pfe/pricipaux/MAROC-LOC/mobile-app/lib';

const counts = {
  fromLTRB: 0,
  positionedLeft: 0,
  positionedRight: 0,
  alignmentLeft: 0,
  alignmentRight: 0,
  textAlignLeft: 0,
  textAlignRight: 0,
  textDirectionLtr: 0,
  edgeInsetsLeft: 0,
  edgeInsetsRight: 0,
};

function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p);
    else if (/\.dart$/.test(f)) {
      const txt = fs.readFileSync(p, 'utf8');
      counts.fromLTRB += (txt.match(/EdgeInsets\.fromLTRB/g) || []).length;
      counts.positionedLeft += (txt.match(/Positioned\(left:/g) || []).length;
      counts.positionedRight += (txt.match(/Positioned\(right:/g) || []).length;
      counts.alignmentLeft += (txt.match(/Alignment\.\w*Left/g) || []).length;
      counts.alignmentRight += (txt.match(/Alignment\.\w*Right/g) || []).length;
      counts.textAlignLeft += (txt.match(/TextAlign\.left/g) || []).length;
      counts.textAlignRight += (txt.match(/TextAlign\.right/g) || []).length;
      counts.textDirectionLtr += (txt.match(/TextDirection\.ltr/g) || []).length;
      counts.edgeInsetsLeft += (txt.match(/EdgeInsets\.only\([^)]*left:/g) || []).length;
      counts.edgeInsetsRight += (txt.match(/EdgeInsets\.only\([^)]*right:/g) || []).length;
    }
  }
}

walk(lib);
console.log(counts);
