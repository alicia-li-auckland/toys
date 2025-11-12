# Construction Domain Expertise

## Overview

This guide provides domain-specific knowledge about construction projects, data formats, and patterns. Use this to make informed recommendations and catch domain-specific errors.

## Construction Trade Sequences

### Standard Sequence Order

Construction trades must follow a logical sequence. Completing trades out of order indicates issues:

1. **In Wall Insulation** (no prerequisites)
2. **Wall Drywall** (requires: In Wall Insulation)
3. **Overhead Plumbing** (requires: Wall Drywall)
4. **Overhead Duct Rough In** (requires: Overhead Plumbing)
5. **Overhead Duct Insulation** (requires: Overhead Duct Rough In)
6. **Wall Drywall Finish** (requires: Overhead Duct Insulation)
7. **Wall Prime Paint** (requires: Wall Drywall Finish)

**Why this matters:**
- If paint is done before drywall, that's an anomaly
- If overhead work happens after finishes, that's rework
- Use this to validate progress data and flag sequence violations

### General Construction Flow

```
Site Prep & Excavation
    ↓
Foundations (concrete work, SOG)
    ↓
Structure (steel, framing)
    ↓
Enclosure (exterior walls, roofing)
    ↓
MEP Rough-In (plumbing, electrical, HVAC)
    ↓
Drywall & Interior Framing
    ↓
Finishes (paint, flooring, ceiling)
    ↓
Equipment & Fixtures
    ↓
Site Improvements & Closeout
```

## Conflicting Trade Pairs

Some trades cannot happen simultaneously in the same location:

| Trade A | Trade B | Reason |
|---------|---------|--------|
| Overhead Duct Rough In | Wall Prime Paint | Physical space conflict |
| Overhead Plumbing | Wall Drywall Finish | Plumbing work damages finished drywall |
| Overhead Duct Insulation | Wall Prime Paint | Insulation debris affects paint quality |
| Wall Drywall | Overhead Duct Rough In | Ductwork must go in before drywall |

**When to flag:**
- If both trades show "in-progress" at same location
- If completion percentages suggest overlap
- In anomaly detection (trade collision detector)

## Construction Terminology

### Common Abbreviations

| Abbreviation | Meaning | Category |
|--------------|---------|----------|
| SOG | Slab on Grade | Foundations |
| MEP | Mechanical, Electrical, Plumbing | Systems |
| HVAC | Heating, Ventilation, Air Conditioning | Mechanical |
| GWB | Gypsum Wall Board | Finishes |
| ACT | Acoustic Ceiling Tile | Finishes |
| VCT | Vinyl Composition Tile | Flooring |
| CMU | Concrete Masonry Unit | Structure |
| FFE | Furniture, Fixtures & Equipment | Equipment |
| RFP | Request for Proposal | Procurement |
| RFI | Request for Information | Admin |
| WBS | Work Breakdown Structure | Management |

### Trade Category Aliases

When parsing data, these terms often refer to the same trade:

**Concrete Work:**
- "Foundations", "Concrete Foundation", "Footings", "SOG", "Slab"

**Structural:**
- "Structure", "Structural Steel", "Steel Erection", "Framing"

**Envelope:**
- "Enclosure", "Building Envelope", "Exterior Walls", "Skin", "Weatherproofing"

**MEP Rough-In:**
- "MEP Rough", "Plumbing Rough", "Electrical Rough", "HVAC Rough", "Systems Rough-In"

**Drywall:**
- "GWB", "Gypsum Board", "Sheetrock", "Wall Board", "Drywall Install"

**Finishes:**
- "Interior Finishes", "Paint", "Flooring", "Ceiling", "Trim", "Casework"

## Data Formats

### XER File Structure (Primavera P6)

XER files are tab-delimited text files with multiple tables:

**Key Tables:**
- `PROJECT`: Project metadata
- `PROJWBS`: Work Breakdown Structure (location hierarchy)
- `TASK`: Individual activities
- `TASKPRED`: Dependencies between tasks
- `ACTVTYPE`: Activity code type definitions (e.g., "Trade", "Phase")
- `ACTVCODE`: Actual activity codes (e.g., "Concrete", "Plumbing")
- `TASKACTV`: Links tasks to activity codes

**Parsing Pattern:**
```
%T TABLE_NAME → New table starts
%F field1 field2 field3 → Column headers
%R value1 value2 value3 → Data row
```

**Common Fields in TASK table:**
- `task_id`: Unique identifier
- `task_code`: Short code (often activity ID)
- `task_name`: Full activity description
- `status_code`: TK_NotStart, TK_Active, TK_Complete
- `target_start_date`, `target_end_date`: Planned dates
- `act_start_date`, `act_end_date`: Actual dates
- `target_drtn_hr_cnt`: Planned duration in hours
- `remain_drtn_hr_cnt`: Remaining duration
- `phys_complete_pct`: Physical completion percentage
- `wbs_id`: Link to WBS hierarchy

### CSV Progress Data

**Typical Columns:**
- Location/Zone identifiers (building, floor, room, area)
- Trade/Activity name
- Completion percentage (0-100)
- Status (Not Started, In Progress, Complete)
- Dates (start, last updated, projected completion)
- Notes/comments

**Common Issues:**
- Inconsistent location naming ("Bldg A Floor 2" vs "A-2" vs "Building A 2nd")
- Trade name variations ("Concrete" vs "SOG" vs "Concrete Pour")
- Missing completion percentages (shows as null/blank)
- Duplicate rows (same location+trade appears multiple times)

## Project Scale Indicators

### Small Project
- **Activities**: 500-2,000
- **Locations**: 10-50
- **Duration**: 3-12 months
- **Data Volume**: Can process in browser
- **Typical Use**: Small commercial, residential buildings

### Medium Project
- **Activities**: 2,000-10,000
- **Locations**: 50-200
- **Duration**: 1-3 years
- **Data Volume**: Browser with optimization
- **Typical Use**: Office buildings, schools, mid-rise residential

### Large Project
- **Activities**: 10,000-50,000+
- **Locations**: 200-1,000+
- **Duration**: 3-5+ years
- **Data Volume**: Server-side processing recommended
- **Typical Use**: Hospitals, data centers, airports, high-rise towers

## Anomaly Patterns

### High-Priority Anomalies

**Sequence Violations:**
- Trade completed before its prerequisites
- Example: Paint done before drywall
- Impact: Indicates rework or data errors

**Trade Collisions:**
- Conflicting trades active at same location
- Example: Painting while installing ductwork
- Impact: Quality issues, delays, rework

**Bottlenecks:**
- Prerequisite trades stalled (<30% complete)
- Blocking dependent trades
- Impact: Project delays cascade

**Stalled Trades:**
- >50% of locations in-progress but <20% average completion
- Indicates resource, material, or coordination issues
- Impact: Schedule risk

### Medium-Priority Anomalies

**Velocity Disparities:**
- Same trade progressing at very different rates (>40% variance)
- Example: Drywall 80% done on Floor 1 but 20% on Floor 2
- Indicates: Resource allocation issues or site access problems

**False Starts:**
- Many activities started (>0% complete) but barely progressed (<5%)
- Indicates: Premature mobilization or incomplete prep work

**Trade Stack Density:**
- ≥4 concurrent trades at same location
- Indicates: Congestion, coordination challenges

### Low-Priority Anomalies

**Completion Clustering:**
- Unusual clustering at 0% or 100% completion
- May indicate: Reporting granularity issues or batch updates

**Asymmetric Progress:**
- Related trades showing >20% difference in completion
- Example: Rough plumbing 90% but rough electrical 50%
- May indicate: Coordination opportunities

## Data Validation Rules

### Must Validate

✅ **Trade Sequences:**
- Check prerequisites are complete before dependent trades
- Flag any out-of-order completions

✅ **Date Logic:**
- Start date ≤ End date
- Actual dates within project timeline
- Completion > 0% requires start date

✅ **Completion Percentages:**
- Value between 0-100
- Status matches percentage (100% = Complete, 0% = Not Started)
- Monotonic increase over time (shouldn't decrease unless rework)

✅ **Location Consistency:**
- Location names consistent within project
- Valid WBS hierarchy (building → floor → room)

### Should Validate

⚠️ **Trade Names:**
- Map to standard trade list or flag as unknown
- Suggest corrections for common typos/abbreviations

⚠️ **Durations:**
- Reasonable for trade type (paint shouldn't take 6 months)
- Flag outliers for review

⚠️ **Data Freshness:**
- Last updated within reasonable timeframe
- Flag stale data (>30 days since update)

## Typical Deliverable Patterns

### Schedule vs Actual Matching

**Input:**
- Schedule (XER with 5,000+ activities)
- Actual progress (CSV with location × trade data)

**Challenge:**
- No shared IDs
- Name variations (location and trade names differ)

**Solution Pattern:**
1. Normalize location and trade names
2. Try exact matches first (gets ~30%)
3. Apply rule-based mapping for known patterns (gets another ~40%)
4. Use fuzzy matching for remainder (gets ~20%)
5. Flag unmatched for manual review (~10%)

**Output:**
- Matched pairs with confidence scores
- Variance analysis (scheduled vs actual %)
- Locations ahead/behind schedule

### Anomaly Detection Dashboard

**Input:**
- Progress data with timestamps

**Process:**
- Run 15 anomaly detectors
- Prioritize by severity (high/medium/low)
- Group by location or trade

**Output:**
- Interactive dashboard showing:
  - Anomaly count by type
  - Heat map of problem locations
  - Drill-down to specific issues
  - Recommendations for investigation

### Progress Comparison

**Input:**
- Multiple project datasets or time periods

**Process:**
- Normalize for fair comparison (account for project size, type)
- Calculate completion velocity (% per week)
- Identify best/worst performers

**Output:**
- Comparative charts
- Trend lines
- Insights about what's working/not working

## Best Practices

### When Parsing Schedules

1. **Always check for Activity Code Type 205** (Type of Work) first
2. **Build WBS hierarchy** to understand location structure
3. **Filter out non-construction activities** (milestones, procurement, design)
4. **Validate dependencies** make sense logically
5. **Extract unique locations and trades** for filtering

### When Matching Data

1. **Start with exact matches** (fast, accurate)
2. **Normalize strings** before comparing (lowercase, remove special chars)
3. **Use confidence thresholds** (e.g., 80%+ for auto-match)
4. **Provide manual review UI** for low-confidence matches
5. **Log matching decisions** for learning/improvement

### When Detecting Anomalies

1. **Use domain knowledge** (trade sequences, conflicts)
2. **Prioritize by impact** (sequence violations > clustering)
3. **Include confidence/severity** scores
4. **Provide context** (why is this an anomaly?)
5. **Suggest next actions** (investigate, validate, ignore)

### When Building Visualizations

1. **Use construction-appropriate colors** (avoid red/green only for accessibility)
2. **Group by logical units** (building, floor, trade)
3. **Show progress in familiar units** (percentages, dates, counts)
4. **Enable drill-down** (summary → detail)
5. **Include export options** (PDF, CSV, images)

---

## When to Ask for Help

If you encounter:
- **Unknown trade terminology**: Ask user what it means, add to knowledge base
- **Unexpected data structure**: Clarify with user, don't assume
- **Domain logic questions**: "In your projects, does X typically happen before Y?"
- **Priority questions**: "Is this anomaly type important for your team?"

Remember: You're learning their specific construction context. Ask questions to build better domain knowledge over time.

