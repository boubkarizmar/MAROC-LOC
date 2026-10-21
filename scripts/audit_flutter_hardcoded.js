const fs = require('fs');
const path = require('path');

const lib = 'c:/Users/HP/Desktop/pfe/pricipaux/MAROC-LOC/mobile-app/lib';

// Patterns that indicate a UI string we want to externalize
const uiPatterns = [
  /Text\(\s*['"]([^'"]+)['"]\s*\)/g,
  /hintText:\s*['"]([^'"]+)['"]/g,
  /labelText:\s*['"]([^'"]+)['"]/g,
  /helperText:\s*['"]([^'"]+)['"]/g,
  /errorText:\s*['"]([^'"]+)['"]/g,
  /counterText:\s*['"]([^'"]+)['"]/g,
  /prefixText:\s*['"]([^'"]+)['"]/g,
  /suffixText:\s*['"]([^'"]+)['"]/g,
  /title:\s*['"]([^'"]+)['"]/g,
  /content:\s*['"]([^'"]+)['"]/g,
  /message:\s*['"]([^'"]+)['"]/g,
  /label:\s*['"]([^'"]+)['"]/g,
  /tooltip:\s*['"]([^'"]+)['"]/g,
];

const skipRe = /^(https?:|\/|assets\/|images\/|packages\/|[a-z_][a-z0-9_]*$|#[0-9a-fA-F]{3,8}$|true|false|null|\d+$|\d+[.,]?\d*$)/;
const frenchStop = ['le ', 'la ', 'les ', 'de ', 'des ', 'du ', 'et ', 'un ', 'une ', 'en ', 'au ', 'aux ', 'pour ', 'par ', 'sur ', 'dans ', 'ce ', 'cette ', 'se ', 'qui ', 'que ', 'avec ', 'est ', 'sont ', 'a ', 'je ', 'tu ', 'il ', 'elle ', 'nous ', 'vous ', 'ils ', 'elles '];
const hasFrench = (s) => /[A-ZÉÀÈÙÂÊÎÔÛÄËÏÖÜÇ]/.test(s) && (/[éèàùâêîôûëïüç]/i.test(s) || frenchStop.some((w) => s.toLowerCase().includes(w)));
const hasWord = (s) => /[A-Za-zÉÀÈÙÂÊÎÔÛÄËÏÖÜÇ]{3,}/.test(s);

const matches = [];
const byFile = {};

function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    const st = fs.statSync(p);
    if (st.isDirectory()) {
      walk(p);
    } else if (/\.dart$/.test(f) && !p.includes('/generated/')) {
      const txt = fs.readFileSync(p, 'utf8');
      // Strip comments
      const clean = txt.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
      for (const re of uiPatterns) {
        let m;
        while ((m = re.exec(clean)) !== null) {
          const s = m[1].trim();
          if (s.length < 2) continue;
          if (skipRe.test(s)) continue;
          if (!hasWord(s) && !hasFrench(s)) continue;
          const rel = p.replace(lib + '/', '').replace(/\\/g, '/');
          matches.push({ file: rel, text: s });
          byFile[rel] = (byFile[rel] || 0) + 1;
        }
      }
    }
  }
}

walk(lib);

const sorted = Object.entries(byFile).sort((a, b) => b[1] - a[1]);
console.log('Total potential hardcoded UI strings:', matches.length);
console.log('Files affected:', sorted.length);
console.log('\nTop files:');
sorted.slice(0, 30).forEach(([f, n]) => console.log(`${n.toString().padStart(3)} ${f}`));
console.log('\nSample strings:');
matches.slice(0, 30).forEach((m) => console.log(`${m.file}: "${m.text.replace(/\n/g, ' ').slice(0, 80)}"`));
