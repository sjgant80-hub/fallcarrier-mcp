#!/usr/bin/env node
// fallcarrier-mcp · MCP stdio server wrapping fallcarrier-sdk · MIT · AI-Native Solutions
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

const server = new Server({ name: 'fallcarrier-mcp', version: '1.0.0' }, { capabilities: { tools: {} } });

const TOOLS = [
  {
    name: 'fallcarrier_draw_mesh',
    description: 'drawMesh · from fallcarrier-sdk',
    inputSchema: { type: 'object', properties: {} },
    handler: async (args) => {
      const { drawMesh } = await import('@ai-native-solutions/fallcarrier-sdk');
      return typeof drawMesh === 'function' ? await drawMesh(args) : { error: 'drawMesh not callable' };
    }
  },
  {
    name: 'fallcarrier_mk',
    description: 'mk · from fallcarrier-sdk',
    inputSchema: { type: 'object', properties: {} },
    handler: async (args) => {
      const { mk } = await import('@ai-native-solutions/fallcarrier-sdk');
      return typeof mk === 'function' ? await mk(args) : { error: 'mk not callable' };
    }
  },
  {
    name: 'fallcarrier_draw_peers',
    description: 'drawPeers · from fallcarrier-sdk',
    inputSchema: { type: 'object', properties: {} },
    handler: async (args) => {
      const { drawPeers } = await import('@ai-native-solutions/fallcarrier-sdk');
      return typeof drawPeers === 'function' ? await drawPeers(args) : { error: 'drawPeers not callable' };
    }
  },
  {
    name: 'fallcarrier_draw_relays',
    description: 'drawRelays · from fallcarrier-sdk',
    inputSchema: { type: 'object', properties: {} },
    handler: async (args) => {
      const { drawRelays } = await import('@ai-native-solutions/fallcarrier-sdk');
      return typeof drawRelays === 'function' ? await drawRelays(args) : { error: 'drawRelays not callable' };
    }
  },
  {
    name: 'fallcarrier_render_log',
    description: 'renderLog · from fallcarrier-sdk',
    inputSchema: { type: 'object', properties: {} },
    handler: async (args) => {
      const { renderLog } = await import('@ai-native-solutions/fallcarrier-sdk');
      return typeof renderLog === 'function' ? await renderLog(args) : { error: 'renderLog not callable' };
    }
  },
  {
    name: 'fallcarrier_add_log',
    description: 'addLog · from fallcarrier-sdk',
    inputSchema: { type: 'object', properties: {} },
    handler: async (args) => {
      const { addLog } = await import('@ai-native-solutions/fallcarrier-sdk');
      return typeof addLog === 'function' ? await addLog(args) : { error: 'addLog not callable' };
    }
  }
];

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS.map(({ handler, ...rest }) => rest)
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const t = TOOLS.find(x => x.name === req.params.name);
  if (!t) throw new Error('unknown tool: ' + req.params.name);
  const result = await t.handler(req.params.arguments || {});
  return { content: [{ type: 'text', text: JSON.stringify(result) }] };
});

await server.connect(new StdioServerTransport());
console.error('fallcarrier-mcp v1.0.0 · stdio ready');
