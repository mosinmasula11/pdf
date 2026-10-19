import { createServer, request } from "node:http";
import type { RequestOptions } from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, expect, it } from "vitest";
import { createPinnedApiLookup } from "./api-proxy";

it.each([{ address: "1.1.1.1", family: 4 }, { address: "2606:4700:4700::1111", family: 6 }])("returns the single-address form for $address", destination => {
  let received: unknown[] = [];
  createPinnedApiLookup(destination)("public.example", {}, (...args) => { received = args; });
  expect(received).toEqual([null, destination.address, destination.family]);
});
it.each([{ address: "1.1.1.1", family: 4 }, { address: "2606:4700:4700::1111", family: 6 }])("returns address records, not a string, when all is requested for $address", destination => {
  let received: unknown[] = [];
  createPinnedApiLookup(destination)("public.example", { all: true }, (...args) => { received = args; });
  expect(received).toEqual([null, [destination]]);
});

const server = createServer((req, res) => {
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify({ method: req.method, host: req.headers.host }));
});
let port: number;
beforeAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => { port = (server.address() as AddressInfo).port; resolve(); });
  });
});
afterAll(async () => {
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
});

// Only the lookup adapter is tested on loopback; public proxy resolution remains guarded.
it("reproduces Invalid IP address: undefined when a legacy callback returns a string for all=true", async () => {
  await expect(new Promise<void>((resolve, reject) => {
    const options: RequestOptions & { autoSelectFamily: boolean } = {
      agent: false, autoSelectFamily: true,
      lookup: (_hostname, _options, callback) => callback(null, "127.0.0.1", 4),
    };
    const req = request("http://lookup-regression.test:" + port + "/", options, response => {
      response.resume(); response.on("end", resolve); response.on("error", reject);
    });
    req.on("error", reject);
    req.setTimeout(2000, () => req.destroy(new Error("Socket regression test timed out.")));
    req.end();
  })).rejects.toThrow("Invalid IP address: undefined");
});

it.each([false, true])("connects through Node's real socket with autoSelectFamily=%s", async autoSelectFamily => {
  const body = await new Promise<string>((resolve, reject) => {
    const options: RequestOptions & { autoSelectFamily: boolean } = {
      agent: false, autoSelectFamily,
      lookup: createPinnedApiLookup({ address: "127.0.0.1", family: 4 }),
    };
    const req = request("http://lookup-regression.test:" + port + "/", options, response => {
      let text = "";
      response.on("data", chunk => { text += chunk; });
      response.on("end", () => resolve(text));
      response.on("error", reject);
    });
    req.on("error", reject);
    req.setTimeout(2000, () => req.destroy(new Error("Socket regression test timed out.")));
    req.end();
  });
  expect(JSON.parse(body)).toEqual({ method: "GET", host: "lookup-regression.test:" + port });
});
