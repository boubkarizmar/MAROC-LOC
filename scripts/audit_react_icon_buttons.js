const fs = require('fs');
const path = require('path');

const src = 'c:/Users/HP/Desktop/pfe/pricipaux/MAROC-LOC/frontend/src';
let count = 0;
const samples = [];

function stripTags(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p);
    else if (/\.(tsx|ts)$/.test(f)) {
      const txt = fs.readFileSync(p, 'utf8');
      const btnRe = /<button[^>]*>/g;
      let m;
      while ((m = btnRe.exec(txt)) !== null) {
        const start = m.index;
        const end = txt.indexOf('</button>', start);
        if (end === -1) continue;
        const inner = txt.slice(start + m[0].length, end);
        const text = stripTags(inner);
        const hasIcon = /<(svg|i\b|[A-Z][a-zA-Z]*Icon|Lucide|Icon|Menu|X\b|Search|Bell|Filter|Heart|User|Settings|Arrow|Plus|Trash|Edit|Eye|MapPin|Home)/.test(inner);
        if (text.length < 2 && hasIcon) {
          count++;
          const hasAria = /aria-label=/.test(txt.slice(start, start + m[0].length));
          if (!hasAria && samples.length < 8) samples.push({ file: p.replace(src + '/', ''), snippet: inner.slice(0, 80) });
        }
      }
    }
  }
}

walk(src);
console.log('icon-only buttons without visible text:', count);
console.log('sample without aria-label:', samples);
