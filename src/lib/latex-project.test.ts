import { expect, it } from "vitest";
import { LATEX_TEMPLATES, latexOutline, newLatexProject, validLatexPath, validateLatexProject } from "./latex-project";

it.each(["main.tex", "sections/introduction.tex", "figures/plot-1.png", "references.bib"])("accepts safe project path %s", path => expect(validLatexPath(path)).toBe(true));
it.each(["../main.tex", "/main.tex", "C:\\main.tex", "a/../../x.tex", "a//x.tex", "script.js", "a/./x.tex"])("rejects unsafe or unsupported path %s", path => expect(validLatexPath(path)).toBe(false));
it("requires a real main document and rejects duplicate files", () => {
  expect(() => validateLatexProject({ ...newLatexProject(), main: "missing.tex" })).toThrow();
  const project = newLatexProject();
  expect(() => validateLatexProject({ ...project, files: [...project.files, { path: "MAIN.tex", content: "duplicate" }] })).toThrow();
});
it("supports multiple source files and binary assets without altering their content", () => {
  const project = newLatexProject();
  const next = validateLatexProject({ ...project, files: [...project.files, { path: "sections/intro.tex", content: "Hello \\LaTeX" }, { path: "image.png", content: "aGVsbG8=", binary: true }] });
  expect(next.files[1].content).toBe("Hello \\LaTeX");
  expect(next.files[2].content).toBe("aGVsbG8=");
});
it("limits project size and file count", () => {
  expect(() => validateLatexProject({ ...newLatexProject(), files: [{ path: "main.tex", content: "x".repeat(12 * 1024 * 1024 + 1) }] })).toThrow("12 MB");
  expect(() => validateLatexProject({ ...newLatexProject(), files: Array.from({ length: 101 }, (_, index) => ({ path: `${index}.tex`, content: "" })) })).toThrow("100");
});
it("builds an outline with source offsets and ignores commented commands", () => {
  const source = "% \\section{Hidden}\n\\section{First}\nText\n\\subsection*{Details}";
  const outline = latexOutline(source);
  expect(outline.map(item => item.title)).toEqual(["First", "Details"]);
  expect(source.slice(outline[0].offset).trimStart()).toContain("\\section{First}");
});
it("provides complete editable LaTeX templates", () => {
  for (const key of Object.keys(LATEX_TEMPLATES)) {
    const project = validateLatexProject(newLatexProject(key));
    expect(project.files[0].content).toContain("\\begin{document}");
    expect(project.files[0].content).toContain("\\end{document}");
  }
});
