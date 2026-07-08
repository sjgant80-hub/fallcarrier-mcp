# @ai-native-solutions/fallcarrier-mcp

**stdio MCP server** exposing FallCarrier's mesh-first messaging as Claude tools.

Wraps [`@ai-native-solutions/fallcarrier-sdk`](https://github.com/sjgant80-hub/fallcarrier-sdk). MIT.

## Add to Claude Code

```bash
claude mcp add fallcarrier -- npx -y @ai-native-solutions/fallcarrier-mcp
```

Restart Claude Code once, then the tools are live.

## Tools

| Tool | What it does |
|---|---|
| `send_message` | Send to a DID via best-available transport. Queues if no route. |
| `get_route` | Trace the route to a DID without sending. |
| `list_peers` | Every reachable peer with transport and latency. |
| `transport_status` | WebRTC / LoRa / relay health snapshot. |
| `connect_relay` | Open a WebSocket relay fallback. |
| `flush_outbox` | Retry queued messages against current routes. |

## Resources

- `fallcarrier://identity` — this carrier's DID
- `fallcarrier://log` — recent message log
- `fallcarrier://peers` — current peer table
- `fallcarrier://relays` — configured relays

## Local dev

```bash
git clone https://github.com/sjgant80-hub/fallcarrier-mcp
cd fallcarrier-mcp
npm install
node src/index.js
```

## Companions

- **fallcarrier-sdk** — the underlying JS library
- **fallcarrier-api** — HTTP wrapper with Docker

## License

MIT · AI-Native Solutions
