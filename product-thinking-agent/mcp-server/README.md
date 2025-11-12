# Product Thinking Agent MCP Server

An MCP (Model Context Protocol) server that provides construction domain knowledge and data analysis tools for rapid experimentation in construction tech.

## What This Does

This server integrates with Cursor/Claude to give your AI assistant:
- **Domain knowledge** about construction trades, sequences, and patterns
- **Data analysis tools** for parsing schedules, matching actual vs planned progress
- **Anomaly detection** algorithms specific to construction projects

## Installation

```bash
cd mcp-server
npm install
```

## Configuration

Add to your Cursor MCP settings (`~/Library/Application Support/Cursor/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`):

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

## Available Resources

- **construction-domain**: Trade sequences, conflicts, and construction patterns
- **customer-data-schemas**: Known data formats (XER, CSV structures)
- **deliverable-templates**: Common prototype patterns

## Available Tools

### analyze_schedule
Parse and analyze construction schedules (XER, CSV format).

### match_actual_vs_schedule
Match actual construction progress against scheduled activities.

### detect_anomalies
Run 15 anomaly detection algorithms on construction progress data.

## Testing

```bash
npm start
```

The server runs on stdio and communicates via JSON-RPC.

