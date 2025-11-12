# Decision Template: Data Processing

## Problem Statement Template

**User Request:** [Summarize what they want to do with data]

**Clarifying Questions:**

1. **Data Source & Format:**
   - What file format? (XER, CSV, JSON, Excel, PDF)
   - How large is the file? (KB, MB, number of rows)
   - How clean is the data? (consistent, messy, unknown)

2. **Processing Requirements:**
   - What transformations needed? (parse, filter, aggregate, match, analyze)
   - Any calculations or derived fields?
   - Need to combine multiple datasets?

3. **Output Requirements:**
   - What format? (JSON, CSV, visualization, report)
   - Interactive or static?
   - Who consumes the output? (human, another system)

4. **Performance Needs:**
   - How often will this run? (one-time, daily, real-time)
   - What's acceptable processing time? (seconds, minutes)
   - Where does it run? (browser, server, offline)

5. **Quality Requirements:**
   - Tolerance for errors? (must be perfect vs exploratory)
   - Need audit trail or logging?
   - What happens if data is malformed?

## Option Frameworks

### Option A: Client-Side Browser Processing

**When to Use:**
- Data < 10MB
- One-time or infrequent processing
- Need maximum portability (no server setup)
- User has modern browser

**Stack:**
```javascript
- PapaParse for CSV parsing
- fast-xml-parser for XER/XML
- Native JS Array methods for transformations
- Optional: Web Workers for heavy processing
```

**Pros:**
- Zero server infrastructure
- Works offline
- Instant feedback (no network latency)
- Easy to share (single HTML file)

**Cons:**
- Limited by browser memory (~50-100MB)
- Slower for large datasets
- User's device does the work
- No centralized processing/caching

**Effort:** 2-4 hours

**Code Pattern:**
```javascript
// Upload file
const file = event.target.files[0];
const text = await file.text();

// Parse based on format
const data = ext === '.csv' 
  ? Papa.parse(text, {header: true}).data
  : parseXER(text);

// Transform
const processed = data
  .filter(row => /* criteria */)
  .map(row => /* transform */)
  .reduce((acc, row) => /* aggregate */, {});

// Output
displayResults(processed);
// or downloadCSV(processed);
```

---

### Option B: Node.js Script

**When to Use:**
- Data 10MB-1GB
- Batch processing or automation
- No UI needed (command-line is fine)
- Output is file-based (CSV, JSON)

**Stack:**
```javascript
- Node.js with fs/promises
- PapaParse or csv-parser
- fast-xml-parser for XER
- Optional: streams for very large files
```

**Pros:**
- Handle larger datasets
- Easy to automate (cron, CI/CD)
- Can process multiple files
- Faster than browser for heavy processing

**Cons:**
- Requires Node.js installed
- No visual interface
- Not as shareable (need tech setup)
- Harder to iterate (edit code, run, check output)

**Effort:** 2-3 hours

**Code Pattern:**
```javascript
import fs from 'fs/promises';
import Papa from 'papaparse';

// Read file
const content = await fs.readFile('input.csv', 'utf-8');

// Parse
const { data } = Papa.parse(content, { header: true });

// Process
const results = processData(data);

// Write output
await fs.writeFile(
  'output.json',
  JSON.stringify(results, null, 2)
);

console.log(`Processed ${data.length} rows`);
```

---

### Option C: Streaming Processing (Large Files)

**When to Use:**
- Data > 1GB
- Don't need all data in memory at once
- Line-by-line or chunk-by-chunk processing works

**Stack:**
```javascript
- Node.js streams
- csv-parser or fast-csv
- SAX-style XML parsing for XER
```

**Pros:**
- Handle massive files (10GB+)
- Constant memory usage
- Can start outputting results before finishing input

**Cons:**
- More complex code
- Harder to debug
- Can't easily do multi-pass operations
- Requires streaming-compatible logic

**Effort:** 4-6 hours

**Code Pattern:**
```javascript
import fs from 'fs';
import csv from 'csv-parser';

const results = [];

fs.createReadStream('huge-file.csv')
  .pipe(csv())
  .on('data', (row) => {
    // Process each row
    const processed = transformRow(row);
    if (meetsFilter(processed)) {
      results.push(processed);
    }
  })
  .on('end', () => {
    // All done
    outputResults(results);
  });
```

---

## Recommendation Logic

```
Data Volume Decision Tree:

< 5MB (< 10k rows)
  └─ Need UI? 
      ├─ Yes → Option A (Browser)
      └─ No → Option B (Node.js script)

5MB - 100MB (10k - 100k rows)
  └─ Need interactivity?
      ├─ Yes → Option A + Web Workers
      └─ No → Option B (Node.js)

100MB - 1GB (100k - 1M rows)
  └─ Always → Option B (Node.js)
      └─ If very slow → Option C (Streaming)

> 1GB
  └─ Always → Option C (Streaming)
      └─ Or consider database/specialized tools
```

## Quality Checklist

Every data processing solution should include:

### Data Validation
```javascript
// ✓ Check file format matches expected
if (!file.name.endsWith('.csv')) {
  throw new Error('Expected CSV file');
}

// ✓ Validate required columns exist
const requiredColumns = ['location', 'trade', 'completion'];
const missing = requiredColumns.filter(col => !headers.includes(col));
if (missing.length > 0) {
  throw new Error(`Missing columns: ${missing.join(', ')}`);
}

// ✓ Check data types
row.completion = parseFloat(row.completion);
if (isNaN(row.completion)) {
  console.warn(`Invalid completion value: ${row.completion}`);
}
```

### Error Handling
```javascript
// ✓ Wrap file I/O in try-catch
try {
  const content = await fs.readFile(filePath, 'utf-8');
} catch (error) {
  throw new Error(`Failed to read file: ${error.message}`);
}

// ✓ Handle malformed data gracefully
const parsed = Papa.parse(content, {
  header: true,
  skipEmptyLines: true,
  error: (error) => {
    console.warn(`Parsing warning: ${error.message}`);
  }
});
```

### Progress Feedback
```javascript
// ✓ For long operations, show progress
console.log(`Processing ${data.length} rows...`);
const startTime = Date.now();

// Process data...

const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
console.log(`✓ Complete in ${elapsed}s`);
```

### Output Validation
```javascript
// ✓ Verify output makes sense
if (results.length === 0) {
  console.warn('Warning: No results generated. Check your filters.');
}

// ✓ Include metadata
const output = {
  metadata: {
    processed_at: new Date().toISOString(),
    input_rows: data.length,
    output_rows: results.length,
    filters_applied: filters,
  },
  data: results,
};
```

## Common Patterns

### Pattern: Parse Multiple File Formats

```javascript
async function parseFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const content = await fs.readFile(filePath, 'utf-8');
  
  switch (ext) {
    case '.csv':
      return Papa.parse(content, { header: true }).data;
    case '.xer':
      return parseXER(content);
    case '.json':
      return JSON.parse(content);
    default:
      throw new Error(`Unsupported format: ${ext}`);
  }
}
```

### Pattern: Normalize and Clean Data

```javascript
function normalizeRow(row) {
  return {
    location: (row.location || row.Location || '').trim(),
    trade: (row.trade || row.Trade || '').trim(),
    completion: parseFloat(row.completion_percentage || row.completion || 0),
    status: normalizeStatus(row.status || row.Status),
  };
}

function normalizeStatus(status) {
  const lower = (status || '').toLowerCase();
  if (lower.includes('complete') || lower === 'done') return 'Complete';
  if (lower.includes('progress') || lower === 'active') return 'In Progress';
  if (lower.includes('not') || lower === 'pending') return 'Not Started';
  return 'Unknown';
}
```

### Pattern: Filter and Aggregate

```javascript
// Filter to construction activities only
const constructionActivities = data.filter(row => {
  const code = row.activity_code || '';
  return !['A', 'D', 'E', 'H', 'L', 'X'].includes(code); // Non-construction codes
});

// Group by location
const byLocation = constructionActivities.reduce((acc, row) => {
  const loc = row.location;
  if (!acc[loc]) acc[loc] = [];
  acc[loc].push(row);
  return acc;
}, {});

// Calculate completion per location
const locationSummary = Object.entries(byLocation).map(([location, activities]) => ({
  location,
  total_activities: activities.length,
  avg_completion: activities.reduce((sum, a) => sum + a.completion, 0) / activities.length,
  completed_count: activities.filter(a => a.completion === 100).length,
}));
```

### Pattern: Export Results

```javascript
// Export as CSV
function exportCSV(data, filename) {
  const csv = Papa.unparse(data);
  fs.writeFileSync(filename, csv);
  console.log(`✓ Exported to ${filename}`);
}

// Export as JSON
function exportJSON(data, filename) {
  fs.writeFileSync(filename, JSON.stringify(data, null, 2));
  console.log(`✓ Exported to ${filename}`);
}

// Export as HTML table
function exportHTML(data, filename) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head><title>Results</title></head>
    <body>
      <table border="1">
        <thead><tr>${Object.keys(data[0]).map(k => `<th>${k}</th>`).join('')}</tr></thead>
        <tbody>
          ${data.map(row => `<tr>${Object.values(row).map(v => `<td>${v}</td>`).join('')}</tr>`).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;
  fs.writeFileSync(filename, html);
  console.log(`✓ Exported to ${filename}`);
}
```

## Example Conversation

```
User: "I need to process this 50MB XER file and extract all concrete activities"

You: "Got it - 50MB XER for concrete extraction. A few questions:

1. How many activities are in the file? (rough estimate)
2. How do you identify 'concrete activities'? 
   - By activity code?
   - By activity name keywords?
   - By trade assignment?
3. What do you need as output?
   - List of activities (CSV)?
   - Summary stats?
   - Visualization?
4. Is this one-time or will you process multiple files?"

User: "About 20k activities. Concrete is activity code 'N' or names with 'concrete', 'SOG', 'foundation'. Need CSV output. Will process 5-10 files."

You: "Perfect! For 50MB with 20k activities and multiple files to process, I recommend:

**Option B: Node.js Script**

Why:
- 50MB is too large for comfortable browser processing
- Batch processing multiple files is easier in Node
- CSV output doesn't need UI
- You can automate this once it works

The script will:
1. Parse XER file (extract TASK table and activity codes)
2. Filter by code 'N' OR name contains ['concrete', 'sog', 'foundation']
3. Export matching activities to CSV
4. Handle all 5-10 files in one run

Estimated effort: 2-3 hours to build and test.

Sound good?"
```

---

## Red Flags

🚩 **Too much data for browser**: If data > 50MB, don't process in browser
🚩 **Complex multi-pass logic with streaming**: Streaming doesn't work well if you need multiple passes
🚩 **Assuming data structure**: Always validate columns/fields exist
🚩 **No progress feedback**: For >5 second operations, show progress
🚩 **Brittle parsing**: Hard-coding column indices instead of using header names

