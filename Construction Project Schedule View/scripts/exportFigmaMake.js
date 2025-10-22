import fs from 'fs';
import path from 'path';

const scriptPathname = decodeURIComponent(new URL(import.meta.url).pathname);
const root = path.resolve(path.dirname(scriptPathname), '..');

const rawJsonPath = path.join(root, 'src/data/rawStatusTable.json');
const highschoolPath = path.join(root, 'src/data/Highschool.js');
const outDir = path.join(root, 'src/data');

const toIsoDate = (d) => {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const parseDate = (s) => new Date(Date.parse(s.replace(/\//g, '-')));

const daysBetween = (a, b) => Math.floor(Math.abs(b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));

const normalizeStatus = (s) => {
  if (!s) return 'pending';
  const lower = String(s).toLowerCase();
  if (lower === 'complete' || lower === 'completed') return 'complete';
  if (lower === 'in progress' || lower === 'in-progress' || lower === 'progress') return 'in progress';
  return 'not started';
};

function extractFromHighschool() {
  const rtf = fs.readFileSync(highschoolPath, 'utf8');
  let pre = rtf
    .replace(/\\\{/g, '{')
    .replace(/\\\}/g, '}')
    .replace(/\\\n/g, '\n')
    .replace(/\\\r/g, '')
    .replace(/\r/g, '')
    .replace(/\t/g, ' ');

  const anchor = pre.indexOf('"table"');
  if (anchor === -1) return null;
  let startIdx = anchor;
  while (startIdx > 0 && pre[startIdx] !== '{') startIdx--;
  if (pre[startIdx] !== '{') return null;
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
  if (endIdx === -1) return null;
  let jsonSlice = pre.slice(startIdx, endIdx + 1);
  jsonSlice = jsonSlice.replace(/\\[a-zA-Z]+[0-9]*\s?/g, '');
  try {
    return JSON.parse(jsonSlice);
  } catch {
    return null;
  }
}

let data;
// Prefer extracting directly from Highschool.js to avoid any malformed saved JSON
if (fs.existsSync(highschoolPath)) {
  data = extractFromHighschool();
}
// Fallback to raw JSON file if available
if (!data && fs.existsSync(rawJsonPath)) {
  const text = fs.readFileSync(rawJsonPath, 'utf8');
  try {
    data = JSON.parse(text);
  } catch {
    // ignore, data stays undefined
  }
}

if (!data) {
  console.error('Failed to load dataset from Highschool.js or rawStatusTable.json');
  process.exit(1);
}
const dates = Object.keys(data.table || {}).sort((a, b) => parseDate(a) - parseDate(b));
if (dates.length === 0) {
  console.error('No dates found in rawStatusTable.json');
  process.exit(1);
}

const firstDate = parseDate(dates[0]);
const lastDate = parseDate(dates[dates.length - 1]);

// 1) Snapshots CSV (date,locationId,trade,status)
const snapshotRows = [['date', 'locationId', 'trade', 'status']];
for (const d of dates) {
  const byZone = data.table[d] || {};
  for (const zid of Object.keys(byZone)) {
    const entries = byZone[zid];
    if (Array.isArray(entries)) continue; // issues array, skip
    for (const trade of Object.keys(entries)) {
      const val = entries[trade];
      if (typeof val !== 'string') continue;
      snapshotRows.push([d.replace(/\//g, '-'), zid, trade, normalizeStatus(val)]);
    }
  }
}

const snapshotsCsv = snapshotRows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
fs.writeFileSync(path.join(outDir, 'figma_snapshots.csv'), snapshotsCsv, 'utf8');

// 2) Derived schedule CSV
// For each (zid, trade): earliest active (in progress/complete) = start; earliest complete = end; else last date
const scheduleRows = [['locationId', 'trade', 'startDate', 'endDate', 'durationDays', 'latestStatus']];

const zones = new Map(); // zid -> Set<trade>
for (const d of dates) {
  const byZone = data.table[d] || {};
  for (const zid of Object.keys(byZone)) {
    const entries = byZone[zid];
    if (Array.isArray(entries)) continue;
    const set = zones.get(zid) || new Set();
    for (const trade of Object.keys(entries)) {
      if (typeof entries[trade] === 'string') set.add(trade);
    }
    zones.set(zid, set);
  }
}

for (const [zid, tradeSet] of zones.entries()) {
  for (const trade of tradeSet) {
    let firstActive = null;
    let firstComplete = null;
    let latestStatus = 'not started';
    for (const d of dates) {
      const entries = data.table[d][zid] || {};
      const statusRaw = entries[trade];
      const status = typeof statusRaw === 'string' ? normalizeStatus(statusRaw) : undefined;
      if (status) latestStatus = status;
      if (!firstActive && (status === 'in progress' || status === 'complete')) firstActive = parseDate(d);
      if (!firstComplete && status === 'complete') firstComplete = parseDate(d);
    }
    const start = firstActive || firstDate;
    const end = firstComplete || lastDate;
    const duration = Math.max(1, daysBetween(start, end) + 1);
    scheduleRows.push([zid, trade, toIsoDate(start), toIsoDate(end), String(duration), latestStatus]);
  }
}

const scheduleCsv = scheduleRows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
fs.writeFileSync(path.join(outDir, 'figma_schedule.csv'), scheduleCsv, 'utf8');

console.log('Wrote figma_snapshots.csv and figma_schedule.csv to', outDir);


