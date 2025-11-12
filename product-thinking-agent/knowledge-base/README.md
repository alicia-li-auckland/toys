# Knowledge Base

This directory contains learnings extracted from conversations and project work. The knowledge base grows over time as patterns emerge and decisions are documented.

## Structure

```
knowledge-base/
├── data-matching-patterns.md      # Patterns for matching datasets
├── construction-domain-rules.md   # Construction-specific learnings
├── customer-specific-quirks.md    # Customer data patterns
├── technical-decisions.md         # Archive of technical choices
└── conversation-summaries/        # Summaries of key discussions
    ├── 2024-12/
    │   ├── schedule-matching-project.md
    │   └── anomaly-dashboard-project.md
    └── ...
```

## How It Works

### Automatic Extraction (Future)

After each conversation, run:
```bash
node scripts/extract-knowledge.js
```

This will:
1. Analyze recent conversations
2. Extract patterns and decisions
3. Update relevant knowledge files
4. Sync back to MCP server

### Manual Addition

You can also manually add learnings:

1. Create or update a markdown file in this directory
2. Follow the template format (see examples below)
3. Run `node scripts/update-mcp-context.js` to sync

## Knowledge Template

### Pattern/Learning Entry

```markdown
## [Title of Pattern/Learning]

**Context:** [When does this apply?]

**Problem:** [What challenge does this address?]

**Solution:** [What works?]

**Why:** [Reasoning behind this approach]

**Example:**
[Code snippet or concrete example]

**Related:**
- [Link to related patterns]
- [Reference to conversation]

**Last Updated:** YYYY-MM-DD
```

## How to Use

### For the Agent

When responding to user requests:
1. Check relevant knowledge files for similar patterns
2. Reference past solutions that worked
3. Apply learned constraints and preferences
4. Update knowledge after implementing new solutions

### For Users

Browse these files to:
- Understand established patterns
- See what approaches have been tried
- Learn from past technical decisions
- Identify knowledge gaps to fill

## Contributing

After completing a project:
1. Document key decisions made
2. Note what worked well and what didn't
3. Extract reusable patterns
4. Update relevant knowledge files
5. Add conversation summary

## Future Enhancements

- [ ] Automated pattern extraction from conversations
- [ ] Search interface for knowledge base
- [ ] Link knowledge to specific code implementations
- [ ] Track pattern usage frequency
- [ ] Version control for evolving patterns

