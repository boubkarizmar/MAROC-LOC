const fs = require('fs');
const path = require('path');

const src = 'c:/Users/HP/Desktop/pfe/pricipaux/MAROC-LOC/frontend/src';
const fr = JSON.parse(fs.readFileSync('c:/Users/HP/Desktop/pfe/pricipaux/MAROC-LOC/frontend/src/i18n/locales/fr.json', 'utf8'));

function flatten(obj, prefix = '') {
  const out = {};
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(out, flatten(v, prefix + k + '.'));
    } else {
      out[prefix + k] = v;
    }
  }
  return out;
}

const keys = Object.keys(flatten(fr));
const used = new Set();

function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p);
    else if (/\.(tsx|ts)$/.test(f)) {
      const txt = fs.readFileSync(p, 'utf8');
      const re = /\bt\(['"`]([^'"`]+)['"`]/g;
      let m;
      while ((m = re.exec(txt)) !== null) used.add(m[1]);
    }
  }
}

walk(src);

const missing = [...used].filter((k) => !k.includes('${') && !keys.includes(k));
console.log('static missing count:', missing.length);
console.log(missing.slice(0, 50).join('\n'));
