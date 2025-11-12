# Decision Template: Data Visualization

## Problem Statement Template

**User Request:** [What they want to visualize]

**Clarifying Questions:**

1. **Data & Message:**
   - What story are you telling with this data?
   - What should viewers understand at a glance?
   - Any specific insights to highlight?

2. **Data Characteristics:**
   - What type of data? (time-series, categorical, hierarchical, spatial)
   - How much data? (points, categories, time range)
   - Static or interactive?

3. **Audience & Context:**
   - Who's viewing this? (executives, field teams, customers)
   - Where will it be shown? (dashboard, report, presentation)
   - Device? (desktop, mobile, print)

4. **Interaction Needs:**
   - Read-only or interactive? (hover, filter, drill-down)
   - Comparison needed? (side-by-side, overlays)
   - Time-based animation?

5. **Technical Constraints:**
   - Update frequency? (static, daily, real-time)
   - Integration? (standalone, embedded, export)
   - Branding requirements?

## Visualization Type Guide

### For Time-Series Data

**Line Chart**
- **Best for**: Trends over continuous time
- **Use when**: Showing progress, rates, or changes
- **Example**: "Completion % over last 90 days"

**Gantt Chart**
- **Best for**: Schedules and timelines
- **Use when**: Showing activity duration and dependencies
- **Example**: "Construction schedule with milestones"

**Area Chart**
- **Best for**: Cumulative trends
- **Use when**: Showing accumulation or volume over time
- **Example**: "Cumulative costs by month"

### For Comparisons

**Bar Chart (Horizontal/Vertical)**
- **Best for**: Comparing categories
- **Use when**: Comparing completion across locations or trades
- **Example**: "Top 10 locations by completion %"

**Grouped Bar Chart**
- **Best for**: Comparing multiple metrics per category
- **Use when**: Comparing scheduled vs actual
- **Example**: "Planned vs actual completion by trade"

**Scatter Plot**
- **Best for**: Finding correlations
- **Use when**: Looking for patterns between two variables
- **Example**: "Project size vs completion velocity"

### For Parts of Whole

**Pie Chart** (use sparingly!)
- **Best for**: Simple proportions (2-5 slices)
- **Use when**: Showing % of total
- **Example**: "Project budget by trade (5 categories)"
- **Warning**: Hard to compare slices accurately

**Stacked Bar**
- **Best for**: Composition over categories
- **Use when**: Showing trade mix per location
- **Example**: "Trade breakdown by building"

**Treemap**
- **Best for**: Hierarchical proportions
- **Use when**: Showing nested categories
- **Example**: "Budget by Division → Trade → Activity"

### For Spatial Data

**Heat Map (Grid)**
- **Best for**: Location × Trade matrices
- **Use when**: Showing completion across grid
- **Example**: "Trades (rows) × Floors (cols) completion %"

**Heat Map (Overlay)**
- **Best for**: Floor plan progress
- **Use when**: Showing activity density by zone
- **Example**: "Which areas have most in-progress work"

**Choropleth Map**
- **Best for**: Geographic data
- **Use when**: Showing metrics by region/zone
- **Example**: "Completion % by building on site map"

### For Hierarchical Data

**Tree Diagram**
- **Best for**: Organizational structure
- **Use when**: Showing WBS or breakdown structure
- **Example**: "Project → Phase → Trade → Activity"

**Sunburst Chart**
- **Best for**: Nested proportions with hierarchy
- **Use when**: Interactive exploration of levels
- **Example**: "Budget breakdown with drill-down"

## Library Selection

### Chart.js

**When to Use:**
- Simple, common chart types (bar, line, pie)
- Quick setup (< 30 min)
- Responsive needed
- Not too many data points (< 1,000)

**Pros:**
- Easy to learn
- Good defaults
- Lightweight
- Well documented

**Cons:**
- Limited customization
- Not great for complex interactions
- Performance issues with large datasets

**Code Example:**
```javascript
new Chart(ctx, {
  type: 'bar',
  data: {
    labels: ['Location A', 'Location B', 'Location C'],
    datasets: [{
      label: 'Completion %',
      data: [75, 60, 90],
      backgroundColor: '#3498db'
    }]
  },
  options: {
    responsive: true,
    scales: {
      y: { beginAtZero: true, max: 100 }
    }
  }
});
```

---

### D3.js

**When to Use:**
- Custom visualizations
- Complex interactions
- Large datasets (10,000+ points)
- Unique design requirements

**Pros:**
- Extremely flexible
- Powerful data transformations
- Great for custom designs
- Handles large datasets well

**Cons:**
- Steep learning curve
- More code to write
- Harder to maintain
- Need to build everything

**Code Example:**
```javascript
const svg = d3.select('#chart')
  .append('svg')
  .attr('width', 600)
  .attr('height', 400);

const xScale = d3.scaleBand()
  .domain(data.map(d => d.location))
  .range([0, 600])
  .padding(0.1);

const yScale = d3.scaleLinear()
  .domain([0, 100])
  .range([400, 0]);

svg.selectAll('rect')
  .data(data)
  .enter()
  .append('rect')
  .attr('x', d => xScale(d.location))
  .attr('y', d => yScale(d.completion))
  .attr('width', xScale.bandwidth())
  .attr('height', d => 400 - yScale(d.completion))
  .attr('fill', '#3498db');
```

---

### Recharts (React)

**When to Use:**
- Building React apps
- Need responsive, interactive charts
- Want declarative API
- Standard chart types

**Pros:**
- React-friendly (component-based)
- Declarative syntax
- Responsive by default
- Good documentation

**Cons:**
- React-only
- Less flexible than D3
- Bundle size (medium)

**Code Example:**
```tsx
<BarChart width={600} height={400} data={data}>
  <XAxis dataKey="location" />
  <YAxis domain={[0, 100]} />
  <Tooltip />
  <Bar dataKey="completion" fill="#3498db" />
</BarChart>
```

---

### dhtmlx-gantt

**When to Use:**
- Gantt charts specifically
- Construction schedules
- Need dependency lines
- Time-based planning

**Pros:**
- Built for Gantt charts
- Handles dependencies well
- Resource allocation features
- Good for construction

**Cons:**
- Specialized (one chart type)
- Commercial license for some features
- Learning curve

**Code Example:**
```javascript
gantt.init("gantt_here");
gantt.parse({
  data: [
    {id: 1, text: "Foundations", start_date: "2024-01-01", duration: 30},
    {id: 2, text: "Structure", start_date: "2024-02-01", duration: 60}
  ],
  links: [
    {id: 1, source: 1, target: 2, type: "0"} // Finish-to-start
  ]
});
```

## Recommendation Logic

```
Chart Type + Data Volume + Customization:

Standard charts (bar, line, pie) + < 1k points + Default styling
  └─ Use Chart.js (easiest)

Standard charts + React app
  └─ Use Recharts (React-friendly)

Custom visualizations + Complex interactions
  └─ Use D3.js (most flexible)

Gantt charts specifically
  └─ Use dhtmlx-gantt (specialized)

Large datasets (>10k points) + Performance critical
  └─ Use D3.js with canvas rendering
  └─ Or pre-aggregate data on server
```

## Design Principles

### 1. Choose the Right Chart

❌ **Wrong**: Pie chart with 15 slices
✅ **Right**: Horizontal bar chart (easier to compare)

❌ **Wrong**: 3D chart (distorts perception)
✅ **Right**: Flat 2D chart (accurate representation)

❌ **Wrong**: Dual-axis line chart (confusing scales)
✅ **Right**: Two separate charts or normalized scale

### 2. Use Color Effectively

**Purpose-Driven Colors:**
```css
/* Status colors */
.complete { color: #27ae60; }  /* Green */
.in-progress { color: #f39c12; }  /* Orange */
.not-started { color: #95a5a6; }  /* Gray */
.blocked { color: #e74c3c; }  /* Red */

/* Sequential (low to high) */
.low { color: #feedde; }
.medium { color: #fdbe85; }
.high { color: #fd8d3c; }

/* Diverging (good/bad from center) */
.below { color: #d73027; }
.at-target { color: #ffffbf; }
.above { color: #1a9850; }
```

**Accessibility:**
- Don't rely on color alone (use patterns, labels)
- Ensure sufficient contrast (4.5:1 minimum)
- Test with colorblind simulators

### 3. Label Clearly

```javascript
// ✓ Clear axis labels
xAxis: { title: { text: 'Building Location' } }
yAxis: { title: { text: 'Completion Percentage (%)' } }

// ✓ Data labels on small datasets
dataLabels: { enabled: true, format: '{point.y}%' }

// ✓ Tooltips for additional context
tooltip: {
  format: '<b>{point.location}</b><br/>Completion: {point.y}%<br/>Updated: {point.date}'
}

// ✓ Legend when multiple series
legend: { enabled: true, position: 'bottom' }
```

### 4. Provide Context

```javascript
// Show target line
{
  type: 'line',
  data: [{ x: 0, y: 75 }, { x: 10, y: 75 }],
  label: 'Target: 75%',
  borderColor: 'red',
  borderDash: [5, 5]
}

// Show average
const avg = data.reduce((sum, d) => sum + d.value, 0) / data.length;
// Draw horizontal line at avg

// Annotate important events
annotations: [{
  type: 'line',
  xMin: 'Week 12',
  xMax: 'Week 12',
  label: { content: 'Major Milestone' }
}]
```

### 5. Make It Interactive (When Useful)

**Good Interactions:**
- Hover for details (tooltips)
- Click to drill down (location → trades)
- Filter by category (show/hide series)
- Zoom time range (date picker)

**Bad Interactions:**
- Unnecessary animations that slow understanding
- Interactions that hide critical data
- Complex gestures (pinch, multi-touch) for desktop

## Common Patterns

### Pattern: Progress Heat Map

```javascript
// Data: locations × trades matrix
const data = [
  { location: 'Floor 1', Concrete: 100, MEP: 75, Drywall: 50 },
  { location: 'Floor 2', Concrete: 90, MEP: 60, Drywall: 0 },
];

// Chart.js matrix chart (heatmap)
const ctx = document.getElementById('heatmap').getContext('2d');
new Chart(ctx, {
  type: 'matrix',
  data: {
    datasets: [{
      label: 'Completion %',
      data: data.flatMap(row => 
        Object.keys(row).filter(k => k !== 'location').map(trade => ({
          x: trade,
          y: row.location,
          v: row[trade] // value for color scale
        }))
      ),
      backgroundColor(context) {
        const value = context.dataset.data[context.dataIndex].v;
        return `hsl(${value}, 70%, 50%)`; // Red (0) to green (100)
      }
    }]
  }
});
```

### Pattern: Time Series with Forecast

```javascript
const historicalData = [/* actual data */];
const forecastData = [/* projected data */];

new Chart(ctx, {
  type: 'line',
  data: {
    datasets: [
      {
        label: 'Actual',
        data: historicalData,
        borderColor: '#3498db',
        borderWidth: 2
      },
      {
        label: 'Forecast',
        data: forecastData,
        borderColor: '#95a5a6',
        borderDash: [5, 5], // Dashed line for forecast
        borderWidth: 2
      }
    ]
  }
});
```

### Pattern: Drill-Down Chart

```javascript
let currentView = 'summary'; // or 'detail'
let selectedLocation = null;

function renderChart() {
  if (currentView === 'summary') {
    // Show all locations
    renderSummaryChart(allLocations);
  } else {
    // Show trades for selected location
    renderDetailChart(selectedLocation);
  }
}

// Click handler
chart.onClick = (event, elements) => {
  if (elements.length > 0) {
    const dataIndex = elements[0].index;
    selectedLocation = data[dataIndex].location;
    currentView = 'detail';
    renderChart();
  }
};
```

## Example Conversation

```
User: "I need to visualize construction progress across 12 buildings"

You: "Great! A few questions to pick the right visualization:

1. What's the key insight you want to show?
   - Which buildings are ahead/behind?
   - Progress trend over time?
   - Completion by trade within each building?

2. Will this be static (PDF/image) or interactive (click/filter)?

3. How much detail? 
   - Just overall completion per building?
   - Or breakdown by trade?

4. Who's the audience and context?
   - Executive dashboard (high-level)?
   - Field team (actionable detail)?
   - Customer report (professional presentation)?"

User: "Need to show which buildings are ahead/behind schedule. Interactive dashboard for internal team. Show overall completion per building plus ability to drill into trades."

You: "Perfect! I recommend a **Grouped Bar Chart** with drill-down:

**Top-Level View:**
- Horizontal bars showing each building
- Two bars per building: Scheduled % vs Actual %
- Color-coded: Green (ahead), Yellow (on track), Red (behind)
- Click a building to drill down

**Drill-Down View:**
- Show trades for that building
- Same scheduled vs actual comparison
- Back button to return to summary

**Tech Stack:**
- Chart.js for the bars (simple, clean)
- Vanilla JS or React depending on your preference
- Effort: 3-4 hours

**Mockup:**
```
Buildings Progress (as of Dec 1)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Building A  ████████████░ 85%  ▓▓▓▓▓▓▓▓░ 75% ← Click to drill down
Building B  ██████░░░░░░░ 50%  ████░░░░░ 45%
Building C  ██████████▓░ 95%  ████████░ 80%
            └─ Scheduled      └─ Actual

Legend: ■ Ahead  ■ On Track  ■ Behind
```

Sound good?"
```

---

## Red Flags

🚩 **Too many colors**: Stick to 5-7 max, group others as "Other"
🚩 **Misleading scales**: Always start Y-axis at 0 for bar charts
🚩 **Chartjunk**: Remove unnecessary gridlines, borders, 3D effects
🚩 **Inaccessible colors**: Test with colorblind simulator
🚩 **Wrong chart type**: Don't force data into inappropriate visualizations

