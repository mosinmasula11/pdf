const http = require("node:http");
const { WebSocketServer } = require("next/dist/compiled/ws");

// Loopback-only fixture; never part of the application's HTTP or WebSocket proxy.
async function startEchoServer(port = 3004) {
  const server = http.createServer((req, res) => {
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ service: "msyn-websocket-test-fixture" }));
  });
  const sockets = new WebSocketServer({ noServer: true, maxPayload: 2 * 1024 * 1024 });
  server.on("upgrade", (request, socket, head) => {
    if (request.url === "/reject") { socket.end("HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n"); return; }
    sockets.handleUpgrade(request, socket, head, connection => sockets.emit("connection", connection));
  });
  sockets.on("connection", socket => {
    socket.on("error", () => {});
    socket.on("message", (data, binary) => {
      if (!binary && data.toString() === "__close__") socket.close(1000, "Server finished");
      else socket.send(data, { binary });
    });
  });
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(port, "127.0.0.1", resolve); });
  return {
    url: "ws://127.0.0.1:" + server.address().port + "/echo",
    close: () => new Promise((resolve, reject) => {
      for (const socket of sockets.clients) socket.terminate();
      sockets.close(() => server.close(error => error ? reject(error) : resolve()));
    }),
  };
}
module.exports = { startEchoServer };
if (require.main === module) {
  startEchoServer(Number(process.env.MSYN_WS_TEST_PORT || 3004)).then(fixture => {
    console.log("WebSocket test fixture: " + fixture.url);
    process.once("SIGTERM", () => fixture.close().then(() => process.exit(0)));
    process.once("SIGINT", () => fixture.close().then(() => process.exit(0)));
  }).catch(error => { console.error(error.message); process.exitCode = 1; });
}
