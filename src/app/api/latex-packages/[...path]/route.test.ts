import { afterEach, expect, it, vi } from "vitest";
import { GET } from "./route";

afterEach(() => vi.unstubAllGlobals());
it.each([["https:", "example.com"], ["pdftex", "26", ".."], ["pdftex", "26", "a/b.tex"], ["xetex", "26", "article.cls"], ["pdftex", "26", "https://example.com"]])("rejects unsafe package requests %j", async (...path) => {
  const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
  expect((await GET(new Request("http://localhost/api/latex-packages/test"), { params: Promise.resolve({ path }) })).status).toBe(404);
  expect(fetch).not.toHaveBeenCalled();
});
it("fetches only the fixed package mirror and preserves binary resources", async () => {
  const fetch = vi.fn().mockResolvedValue(new Response(new Uint8Array([1, 2, 3]), { headers: { "content-length": "3" } })); vi.stubGlobal("fetch", fetch);
  const response = await GET(new Request("http://localhost/test"), { params: Promise.resolve({ path: ["pdftex", "26", "unit-test-package.sty"] }) });
  expect(response.status).toBe(200);
  expect([...new Uint8Array(await response.arrayBuffer())]).toEqual([1, 2, 3]);
  expect(fetch.mock.calls[0][0]).toBe("https://texlive.texlyre.org/pdftex/26/unit-test-package.sty");
  expect(fetch.mock.calls[0][1].redirect).toBe("manual");
  expect(response.headers.get("fileid")).toMatch(/^[a-f0-9]{64}$/);
});
it("does not relay package mirror redirects", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 302, headers: { location: "http://localhost/" } })));
  expect((await GET(new Request("http://localhost/test"), { params: Promise.resolve({ path: ["pdftex", "26", "redirect-test.sty"] }) })).status).toBe(404);
});
