const fs = require('fs');
const path = require('path');

const src = 'c:/Users/HP/Desktop/pfe/pricipaux/MAROC-LOC/frontend/src';

const counts = {
  responsiveClasses: 0,
  fixedPixelWidths: 0,
  useMediaQuery: 0,
  minWidthMedia: 0,
  maxWidthMedia: 0,
  container: 0,
  sidebarFixed: 0,
};

function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p);
    else if (/\.(tsx|ts|css)$/.test(f)) {
      const txt = fs.readFileSync(p, 'utf8');
      counts.responsiveClasses += (txt.match(/\b(sm|md|lg|xl|2xl):/g) || []).length;
      counts.fixedPixelWidths += (txt.match(/\bw-\[\d+px\]/g) || []).length;
      counts.useMediaQuery += (txt.match(/useMediaQuery/g) || []).length;
      counts.minWidthMedia += (txt.match(/min-width:/g) || []).length;
      counts.maxWidthMedia += (txt.match(/max-width:/g) || []).length;
      counts.container += (txt.match(/\bcontainer\b/g) || []).length;
      counts.sidebarFixed += (txt.match(/w-\[340px\]|w-80\b|w-96\b|w-\[320px\]/g) || []).length;
    }
  }
}

walk(src);
console.log(counts);
