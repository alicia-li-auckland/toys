# Prototype Implementation Plan

## Prototype: [Prototype Name]

**Purpose:** [What are we testing/exploring?]
**Audience:** [Who will use/see this?]
**Timeline:** [How quickly do we need this?]
**Created:** [Date]

---

## 1. Prototype Goals

### What We're Testing
[What hypothesis or concept is this prototype exploring?]

**Key Questions:**
- Question 1: [e.g., "Can users understand the matched data visualization?"]
- Question 2: [e.g., "Is the confidence score helpful or confusing?"]
- Question 3: [e.g., "How long does it take to review 100 matches?"]

### Success Criteria
[How will we know if this prototype is successful?]
- [ ] Users can complete [task] without asking questions
- [ ] Processing time is acceptable (< X seconds)
- [ ] Visual design is clear and professional enough for [audience]
- [ ] Key insight is immediately visible

### Out of Scope
[What are we explicitly NOT building in this prototype?]
- ❌ Perfect error handling (basic is fine)
- ❌ Mobile responsiveness (desktop only for now)
- ❌ User authentication (not needed for prototype)
- ❌ Data persistence (session-only, no saving)

---

## 2. Quick-Start Approach

### Option A: Single HTML File ⭐ (Recommended for speed)
**Why:** Fastest to build, easiest to share, no dependencies

**Tech Stack:**
- Single `index.html` file
- Inline CSS and JavaScript
- CDN libraries (PapaParse, Chart.js)
- No build step required

**Pros:**
- Can build in 2-4 hours
- Easy to share (email, Slack)
- Works offline
- No setup needed

**Cons:**
- Harder to maintain if grows complex
- Limited to browser capabilities
- No hot reload during development

---

### Option B: Vite + React (If prototype needs to scale)
**Why:** Better for complex interactions, component reuse

**Tech Stack:**
- Vite (fast bundler)
- React
- Tailwind CSS or shadcn/ui
- Local development server

**Pros:**
- Component reusability
- Modern development experience
- Easy to upgrade to production later

**Cons:**
- More setup time (1-2 hours)
- Requires Node.js
- Needs build step

---

**Chosen Approach:** [Option A / Option B]

**Rationale:** [Why this choice for this prototype?]

---

## 3. User Interface Mockup

### Layout Structure
```
┌─────────────────────────────────────────────────┐
│ Header: [Prototype Title]                      │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ Upload Section                          │   │
│  │ [Choose File] [Process]                │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ Summary Stats                           │   │
│  │ Total: 500 | Matched: 450 | Rate: 90% │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ Visualization                           │   │
│  │ [Chart showing key insight]            │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ Data Table                              │   │
│  │ [Rows of matched data]                 │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  [Export CSV] [Reset]                          │
└─────────────────────────────────────────────────┘
```

### Key Interactions
1. **File Upload:** User drops file or clicks to browse
2. **Process Button:** Triggers data processing
3. **Results Display:** Shows summary and details
4. **Filtering:** (If needed) Filter by category, threshold, etc.
5. **Export:** Download results as CSV

### Visual Design Notes
- Color scheme: [e.g., "Blue primary, green for success, red for errors"]
- Typography: [e.g., "Sans-serif, 16px base size"]
- Spacing: [e.g., "Generous whitespace, 20px margins"]
- Style: [e.g., "Clean and professional, minimal decoration"]

---

## 4. Core Functionality

### Minimum Viable Features
[What MUST work for this prototype to be useful?]

**Must Have:**
- [ ] Load data file
- [ ] Process/analyze data
- [ ] Display key insight
- [ ] Show results in table
- [ ] Basic error handling

**Should Have:**
- [ ] Summary statistics
- [ ] Visualization (chart/graph)
- [ ] Export results
- [ ] Loading states

**Could Have:**
- [ ] Filtering/sorting
- [ ] Search functionality
- [ ] Multiple views/tabs
- [ ] Keyboard shortcuts

**Won't Have:**
- Authentication
- Data persistence
- Real-time updates
- Mobile optimization

---

### Implementation Checklist

**Step 1: Basic Structure (30 min)**
- [ ] Create HTML file with sections
- [ ] Add basic CSS for layout
- [ ] Test that it loads in browser

**Step 2: File Upload (30 min)**
- [ ] Add file input
- [ ] Read file contents
- [ ] Parse CSV/JSON/etc
- [ ] Show file info (name, size, row count)

**Step 3: Core Logic (1-2 hours)**
- [ ] Implement main processing function
- [ ] Calculate key metrics
- [ ] Format results for display
- [ ] Add basic validation

**Step 4: Display Results (1 hour)**
- [ ] Summary stats cards
- [ ] Data table with results
- [ ] Basic styling for readability

**Step 5: Visualization (1 hour)**
- [ ] Choose chart type
- [ ] Implement with Chart.js or similar
- [ ] Connect to processed data
- [ ] Add labels and legend

**Step 6: Polish (30 min)**
- [ ] Loading spinner for slow operations
- [ ] Error messages for bad inputs
- [ ] Success confirmation
- [ ] Export button

---

## 5. Sample Code Structure

### Single HTML File Approach

```html
<!DOCTYPE html>
<html>
<head>
  <title>[Prototype Title]</title>
  <script src="https://cdn.jsdelivr.net/npm/papaparse@5"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script>
  <style>
    /* Inline CSS */
    * { box-sizing: border-box; }
    body { 
      font-family: system-ui, sans-serif; 
      max-width: 1200px; 
      margin: 0 auto; 
      padding: 20px;
    }
    .upload-section { margin: 20px 0; }
    .summary { display: flex; gap: 20px; margin: 20px 0; }
    .stat-card { 
      flex: 1; 
      padding: 15px; 
      background: #f0f0f0; 
      border-radius: 8px; 
    }
    table { 
      width: 100%; 
      border-collapse: collapse; 
      margin: 20px 0; 
    }
    th, td { 
      border: 1px solid #ddd; 
      padding: 10px; 
      text-align: left; 
    }
    th { background: #333; color: white; }
    .btn { 
      padding: 10px 20px; 
      background: #0066cc; 
      color: white; 
      border: none; 
      border-radius: 4px; 
      cursor: pointer; 
    }
    .btn:hover { background: #0052a3; }
  </style>
</head>
<body>
  <h1>[Prototype Title]</h1>
  
  <div class="upload-section">
    <input type="file" id="fileInput" accept=".csv">
    <button class="btn" onclick="processFile()">Process</button>
  </div>
  
  <div id="summary" class="summary" style="display: none;">
    <div class="stat-card">
      <h3>Total Rows</h3>
      <p id="totalRows">-</p>
    </div>
    <div class="stat-card">
      <h3>Matched</h3>
      <p id="matchedRows">-</p>
    </div>
    <div class="stat-card">
      <h3>Match Rate</h3>
      <p id="matchRate">-</p>
    </div>
  </div>
  
  <div id="chart-container" style="display: none;">
    <canvas id="chart"></canvas>
  </div>
  
  <div id="results" style="display: none;">
    <h2>Results</h2>
    <table id="dataTable"></table>
    <button class="btn" onclick="exportResults()">Export CSV</button>
  </div>
  
  <script>
    let processedData = [];
    
    async function processFile() {
      const fileInput = document.getElementById('fileInput');
      const file = fileInput.files[0];
      
      if (!file) {
        alert('Please select a file first');
        return;
      }
      
      // Read file
      const text = await file.text();
      
      // Parse CSV
      const parsed = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true
      });
      
      // Process data
      processedData = processData(parsed.data);
      
      // Display results
      displaySummary(processedData);
      displayChart(processedData);
      displayTable(processedData);
    }
    
    function processData(data) {
      // TODO: Implement core logic
      return data.map(row => ({
        ...row,
        // Add calculated fields
      }));
    }
    
    function displaySummary(data) {
      document.getElementById('summary').style.display = 'flex';
      document.getElementById('totalRows').textContent = data.length;
      // TODO: Update other stats
    }
    
    function displayChart(data) {
      // TODO: Create chart
    }
    
    function displayTable(data) {
      const table = document.getElementById('dataTable');
      // TODO: Populate table
      document.getElementById('results').style.display = 'block';
    }
    
    function exportResults() {
      const csv = Papa.unparse(processedData);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'results.csv';
      a.click();
    }
  </script>
</body>
</html>
```

---

## 6. Testing Plan

### Manual Testing Checklist
- [ ] Test with sample data file
- [ ] Test with empty file
- [ ] Test with invalid format
- [ ] Test with large file (performance)
- [ ] Test all interactive elements
- [ ] Test in different browsers (Chrome, Safari, Firefox)
- [ ] Test export functionality

### Key Scenarios
1. **Happy Path:** Upload valid file → Process → See results → Export
2. **Error Case:** Upload wrong format → See helpful error message
3. **Edge Case:** Upload very small file (1 row) → Still works
4. **Edge Case:** Upload large file (10k rows) → Completes in reasonable time

---

## 7. Demo Preparation

### Demo Script
1. **Intro (30 sec):** "This prototype tests [hypothesis]"
2. **Show Upload (15 sec):** "Here's how you load data"
3. **Show Processing (15 sec):** "Click process and wait"
4. **Show Results (1 min):** "Here's what you get - summary, chart, table"
5. **Highlight Key Insight (30 sec):** "Notice that [key finding]"
6. **Show Export (15 sec):** "You can download the results"
7. **Get Feedback (1 min):** "What do you think? What would make this more useful?"

### Sample Data
**Prepare 2-3 sample files:**
- `sample-small.csv` - 10 rows (for quick demo)
- `sample-typical.csv` - 500 rows (realistic use case)
- `sample-edge.csv` - Edge cases (duplicates, missing data)

---

## 8. Feedback Collection

### Questions to Ask Users
1. Was the purpose of this tool immediately clear?
2. Was the data processing fast enough?
3. Was the key insight visible at a glance?
4. What would you change about the interface?
5. Would you use this if it were available?
6. What features are missing?

### Feedback Form
```markdown
**Prototype Feedback**

Rate 1-5 (1=poor, 5=excellent):
- Clarity of purpose: [ ]
- Ease of use: [ ]
- Visual design: [ ]
- Speed/performance: [ ]
- Usefulness of output: [ ]

What worked well?
[Open text]

What was confusing?
[Open text]

What would you add/change?
[Open text]
```

---

## 9. Next Steps

### If Prototype is Successful
- [ ] Gather all feedback
- [ ] Prioritize improvements
- [ ] Decide: Enhance prototype or rebuild for production?
- [ ] Create full feature spec (use feature-spec.md template)
- [ ] Plan production implementation

### If Prototype Needs Changes
- [ ] Identify key issues from feedback
- [ ] Decide on pivot vs iterate
- [ ] Build revised version
- [ ] Test again

### If Prototype is Not Viable
- [ ] Document what we learned
- [ ] Decide if concept should be abandoned or reframed
- [ ] Explore alternative approaches

---

**Prototype Status:** [Not Started / In Progress / Ready to Demo / Complete]
**Demo Date:** [Date]
**Feedback Collected:** [Yes/No]
**Next Steps:** [What happens after demo?]

