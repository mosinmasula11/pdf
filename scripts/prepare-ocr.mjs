import { mkdir, copyFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const target = join(process.cwd(), "public", "ocr");
await mkdir(target, { recursive: true });
const workerRoot = dirname(require.resolve("tesseract.js/package.json"));
const coreRoot = dirname(require.resolve("tesseract.js-core/package.json"));
const languageRoot = dirname(require.resolve("@tesseract.js-data/eng/package.json"));
await Promise.all([
  copyFile(join(workerRoot, "dist/worker.min.js"), join(target, "worker.min.js")),
  copyFile(join(coreRoot, "tesseract-core-lstm.wasm.js"), join(target, "tesseract-core-lstm.wasm.js")),
  copyFile(join(coreRoot, "tesseract-core-lstm.wasm"), join(target, "tesseract-core-lstm.wasm")),
  copyFile(join(languageRoot, "4.0.0_best_int/eng.traineddata.gz"), join(target, "eng.traineddata.gz")),
]);
