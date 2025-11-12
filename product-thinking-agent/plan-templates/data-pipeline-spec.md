# Data Pipeline Implementation Plan

## Pipeline: [Pipeline Name]

**Purpose:** [What does this pipeline do?]
**Frequency:** [One-time, Daily, Weekly, On-demand]
**Created:** [Date]

---

## 1. Overview

### Input → Processing → Output

```
[Input Source]
     ↓
[Validation]
     ↓
[Transformation]
     ↓
[Enrichment]
     ↓
[Output Destination]
```

### Business Goal
[Why are we building this pipeline? What decision does it enable?]

---

## 2. Data Sources

### Input 1: [Source Name]
- **Format:** [CSV, XER, JSON, API, Database]
- **Location:** [File path, URL, database connection]
- **Size:** [Typical size: MB, row count]
- **Frequency:** [How often updated]
- **Schema:**
  ```
  Column Name | Type | Required | Description
  ------------|------|----------|------------
  location    | string | Yes | Building location identifier
  trade       | string | Yes | Construction trade name
  completion  | number | Yes | Percentage complete (0-100)
  ```

### Input 2: [Source Name]
[Same structure as above]

---

## 3. Data Validation

### Input Checks
**What to Verify:**
- [ ] File exists and is readable
- [ ] File format matches expected (CSV headers, XER structure, etc.)
- [ ] Required columns/fields are present
- [ ] Data types are correct
- [ ] No completely empty files
- [ ] File size is within expected range

**Validation Code:**
```javascript
async function validateInput(filePath, expectedSchema) {
  // Check file exists
  if (!await fs.access(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  
  // Check size
  const stats = await fs.stat(filePath);
  if (stats.size === 0) {
    throw new Error(`File is empty: ${filePath}`);
  }
  if (stats.size > MAX_FILE_SIZE) {
    throw new Error(`File too large: ${filePath} (${stats.size} bytes)`);
  }
  
  // Parse and validate structure
  const content = await fs.readFile(filePath, 'utf-8');
  const parsed = Papa.parse(content, { header: true });
  
  // Check required columns
  const missingColumns = expectedSchema.required.filter(
    col => !parsed.meta.fields.includes(col)
  );
  if (missingColumns.length > 0) {
    throw new Error(`Missing columns: ${missingColumns.join(', ')}`);
  }
  
  return parsed.data;
}
```

### Data Quality Checks
- [ ] No duplicate rows (or handle appropriately)
- [ ] Dates are parseable and within reasonable range
- [ ] Numeric fields are actually numbers (not strings)
- [ ] Enumerations match expected values
- [ ] Referential integrity (IDs exist in related tables)

**Quality Check Code:**
```javascript
function checkDataQuality(data) {
  const issues = [];
  
  // Check for duplicates
  const seen = new Set();
  data.forEach((row, index) => {
    const key = `${row.location}_${row.trade}`;
    if (seen.has(key)) {
      issues.push(`Row ${index}: Duplicate location+trade: ${key}`);
    }
    seen.add(key);
  });
  
  // Check completion range
  data.forEach((row, index) => {
    if (row.completion < 0 || row.completion > 100) {
      issues.push(`Row ${index}: Invalid completion: ${row.completion}`);
    }
  });
  
  return issues;
}
```

---

## 4. Data Transformation

### Step 1: Normalization
**Purpose:** Standardize data formats for consistent processing

**Operations:**
- Trim whitespace from strings
- Convert to lowercase for case-insensitive matching
- Remove special characters
- Standardize date formats
- Convert string numbers to actual numbers

**Code:**
```javascript
function normalizeRow(row) {
  return {
    location: (row.location || '').trim().toLowerCase(),
    trade: (row.trade || '').trim().toLowerCase(),
    completion: parseFloat(row.completion || 0),
    date: parseDate(row.date),
  };
}

function parseDate(dateStr) {
  // Handle multiple date formats
  const formats = ['YYYY-MM-DD', 'MM/DD/YYYY', 'DD-MMM-YYYY'];
  for (const format of formats) {
    const parsed = moment(dateStr, format, true);
    if (parsed.isValid()) {
      return parsed.toDate();
    }
  }
  return null;
}
```

---

### Step 2: Enrichment
**Purpose:** Add calculated fields or lookup additional data

**Operations:**
- Calculate derived fields (e.g., completion rate, variance)
- Lookup related data (e.g., trade categories, location hierarchy)
- Add metadata (processing timestamp, data source)

**Code:**
```javascript
function enrichRow(row, metadata) {
  return {
    ...row,
    // Add trade category
    trade_category: lookupTradeCategory(row.trade),
    
    // Add location hierarchy
    building: extractBuilding(row.location),
    floor: extractFloor(row.location),
    
    // Add calculated fields
    is_complete: row.completion === 100,
    is_in_progress: row.completion > 0 && row.completion < 100,
    
    // Add metadata
    processed_at: new Date().toISOString(),
    source_file: metadata.fileName,
  };
}
```

---

### Step 3: Aggregation
**Purpose:** Summarize data at different levels

**Operations:**
- Group by location, trade, date range
- Calculate statistics (sum, average, min, max)
- Count records by category
- Identify trends

**Code:**
```javascript
function aggregateByLocation(data) {
  const byLocation = {};
  
  data.forEach(row => {
    if (!byLocation[row.location]) {
      byLocation[row.location] = {
        location: row.location,
        activities: [],
        total_completion: 0,
        count: 0,
      };
    }
    
    byLocation[row.location].activities.push(row);
    byLocation[row.location].total_completion += row.completion;
    byLocation[row.location].count++;
  });
  
  // Calculate averages
  return Object.values(byLocation).map(loc => ({
    ...loc,
    avg_completion: loc.total_completion / loc.count,
  }));
}
```

---

### Step 4: Filtering
**Purpose:** Remove irrelevant or out-of-scope data

**Filter Rules:**
- Remove rows where [condition]
- Keep only rows matching [criteria]
- Exclude [specific categories]

**Code:**
```javascript
function applyFilters(data, filters) {
  let filtered = data;
  
  // Filter by date range
  if (filters.start_date && filters.end_date) {
    filtered = filtered.filter(row => 
      row.date >= filters.start_date && row.date <= filters.end_date
    );
  }
  
  // Filter by construction activities only
  if (filters.construction_only) {
    filtered = filtered.filter(row => 
      isConstructionActivity(row.trade)
    );
  }
  
  // Filter by completion threshold
  if (filters.min_completion) {
    filtered = filtered.filter(row => 
      row.completion >= filters.min_completion
    );
  }
  
  return filtered;
}
```

---

## 5. Error Handling

### Error Types & Responses

**Critical Errors (Stop Pipeline):**
- Input file not found
- Input file format completely wrong
- Required fields missing entirely
- Database connection failure

**Response:** Log error, notify user, exit gracefully

```javascript
try {
  const data = await loadInput(filePath);
} catch (error) {
  console.error('Critical error:', error.message);
  notifyUser(`Pipeline failed: ${error.message}`);
  process.exit(1);
}
```

---

**Recoverable Errors (Log and Continue):**
- Single row has invalid data
- Optional field is missing
- Enrichment lookup fails for one record

**Response:** Log warning, skip/fix bad record, continue

```javascript
const results = [];
const errors = [];

data.forEach((row, index) => {
  try {
    const processed = processRow(row);
    results.push(processed);
  } catch (error) {
    errors.push({ row: index, error: error.message, data: row });
    // Continue to next row
  }
});

console.log(`Processed ${results.length} rows successfully`);
console.log(`Encountered ${errors.length} errors`);
```

---

### Logging Strategy

**What to Log:**
- Pipeline start/end times
- Input file names and sizes
- Row counts at each stage
- Errors and warnings
- Performance metrics

**Log Format:**
```javascript
console.log('[2024-12-01 10:00:00] Pipeline started');
console.log('[2024-12-01 10:00:01] Loaded input: schedule.csv (5.2 MB, 5000 rows)');
console.log('[2024-12-01 10:00:03] Validation complete: 4998 valid, 2 invalid');
console.log('[2024-12-01 10:00:05] Transformation complete: 4998 rows processed');
console.log('[2024-12-01 10:00:06] Output written: matches.csv (3.8 MB)');
console.log('[2024-12-01 10:00:06] Pipeline complete in 6.2 seconds');
```

---

## 6. Output Specification

### Output 1: [Output Name]
- **Format:** [CSV, JSON, Database insert, API call]
- **Location:** [File path, database table, API endpoint]
- **Schema:**
  ```
  Field Name | Type | Description
  -----------|------|------------
  location   | string | Standardized location name
  trade      | string | Standardized trade name
  completion | number | Completion percentage
  matched_at | timestamp | When this match was made
  confidence | number | Match confidence score (0-1)
  ```

### Output 2: [Summary Stats]
- **Format:** JSON
- **Contents:**
  ```json
  {
    "pipeline_run": {
      "timestamp": "2024-12-01T10:00:00Z",
      "duration_seconds": 6.2,
      "status": "success"
    },
    "input_summary": {
      "total_rows": 5000,
      "valid_rows": 4998,
      "invalid_rows": 2
    },
    "output_summary": {
      "total_matches": 4500,
      "auto_matched": 4000,
      "needs_review": 500,
      "unmatched": 498
    }
  }
  ```

### Output Writing
```javascript
async function writeOutput(data, outputPath) {
  // Convert to CSV
  const csv = Papa.unparse(data, {
    quotes: true,
    header: true
  });
  
  // Write file
  await fs.writeFile(outputPath, csv, 'utf-8');
  
  console.log(`✓ Wrote ${data.length} rows to ${outputPath}`);
  
  // Verify file was written
  const stats = await fs.stat(outputPath);
  console.log(`  File size: ${(stats.size / 1024).toFixed(1)} KB`);
}
```

---

## 7. Performance Optimization

### Target Performance
- Input loading: < 2 seconds per 10MB
- Processing: < 5 seconds per 10k rows
- Output writing: < 1 second per 10MB
- Total pipeline: < 10 seconds for typical dataset

### Optimization Strategies

**For Large Files:**
- Use streaming instead of loading entire file into memory
- Process in chunks
- Use Web Workers or worker threads for parallel processing

**For Slow Operations:**
- Cache lookup results
- Batch database queries
- Use indexes on frequently queried fields

**Code Example:**
```javascript
// Streaming for large files
import { createReadStream } from 'fs';
import csv from 'csv-parser';

async function processLargeFile(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    
    createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        // Process each row as it streams
        const processed = processRow(row);
        results.push(processed);
      })
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}
```

---

## 8. Testing Strategy

### Unit Tests
**Test Individual Functions:**
- Normalization logic
- Validation rules
- Transformation functions
- Calculation accuracy

**Example:**
```javascript
describe('normalizeLocation', () => {
  it('should convert to lowercase', () => {
    expect(normalizeLocation('Building A')).toBe('buildinga');
  });
  
  it('should remove special characters', () => {
    expect(normalizeLocation('Building A-2')).toBe('buildinga2');
  });
});
```

### Integration Tests
**Test Full Pipeline:**
- End-to-end with sample data
- Expected output matches actual
- Performance meets targets

**Example:**
```javascript
describe('Full Pipeline', () => {
  it('should process sample data correctly', async () => {
    const result = await runPipeline({
      scheduleFile: 'test/sample-schedule.csv',
      actualFile: 'test/sample-actual.csv',
      outputFile: 'test/output.csv'
    });
    
    expect(result.matched_count).toBe(90); // 90 of 100 matched
    expect(result.duration).toBeLessThan(5000); // < 5 seconds
  });
});
```

### Edge Case Tests
- Empty input files
- Invalid data formats
- Extremely large files
- Duplicate records
- Missing required fields

---

## 9. Monitoring & Alerts

### Metrics to Track
- Pipeline success/failure rate
- Average processing time
- Data quality issues (invalid rows, duplicates)
- Output file sizes

### Alerts to Configure
- Pipeline failure (notify immediately)
- Processing time > 2x normal (performance degradation)
- Data quality issues > 5% (data problem)
- Output file size dramatically different (unexpected result)

### Logging for Debugging
```javascript
// Detailed logging for troubleshooting
if (DEBUG_MODE) {
  console.log('Input row:', JSON.stringify(row, null, 2));
  console.log('After normalization:', JSON.stringify(normalized, null, 2));
  console.log('After enrichment:', JSON.stringify(enriched, null, 2));
}
```

---

## 10. Deployment & Scheduling

### Manual Execution
```bash
node pipeline.js \
  --schedule data/schedule.csv \
  --actual data/actual.csv \
  --output results/matches.csv \
  --config config.json
```

### Automated Scheduling (if needed)
```bash
# Cron job (Unix/Mac)
0 2 * * * /usr/bin/node /path/to/pipeline.js --config prod.json

# Task Scheduler (Windows)
# Create task that runs pipeline.js daily at 2am
```

### Environment Configuration
```javascript
// config.json
{
  "input_dir": "/data/input",
  "output_dir": "/data/output",
  "log_dir": "/var/log/pipelines",
  "max_file_size_mb": 100,
  "confidence_threshold": 0.8,
  "enable_notifications": true
}
```

---

## 11. Maintenance & Evolution

### Version Control
- Track pipeline code in git
- Document changes in CHANGELOG
- Tag releases with semantic versions

### Documentation
- Keep this spec updated as pipeline evolves
- Document any configuration changes
- Note any data format changes

### Future Enhancements
- [ ] Add support for additional input formats
- [ ] Implement incremental processing (only new data)
- [ ] Add data quality dashboard
- [ ] Set up automated testing in CI/CD
- [ ] Add retry logic for transient failures

---

**Pipeline Ready:** [Yes/No]
**Tested With:** [Sample data description]
**Approved By:** [Name]
**Deployment Date:** [Date]

