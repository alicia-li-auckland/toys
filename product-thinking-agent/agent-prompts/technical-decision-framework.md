# Technical Decision Framework

## Overview

This framework guides how to evaluate and recommend technical approaches for rapid experimentation in construction tech. Use this to make consistent, well-reasoned decisions.

## Decision Dimensions

Every technical decision should consider these 5 dimensions:

### 1. Time to Value
- How quickly can we deliver something usable?
- Is this a one-off prototype or reusable tool?
- What's the minimum viable implementation?

### 2. Data Scale
- How much data are we processing?
- Where does processing happen (browser, server)?
- What's the performance target?

### 3. Complexity
- How complex is the logic?
- Are there dependencies between components?
- What's the maintenance burden?

### 4. Portability
- Who needs to run this and where?
- Are there deployment constraints?
- Does it need to work offline?

### 5. Quality Bar
- Is this internal exploration or customer-facing?
- What's the tolerance for errors?
- Does it need to scale or be maintained?

## Decision Trees

### Stack Selection

```
START: What are we building?

Data processing script?
├─ Input/Output only? → Node.js script
└─ Need visualization? → Node.js + HTML export

Interactive tool?
├─ Quick prototype? → Single HTML file
├─ Complex interactions? → Vite + React
└─ Exploratory analysis? → Observable notebook

Customer deliverable?
├─ Report/PDF? → HTML + Puppeteer
├─ Interactive dashboard? → Vite + React
└─ Data export? → Node.js script

```

### Data Processing Approach

```
How many rows?

< 1,000 rows
├─ Simple transformation? → Array methods in browser
├─ Complex logic? → Libraries (Papa Parse, etc.)
└─ Performance matters? → Still fine in browser

1,000 - 10,000 rows
├─ Read-only display? → Virtual scrolling (React Window)
├─ Heavy processing? → Web Workers
└─ Real-time filtering? → Indexed data structures

10,000+ rows
├─ One-time processing? → Server-side (Node.js)
├─ Interactive exploration? → Server API + frontend
└─ Simple aggregation? → Database or pre-computed

```

### Matching Strategy Selection

```
Do we have shared IDs between datasets?

YES → Use exact ID match (fast, accurate)
  ├─ IDs are reliable? → Hash map lookup
  └─ IDs might be inconsistent? → Normalize then match

NO → Need to match by attributes
  ├─ Data is clean and consistent?
  │   └─ Use location + trade key match
  │
  ├─ Naming variations exist?
  │   ├─ < 1,000 rows? → Fuzzy match all
  │   └─ > 1,000 rows? → Hybrid (rules + fuzzy)
  │
  └─ Customer-specific patterns?
      └─ Build rule-based mapping

```

### Visualization Choice

```
What are we showing?

Time-based data?
├─ Timeline/Gantt? → dhtmlx-gantt or custom D3
├─ Trends over time? → Line charts (Chart.js/Recharts)
└─ Before/after? → Side-by-side bar charts

Comparison data?
├─ Categories? → Bar charts
├─ Parts of whole? → Pie charts (sparingly!)
└─ Multiple dimensions? → Grouped bar or scatter

Spatial data?
├─ Floor plan overlay? → Canvas + coordinates
├─ Heat map by zone? → Color-coded grid
└─ Location list? → Sortable table with indicators

Hierarchical data?
├─ WBS/breakdown? → Tree view or nested list
├─ Dependencies? → Network diagram (D3)
└─ Roll-ups? → Hierarchical table with expand/collapse

```

## Option Comparison Template

Use this template when presenting options:

```markdown
## Option [A/B/C]: [Descriptive Name]

### Approach
[1-2 sentence description of the technical approach]

### Pros
- [Specific advantage relevant to this use case]
- [Another advantage]
- [Third advantage]

### Cons
- [Specific limitation or tradeoff]
- [Another limitation]
- [Third limitation]

### Technical Details
- **Stack**: [Specific technologies]
- **Effort**: [Time estimate]
- **Data limits**: [What it can handle]
- **Maintenance**: [Ongoing effort required]

### Best For
[Specific use cases where this option shines]

### Red Flags
[Scenarios where you should NOT use this option]
```

## Recommendation Logic

### When to Recommend Single HTML File
✅ Recommend when:
- Need maximum portability (email, shared drive)
- Data < 5,000 rows
- Simple interactions (filtering, sorting)
- Rapid iteration needed (< 4 hours)
- No backend available

❌ Avoid when:
- Complex state management needed
- Heavy data processing required
- Want to reuse components across tools
- Need real-time backend communication

### When to Recommend Vite + React
✅ Recommend when:
- Complex interactions (drill-down, multi-step flows)
- Component reusability is valuable
- Data > 5,000 rows (need efficient rendering)
- Professional polish required
- Time budget allows (4-8 hours setup)

❌ Avoid when:
- Need something in < 2 hours
- Maximum portability required (no build step)
- Very simple tool (single view, basic table)
- No component reuse expected

### When to Recommend Node.js Script
✅ Recommend when:
- Headless processing (no UI needed)
- Large data volumes (> 50k rows)
- Output is CSV/JSON (not interactive)
- Batch processing workflow
- Integration with other systems

❌ Avoid when:
- User needs to see/interact with data
- Visual exploration required
- Non-technical user is running it
- Need immediate visual feedback

### When to Recommend Observable Notebook
✅ Recommend when:
- Exploratory data analysis
- Interactive parameter tweaking
- Want to show analysis process (not just results)
- Prototyping visualizations
- Collaborative exploration

❌ Avoid when:
- Need offline capability
- Want standalone deliverable
- Non-technical customer audience
- Production tool (not exploration)

## Quality Bars by Use Case

### Internal Prototype (For You)
- **Error handling**: Basic (fail with message)
- **Data validation**: Light (check file exists)
- **UI polish**: Functional is fine
- **Documentation**: Inline comments
- **Testing**: Manual smoke test

### Internal Tool (For Team)
- **Error handling**: Comprehensive (handle all edge cases)
- **Data validation**: Strict (validate inputs, show errors)
- **UI polish**: Clean and intuitive
- **Documentation**: README + inline comments
- **Testing**: Test with real data samples

### Customer Demo
- **Error handling**: Graceful (never show errors, just helpful messages)
- **Data validation**: Strict with helpful guidance
- **UI polish**: Professional, branded
- **Documentation**: User guide
- **Testing**: Thorough with edge cases

### Customer Production Tool
- **Error handling**: Comprehensive + logging
- **Data validation**: Strict + detailed error messages
- **UI polish**: Professional + accessibility
- **Documentation**: Full user guide + technical docs
- **Testing**: Automated + manual QA

## Performance Targets

| Data Volume | Load Time Target | Interaction Target |
|-------------|-----------------|-------------------|
| < 1k rows | < 500ms | Instant |
| 1k-10k rows | < 2 seconds | < 100ms |
| 10k-50k rows | < 5 seconds | < 500ms |
| 50k+ rows | < 10 seconds | < 1 second |

**Techniques to hit targets:**
- Virtual scrolling for large lists
- Debouncing for search/filter
- Web Workers for heavy processing
- Indexed data structures for lookups
- Lazy loading for large datasets

## Code Quality Checklist

Every implementation should have:

### Data Validation
```javascript
// ✓ Check file exists and is readable
// ✓ Validate expected columns/structure
// ✓ Handle missing/null values
// ✓ Provide helpful error messages
```

### Error Handling
```javascript
// ✓ Try-catch around file I/O
// ✓ User-friendly error messages
// ✓ Graceful degradation when possible
// ✓ Don't crash on bad data
```

### Performance
```javascript
// ✓ Test with realistic data volume
// ✓ Optimize loops for large datasets
// ✓ Use efficient data structures
// ✓ Profile if slow (> 2 seconds)
```

### Maintainability
```javascript
// ✓ Clear variable/function names
// ✓ Comments explaining business logic
// ✓ Modular code (separate concerns)
// ✓ Constants for magic numbers
```

### Usability
```javascript
// ✓ Loading indicators for slow operations
// ✓ Empty states (no data loaded yet)
// ✓ Success confirmations
// ✓ Undo/reset when appropriate
```

## Anti-Patterns to Catch

### Over-Engineering
❌ "Let's build a microservices architecture with Redis caching and GraphQL API"
✅ "Let's start with a Node.js script and HTML output. We can add complexity if needed."

### Under-Engineering
❌ "Just hard-code the values and we'll fix it later"
✅ "Let's parameterize this now - it's 5 extra minutes that saves hours later"

### Premature Optimization
❌ "We should use WebAssembly for maximum performance"
✅ "Let's build it simply first, then optimize if it's slow"

### Ignoring Constraints
❌ "This requires a backend server and database"
✅ "Given your constraints, here's how we can do this client-side..."

### Brittle Assumptions
❌ "Assume column 3 is always the trade name"
✅ "Let's detect the column by header name or let user select"

## Decision-Making Process

1. **Understand Constraints**
   - Time available
   - Data volume
   - Technical skills of user
   - Deployment environment

2. **Identify Requirements**
   - Functional (what it must do)
   - Non-functional (performance, usability)
   - Quality bar (prototype vs production)

3. **Generate Options**
   - Simple/fast option
   - Balanced option
   - Advanced/robust option

4. **Evaluate Trade-offs**
   - Map each option against constraints
   - Identify deal-breakers
   - Calculate effort vs value

5. **Make Recommendation**
   - Pick best fit for constraints
   - Explain reasoning
   - Note alternatives if constraints change

6. **Validate with User**
   - Present options and reasoning
   - Adjust based on feedback
   - Confirm before implementing

---

Remember: The "best" technical decision is the one that **delivers value fastest** while **meeting quality requirements**. Don't over-engineer, but don't produce slop either.

