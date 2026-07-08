#!/usr/bin/env node
// @ai-native-solutions/fallcarrier-mcp
// stdio MCP server wrapping fallcarrier-sdk.
// MIT · AI-Native Solutions

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import { FallCarrier } from '@ai-native-solutions/fallcarrier-sdk';

// Single carrier instance shared across tool calls in this process
const fc = new FallCarrier({
  transports: ['websocket-relay'] // Node has no WebRTC / Web Serial
});
await fc.connect();

const server = new Server(
  { name: 'fallcarrier-mcp', version: '1.0.0' },
  { capabilities: { tools: {}, resources: {} } }
);

// ─── Tools ─────────────────────────────────────────────────────────
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'send_message',
      description: 'Send a mesh message to a DID over the best-available transport (WebRTC / LoRa / WebSocket relay). Queues if no route.',
      inputSchema: {
        type: 'object',
        properties: {
          to: { type: 'string', description: 'Destination DID, e.g. did:fc:atrium9k' },
          payload: { description: 'String or JSON-serialisable payload' }
        },
        required: ['to', 'payload']
      }
    },
    {
      name: 'get_route',
      description: 'Trace the route to a DID without sending anything. Returns reachable status and hop plan.',
      inputSchema: {
        type: 'object',
        properties: { to: { type: 'string', description: 'Destination DID' } },
        required: ['to']
      }
    },
    {
      name: 'list_peers',
      description: 'List every reachable peer with transport and latency.',
      inputSchema: { type: 'object', properties: {} }
    },
    {
      name: 'transport_status',
      description: 'Snapshot of WebRTC, LoRa, and relay health.',
      inputSchema: { type: 'object', properties: {} }
    },
    {
      name: 'connect_relay',
      description: 'Open a WebSocket relay fallback for when local mesh is empty.',
      inputSchema: {
        type: 'object',
        properties: { url: { type: 'string', description: 'wss://... URL' } },
        required: ['url']
      }
    },
    {
      name: 'flush_outbox',
      description: 'Retry every queued message against current routes.',
      inputSchema: { type: 'object', properties: {} }
    }
  ]
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args = {} } = req.params;
  const wrap = (obj) => ({ content: [{ type: 'text', text: JSON.stringify(obj, null, 2) }] });

  try {
    switch (name) {
      case 'send_message': {
        const r = await fc.send(args.to, args.payload);
        return wrap(r);
      }
      case 'get_route': {
        return wrap(fc.getRoute(args.to));
      }
      case 'list_peers': {
        return wrap({ did: fc.did, peers: fc.getPeers() });
      }
      case 'transport_status': {
        return wrap({ did: fc.did, ...fc.transportStatus() });
      }
      case 'connect_relay': {
        const entry = fc.connectRelay(args.url);
        // Give the socket a beat to open
        await new Promise((r) => setTimeout(r, 400));
        return wrap({ url: entry.url, status: entry.status });
      }
      case 'flush_outbox': {
        const r = await fc.flushOutbox();
        return wrap({ retried: r.length, results: r });
      }
      default:
        return { content: [{ type: 'text', text: `unknown tool: ${name}` }], isError: true };
    }
  } catch (e) {
    return { content: [{ type: 'text', text: `error · ${e.message}` }], isError: true };
  }
});

// ─── Resources ─────────────────────────────────────────────────────
server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    { uri: 'fallcarrier://identity', name: 'Carrier DID', description: 'This carrier\'s DID', mimeType: 'application/json' },
    { uri: 'fallcarrier://log',      name: 'Message log', description: 'Recent send/queue/deliver entries', mimeType: 'application/json' },
    { uri: 'fallcarrier://peers',    name: 'Reachable peers', description: 'Current peer table', mimeType: 'application/json' },
    { uri: 'fallcarrier://relays',   name: 'Configured relays', description: 'Relay list with statuses', mimeType: 'application/json' }
  ]
}));

server.setRequestHandler(ReadResourceRequestSchema, async (req) => {
  const uri = req.params.uri;
  const body = (obj) => ({ contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(obj, null, 2) }] });
  switch (uri) {
    case 'fallcarrier://identity': return body({ did: fc.did });
    case 'fallcarrier://log':      return body(fc.log.slice(-50));
    case 'fallcarrier://peers':    return body(fc.getPeers());
    case 'fallcarrier://relays':   return body(fc.relays.map((r) => ({ url: r.url, status: r.status })));
    default: throw new Error('unknown resource: ' + uri);
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
