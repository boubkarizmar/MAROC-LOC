const fs = require('fs');
const path = require('path');

const src = 'c:/Users/HP/Desktop/pfe/pricipaux/MAROC-LOC/frontend/src';

const counts = {
  ariaLabel: 0,
  ariaLabelledBy: 0,
  ariaDescribedBy: 0,
  role: 0,
  alt: 0,
  title: 0,
  buttonIconNoLabel: 0,
  h1: 0,
  h2: 0,
  prefersReducedMotion: 0,
  focusTrap: 0,
  useFocusTrap: 0,
  liveRegion: 0,
  tabIndex: 0,
};

const iconButtonFiles = [];

function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p);
    else if (/\.(tsx|ts)$/.test(f)) {
      const txt = fs.readFileSync(p, 'utf8');
      counts.ariaLabel += (txt.match(/aria-label=/g) || []).length;
      counts.ariaLabelledBy += (txt.match(/aria-labelledby=/g) || []).length;
      counts.ariaDescribedBy += (txt.match(/aria-describedby=/g) || []).length;
      counts.role += (txt.match(/\srole=/g) || []).length;
      counts.alt += (txt.match(/\salt=/g) || []).length;
      counts.title += (txt.match(/\stitle=/g) || []).length;
      counts.h1 += (txt.match(/<h1/g) || []).length;
      counts.h2 += (txt.match(/<h2/g) || []).length;
      counts.prefersReducedMotion += (txt.match(/prefers-reduced-motion/gi) || []).length;
      counts.focusTrap += (txt.match(/focus-trap/gi) || []).length;
      counts.useFocusTrap += (txt.match(/useFocusTrap/g) || []).length;
      counts.liveRegion += (txt.match(/aria-live=/g) || []).length;
      counts.tabIndex += (txt.match(/tabIndex=/g) || []).length;
      // Icon buttons: button with only icon children (rough)
      const btnRe = /<button[^>]*>/g;
      let m;
      while ((m = btnRe.exec(txt)) !== null) {
        const start = m.index;
        const end = txt.indexOf('</button>', start);
        if (end === -1) continue;
        const inner = txt.slice(start, end);
        const hasText = /[A-Za-zÉÀÈ]{2,}/.test(inner);
        const hasIcon = /<(svg|i\b|Lucide|Icon|Arrow|Search|Menu|X\b|Plus|Trash|Edit|Eye|Heart|Bell|User|Settings|Filter)/i.test(inner);
        if (hasIcon && !hasText) {
          counts.buttonIconNoLabel++;
          iconButtonFiles.push({ file: p.replace(src + '/', ''), snippet: inner.slice(0, 120) });
        }
      }
    }
  }
}

walk(src);
console.log(counts);
console.log('sample icon-only buttons:', iconButtonFiles.slice(0, 5));
