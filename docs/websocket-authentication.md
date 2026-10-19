# WebSocket authentication and relay

The API Client supports No Auth, Bearer Token, Basic Auth, API Key (header/query), custom handshake headers and query parameters. Selecting header authentication enables relay mode. Disconnect before changing connection details. Enter an existing OAuth access token as a Bearer token; OAuth token acquisition, Digest, NTLM, Socket.IO and client certificates are not implemented.

## Transport
Direct mode uses the browser WebSocket API. Browser cookies follow browser policy. Custom headers cannot be added in direct mode.

Relay mode posts connection configuration to /api/websocket and consumes an HTTP NDJSON event stream while the server holds the upstream ws connection. Send/close requests use an opaque short-lived session ID and 256-bit capability token held only in browser/server memory. Browser cookies and incoming application Authorization headers are never forwarded automatically.

The relay requires same-origin requests, verified wss TLS, public destinations on port 443, DNS validation and pinned address lookup. It disables redirects and compression, rejects reserved headers, bounds messages at 2 MB and caps active connections (8) and connection attempts (60/minute per process). Connections expire after five minutes and close on stream cancellation. It is not a private-network proxy.

## Deployment
Run on the app's persistent Node server. Serverless/edge or multi-instance routing without connection affinity is not supported: connection and send/close requests must reach the same process. Configure the reverse proxy to disable response buffering for /api/websocket, allow five-minute streaming responses and retain the public Origin/Host. No extra listening port or custom Next server is required. Infrastructure access logs should not record request bodies or X-Relay-Token. For public high-volume use add ingress rate limits and appropriate authentication.

Credentials, custom headers, subprotocols and query values are not saved to connection history, exported connection profiles or application storage. Messages appear in the in-memory log and in explicitly downloaded logs; do not send secrets to untrusted echo servers. No TLS bypass setting is provided.
