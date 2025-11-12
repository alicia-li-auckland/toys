# Data Matching Patterns

Learnings from matching construction schedule data to actual progress data.

## Pattern: Two-Pass Hybrid Matching

**Context:** When matching datasets without shared IDs and varying data quality.

**Problem:** 
- No common unique identifiers between schedule and actual data
- Some data is clean (exact matches possible)
- Some data has variations (typos, abbreviations, different formats)
- Fuzzy matching everything is slow for large datasets (>5k rows)

**Solution:** Use a two-pass approach:

1. **Pass 1: Exact + Rule-Based** (~70% of matches, fast)
   - Normalize strings (lowercase, trim, remove special chars)
   - Try exact matches on normalized location+trade keys
   - Apply known mapping rules (e.g., "SOG" → "Concrete")
   - Auto-match with 100% confidence

2. **Pass 2: Fuzzy Matching** (~20% of matches, slower)
   - For unmatched items from Pass 1
   - Calculate string similarity (Jaro-Winkler distance)
   - Use confidence threshold (e.g., 80%)
   - Flag low-confidence matches for review

3. **Pass 3: Manual Review** (~10% of items)
   - Present unmatched or low-confidence items to user
   - Capture user decisions for learning
   - Add accepted matches to rule-based mapping

**Why:** 
- Gets ~90% automated matching
- Fast for large datasets (only fuzzy-match the hard 30%)
- Balances speed vs accuracy
- Improves over time as rules accumulate

**Example:**

```javascript
function hybridMatch(scheduleData, actualData, threshold = 0.8) {
  const matches = [];
  const unmatched = [];
  
  // Pass 1: Exact + Rule-Based
  const scheduleMap = buildKeyMap(scheduleData, ruleBasedNormalizer);
  actualData.forEach(actual => {
    const key = normalizeKey(actual.location, actual.trade);
    const scheduled = scheduleMap.get(key);
    if (scheduled) {
      matches.push({ actual, scheduled, confidence: 1.0, method: 'exact' });
    } else {
      unmatched.push(actual);
    }
  });
  
  // Pass 2: Fuzzy Match
  unmatched.forEach(actual => {
    const bestMatch = findBestFuzzyMatch(actual, scheduleData);
    if (bestMatch.confidence >= threshold) {
      matches.push({ ...bestMatch, method: 'fuzzy' });
    } else {
      matches.push({ actual, scheduled: null, confidence: 0, method: 'unmatched' });
    }
  });
  
  return matches;
}
```

**Metrics:**
- Time: ~2 seconds for 5,000 rows
- Accuracy: 85-90% auto-match
- Manual review: 10-15% of items

**Related:**
- See `customer-specific-quirks.md` for known mapping rules
- Reference: Schedule matching project (Dec 2024)

**Last Updated:** 2024-12-01

---

## Pattern: Location Name Normalization

**Context:** Construction project data with inconsistent location naming.

**Problem:**
- Same location has multiple names: "Building A - Floor 2", "Bldg A 2nd Floor", "A-2", "BuildingA_F2"
- Makes exact matching impossible
- Need to recognize these as the same location

**Solution:** Multi-level normalization strategy:

1. **Remove noise:**
   - Lowercase everything
   - Remove special characters (-, _, spaces)
   - Remove common words ("building", "floor", "level")

2. **Standardize abbreviations:**
   - "Bldg" → "Building"
   - "Fl" / "F" → "Floor"
   - "1st", "2nd" → "1", "2"

3. **Extract key components:**
   - Building identifier (letter or number)
   - Floor number
   - Zone/wing (if present)

4. **Generate canonical key:**
   - Format: `building_floor_zone`
   - Example: "buildinga_floor2_west" → "a2west"

**Example:**

```javascript
function normalizeLocation(location) {
  let normalized = location.toLowerCase().trim();
  
  // Remove noise
  normalized = normalized
    .replace(/[^a-z0-9]/g, '')
    .replace(/building/g, '')
    .replace(/floor/g, '')
    .replace(/level/g, '')
    .replace(/level/g, '');
  
  // Extract components with regex
  const buildingMatch = normalized.match(/[a-z]+/);
  const floorMatch = normalized.match(/\d+/);
  
  const building = buildingMatch ? buildingMatch[0] : '';
  const floor = floorMatch ? floorMatch[0] : '';
  
  return `${building}${floor}`;
}

// Examples:
normalizeLocation("Building A - Floor 2"); // "a2"
normalizeLocation("Bldg A 2nd Floor");     // "a2"
normalizeLocation("A-2");                   // "a2"
normalizeLocation("BuildingA_F2");         // "a2"
```

**Related:**
- Applies to both schedule and actual data before matching
- Combine with trade normalization for full key

**Last Updated:** 2024-12-01

---

## Pattern: Trade Name Mapping Dictionary

**Context:** Different naming conventions for construction trades across customers.

**Problem:**
- Same trade has different names: "Concrete Pour" vs "SOG" vs "Foundations - Concrete"
- Need to map these to standard trade categories
- Mapping rules are customer-specific

**Solution:** Hierarchical mapping dictionary:

1. **Global dictionary:** Standard mappings that apply to all projects
2. **Customer dictionary:** Customer-specific overrides
3. **Project dictionary:** Project-level exceptions

Priority: Project > Customer > Global

**Structure:**

```json
{
  "global": {
    "sog": "concrete",
    "gwb": "drywall",
    "mep": ["mechanical", "electrical", "plumbing"],
    "hvac": "mechanical"
  },
  "customer_uno": {
    "type_n": "concrete",
    "type_p": "structure",
    "type_s": "mep_roughin"
  },
  "project_uno_building_a": {
    "special_concrete_mix": "concrete"
  }
}
```

**Learning Process:**

1. **Initial state:** Only global dictionary
2. **User corrects match:** "Actually, 'Type N' means Concrete for this customer"
3. **System learns:** Add to customer dictionary
4. **Future projects:** Automatically apply customer rules
5. **Confidence score:** Higher for learned rules

**Example:**

```javascript
function mapTrade(tradeName, customer, project) {
  const normalized = tradeName.toLowerCase().trim();
  
  // Check project-specific first
  const projectDict = mappings[`project_${project}`];
  if (projectDict && projectDict[normalized]) {
    return { trade: projectDict[normalized], confidence: 1.0, source: 'project' };
  }
  
  // Check customer-specific
  const customerDict = mappings[`customer_${customer}`];
  if (customerDict && customerDict[normalized]) {
    return { trade: customerDict[normalized], confidence: 0.95, source: 'customer' };
  }
  
  // Check global
  const globalDict = mappings.global;
  if (globalDict[normalized]) {
    return { trade: globalDict[normalized], confidence: 0.9, source: 'global' };
  }
  
  // Unknown
  return { trade: tradeName, confidence: 0, source: 'unknown' };
}
```

**Capture User Corrections:**

```javascript
function recordCorrection(original, corrected, customer, project) {
  // Add to appropriate dictionary
  const dict = determineScope(customer, project); // 'customer' or 'project'
  
  mappings[dict][original.toLowerCase()] = corrected.toLowerCase();
  
  // Save to disk/database
  saveMappings(mappings);
  
  // Sync to MCP server
  updateMCPKnowledge('trade-mappings', mappings);
}
```

**Metrics to Track:**
- Mapping coverage: % of trades with known mappings
- Correction rate: How often users override
- Dictionary growth: New mappings over time

**Related:**
- Applies in all matching scenarios
- Foundation for automated trade classification

**Last Updated:** 2024-12-01

---

## Pattern: Confidence-Based Auto-Match Thresholds

**Context:** Deciding which fuzzy matches to auto-accept vs flag for review.

**Problem:**
- High threshold (e.g., 95%): Safe but requires lots of manual review
- Low threshold (e.g., 60%): Fast but many wrong auto-matches
- Sweet spot varies by use case

**Solution:** Adaptive confidence thresholds based on context:

**High Stakes (Customer-Facing Reports)**
- Auto-match threshold: 95%
- Review threshold: 75-95%
- Reject threshold: <75%

**Medium Stakes (Internal Analysis)**
- Auto-match threshold: 85%
- Review threshold: 70-85%
- Reject threshold: <70%

**Low Stakes (Exploratory)**
- Auto-match threshold: 75%
- Accept all: >60%
- Reject: <60%

**Factors that influence threshold:**
- Data quality (clean data = lower threshold okay)
- Dataset size (large = need higher threshold to reduce review volume)
- Criticality (customer-facing = higher threshold)
- Time available (urgent = lower threshold, review later)

**Example:**

```javascript
function determineThreshold(context) {
  const { use_case, data_quality, dataset_size, time_pressure } = context;
  
  let baseThreshold = 0.8;
  
  // Adjust for use case
  if (use_case === 'customer_facing') baseThreshold += 0.1;
  if (use_case === 'exploratory') baseThreshold -= 0.1;
  
  // Adjust for data quality
  if (data_quality === 'clean') baseThreshold -= 0.05;
  if (data_quality === 'messy') baseThreshold += 0.05;
  
  // Adjust for size
  if (dataset_size > 10000) baseThreshold += 0.05; // Need to reduce review volume
  
  // Adjust for urgency
  if (time_pressure === 'urgent') baseThreshold -= 0.1;
  
  return Math.max(0.6, Math.min(0.95, baseThreshold));
}
```

**Learning Over Time:**

Track false positives and false negatives:
- If user frequently rejects auto-matches → raise threshold
- If user frequently accepts flagged items → lower threshold
- Converge to optimal threshold per customer/project type

**Related:**
- Works with hybrid matching pattern
- Applies to all fuzzy matching scenarios

**Last Updated:** 2024-12-01

---

## Pattern: Match Review Interface

**Context:** Presenting low-confidence matches to users for manual review.

**Problem:**
- Users need to quickly review and approve/reject matches
- Need context to make informed decisions
- Should capture corrections for learning

**Solution:** Side-by-side comparison UI with actions:

**Display:**
- Show both records side-by-side
- Highlight differing fields
- Show confidence score and why it's low
- Provide accept/reject/edit actions

**Workflow:**
1. Show highest-confidence unreviewed match first
2. User accepts → move to next
3. User rejects → show alternative matches or mark unmatched
4. User edits → capture correction, update mappings

**Example Interface:**

```
┌─────────────────────────────────────────────────────┐
│ Review Match (Confidence: 78%)                      │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Actual Data           ←→    Schedule Data          │
│  ─────────────                ───────────────       │
│  Location: Bldg A F2          Location: Building A  │
│                                         Floor 2      │
│  Trade: Concrete Pour         Trade: SOG            │
│  Completion: 75%              Scheduled: 80%        │
│                                                     │
│  Why low confidence:                                │
│  • Location names don't match exactly               │
│  • Trade names are different                        │
│                                                     │
│  [ ✓ Accept ] [ ✗ Reject ] [ ✎ Edit Match ]       │
│                                                     │
│  Progress: 45 / 120 items reviewed                  │
└─────────────────────────────────────────────────────┘
```

**Capture Learning:**

```javascript
function handleUserDecision(match, decision) {
  if (decision === 'accept') {
    // Learn from acceptance
    const normalized = {
      location: normalizeLocation(match.actual.location),
      trade: normalizeTrade(match.actual.trade)
    };
    addToMappingRules(normalized, match.scheduled);
    
    return { matched: true, confidence: 1.0 };
  }
  
  if (decision === 'reject') {
    // Learn from rejection
    addToRejectionList(match.actual, match.scheduled);
    return { matched: false };
  }
  
  if (decision === 'edit') {
    // Manual correction - high-value learning
    const correctedMatch = promptUserForCorrectMatch();
    addToMappingRules(match.actual, correctedMatch);
    return { matched: true, confidence: 1.0, manual: true };
  }
}
```

**Keyboard Shortcuts:**
- `A` or `Enter`: Accept
- `R` or `Backspace`: Reject
- `E`: Edit
- `S`: Skip (decide later)
- `←`/`→`: Navigate

**Batch Operations:**
- "Accept all above 90% confidence"
- "Reject all below 65% confidence"
- Speeds up review of large datasets

**Related:**
- Integrates with hybrid matching pattern
- Feeds learning into mapping dictionaries

**Last Updated:** 2024-12-01

