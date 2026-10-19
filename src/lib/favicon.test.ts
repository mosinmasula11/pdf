import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("MSYN favicon branding", () => {
  it("serves the approved MSYN icon at the conventional favicon path", () => {
    const icon = readFileSync(resolve(process.cwd(), "src/app/favicon.ico"));
    const brand = readFileSync(resolve(process.cwd(), "public/logo_for_title.ico"));
    expect(icon.equals(brand)).toBe(true);
    expect([...icon.subarray(0, 4)]).toEqual([0, 0, 1, 0]);
  });
  it("uses the conventional favicon in metadata and installed app settings", () => {
    expect(readFileSync(resolve(process.cwd(), "src/app/layout.tsx"), "utf8")).toContain('url: "/favicon.ico"');
    expect(readFileSync(resolve(process.cwd(), "src/app/manifest.ts"), "utf8")).toContain('src: "/favicon.ico"');
  });
});
