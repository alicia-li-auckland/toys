# Plan Generation Templates

These templates help generate detailed, actionable implementation plans for different types of work.

## Available Templates

### 1. Feature Spec (`feature-spec.md`)
**When to Use:**
- Building a complete feature or tool
- Need detailed implementation plan
- Requires quality checks and testing
- Will be maintained long-term

**Covers:**
- Product goals and success criteria
- Technical architecture
- Step-by-step implementation
- Quality checks and edge cases
- Handoff artifacts

**Typical Timeline:** Days to weeks

---

### 2. Data Pipeline Spec (`data-pipeline-spec.md`)
**When to Use:**
- Processing/transforming data
- ETL (Extract, Transform, Load) workflows
- Batch processing jobs
- Data validation and enrichment

**Covers:**
- Input/output specifications
- Data validation rules
- Transformation logic
- Error handling
- Performance optimization

**Typical Timeline:** Hours to days

---

### 3. Prototype Spec (`prototype-spec.md`)
**When to Use:**
- Testing a concept or hypothesis
- Need something quickly for feedback
- Exploring design or UX
- Proof of concept before full build

**Covers:**
- Prototype goals and questions
- Quick-start implementation
- Minimum viable features
- Demo preparation
- Feedback collection

**Typical Timeline:** Hours

---

## How to Use Templates

### Step 1: Choose the Right Template
Ask yourself:
- **Timeline?** Hours → Prototype, Days → Pipeline, Weeks → Feature
- **Purpose?** Test idea → Prototype, Process data → Pipeline, Build tool → Feature
- **Audience?** Internal only → Prototype, Production → Feature
- **Maintenance?** Throwaway → Prototype, Long-term → Feature

### Step 2: Fill Out the Template
1. Copy the appropriate template
2. Replace all `[Placeholder]` text with actual content
3. Remove sections that don't apply
4. Add sections if needed for your specific case

### Step 3: Review with Agent/Team
- Walk through the plan
- Validate assumptions
- Adjust estimates
- Get approval before implementation

### Step 4: Use as Implementation Guide
- Check off tasks as you complete them
- Update timeline if needed
- Add notes about decisions made
- Keep it as documentation

---

## Template Comparison

| Aspect | Prototype | Pipeline | Feature |
|--------|-----------|----------|---------|
| **Time to Create Plan** | 15-30 min | 30-60 min | 1-2 hours |
| **Implementation Time** | 2-8 hours | 4-16 hours | 1-4 weeks |
| **Detail Level** | High-level | Detailed | Very detailed |
| **Quality Bar** | Functional | Robust | Production |
| **Documentation** | Minimal | Moderate | Extensive |
| **Testing** | Manual only | Basic tests | Full test suite |
| **Maintenance** | None expected | Moderate | Long-term |

---

## Customization Tips

### Adding Sections
If your project needs something not in the template, add it! Common additions:
- **Security Requirements** (for customer-facing features)
- **Accessibility Checklist** (for UI features)
- **API Documentation** (for backend services)
- **Migration Plan** (for updates to existing systems)

### Removing Sections
If a section doesn't apply, remove it! Examples:
- No UI needed? Remove "User Interface" section
- No external dependencies? Remove "Integration" section
- Simple logic? Condense "Implementation Steps"

### Adjusting Detail Level
- **Less detail:** Remove code examples, simplify checklists
- **More detail:** Add pseudo-code, expand validation rules, list more edge cases

---

## Examples of Filled Templates

### Example 1: Quick Prototype
**Project:** Test if users understand fuzzy match confidence scores

**Template Used:** `prototype-spec.md`

**Key Sections:**
- Goals: "Can users interpret 78% confidence score correctly?"
- Approach: Single HTML file, 4 hours to build
- Testing: Show to 5 users, collect feedback
- Next Steps: If successful → add to full feature

---

### Example 2: Data Processing Pipeline
**Project:** Nightly job to match schedule updates with actual progress

**Template Used:** `data-pipeline-spec.md`

**Key Sections:**
- Inputs: Updated XER file, Progress CSV from API
- Transformations: Normalize, match, flag anomalies
- Outputs: Matched CSV, summary JSON, alert emails
- Schedule: Daily at 2am via cron job

---

### Example 3: Full Feature
**Project:** Interactive dashboard for construction progress tracking

**Template Used:** `feature-spec.md`

**Key Sections:**
- Goals: Reduce manual reporting time by 80%
- Architecture: React frontend, Node.js backend, PostgreSQL
- Implementation: 3 weeks, 4 phases
- Quality: Full test suite, accessibility compliant
- Handoff: Documentation, training materials, deployment guide

---

## Best Practices

### Before Starting a Plan
✅ **Do:**
- Understand the problem fully
- Know your constraints (time, audience, resources)
- Have sample data or examples
- Clarify success criteria

❌ **Don't:**
- Start without understanding the "why"
- Guess at requirements (ask questions!)
- Over-scope for a prototype
- Under-plan for a production feature

### While Creating a Plan
✅ **Do:**
- Be specific (avoid vague descriptions)
- Include code examples where helpful
- Think through edge cases
- Estimate realistically

❌ **Don't:**
- Write a novel (be concise)
- Skip quality checks
- Ignore error handling
- Assume everything will go perfectly

### After Creating a Plan
✅ **Do:**
- Review with someone else
- Test assumptions with quick experiments
- Adjust based on feedback
- Keep plan updated as you implement

❌ **Don't:**
- Treat plan as unchangeable
- Skip steps to save time (usually backfires)
- Forget to document decisions
- Lose track of what you've completed

---

## Template Maintenance

These templates evolve! After completing a project:
1. Note what worked well
2. Identify missing sections
3. Remove unhelpful sections
4. Update examples
5. Share improvements

**Last Updated:** 2024-12-01

