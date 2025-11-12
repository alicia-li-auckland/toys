# Construction Domain Rules

Learnings specific to construction project patterns, constraints, and best practices.

## Rule: Validate Trade Sequence Before Flagging Issues

**Context:** When analyzing construction progress data for anomalies.

**Problem:**
- Not all projects follow the exact same trade sequence
- Building types vary (data center vs residential vs office)
- Some trades can happen in parallel
- False positives from overly strict sequence validation

**Solution:** Flexible sequence validation:

1. **Core prerequisites only:** Focus on hard dependencies
   - Can't finish before rough-in
   - Can't rough-in before structure
   - Can't close before MEP

2. **Parallel work is normal:** Don't flag as anomaly
   - Multiple trades can work in different zones simultaneously
   - Interior finishes can start on lower floors while structure continues above

3. **Building-type specific rules:**
   - Data center: More emphasis on MEP, less on finishes
   - Residential: Standard sequence applies
   - Tenant improvement: May skip early trades (already built)

**Example:**

```javascript
// Hard prerequisites (always validate)
const criticalPrerequisites = {
  'wall_drywall_finish': ['wall_drywall'],  // Can't finish before install
  'wall_prime_paint': ['wall_drywall_finish'],  // Can't paint before finish
  'overhead_plumbing': ['structure'],  // Need structure first
};

// Soft prerequisites (warn but don't flag as critical)
const recommendedSequence = {
  'wall_drywall': ['in_wall_insulation'],  // Usually insulate first
  'overhead_duct_insulation': ['overhead_duct_rough_in'],  // Usually rough-in first
};

function validateSequence(location Activities, buildingType) {
  const criticalViolations = [];
  const warnings = [];
  
  // Check critical prerequisites
  locationActivities.forEach(activity => {
    const prereqs = criticalPrerequisites[activity.trade];
    if (prereqs) {
      prereqs.forEach(prereq => {
        const prereqActivity = locationActivities.find(a => a.trade === prereq);
        if (!prereqActivity || prereqActivity.completion < 100) {
          if (activity.completion > 0) {
            criticalViolations.push({
              trade: activity.trade,
              prerequisite: prereq,
              severity: 'high'
            });
          }
        }
      });
    }
  });
  
  // Check recommended sequence (warnings only)
  // ... similar logic with warnings array
  
  return { criticalViolations, warnings };
}
```

**Building Type Considerations:**

```javascript
const buildingTypeRules = {
  'data_center': {
    // MEP is critical, finishes less so
    criticalTrades: ['overhead_plumbing', 'overhead_duct', 'electrical'],
    optionalTrades: ['paint', 'flooring'],
  },
  'residential': {
    // Standard sequence applies
    followStandardSequence: true,
  },
  'tenant_improvement': {
    // May skip early trades
    skipTrades: ['structure', 'foundations', 'enclosure'],
  },
};
```

**Last Updated:** 2024-12-01

---

## Rule: Activity Code 205 is King (for XER files)

**Context:** Parsing Primavera P6 XER files for trade information.

**Problem:**
- XER files can have multiple activity code types
- Activity names are often ambiguous
- Need reliable way to identify trade/work type

**Solution:** Prioritize Activity Code Type 205 ("Type of Work"):

1. **Always check for code 205 first**
2. **Map 205 codes to standard trades:**
   - M = Site & Excavation
   - N = Foundations
   - P = Structure
   - Q = Enclosure
   - S = Interior Rough-In
   - T = Equipment
   - U = Finishes
   - V = Site Improvements

3. **Fallback hierarchy if 205 not present:**
   - Other activity codes (Discipline, Trade, Division, CSI)
   - WBS parent folder names
   - Keyword detection in activity names

**Example:**

```javascript
function extractTrade(task, activityCodes, taskActivityLinks) {
  // Priority 1: Activity Code Type 205
  const code205 = findActivityCode(task, '205', activityCodes, taskActivityLinks);
  if (code205) {
    return mapCode205ToTrade(code205);
  }
  
  // Priority 2: Other activity code types
  const otherCodes = findOtherActivityCodes(task, activityCodes, taskActivityLinks);
  if (otherCodes.length > 0) {
    return mapGenericCode(otherCodes[0]);
  }
  
  // Priority 3: WBS path analysis
  const wbsPath = getWBSPath(task);
  const tradeFromWBS = inferTradeFromWBS(wbsPath);
  if (tradeFromWBS) {
    return tradeFromWBS;
  }
  
  // Priority 4: Activity name keywords
  return inferTradeFromName(task.task_name);
}

function mapCode205ToTrade(code) {
  const firstChar = code.charAt(0).toUpperCase();
  const map = {
    'M': 'site_excavation',
    'N': 'foundations',
    'P': 'structure',
    'Q': 'enclosure',
    'S': 'interior_rough_in',
    'T': 'equipment',
    'U': 'finishes',
    'V': 'site_improvements',
  };
  return map[firstChar] || 'unknown';
}
```

**Why This Matters:**
- Code 205 is standardized across many construction schedules
- More reliable than parsing activity names
- Enables consistent trade grouping
- Critical for parent folder / trade grouping views

**Related:**
- See PARENT_FOLDERS_GUIDE.md for implementation example
- Applies to any XER parsing tool

**Last Updated:** 2024-12-01

---

## Rule: Filter Non-Construction Activities

**Context:** Construction schedules include many non-construction activities.

**Problem:**
- 40-60% of schedule activities are not actual construction work
- Includes: design, procurement, RFPs, sign-offs, milestones
- Clutters construction-focused views
- Skews completion calculations

**Solution:** Identify and filter non-construction activities:

**Non-Construction Activity Codes (XER):**
- A = Milestones
- D = Design
- E = Pre-Construction
- H = Procurement
- L = Mobilization
- X = Close-Out

**Non-Construction Keywords (Activity Names):**
- "RFP", "RFI", "Submittal"
- "Design", "Review", "Approval"
- "Permit", "Inspection"
- "Procurement", "Order", "Delivery"
- "Mobilization", "Demobilization"

**Example:**

```javascript
const NON_CONSTRUCTION_CODES = ['A', 'D', 'E', 'H', 'L', 'X'];

const NON_CONSTRUCTION_KEYWORDS = [
  'rfp', 'rfi', 'submittal', 'design', 'review', 'approval',
  'permit', 'inspection', 'procurement', 'order', 'delivery',
  'mobilization', 'demobilization', 'closeout'
];

function isConstructionActivity(activity) {
  // Check activity code
  const code = getActivityCode(activity);
  if (code && NON_CONSTRUCTION_CODES.includes(code.charAt(0).toUpperCase())) {
    return false;
  }
  
  // Check activity name for keywords
  const nameLower = activity.task_name.toLowerCase();
  if (NON_CONSTRUCTION_KEYWORDS.some(keyword => nameLower.includes(keyword))) {
    return false;
  }
  
  // Check duration (milestones have 0 duration)
  if (activity.target_drtn_hr_cnt === 0) {
    return false; // Likely a milestone
  }
  
  return true;
}

// Apply filter
const constructionActivities = allActivities.filter(isConstructionActivity);
```

**When to Keep Non-Construction:**
- Full project view (include milestones)
- Schedule critical path analysis (procurement matters)
- Complete timeline visualization

**When to Filter:**
- Construction-only progress tracking
- Trade-based analysis
- Field team views
- Completion percentage calculations

**Last Updated:** 2024-12-01

---

## Rule: Locations are Hierarchical

**Context:** Construction projects have hierarchical location structures.

**Problem:**
- Flat location lists lose context
- Hard to aggregate by building or floor
- Can't drill down from summary to detail

**Solution:** Parse and maintain location hierarchy:

**Typical Structure:**
```
Project
├── Building A
│   ├── Floor 1
│   │   ├── Zone A
│   │   └── Zone B
│   └── Floor 2
│       ├── Zone A
│       └── Zone B
└── Building B
    └── ...
```

**Parsing Strategies:**

**From WBS (XER files):**
```javascript
function buildWBSHierarchy(wbsTable) {
  const hierarchy = {};
  
  wbsTable.forEach(wbs => {
    hierarchy[wbs.wbs_id] = {
      id: wbs.wbs_id,
      name: wbs.wbs_name,
      parentId: wbs.parent_wbs_id,
      level: 0, // Calculate based on parent chain
      children: [],
    };
  });
  
  // Link parents to children
  Object.values(hierarchy).forEach(node => {
    if (node.parentId) {
      const parent = hierarchy[node.parentId];
      if (parent) {
        parent.children.push(node);
        node.level = parent.level + 1;
      }
    }
  });
  
  return hierarchy;
}
```

**From Location Names (CSV/actual data):**
```javascript
function parseLocationHierarchy(locationName) {
  // Try to extract: Building, Floor, Zone
  // Examples:
  // "Building A - Floor 1 - Zone A" → {building: "A", floor: "1", zone: "A"}
  // "A-1-A" → {building: "A", floor: "1", zone: "A"}
  // "Building A Floor 1" → {building: "A", floor: "1"}
  
  const patterns = [
    /building\s*([a-z0-9]+).*floor\s*([0-9]+).*zone\s*([a-z])/i,
    /([a-z])-([0-9])-([a-z])/i,
    /building\s*([a-z0-9]+).*floor\s*([0-9]+)/i,
  ];
  
  for (const pattern of patterns) {
    const match = locationName.match(pattern);
    if (match) {
      return {
        building: match[1],
        floor: match[2],
        zone: match[3] || null,
        original: locationName,
      };
    }
  }
  
  return { original: locationName }; // Couldn't parse
}
```

**Aggregation:**
```javascript
// Roll up completion by floor
function aggregateByFloor(activities) {
  const byFloor = {};
  
  activities.forEach(activity => {
    const location = parseLocationHierarchy(activity.location);
    const floorKey = `${location.building}-${location.floor}`;
    
    if (!byFloor[floorKey]) {
      byFloor[floorKey] = {
        activities: [],
        totalCompletion: 0,
      };
    }
    
    byFloor[floorKey].activities.push(activity);
    byFloor[floorKey].totalCompletion += activity.completion;
  });
  
  // Calculate averages
  Object.values(byFloor).forEach(floor => {
    floor.avgCompletion = floor.totalCompletion / floor.activities.length;
  });
  
  return byFloor;
}
```

**UI Considerations:**
- Show breadcrumbs: Project > Building A > Floor 1
- Enable drill-down: Click building → see floors
- Allow roll-up views: Summary at building level

**Last Updated:** 2024-12-01

---

## Rule: Completion % Means Different Things

**Context:** "Completion percentage" can be ambiguous.

**Problem:**
- Physical completion (work done)
- Duration completion (time elapsed)
- Resource completion (labor hours used)
- These are often different!

**Solution:** Clarify and track the type:

**Physical Completion:**
- Most useful for construction tracking
- Based on actual work completed
- Example: 50% of drywall installed

**Duration Completion:**
- Based on time elapsed
- May not reflect actual progress
- Example: 10 days into 20-day activity = 50% duration

**In XER Files:**
- `phys_complete_pct`: Physical completion (use this!)
- Calculated from actual dates and durations: Duration-based (less useful)

**In Actual Data:**
- Usually physical completion
- But verify with customer

**Best Practices:**

```javascript
function getCompletion(activity) {
  // Prefer physical completion
  if (activity.phys_complete_pct !== undefined) {
    return activity.phys_complete_pct;
  }
  
  // Calculate from status
  if (activity.status === 'Complete' || activity.status_code === 'TK_Complete') {
    return 100;
  }
  if (activity.status === 'Not Started' || activity.status_code === 'TK_NotStart') {
    return 0;
  }
  
  // Estimate from dates (duration-based, less accurate)
  if (activity.act_start_date && activity.target_end_date) {
    const start = new Date(activity.act_start_date);
    const end = new Date(activity.target_end_date);
    const now = new Date();
    const total = end - start;
    const elapsed = now - start;
    return Math.max(0, Math.min(100, (elapsed / total) * 100));
  }
  
  return null; // Unknown
}
```

**When Comparing Schedule vs Actual:**
- Ensure both use same completion type
- Physical completion is usually most comparable
- Flag if completion types differ

**Last Updated:** 2024-12-01

