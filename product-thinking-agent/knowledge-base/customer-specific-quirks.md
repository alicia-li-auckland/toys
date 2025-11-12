# Customer-Specific Quirks

Customer-specific data patterns, preferences, and naming conventions. Add to this file as you learn more about each customer's unique setup.

## Template: Customer Entry

```markdown
## Customer: [Customer Name]

**Industry/Type:** [Data center, Residential, Commercial, etc.]

**Data Characteristics:**
- File formats: [XER, CSV, Excel, etc.]
- Typical project size: [Number of activities, locations]
- Update frequency: [Daily, Weekly, etc.]

**Naming Conventions:**
- Locations: [Pattern or examples]
- Trades: [Any unique terminology]
- Activity codes: [Custom codes if applicable]

**Known Mappings:**
[List of customer-specific abbreviations or terms]

**Preferences:**
- Deliverable format: [PDF, Excel, Dashboard]
- Reporting frequency: [Weekly, Monthly]
- Key metrics: [What they care about most]

**Quirks & Gotchas:**
[Any unusual data patterns or things to watch for]

**Last Updated:** YYYY-MM-DD
```

---

## Customer: UNO (Example)

**Industry/Type:** Multi-family residential construction

**Data Characteristics:**
- File format: Primavera P6 XER files
- Typical project size: 50,000+ activities
- Update frequency: Monthly
- Location granularity: Building > Floor > Unit

**Naming Conventions:**
- Locations: "Building [Letter]-Floor [Number]" (e.g., "Building A-Floor 2")
- WBS structure: 4+ levels deep
- Activity codes: Uses Type 205 (Type of Work) extensively

**Known Mappings:**
```json
{
  "type_n": "foundations",
  "type_p": "structure",
  "type_q": "enclosure",
  "type_s": "interior_rough_in",
  "type_u": "finishes"
}
```

**Preferences:**
- Deliverable: Interactive schedule converter with parent folder grouping
- Key focus: Construction activities only (filter out design/procurement)
- Metrics: Activities by trade type, WBS hierarchy preservation

**Quirks & Gotchas:**
- Very large XER files (50,000+ rows) - need efficient parsing
- Heavy use of Activity Code Type 205 for classification
- Non-construction activities (A, D, E, H, L, X codes) should be filtered out
- 4-level WBS hierarchy must be preserved for context

**Last Updated:** 2024-12-01

---

## Customer: Wharton Smith (Example)

**Industry/Type:** Commercial construction

**Data Characteristics:**
- File formats: XER schedules + CSV actual progress
- Project size: 5,000-10,000 activities
- Update frequency: Weekly
- Location granularity: Zone-based

**Naming Conventions:**
- Locations: Zone codes (e.g., "Zone 101", "Zone 102")
- Trades: Uses abbreviations heavily
- Common abbreviations:
  - "SOG" = Slab on Grade / Concrete
  - "MEP-R" = MEP Rough-In
  - "GWB" = Drywall

**Known Mappings:**
```json
{
  "sog": "concrete",
  "mep-r": "mep_roughin",
  "mep-f": "mep_finish",
  "gwb": "drywall",
  "gwb-f": "drywall_finish"
}
```

**Preferences:**
- Deliverable: Matched schedule vs actual with variance analysis
- Reporting: Weekly dashboard + monthly PDF
- Key metrics: On-time percentage, completion velocity, variance trends

**Quirks & Gotchas:**
- Actual progress data often has location name variations
  - Schedule: "Zone 101"
  - Actual: "Z101" or "Zone-101"
  - Need normalization for matching
- Trade names in actual data don't match schedule (use mapping dictionary)
- Weekly cadence means time-series analysis is important

**Last Updated:** 2024-12-01

---

## Customer: [Template for New Customer]

**Industry/Type:** [Fill in]

**Data Characteristics:**
- File formats: 
- Typical project size: 
- Update frequency: 

**Naming Conventions:**
- Locations: 
- Trades: 
- Activity codes: 

**Known Mappings:**
```json
{
  // Add mappings as you learn them
}
```

**Preferences:**
- Deliverable format: 
- Reporting frequency: 
- Key metrics: 

**Quirks & Gotchas:**
- 

**Last Updated:** YYYY-MM-DD

---

## How to Add Customer Learnings

When working with a new customer or discovering new patterns:

1. **Start with template:** Copy the template above
2. **Fill in known info:** Add what you know from initial conversations
3. **Update as you learn:** Add quirks, mappings, preferences as discovered
4. **Document corrections:** When user corrects a match, add the mapping
5. **Track preferences:** Note what deliverable formats they prefer
6. **Sync to MCP:** Run `node scripts/update-mcp-context.js` to make available to agent

## Tracking Customer-Specific Rules

```javascript
// In your matching or parsing code:

function getCustomerRules(customerName) {
  // Load from this knowledge base
  const customerKnowledge = loadKnowledge(`customer_${customerName}`);
  
  return {
    tradeMappings: customerKnowledge.known_mappings || {},
    locationPattern: customerKnowledge.location_pattern,
    filterCodes: customerKnowledge.non_construction_codes || [],
    preferences: customerKnowledge.preferences || {},
  };
}

// Apply customer-specific rules
const rules = getCustomerRules('uno');
const trade = mapTradeWithRules(rawTrade, rules.tradeMappings);
```

## Customer Knowledge Priority

When there are conflicts between global rules and customer-specific rules:

1. **Customer-specific always wins**
2. **Document the override** (helps understand why)
3. **Ask user to confirm** if it seems unusual

Example:
```javascript
// Global rule: "Type N" = foundations
// Customer UNO rule: "Type N" = concrete_pour

// Use customer rule for UNO projects
// But flag for review if you see it in a different customer's data
```

---

**Last Updated:** 2024-12-01

