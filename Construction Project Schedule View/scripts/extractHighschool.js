/*
 Extract JSON from an RTF-wrapped file Highschool.js and write to rawStatusTable.json
*/
import fs from 'fs';
import path from 'path';

const scriptPathname = decodeURIComponent(new URL(import.meta.url).pathname);
const root = path.resolve(path.dirname(scriptPathname), '..');
const inputPath = path.join(root, 'src/data/Highschool.js');
const outputPath = path.join(root, 'src/data/rawStatusTable.json');

const rtf = fs.readFileSync(inputPath, 'utf8');

// The content appears to contain a JSON object with escaped quotes and backslashes inside RTF braces.
// Strategy: Find the first occurrence of "{\n  \"table\"" (escaped quotes) and the matching closing brace,
// then unescape sequences and parse.

// Pre-clean: convert escaped braces and line separators found in RTF to plain text
let pre = rtf
  .replace(/\\\{/g, '{')
  .replace(/\\\}/g, '}')
  .replace(/\\\n/g, '\n')
  .replace(/\\\r/g, '')
  .replace(/\r/g, '')
  .replace(/\t/g, ' ');

// Find the region containing the JSON by locating the first occurrence of '"table"'
const anchor = pre.indexOf('"table"');
if (anchor === -1) {
  console.error('Could not find the "table" anchor in Highschool.js');
  process.exit(1);
}

// Walk backward to the nearest '{' and forward to the matching '}' using brace counting
let startIdx = anchor;
while (startIdx > 0 && pre[startIdx] !== '{') startIdx--;
if (pre[startIdx] !== '{') {
  console.error('Could not locate JSON opening brace');
  process.exit(1);
}

let i = startIdx;
let depth = 0;
let endIdx = -1;
while (i < pre.length) {
  const ch = pre[i];
  if (ch === '{') depth++;
  if (ch === '}') {
    depth--;
    if (depth === 0) {
      endIdx = i;
      break;
    }
  }
  i++;
}

if (endIdx === -1) {
  console.error('Could not locate JSON closing brace');
  process.exit(1);
}

let jsonSlice = pre.slice(startIdx, endIdx + 1);

// Remove lingering RTF control words like \cf0, \cb2 etc.
jsonSlice = jsonSlice.replace(/\\[a-zA-Z]+[0-9]*\s?/g, '');

let data;
try {
  data = JSON.parse(jsonSlice);
} catch (e) {
  console.error('Failed to parse extracted JSON:', e.message);
  // Write raw for debugging
  fs.writeFileSync(outputPath + '.raw.txt', jsonSlice, 'utf8');
  process.exit(1);
}

fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf8');
console.log('Wrote', outputPath);


