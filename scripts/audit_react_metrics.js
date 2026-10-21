const fs = require('fs');
const path = require('path');

const src = 'c:/Users/HP/Desktop/pfe/pricipaux/MAROC-LOC/frontend/src';

let classNameCount = 0;
let words = 0;
const tokens = new Set();
const systemImports = new Set();
const uiImports = new Set();
const filesWithClassName = new Set();

function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    const st = fs.statSync(p);
    if (st.isDirectory()) {
      walk(p);
    } else if (/\.(tsx|ts)$/.test(f)) {
      const txt = fs.readFileSync(p, 'utf8');
      const classRe = /className=\{?[`"']([^`"'}]+)/g;
      let m;
      while ((m = classRe.exec(txt)) !== null) {
        classNameCount++;
        filesWithClassName.add(p);
        const cls = m[1].trim().split(/\s+/);
        words += cls.length;
        cls.forEach((c) => tokens.add(c));
      }
      const impRe = /from\s+['"]([^'"]+)['"]/g;
      let im;
      while ((im = impRe.exec(txt)) !== null) {
        const srcPath = im[1];
        if (srcPath.includes('/system/') || srcPath.startsWith('design-system')) {
          systemImports.add(srcPath);
        }
        if (srcPath.includes('/ui/') || srcPath.includes('components/ui/')) {
          uiImports.add(srcPath);
        }
      }
    }
  }
}

walk(src);

console.log('className occurrences:', classNameCount);
console.log('files with className:', filesWithClassName.size);
console.log('utility words:', words);
console.log('unique tokens:', tokens.size);
console.log('ui import paths:', uiImports.size);
console.log('system import paths:', systemImports.size);
