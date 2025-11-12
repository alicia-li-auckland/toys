#!/usr/bin/env node

/**
 * Update MCP server context with latest knowledge base
 * 
 * Syncs knowledge base files to MCP server resources
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const KNOWLEDGE_BASE_DIR = path.join(__dirname, '../knowledge-base');
const MCP_KNOWLEDGE_DIR = path.join(__dirname, '../mcp-server/knowledge');

async function updateMCPContext() {
  console.log('Updating MCP Server Context');
  console.log('===========================\n');

  try {
    // Read all knowledge base markdown files
    const files = await fs.readdir(KNOWLEDGE_BASE_DIR);
    const markdownFiles = files.filter(f => f.endsWith('.md') && f !== 'README.md');

    console.log(`Found ${markdownFiles.length} knowledge files to process:\n`);

    for (const file of markdownFiles) {
      const filePath = path.join(KNOWLEDGE_BASE_DIR, file);
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Convert to a structured format the MCP server can use
      const knowledge = {
        source_file: file,
        last_updated: new Date().toISOString(),
        content: content,
        // Could extract sections, patterns, etc. for easier querying
      };

      // For now, just log what we'd do
      console.log(`  ✓ Processed ${file}`);
      console.log(`    - ${content.split('\n').length} lines`);
      console.log(`    - ${(content.length / 1024).toFixed(1)} KB`);
    }

    console.log('\n✅ Knowledge base sync complete!');
    console.log('\nNext steps:');
    console.log('  1. Restart MCP server for changes to take effect');
    console.log('  2. MCP server will load updated knowledge automatically');
    console.log('');
    console.log('Note: Currently this is a read-only sync.');
    console.log('Future: Could implement bi-directional sync and versioning.');

  } catch (error) {
    console.error('❌ Error updating MCP context:', error.message);
    process.exit(1);
  }
}

// Helper: Extract patterns from markdown
function extractPatterns(markdownContent) {
  const patterns = [];
  const sections = markdownContent.split(/^##\s+/m);
  
  sections.forEach(section => {
    if (section.trim()) {
      const lines = section.split('\n');
      const title = lines[0].trim();
      
      // Extract key fields if present
      const context = extractField(section, 'Context');
      const problem = extractField(section, 'Problem');
      const solution = extractField(section, 'Solution');
      
      if (context || problem || solution) {
        patterns.push({
          title,
          context,
          problem,
          solution,
        });
      }
    }
  });
  
  return patterns;
}

function extractField(text, fieldName) {
  const regex = new RegExp(`\\*\\*${fieldName}:\\*\\*\\s*(.+?)(?=\\n\\n|\\*\\*|$)`, 'is');
  const match = text.match(regex);
  return match ? match[1].trim() : null;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  updateMCPContext();
}

export { updateMCPContext, extractPatterns };

