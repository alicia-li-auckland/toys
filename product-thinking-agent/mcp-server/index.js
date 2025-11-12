#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import tools
import { analyzeSchedule } from './tools/analyze-schedule.js';
import { matchActualVsSchedule } from './tools/match-actual-vs-schedule.js';
import { detectAnomalies } from './tools/anomaly-detector.js';

class ProductThinkingAgentServer {
  constructor() {
    this.server = new Server(
      {
        name: 'product-thinking-agent-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    this.knowledgePath = path.join(__dirname, 'knowledge');
    this.setupHandlers();
    this.setupErrorHandling();
  }

  setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  setupHandlers() {
    // List available resources (knowledge files)
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          {
            uri: 'knowledge://construction-domain',
            name: 'Construction Domain Knowledge',
            description: 'Trade sequences, conflicts, and construction patterns',
            mimeType: 'application/json',
          },
          {
            uri: 'knowledge://customer-data-schemas',
            name: 'Customer Data Schemas',
            description: 'Known data formats (XER, CSV structures)',
            mimeType: 'application/json',
          },
          {
            uri: 'knowledge://deliverable-templates',
            name: 'Deliverable Templates',
            description: 'Common prototype patterns and deliverable types',
            mimeType: 'application/json',
          },
        ],
      };
    });

    // Read specific knowledge resource
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const uri = request.params.uri;
      const resourceName = uri.replace('knowledge://', '');
      const filePath = path.join(this.knowledgePath, `${resourceName}.json`);

      try {
        const content = await fs.readFile(filePath, 'utf-8');
        return {
          contents: [
            {
              uri: request.params.uri,
              mimeType: 'application/json',
              text: content,
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to read resource ${resourceName}: ${error.message}`);
      }
    });

    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'analyze_schedule',
            description: 'Parse and analyze construction schedules (XER, CSV). Extracts activities, trade information, dependencies, and provides insights about project structure.',
            inputSchema: {
              type: 'object',
              properties: {
                file_path: {
                  type: 'string',
                  description: 'Path to the schedule file (XER or CSV)',
                },
                analysis_type: {
                  type: 'string',
                  enum: ['summary', 'trades', 'timeline', 'dependencies', 'full'],
                  description: 'Type of analysis to perform',
                  default: 'summary',
                },
              },
              required: ['file_path'],
            },
          },
          {
            name: 'match_actual_vs_schedule',
            description: 'Match actual construction progress data against scheduled activities. Supports fuzzy matching by location and trade name.',
            inputSchema: {
              type: 'object',
              properties: {
                schedule_file: {
                  type: 'string',
                  description: 'Path to schedule file (XER or CSV)',
                },
                actual_file: {
                  type: 'string',
                  description: 'Path to actual progress data file (CSV)',
                },
                matching_strategy: {
                  type: 'string',
                  enum: ['exact', 'fuzzy', 'rule_based', 'hybrid'],
                  description: 'Strategy for matching activities',
                  default: 'hybrid',
                },
                confidence_threshold: {
                  type: 'number',
                  description: 'Minimum confidence score for auto-matching (0-1)',
                  default: 0.8,
                },
              },
              required: ['schedule_file', 'actual_file'],
            },
          },
          {
            name: 'detect_anomalies',
            description: 'Run 15 anomaly detection algorithms on construction progress data. Identifies sequence violations, stalled trades, velocity disparities, and more.',
            inputSchema: {
              type: 'object',
              properties: {
                data_file: {
                  type: 'string',
                  description: 'Path to construction progress data file (CSV)',
                },
                detectors: {
                  type: 'array',
                  items: {
                    type: 'string',
                    enum: [
                      'sequence_violations',
                      'stalled_trades',
                      'velocity_disparities',
                      'completion_clustering',
                      'trade_stack_density',
                      'bottleneck_index',
                      'abandoned_zones',
                      'trade_leapfrogging',
                      'completion_rate_decay',
                      'false_starts',
                      'hidden_rework',
                      'trade_collisions',
                      'asymmetric_progress',
                      'schedule_deviations',
                      'material_constraints',
                      'all',
                    ],
                  },
                  description: 'Which anomaly detectors to run',
                  default: ['all'],
                },
              },
              required: ['data_file'],
            },
          },
        ],
      };
    });

    // Execute tools
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'analyze_schedule':
            return await analyzeSchedule(args);

          case 'match_actual_vs_schedule':
            return await matchActualVsSchedule(args);

          case 'detect_anomalies':
            return await detectAnomalies(args);

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error executing ${name}: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Product Thinking Agent MCP Server running on stdio');
  }
}

// Start the server
const server = new ProductThinkingAgentServer();
server.run().catch(console.error);

