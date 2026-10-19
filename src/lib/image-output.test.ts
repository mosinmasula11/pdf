import { expect, it } from "vitest";
import { svgOutputSize, uniqueImageName } from "./image-output";
it("preserves the SVG aspect ratio with height-only sizing", () => {
  expect(svgOutputSize(100, 50, 2, "", "50", true)).toEqual({ width: 100, height: 50 });
});
it("supports width-only sizing and explicit stretching", () => {
  expect(svgOutputSize(100, 50, 2, "300", "", true)).toEqual({ width: 300, height: 150 });
  expect(svgOutputSize(100, 50, 2, "300", "100", false)).toEqual({ width: 300, height: 100 });
});
it("rejects oversized or invalid dimensions before canvas allocation", () => {
  expect(() => svgOutputSize(100, 50, 2, "100000", "", true)).toThrow();
  expect(() => svgOutputSize(100, 50, 2, "", "-1", true)).toThrow();
});
it("keeps all same-basename images in batch ZIP exports", () => {
  const used = new Set<string>();
  expect(["image.png", "image.png", "IMAGE.png", "image-2.png"].map(name => uniqueImageName(name, used)))
    .toEqual(["image.png", "image-2.png", "IMAGE-3.png", "image-2-2.png"]);
});
