# Decision Template: Export Generation

## Problem Statement Template

**User Request:** [What they want to export and in what format]

**Clarifying Questions:**

1. **Export Format:**
   - What format? (PDF, CSV, Excel, JSON, images)
   - Why this format? (sharing, archiving, analysis, printing)
   - Any specific layout or structure requirements?

2. **Content:**
   - What data to include? (summary, details, raw data)
   - Any visualizations? (charts, tables, images)
   - Branding or styling needed? (logos, colors, fonts)

3. **Frequency & Automation:**
   - One-time export or recurring?
   - Manual trigger or automated?
   - How many exports per day/week?

4. **Audience:**
   - Who receives this? (customers, executives, field teams)
   - How will they use it? (print, email, analyze in Excel)
   - Any compliance requirements?

5. **Technical Constraints:**
   - File size limits? (email attachments typically < 10MB)
   - Generation speed? (instant vs batch overnight)
   - Where does it run? (browser, server, cloud function)

## Option Frameworks

### Option A: CSV Export (Data Only)

**When to Use:**
- Exporting tabular data for analysis
- Recipients need to process data (Excel, Python, SQL)
- No formatting or visualization needed
- Maximum compatibility required

**Stack:**
```javascript
- PapaParse (browser or Node.js)
- Native CSV generation
```

**Pros:**
- Universal compatibility
- Small file size
- Easy to generate
- Fast (milliseconds)
- Works in browser

**Cons:**
- Data only (no formatting)
- No charts or images
- Plain text (no rich content)

**Effort:** 30 minutes

**Code Pattern:**
```javascript
import Papa from 'papaparse';

function exportCSV(data, filename) {
  // Convert data to CSV
  const csv = Papa.unparse(data);
  
  // Create download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// Usage
exportCSV(filteredData, 'construction-progress.csv');
```

---

### Option B: PDF Export (Formatted Report)

**When to Use:**
- Need professional formatting
- Include charts and visualizations
- Fixed layout (printing, archiving)
- Customer-facing deliverables

**Stack Options:**

**B1: jsPDF (Simple PDFs)**
```javascript
- jsPDF library
- Works in browser
- Programmatic layout
```

**B2: Puppeteer (HTML → PDF)**
```javascript
- Puppeteer/Playwright
- Server-side only
- Uses HTML/CSS for layout
```

**Pros:**
- Professional appearance
- Include charts and images
- Fixed layout (looks same everywhere)
- Good for printing
- Can include branding

**Cons:**
- Larger file size
- Slower generation (seconds)
- Complex layouts are tricky
- B2 requires server/headless browser

**Effort:** 
- B1 (jsPDF): 3-4 hours
- B2 (Puppeteer): 2-3 hours

**Code Patterns:**

**B1: jsPDF**
```javascript
import jsPDF from 'jspdf';
import 'jspdf-autotable';

function exportPDF(data) {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(18);
  doc.text('Construction Progress Report', 14, 20);
  
  // Add date
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);
  
  // Add table
  doc.autoTable({
    startY: 35,
    head: [['Location', 'Trade', 'Completion %']],
    body: data.map(row => [row.location, row.trade, row.completion])
  });
  
  // Add chart (as image)
  const chartImg = document.getElementById('chart').toDataURL();
  doc.addImage(chartImg, 'PNG', 14, doc.lastAutoTable.finalY + 10, 180, 100);
  
  // Save
  doc.save('report.pdf');
}
```

**B2: Puppeteer (HTML → PDF)**
```javascript
import puppeteer from 'puppeteer';

async function exportPDF(data) {
  // Generate HTML report
  const html = generateHTMLReport(data);
  
  // Launch browser
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Load HTML
  await page.setContent(html, { waitUntil: 'networkidle0' });
  
  // Generate PDF
  await page.pdf({
    path: 'report.pdf',
    format: 'A4',
    printBackground: true,
    margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' }
  });
  
  await browser.close();
}

function generateHTMLReport(data) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; }
        h1 { color: #2c3e50; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #3498db; color: white; }
        .chart { page-break-inside: avoid; }
      </style>
    </head>
    <body>
      <h1>Construction Progress Report</h1>
      <p>Generated: ${new Date().toLocaleDateString()}</p>
      
      <table>
        <thead>
          <tr><th>Location</th><th>Trade</th><th>Completion %</th></tr>
        </thead>
        <tbody>
          ${data.map(row => `
            <tr>
              <td>${row.location}</td>
              <td>${row.trade}</td>
              <td>${row.completion}%</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="chart">
        <img src="${chartImageDataURL}" alt="Progress Chart" />
      </div>
    </body>
    </html>
  `;
}
```

---

### Option C: Excel Export (Data + Formatting)

**When to Use:**
- Recipients want to analyze data in Excel
- Need multiple sheets
- Formulas or conditional formatting
- Data tables with some styling

**Stack:**
```javascript
- xlsx (SheetJS) library
- Works in browser or Node.js
```

**Pros:**
- Familiar to users
- Supports formulas and formatting
- Multiple sheets
- Can include charts (limited)

**Cons:**
- Larger than CSV
- More complex to generate
- Excel-specific features

**Effort:** 2-3 hours

**Code Pattern:**
```javascript
import * as XLSX from 'xlsx';

function exportExcel(data, summaryData) {
  // Create workbook
  const wb = XLSX.utils.book_new();
  
  // Sheet 1: Summary
  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');
  
  // Sheet 2: Detailed Data
  const detailSheet = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, detailSheet, 'Details');
  
  // Apply styling (limited)
  summarySheet['A1'].s = { font: { bold: true, sz: 14 } };
  
  // Write file
  XLSX.writeFile(wb, 'construction-report.xlsx');
}

// Usage
exportExcel(filteredData, summaryStats);
```

---

### Option D: Image Export (Charts/Visualizations)

**When to Use:**
- Need to embed charts in presentations
- Social media sharing
- Include in other documents
- Visual snapshots

**Stack:**
```javascript
- html2canvas (screenshot DOM)
- canvas.toDataURL() for canvas charts
```

**Pros:**
- Works for any visualization
- Easy to embed elsewhere
- Preserves exact appearance

**Cons:**
- Static (not editable)
- May lose quality (raster)
- Large file size (for high res)

**Effort:** 1 hour

**Code Pattern:**
```javascript
import html2canvas from 'html2canvas';

async function exportChartAsImage(elementId) {
  const element = document.getElementById(elementId);
  const canvas = await html2canvas(element, {
    scale: 2, // Higher resolution
    backgroundColor: '#ffffff'
  });
  
  // Convert to image
  const dataURL = canvas.toDataURL('image/png');
  
  // Download
  const link = document.createElement('a');
  link.href = dataURL;
  link.download = 'chart.png';
  link.click();
}

// For Chart.js (has built-in method)
const chartImg = document.getElementById('myChart').toDataURL('image/png');
```

---

## Recommendation Logic

```
Use Case Decision Tree:

Need raw data for analysis?
  └─ CSV (Option A)

Need formatted report with charts?
  ├─ Browser-based? 
  │   └─ jsPDF (Option B1)
  └─ Server-based? 
      └─ Puppeteer (Option B2)

Need Excel for further analysis?
  └─ Excel (Option C)

Need image for presentations?
  └─ PNG/JPG (Option D)

Multiple formats needed?
  └─ Generate all, let user choose
```

## Quality Checklist

Every export should include:

### Metadata
```javascript
// ✓ Include generation info
const metadata = {
  generated_at: new Date().toISOString(),
  generated_by: currentUser.name,
  data_source: 'Construction Progress DB',
  filters_applied: activeFilters,
  row_count: data.length
};
```

### Validation
```javascript
// ✓ Check data before exporting
if (data.length === 0) {
  alert('No data to export. Apply different filters.');
  return;
}

// ✓ Warn about large exports
if (data.length > 10000) {
  const confirm = window.confirm(
    `This export contains ${data.length} rows and may take a while. Continue?`
  );
  if (!confirm) return;
}
```

### User Feedback
```javascript
// ✓ Show progress for slow exports
const loadingToast = showToast('Generating PDF...');

await generatePDF(data);

hideToast(loadingToast);
showToast('PDF downloaded successfully!', 'success');
```

### Error Handling
```javascript
// ✓ Handle failures gracefully
try {
  await exportPDF(data);
} catch (error) {
  console.error('Export failed:', error);
  alert('Failed to generate PDF. Please try again or contact support.');
  
  // Fallback to CSV
  const fallbackCSV = confirm('Would you like to export as CSV instead?');
  if (fallbackCSV) {
    exportCSV(data, 'fallback-export.csv');
  }
}
```

## Common Patterns

### Pattern: Multi-Format Export

```javascript
function ExportMenu({ data }) {
  return (
    <div className="export-menu">
      <button onClick={() => exportCSV(data)}>
        📊 Export CSV
      </button>
      <button onClick={() => exportExcel(data)}>
        📗 Export Excel
      </button>
      <button onClick={() => exportPDF(data)}>
        📄 Export PDF
      </button>
      <button onClick={() => exportImage('chart')}>
        🖼️ Export Chart (PNG)
      </button>
    </div>
  );
}
```

### Pattern: Formatted PDF with Template

```html
<!-- HTML Template for PDF -->
<div id="pdf-content" style="display: none;">
  <div class="header">
    <img src="logo.png" alt="Company Logo" />
    <h1>Construction Progress Report</h1>
    <p class="date">{{date}}</p>
  </div>
  
  <div class="summary">
    <div class="stat-card">
      <h3>Overall Completion</h3>
      <p class="big-number">{{overallCompletion}}%</p>
    </div>
    <div class="stat-card">
      <h3>On Schedule</h3>
      <p class="big-number">{{onSchedule}}</p>
    </div>
  </div>
  
  <div class="section">
    <h2>Progress by Location</h2>
    <table>
      <!-- Data table -->
    </table>
  </div>
  
  <div class="section">
    <h2>Completion Trend</h2>
    <div id="chart-container"></div>
  </div>
  
  <div class="footer">
    <p>Generated by Progress AI on {{timestamp}}</p>
  </div>
</div>
```

### Pattern: Excel with Multiple Sheets

```javascript
function exportMultiSheetExcel(data) {
  const wb = XLSX.utils.book_new();
  
  // Sheet 1: Executive Summary
  const summary = calculateSummary(data);
  const summarySheet = XLSX.utils.json_to_sheet([
    { Metric: 'Total Locations', Value: summary.totalLocations },
    { Metric: 'Avg Completion', Value: summary.avgCompletion + '%' },
    { Metric: 'On Schedule', Value: summary.onSchedule },
    { Metric: 'Behind Schedule', Value: summary.behind }
  ]);
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');
  
  // Sheet 2: By Location
  const byLocation = groupBy(data, 'location');
  const locationData = Object.entries(byLocation).map(([loc, activities]) => ({
    Location: loc,
    'Total Activities': activities.length,
    'Avg Completion': avg(activities, 'completion') + '%'
  }));
  const locationSheet = XLSX.utils.json_to_sheet(locationData);
  XLSX.utils.book_append_sheet(wb, locationSheet, 'By Location');
  
  // Sheet 3: Raw Data
  const rawSheet = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, rawSheet, 'Raw Data');
  
  // Save
  XLSX.writeFile(wb, `progress-report-${Date.now()}.xlsx`);
}
```

### Pattern: Print-Friendly View

```html
<style>
@media print {
  /* Hide UI elements */
  .no-print { display: none !important; }
  
  /* Page breaks */
  .page-break { page-break-after: always; }
  
  /* Ensure colors print */
  * {
    -webkit-print-color-adjust: exact !important;
    color-adjust: exact !important;
  }
  
  /* Full width */
  .container { width: 100% !important; }
  
  /* Footer on each page */
  @page {
    @bottom-right {
      content: "Page " counter(page) " of " counter(pages);
    }
  }
}
</style>

<button onclick="window.print()" class="no-print">
  🖨️ Print Report
</button>
```

## Example Conversation

```
User: "I need to export progress reports for customers"

You: "Let me understand what format works best:

1. What should the report include?
   - Summary stats only?
   - Detailed activity lists?
   - Charts showing trends?

2. What format do customers prefer?
   - PDF (professional, for printing)?
   - Excel (for their own analysis)?
   - CSV (import into their systems)?

3. How will they receive it?
   - Email attachment?
   - Download from dashboard?
   - Automated weekly delivery?

4. Any branding requirements?
   - Company logo, colors?
   - Specific layout/template?

5. How many customers? (affects automation needs)"

User: "Need PDF with summary stats + completion chart + detailed table. Email monthly to 10 customers. Must have our logo and branding."

You: "Perfect! For monthly customer PDFs with branding, I recommend:

**Option: HTML → PDF with Puppeteer (Server-Side)**

Why this approach:
1. Easy to design beautiful reports using HTML/CSS
2. Can include your branding (logo, colors, fonts)
3. Server-side = can automate monthly generation
4. Charts render perfectly in PDF
5. Consistent layout for all customers

The solution will:
- HTML template with your branding
- Include: summary cards, completion chart (Chart.js), detailed table
- Generate PDF on server
- Email to customers automatically
- File size ~500KB (good for email)

Structure:
```
report-template.html
├─ Header (logo, customer name, date)
├─ Summary Section (key metrics in cards)
├─ Chart Section (completion over time)
├─ Table Section (detailed activities)
└─ Footer (contact info, branding)
```

Effort: 6-8 hours (includes template design + automation)

Want me to create a detailed implementation plan?"
```

---

## Red Flags

🚩 **Large PDFs in browser**: If > 10MB or complex layouts, use server-side
🚩 **No filename convention**: Use descriptive names with dates (`progress-2024-12-01.pdf`)
🚩 **Forgetting timezone**: Include timezone in timestamps
🚩 **No data validation**: Check data exists before exporting
🚩 **Blocking UI**: Show progress for exports taking > 2 seconds

