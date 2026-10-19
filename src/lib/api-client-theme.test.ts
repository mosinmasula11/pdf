import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

it("uses MSYN brand tokens throughout the API client instead of Postman orange", () => {
  const source = readFileSync(new URL("../components/tools/ApiClientTool.tsx", import.meta.url), "utf8");
  expect(source).not.toMatch(/(?:bg|text|border|ring|accent|outline)(?:-t)?-orange-/);
  for (const token of ["bg-[var(--brand)]", "bg-[var(--brand-soft)]", "border-[var(--brand)]", "border-t-[var(--brand)]", "ring-[var(--brand)]", "accent-[var(--brand)]"]) expect(source).toContain(token);
});

it("retains semantic error and success colors", () => {
  const source = readFileSync(new URL("../components/tools/ApiClientTool.tsx", import.meta.url), "utf8");
  expect(source).toContain("text-red-700");
  expect(source).toContain("text-emerald-700");
});
