const fs = require('fs');
const path = require('path');

const src = 'c:/Users/HP/Desktop/pfe/pricipaux/MAROC-LOC/frontend/src';

const hexColorRe = /#[0-9a-fA-F]{3,8}\b/g;
const rgbRe = /rgba?\([^)]+\)/g;
const inlineStyleRe = /style=\{?\{([^}]+)\}/g;
const arbitraryColorRe = /\b(bg|text|border|ring|shadow|from|via|to|caret|fill|stroke|decoration|outline|underline|placeholder|divide|accent)-\[([^\]]+)\]/g;

let hexCount = 0;
let rgbCount = 0;
let inlineStyleCount = 0;
let arbitraryColorCount = 0;
const files = new Set();
const samples = [];

function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p);
    else if (/\.(tsx|ts|css)$/.test(f)) {
      const txt = fs.readFileSync(p, 'utf8');
      let m;
      const hex = (txt.match(hexColorRe) || []).length;
      const rgb = (txt.match(rgbRe) || []).length;
      const arb = (txt.match(arbitraryColorRe) || []).length;
      const inline = (txt.match(inlineStyleRe) || []).length;
      hexCount += hex;
      rgbCount += rgb;
      arbitraryColorCount += arb;
      inlineStyleCount += inline;
      if (hex || rgb || arb || inline) {
        files.add(p);
        if (samples.length < 10) {
          const rel = p.replace(src + '/', '');
          samples.push({ file: rel, hex, rgb, arb, inline });
        }
      }
    }
  }
}

walk(src);
console.log({ hexCount, rgbCount, arbitraryColorCount, inlineStyleCount, files: files.size });
console.log('samples:', samples);
