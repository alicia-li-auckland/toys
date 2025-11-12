# Setup Guide

Follow these steps to set up and start using the Product Thinking Agent.

## Prerequisites

- **Node.js 18+** installed
- **Cursor IDE** (for MCP integration)
- **Basic familiarity** with construction data (optional but helpful)

## Step 1: Install MCP Server

```bash
cd /Users/zheng.li/Documents/VSCODE/toys/product-thinking-agent/mcp-server
npm install
```

This will install:
- `@modelcontextprotocol/sdk` - MCP server framework
- `papaparse` - CSV parsing
- `fast-xml-parser` - XER/XML parsing
- `natural` - Fuzzy string matching

## Step 2: Test MCP Server

```bash
npm start
```

You should see:
```
Product Thinking Agent MCP Server running on stdio
```

Press Ctrl+C to stop. The server is working!

## Step 3: Configure Cursor

### Option A: Using Cursor Settings UI

1. Open Cursor
2. Go to **File → Settings** (or **Cursor → Settings** on Mac)
3. Navigate to **Features → MCP**
4. Click **Add MCP Server**
5. Enter configuration:
   ```json
   {
     "command": "node",
     "args": ["/Users/zheng.li/Documents/VSCODE/toys/product-thinking-agent/mcp-server/index.js"]
   }
   ```
6. Name it: `product-thinking-agent`
7. Click **Save**

### Option B: Edit Config File Directly

Edit this file:
```
~/Library/Application Support/Cursor/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json
```

Add:
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

## Step 4: Restart Cursor

Close and reopen Cursor completely for MCP configuration to take effect.

## Step 5: Verify MCP Integration

In Cursor, start a new chat and type:
```
Can you list the available MCP resources?
```

You should see the agent can access:
- `knowledge://construction-domain`
- `knowledge://customer-data-schemas`
- `knowledge://deliverable-templates`

If you see these, MCP is working! ✅

## Step 6: Test the Agent

Try this conversation:

```
You: "I need to match schedule data to actual progress"

Agent should respond with clarifying questions about:
- Data formats
- Data volume
- Matching criteria
- Desired output
- Audience
```

If the agent asks these questions, everything is working! 🎉

## Common Issues

### Issue: MCP Server Not Found

**Error:** `Failed to start MCP server`

**Fix:**
1. Check the path in your MCP config is correct
2. Make sure Node.js 18+ is installed: `node --version`
3. Make sure npm packages are installed: `cd mcp-server && npm install`

---

### Issue: Agent Doesn't Use Domain Knowledge

**Symptoms:** Agent doesn't mention construction trades, sequences, or patterns

**Fix:**
1. Verify MCP server is running (check Cursor console)
2. Check knowledge files exist: `ls mcp-server/knowledge/`
3. Restart Cursor to reload MCP connection

---

### Issue: Agent Responses Are Generic

**Symptoms:** Agent doesn't follow conversational patterns or use decision templates

**Fix:**
1. Make sure `.cursor/rules` file is in your workspace
2. Reference the rules explicitly: "Follow the product thinking agent rules"
3. Cursor may need a fresh chat session to load rules

---

## Advanced Setup

### Enable Debug Logging

Edit `mcp-server/index.js` and add at the top:

```javascript
const DEBUG = true;
```

This will log all MCP server requests/responses to help with troubleshooting.

### Update Construction Domain Knowledge

If you discover new patterns or rules:

1. Edit files in `mcp-server/knowledge/`
2. Run: `node scripts/update-mcp-context.js`
3. Restart Cursor

### Add Customer-Specific Knowledge

Edit `knowledge-base/customer-specific-quirks.md` and add your customer's patterns:

```markdown
## Customer: [Your Customer]

**Industry/Type:** [e.g., Data Center]

**Data Characteristics:**
- File format: XER
- Typical project size: 10,000 activities
- ...

**Known Mappings:**
- "Type N" = Concrete
- "Type P" = Structure
- ...
```

Then run `node scripts/update-mcp-context.js` to sync.

## Usage Tips

### 1. Start Vague, Let Agent Clarify
❌ Don't: "I need a React app with TanStack Table to match XER files..."
✅ Do: "I need to match schedule data to actual progress"

The agent will ask the right questions.

### 2. Answer Honestly
If you're not sure about something, say so! The agent will help you figure it out.

### 3. Review Options Carefully
The agent typically provides 2-3 options. Read the pros/cons before choosing.

### 4. Iterate Freely
Plans can be adjusted. If you think of something after the plan is made, just ask for changes.

### 5. Use Checkpoints
Validate early phases before building later ones. The agent will remind you to do this.

## What's Next?

Now that setup is complete:

1. **Read**: `EXAMPLE_WORKFLOW.md` - See a complete interaction
2. **Explore**: `decision-templates/` - See how technical decisions are framed
3. **Learn**: `knowledge-base/` - Understand the domain knowledge
4. **Build**: Start a conversation and create something!

## Getting Help

If you run into issues:

1. Check this SETUP.md for common problems
2. Review `README.md` for architecture overview
3. Look at `EXAMPLE_WORKFLOW.md` to see expected behavior
4. Check MCP server logs (Cursor console)
5. Verify `.cursor/rules` file is loaded

## Maintenance

### Weekly
- Review `knowledge-base/` and add learnings from completed projects
- Run `node scripts/update-mcp-context.js` to sync changes

### After Each Project
- Document new patterns in `knowledge-base/`
- Add customer-specific quirks if discovered
- Update decision templates if new scenarios emerge

### Monthly
- Review `automation-rules/learned-actions.json`
- Check which actions have become automated
- Revoke any that aren't working well

---

**Setup Complete!** 🚀

You now have a fully functional Product Thinking Agent that will help you rapidly experiment and build high-quality tools.

Start a conversation in Cursor and say:
```
"I need help building [your idea]"
```

The agent will take it from there!

