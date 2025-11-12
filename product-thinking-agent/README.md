# Product Thinking Agent

An AI engineering co-pilot for rapid experimentation in construction technology. This agent helps product designers translate fuzzy ideas into concrete, high-quality implementation plans through conversational dialogue.

## What This Is

Instead of writing PRDs or detailed specs, you can **talk directly to an AI agent** that:
- Asks clarifying questions to understand your needs
- Proposes 2-3 technical approaches with trade-offs
- Generates detailed implementation plans
- Learns your patterns and preferences over time
- Provides construction domain expertise automatically

## Key Features

### 🤖 MCP Server (Model Context Protocol)
Integrates with Cursor/Claude to provide:
- **Domain knowledge**: Construction trade sequences, conflicts, standard patterns
- **Data tools**: Parse schedules, match datasets, detect anomalies
- **Persistent context**: Conversations build knowledge over time

### 💬 Conversational Patterns
The agent follows proven dialogue patterns:
- Socratic questioning to clarify requirements
- Options menus with clear trade-offs
- Incremental validation checkpoints
- Transparent reasoning for recommendations

### 🧠 Knowledge Base
Learns from every project:
- Data matching patterns
- Construction domain rules
- Customer-specific quirks
- Technical decision history

### 🎯 Decision Templates
Standardized frameworks for common scenarios:
- Data processing pipelines
- Interactive prototypes
- Data visualizations
- Export generation

### 🔒 Progressive Trust System
- **Safe actions**: Auto-execute read-only operations
- **Ask-first actions**: Require permission for modifications
- **Learned actions**: Build automation based on your patterns

### 📋 Plan Templates
Generate detailed, implementable plans for:
- Features (complete tools with testing and handoff)
- Data Pipelines (ETL workflows with validation)
- Prototypes (quick experiments for feedback)

## Directory Structure

```
product-thinking-agent/
├── mcp-server/              # MCP server for Cursor/Claude integration
│   ├── index.js            # Main server
│   ├── package.json        # Dependencies
│   ├── knowledge/          # Domain knowledge JSON files
│   └── tools/              # Data analysis tools
│       ├── analyze-schedule.js
│       ├── match-actual-vs-schedule.js
│       └── anomaly-detector.js
│
├── agent-prompts/           # Conversational behavior guides
│   ├── product-thinking.md
│   ├── technical-decision-framework.md
│   └── construction-domain-expertise.md
│
├── decision-templates/      # Technical decision frameworks
│   ├── data-processing.md
│   ├── interactive-prototype.md
│   ├── data-visualization.md
│   └── export-generation.md
│
├── plan-templates/          # Implementation plan templates
│   ├── feature-spec.md
│   ├── data-pipeline-spec.md
│   └── prototype-spec.md
│
├── knowledge-base/          # Growing knowledge from projects
│   ├── data-matching-patterns.md
│   ├── construction-domain-rules.md
│   └── customer-specific-quirks.md
│
├── automation-rules/        # Progressive trust configuration
│   ├── safe-actions.json
│   ├── ask-first-actions.json
│   └── learned-actions.json
│
├── scripts/                 # Utility scripts
│   ├── extract-knowledge.js
│   └── update-mcp-context.js
│
├── .cursor/
│   └── rules                # Cursor-specific agent instructions
│
└── README.md               # This file
```

## Quick Start

### 1. Install MCP Server

```bash
cd mcp-server
npm install
```

### 2. Configure Cursor

Add to your Cursor MCP settings (File → Settings → Features → MCP):

```json
{
  "mcpServers": {
    "product-thinking-agent": {
      "command": "node",
      "args": ["/Users/zheng.li/Documents/VSCODE/toys/product-thinking-agent/mcp-server/index.js"]
    }
  }
}
```

### 3. Start Using

Open Cursor and start a conversation:

```
You: "I need to match actual construction progress to the schedule"

Agent: "Let me understand the data first:
1. What format is your actual progress data? (CSV, API, photos?)
2. What's in the schedule? (XER file, dates, trade names?)
3. How many activities are we matching? (50? 5,000?)
4. What's the matching key? (exact IDs, location+trade+date?)"
```

The agent will guide you through clarifying questions, propose technical options, and generate a detailed implementation plan.

## Example Workflow

### Vague Idea → Actionable Plan

**Step 1: Initial Request**
```
You: "I need to show customers which areas are behind schedule"
```

**Step 2: Agent Clarifies**
```
Agent: "Let me understand what we're building:
1. What data do you have? (Schedule file + actual progress?)
2. How do you define 'behind'? (Days late? % incomplete?)
3. What's the output? (Dashboard? PDF report? Email?)
4. Who's the audience? (Customer execs? Field teams?)
5. How often will this update? (Real-time? Weekly?)"
```

**Step 3: You Answer**
```
You: "XER schedule + CSV actual progress. Behind = >5 days late. 
     Interactive dashboard for customer execs. Updates weekly."
```

**Step 4: Agent Proposes Options**
```
Agent: "Got it. Here are 3 approaches:

**Option A: Single HTML Dashboard**
- Upload both files, auto-match by location+trade
- Show heat map of on-time vs late areas
- Pros: Portable, no server needed
- Cons: Manual upload each week
- Effort: 4-6 hours

**Option B: Automated Weekly Report**
- Scheduled job matches data nightly
- Generates PDF + sends email
- Pros: Fully automated
- Cons: Requires server setup
- Effort: 8-12 hours

**Option C: Live Dashboard with API**
- Connect directly to data sources
- Real-time updates
- Pros: Always current, interactive
- Cons: More complex, ongoing maintenance
- Effort: 2-3 weeks

I recommend Option A for rapid experimentation. You can upgrade to 
Option C later if it proves valuable. Sound good?"
```

**Step 5: You Approve**
```
You: "Yes, Option A"
```

**Step 6: Agent Generates Detailed Plan**
```
Agent: [Generates complete implementation plan using feature-spec.md template]

Including:
- Exact code structure and algorithms
- Data validation steps
- UI mockups
- Quality checks
- Handoff artifacts
- Sample code

Ready to implement or hand to another developer.
```

## Core Principles

### 1. Conversational First
The agent asks questions before assuming. Every interaction builds understanding.

### 2. Transparent Reasoning
The agent explains why it recommends Option A over Option B, showing trade-offs clearly.

### 3. Domain-Aware
Built-in knowledge of construction patterns, trade sequences, and data formats.

### 4. Incremental Trust
Starts cautious (asks before everything), learns your patterns, offers automation over time.

### 5. High-Quality Output
Plans are detailed enough for another AI or engineer to implement without asking questions.

### 6. Learning System
Every conversation adds to the knowledge base, making future interactions smarter.

## Construction Domain Knowledge

The agent knows about:
- **Trade Sequences**: Which trades must complete before others
- **Conflicting Trades**: Which trades can't work simultaneously in the same location
- **Standard Abbreviations**: SOG = Slab on Grade, MEP = Mechanical/Electrical/Plumbing, etc.
- **Data Formats**: XER (Primavera P6), CSV progress data, trade × location matrices
- **Anomaly Patterns**: 15 algorithms for detecting construction progress issues

## Common Use Cases

### 1. Data Matching
Match schedule activities to actual progress data when there are no shared IDs.

**Agent helps with:**
- Choosing matching strategy (exact, fuzzy, rule-based, hybrid)
- Setting confidence thresholds
- Handling name variations
- Building review interfaces

### 2. Interactive Dashboards
Create customer-facing dashboards for progress visualization.

**Agent helps with:**
- Choosing tech stack (single HTML vs React)
- Selecting visualizations (charts, heat maps, tables)
- Implementing filters and drill-downs
- Optimizing performance

### 3. Anomaly Detection
Identify issues in construction progress data.

**Agent helps with:**
- Running 15 specialized detectors
- Prioritizing by severity
- Explaining what each anomaly means
- Suggesting next actions

### 4. Data Exports
Generate formatted reports (PDF, Excel, CSV).

**Agent helps with:**
- Choosing export format for use case
- Designing layouts
- Including metadata
- Automating generation

## Technical Stack

### MCP Server
- **Runtime**: Node.js 18+
- **Framework**: @modelcontextprotocol/sdk
- **Libraries**: papaparse (CSV), fast-xml-parser (XER), natural (fuzzy matching)

### Knowledge Base
- **Format**: Markdown files
- **Version Control**: Git-tracked
- **Updates**: Manual or automated via scripts

### Integration
- **IDE**: Cursor (native MCP support)
- **AI**: Claude (Anthropic)
- **Deployment**: Local (no cloud dependencies)

## Extending the Agent

### Adding New Domain Knowledge
1. Edit files in `mcp-server/knowledge/`
2. Run `node scripts/update-mcp-context.js`
3. Restart MCP server

### Adding New Tools
1. Create tool in `mcp-server/tools/`
2. Register in `mcp-server/index.js`
3. Add to tool list in `ListToolsRequestSchema` handler

### Adding Decision Templates
1. Create markdown file in `decision-templates/`
2. Follow existing template format
3. Reference from agent prompts

### Adding Plan Templates
1. Create markdown file in `plan-templates/`
2. Include all necessary sections
3. Add examples and checklists

## Maintenance

### Updating Knowledge Base
After completing projects, document learnings:
```bash
# Edit knowledge files
vim knowledge-base/data-matching-patterns.md

# Sync to MCP server
node scripts/update-mcp-context.js
```

### Tracking Agent Performance
Monitor:
- Questions asked before proposing solutions
- Option quality (are trade-offs clear?)
- Plan completeness (can others implement without clarification?)
- Learning effectiveness (do repeated tasks get faster?)

## Troubleshooting

### MCP Server Not Connecting
1. Check Cursor MCP settings have correct path
2. Verify Node.js 18+ is installed
3. Run `npm install` in mcp-server/
4. Check console for error messages

### Agent Not Using Domain Knowledge
1. Verify knowledge files exist in `mcp-server/knowledge/`
2. Check MCP server started successfully
3. Restart Cursor to reload MCP connection

### Poor Quality Plans
1. Verify you answered all clarifying questions
2. Check if agent has relevant domain knowledge
3. Provide more context about constraints
4. Review and update agent-prompts/ files

## Future Enhancements

- [ ] Automated knowledge extraction from conversation logs
- [ ] Machine learning for pattern recognition
- [ ] Shared knowledge base across team
- [ ] Integration with project management tools
- [ ] Real-time collaboration features
- [ ] Visual workflow builder

## Contributing

To improve this agent system:
1. Document patterns you discover
2. Add decision templates for new scenarios
3. Expand domain knowledge
4. Share customer-specific learnings (anonymized)
5. Improve plan templates based on usage

## License

MIT

## Contact

For questions or feedback about this agent system, reach out to the product design team.

---

**Remember**: This agent is a thinking partner, not just a code generator. The conversation is as valuable as the code.

