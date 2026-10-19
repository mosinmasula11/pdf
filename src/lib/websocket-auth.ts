export type SocketAuth = { type: "none" | "bearer" | "basic" | "apiKey"; token: string; username: string; password: string; key: string; value: string; location: "header" | "query" };
export interface SocketPair { id: string; enabled: boolean; key: string; value: string }
export const EMPTY_SOCKET_AUTH: SocketAuth = { type: "none", token: "", username: "", password: "", key: "", value: "", location: "header" };

export function prepareSocketRequest(value: string, params: SocketPair[], rows: SocketPair[], auth: SocketAuth) {
  const url = new URL(value);
  const headers: Record<string, string> = {};
  for (const row of params) if (row.enabled && row.key.trim()) url.searchParams.set(row.key.trim(), row.value);
  for (const row of rows) {
    if (!row.enabled || !row.key.trim()) continue;
    const key = row.key.trim().toLowerCase();
    if (!/^[!#$%&'*+\-.^_`|~0-9a-z]+$/.test(key) || /[\r\n\0]/.test(row.value)) throw new Error("Enter valid header names and values.");
    if (/^(host|connection|upgrade|content-length|transfer-encoding|proxy-.*|sec-websocket-.*)$/.test(key)) throw new Error("Handshake header " + key + " is managed automatically.");
    if (key in headers) throw new Error("Duplicate header: " + key);
    headers[key] = row.value;
  }
  if (auth.type === "bearer") {
    if (!auth.token.trim()) throw new Error("Enter a Bearer token.");
    if (headers.authorization) throw new Error("Remove the manual Authorization header before using Bearer auth.");
    headers.authorization = "Bearer " + auth.token.trim();
  } else if (auth.type === "basic") {
    if (!auth.username || auth.username.includes(":")) throw new Error("Enter a Basic auth username without a colon.");
    if (headers.authorization) throw new Error("Remove the manual Authorization header before using Basic auth.");
    const bytes = new TextEncoder().encode(auth.username + ":" + auth.password);
    headers.authorization = "Basic " + btoa(Array.from(bytes, byte => String.fromCharCode(byte)).join(""));
  } else if (auth.type === "apiKey") {
    if (!auth.key.trim() || !auth.value) throw new Error("Enter the API key name and value.");
    if (auth.location === "query") url.searchParams.set(auth.key.trim(), auth.value);
    else {
      const key = auth.key.trim().toLowerCase();
      if (key in headers) throw new Error("Remove the duplicate API key header.");
      headers[key] = auth.value;
    }
  }
  // Validate generated auth headers with the same rules as manually entered headers.
  for (const [key, value] of Object.entries(headers)) {
    if (!/^[!#$%&'*+\-.^_`|~0-9a-z]+$/.test(key) || /[\r\n\0]/.test(value) || /^(host|connection|upgrade|content-length|transfer-encoding|proxy-.*|sec-websocket-.*)$/.test(key)) throw new Error("Invalid or reserved authentication header.");
  }
  if (Object.keys(headers).length > 32 || JSON.stringify(headers).length > 16384) throw new Error("Headers exceed the 16 KB / 32 header limit.");
  return { url: url.toString(), headers };
}
