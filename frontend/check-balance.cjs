const fs = require('fs');
const content = fs.readFileSync('src/components/home/RecommendationSection.tsx', 'utf8');
const lines = content.split('\n');
let depth = 0, paren = 0, bracket = 0;
let inString = false, stringChar = '';
lines.forEach((line, idx) => {
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    const prev = line[i-1];
    if (!inString) {
      if (ch === '"' || ch === "'" || ch === '`') { inString = true; stringChar = ch; }
      else if (ch === '{') depth++;
      else if (ch === '}') depth--;
      else if (ch === '(') paren++;
      else if (ch === ')') paren--;
      else if (ch === '[') bracket++;
      else if (ch === ']') bracket--;
    } else {
      if (ch === stringChar && prev !== '\\') inString = false;
    }
  }
  if (idx >= 280) console.log(`Line ${idx+1}: brace=${depth} paren=${paren} bracket=${bracket}`);
});
console.log('Final: brace=' + depth + ' paren=' + paren + ' bracket=' + bracket);
