# Decision Template: Interactive Prototype

## Problem Statement Template

**User Request:** [Summarize the interactive tool they want to build]

**Clarifying Questions:**

1. **Purpose & Audience:**
   - Who will use this? (internal team, customer demo, production tool)
   - What's the primary use case? (exploration, presentation, daily operations)
   - How often will it be used? (one-time, weekly, daily)

2. **Data Characteristics:**
   - How much data to display? (rows, file size)
   - Static data or needs live updates?
   - Data source? (local file, API, database)

3. **Interactions Needed:**
   - What can users do? (filter, sort, search, drill-down, edit)
   - Any complex state management? (multi-step flows, undo/redo)
   - Export capabilities needed?

4. **Visual Requirements:**
   - What visualizations? (tables, charts, maps, timelines)
   - Any specific design requirements? (branding, accessibility)
   - Device support? (desktop only, mobile-friendly)

5. **Technical Constraints:**
   - Where will this run? (local file, hosted, embedded)
   - Any deployment limitations? (no build step, no server, etc.)
   - Performance expectations? (load time, interaction speed)

## Option Frameworks

### Option A: Single HTML File (Vanilla JS)

**When to Use:**
- Quick prototype (< 1 day)
- Maximum portability needed
- Simple to moderate interactions
- Data < 5,000 rows
- No build tooling available

**Stack:**
```html
- Single .html file
- Inline CSS and JavaScript
- CDN libraries (Chart.js, PapaParse)
- localStorage for state persistence
```

**Pros:**
- Zero setup - just open in browser
- Easy to share (email, Slack, Google Drive)
- Works offline
- No dependencies or build step
- Fast iteration (edit and refresh)

**Cons:**
- Harder to organize large codebases
- No modern JS features (modules, JSX)
- Manual DOM manipulation
- Limited component reusability
- Can get messy with complex state

**Effort:** 2-4 hours

**Code Pattern:**
```html
<!DOCTYPE html>
<html>
<head>
  <title>Construction Progress Dashboard</title>
  <script src="https://cdn.jsdelivr.net/npm/papaparse@5"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script>
  <style>
    /* Inline styles */
    body { font-family: sans-serif; margin: 20px; }
    .filter-panel { margin-bottom: 20px; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px; }
  </style>
</head>
<body>
  <h1>Progress Dashboard</h1>
  
  <div class="filter-panel">
    <input type="text" id="search" placeholder="Search...">
    <select id="trade-filter">
      <option value="">All Trades</option>
    </select>
  </div>
  
  <div id="chart-container">
    <canvas id="progress-chart"></canvas>
  </div>
  
  <table id="data-table"></table>
  
  <script>
    let data = [];
    
    // File upload handler
    document.getElementById('file-upload').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      const text = await file.text();
      data = Papa.parse(text, { header: true }).data;
      render();
    });
    
    // Render function
    function render() {
      renderChart();
      renderTable();
    }
    
    function renderChart() { /* Chart.js code */ }
    function renderTable() { /* DOM manipulation */ }
  </script>
</body>
</html>
```

---

### Option B: Vite + React + shadcn/ui

**When to Use:**
- Complex interactions (multi-step, state-heavy)
- Want component reusability
- Data > 5,000 rows (need efficient rendering)
- Professional polish required
- Have 4+ hours for setup and development

**Stack:**
```javascript
- Vite (fast bundler)
- React (component-based UI)
- shadcn/ui (beautiful components)
- TanStack Table (efficient data grids)
- Recharts (React-friendly charts)
- Tailwind CSS (utility styling)
```

**Pros:**
- Modern development experience
- Component reusability
- Efficient rendering (virtual DOM)
- TypeScript support
- Hot module replacement
- Easy to scale complexity

**Cons:**
- Requires build step
- More setup time
- Need Node.js installed
- Larger bundle size
- Less portable (needs hosting or build)

**Effort:** 4-8 hours (including setup)

**Code Pattern:**
```tsx
// App.tsx
import { useState } from 'react';
import { DataTable } from './components/DataTable';
import { ProgressChart } from './components/ProgressChart';
import { FilterPanel } from './components/FilterPanel';

export default function App() {
  const [data, setData] = useState([]);
  const [filters, setFilters] = useState({ trade: '', search: '' });
  
  const filteredData = data.filter(row => {
    if (filters.trade && row.trade !== filters.trade) return false;
    if (filters.search && !row.name.includes(filters.search)) return false;
    return true;
  });
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Progress Dashboard</h1>
      
      <FilterPanel filters={filters} onChange={setFilters} />
      
      <div className="grid grid-cols-2 gap-4">
        <ProgressChart data={filteredData} />
        <DataTable data={filteredData} />
      </div>
    </div>
  );
}
```

---

### Option C: Observable Notebook

**When to Use:**
- Exploratory data analysis
- Want interactive parameter tweaking
- Showing process + results
- Collaborative exploration
- Comfortable with Observable's environment

**Stack:**
```javascript
- Observable Framework
- D3.js for custom visualizations
- Built-in reactive cells
- Markdown + code cells
```

**Pros:**
- Reactive programming (auto-updates)
- Great for exploration
- Interactive inputs built-in
- Easy to share notebooks
- Beautiful default styling

**Cons:**
- Locked into Observable platform
- Less customizable
- Not great for production tools
- Learning curve for Observable patterns
- Harder to embed elsewhere

**Effort:** 3-5 hours

**Code Pattern:**
```javascript
// Observable cell
data = FileAttachment("progress.csv").csv({ typed: true })

viewof tradeFilter = Inputs.select(
  [...new Set(data.map(d => d.trade))],
  { label: "Trade Filter" }
)

filteredData = data.filter(d => 
  tradeFilter === "All" || d.trade === tradeFilter
)

Plot.plot({
  marks: [
    Plot.barY(filteredData, {
      x: "location",
      y: "completion",
      fill: "trade"
    })
  ]
})
```

---

## Recommendation Logic

```
Complexity Decision Tree:

Simple (single view, basic filtering)
  └─ Need portability?
      ├─ Yes → Option A (Single HTML)
      └─ No → Option B (React)

Moderate (multi-view, interactive filters, charts)
  └─ Time available?
      ├─ < 4 hours → Option A (can still work)
      └─ > 4 hours → Option B (better DX)

Complex (multi-step flows, heavy state, drill-downs)
  └─ Always → Option B (React)
      └─ Unless exploratory → Option C (Observable)

Data Volume:
  < 1k rows → Any option works
  1k-10k rows → Option A or B (with virtualization)
  10k+ rows → Option B with TanStack Table
```

## Quality Checklist

Every interactive prototype should include:

### User Experience
```javascript
// ✓ Loading states
{isLoading ? <Spinner /> : <DataTable data={data} />}

// ✓ Empty states
{data.length === 0 ? (
  <EmptyState message="No data loaded. Upload a file to get started." />
) : (
  <DataTable data={data} />
)}

// ✓ Error states
{error && <Alert variant="error">{error}</Alert>}

// ✓ Success feedback
{saved && <Toast>Changes saved successfully</Toast>}
```

### Performance
```javascript
// ✓ Debounce search inputs
const debouncedSearch = useDebouncedValue(searchTerm, 300);

// ✓ Virtual scrolling for large lists
<VirtualTable
  data={data}
  height={600}
  rowHeight={50}
/>

// ✓ Memoize expensive calculations
const summary = useMemo(() => 
  calculateSummary(filteredData),
  [filteredData]
);
```

### Accessibility
```html
<!-- ✓ Semantic HTML -->
<button aria-label="Filter by trade">Filter</button>
<table role="table" aria-label="Construction activities">

<!-- ✓ Keyboard navigation -->
<input onKeyDown={handleKeyDown} />

<!-- ✓ Color contrast -->
<style>
  .error { color: #c0392b; background: #fadbd8; } /* 4.5:1 contrast */
</style>
```

### Export Capabilities
```javascript
// ✓ CSV export
function exportCSV() {
  const csv = Papa.unparse(filteredData);
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'export.csv';
  a.click();
}

// ✓ Print-friendly view
<button onClick={() => window.print()}>Print Report</button>
```

## Common Patterns

### Pattern: File Upload + Parse

```javascript
// Vanilla JS
document.getElementById('file-input').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  const text = await file.text();
  const parsed = Papa.parse(text, { header: true });
  data = parsed.data;
  render();
});

// React
function FileUpload({ onData }) {
  const handleFile = async (e) => {
    const file = e.target.files[0];
    const text = await file.text();
    const parsed = Papa.parse(text, { header: true });
    onData(parsed.data);
  };
  
  return <input type="file" onChange={handleFile} accept=".csv" />;
}
```

### Pattern: Filter + Search

```javascript
// Vanilla JS
let filters = { trade: '', search: '' };

function applyFilters(data) {
  return data.filter(row => {
    if (filters.trade && row.trade !== filters.trade) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return row.name.toLowerCase().includes(searchLower);
    }
    return true;
  });
}

// React
function useFilters(data) {
  const [filters, setFilters] = useState({ trade: '', search: '' });
  
  const filtered = useMemo(() => {
    return data.filter(row => {
      if (filters.trade && row.trade !== filters.trade) return false;
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        return row.name.toLowerCase().includes(searchLower);
      }
      return true;
    });
  }, [data, filters]);
  
  return [filtered, filters, setFilters];
}
```

### Pattern: Data Table

```javascript
// Vanilla JS
function renderTable(data) {
  const thead = `
    <thead>
      <tr>
        ${Object.keys(data[0]).map(key => `<th>${key}</th>`).join('')}
      </tr>
    </thead>
  `;
  
  const tbody = `
    <tbody>
      ${data.map(row => `
        <tr>
          ${Object.values(row).map(val => `<td>${val}</td>`).join('')}
        </tr>
      `).join('')}
    </tbody>
  `;
  
  document.getElementById('table').innerHTML = thead + tbody;
}

// React with TanStack Table
import { useReactTable, getCoreRowModel } from '@tanstack/react-table';

function DataTable({ data }) {
  const columns = useMemo(() => [
    { accessorKey: 'location', header: 'Location' },
    { accessorKey: 'trade', header: 'Trade' },
    { accessorKey: 'completion', header: 'Completion %' },
  ], []);
  
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });
  
  return (
    <table>
      <thead>
        {table.getHeaderGroups().map(headerGroup => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map(header => (
              <th key={header.id}>{header.column.columnDef.header}</th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map(row => (
          <tr key={row.id}>
            {row.getVisibleCells().map(cell => (
              <td key={cell.id}>{cell.renderValue()}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### Pattern: Chart Visualization

```javascript
// Chart.js (works with vanilla or React)
const ctx = document.getElementById('chart').getContext('2d');
new Chart(ctx, {
  type: 'bar',
  data: {
    labels: data.map(d => d.location),
    datasets: [{
      label: 'Completion %',
      data: data.map(d => d.completion),
      backgroundColor: 'rgba(54, 162, 235, 0.5)',
    }]
  },
  options: {
    responsive: true,
    scales: {
      y: { beginAtZero: true, max: 100 }
    }
  }
});

// Recharts (React)
import { BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

function ProgressChart({ data }) {
  return (
    <BarChart width={600} height={300} data={data}>
      <XAxis dataKey="location" />
      <YAxis domain={[0, 100]} />
      <Tooltip />
      <Bar dataKey="completion" fill="#3498db" />
    </BarChart>
  );
}
```

## Example Conversation

```
User: "I need an interactive dashboard to show construction progress by location"

You: "Great! Let me understand what you need:

1. How many locations are we showing? (10? 100? 1000?)
2. What data points per location? (completion %, trades, dates?)
3. What interactions do you want?
   - Filter by trade or date range?
   - Drill down to see activity details?
   - Export to PDF or CSV?
4. Who's the audience? (internal team or customer-facing?)
5. How will you deploy this? (email as file, host on web, embed in platform?)"

User: "About 50 locations, showing completion % for 8 trades each. Need filtering by trade and date. Will drill down to see activities. Customer-facing. Need to email as single file."

You: "Perfect! For 50 locations × 8 trades = 400 data points, here are your options:

**Option A: Single HTML File** ⭐ RECOMMENDED
- All-in-one file (easy to email)
- Interactive filtering and drill-down
- Charts + tables
- Professional enough for customers
- Effort: 3-4 hours

**Option B: Vite + React**
- More polished UI
- Better for complex interactions
- But requires hosting (can't just email)
- Effort: 6-8 hours

**My Recommendation: Option A** because:
1. You need to email it → single file is perfect
2. 400 rows is totally fine for browser
3. Can still look professional with clean CSS
4. Faster to build and iterate

The dashboard will have:
- Summary cards (avg completion, on-track count)
- Bar chart of completion by location
- Filterable data table
- Click location → drill down to activities
- Export to CSV button

Sound good?"
```

---

## Red Flags

🚩 **Complex state in vanilla JS**: If you have multi-step flows or complex state, use React
🚩 **Large dataset in single HTML**: If > 10k rows, consider React with virtualization or server-side
🚩 **No loading states**: Users will think it's broken if processing takes > 1 second
🚩 **Inaccessible**: Don't forget keyboard navigation and screen reader support
🚩 **No mobile consideration**: Ask if mobile support is needed upfront

