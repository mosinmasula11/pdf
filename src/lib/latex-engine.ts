import type { LatexProject } from "./latex-project";

export interface LatexCompileResult { pdf?: Uint8Array; log: string; status: number }
export class LatexCompiler {
  private worker: Worker | null = null;
  private rejectPending: ((error: Error) => void) | null = null;
  stop() { this.worker?.terminate(); this.worker = null; this.rejectPending?.(new Error("Compilation stopped.")); this.rejectPending = null; }
  async compile(project: LatexProject, onPhase: (phase: string) => void): Promise<LatexCompileResult> {
    this.stop();
    const worker = new Worker("/vendor/swiftlatex/swiftlatexpdftex.js"); this.worker = worker;
    const wait = (initial: boolean) => new Promise<MessageEvent["data"]>((resolve, reject) => {
      const timer = setTimeout(() => { worker.terminate(); if (this.worker === worker) this.worker = null; this.rejectPending = null; reject(new Error("Compilation timed out. Check the log or try a smaller document.")); }, 90000);
      const fail = (error: Error) => { clearTimeout(timer); reject(error); };
      this.rejectPending = fail;
      worker.onerror = () => fail(new Error("The LaTeX compiler could not load. Please retry."));
      worker.onmessage = event => {
        if (initial ? !event.data.cmd : event.data.cmd === "compile") { clearTimeout(timer); this.rejectPending = null; resolve(event.data); }
      };
    });
    try {
      onPhase("Loading compiler…");
      const ready = await wait(true);
      if (ready.result !== "ok") throw new Error("The compiler could not initialize.");
      worker.postMessage({ cmd: "settexliveurl", url: new URL("/api/latex-packages/", window.location.origin).href });
      const folders = new Set<string>();
      for (const file of project.files) {
        const parts = file.path.split("/"); parts.pop();
        for (let i = 1; i <= parts.length; i++) folders.add(parts.slice(0, i).join("/"));
      }
      [...folders].sort((a, b) => a.split("/").length - b.split("/").length).forEach(url => worker.postMessage({ cmd: "mkdir", url }));
      for (const file of project.files) worker.postMessage({ cmd: "writefile", url: file.path, src: file.binary ? Uint8Array.from(atob(file.content), char => char.charCodeAt(0)) : file.content });
      worker.postMessage({ cmd: "setmainfile", url: project.main });
      let result;
      for (let pass = 1; pass <= 2; pass++) {
        onPhase(`Compiling · pass ${pass} of 2…`);
        const pending = wait(false); worker.postMessage({ cmd: "compilelatex" }); result = await pending;
        if (result.result !== "ok") break;
      }
      return { pdf: result.pdf ? new Uint8Array(result.pdf) : undefined, log: result.log || "No compiler log.", status: result.status };
    } finally { worker.terminate(); if (this.worker === worker) this.worker = null; this.rejectPending = null; }
  }
}
