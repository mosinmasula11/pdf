export interface LatexFile { path: string; content: string; binary?: boolean }
export interface LatexProject { name: string; main: string; files: LatexFile[] }
export const LATEX_LIMIT = 12 * 1024 * 1024;
export function validLatexPath(path: string) {
  return path.length > 0 && path.length <= 160 && !path.startsWith("/") && !path.includes("\\")
    && path.split("/").every(part => part !== "." && part !== ".." && /^[\w .-]+$/.test(part))
    && /\.(tex|bib|sty|cls|bst|txt|png|jpe?g|pdf)$/i.test(path);
}
export function validateLatexProject(value: unknown): LatexProject {
  if (!value || typeof value !== "object") throw new Error("Choose a valid LaTeX project.");
  const project = value as LatexProject;
  if (typeof project.name !== "string" || !Array.isArray(project.files) || !project.files.length || project.files.length > 100) throw new Error("Projects need 1–100 files.");
  const seen = new Set<string>(); let total = 0;
  for (const file of project.files) {
    if (!file || !validLatexPath(file.path) || typeof file.content !== "string" || seen.has(file.path.toLowerCase())) throw new Error("Use unique, relative project filenames such as main.tex or images/chart.png.");
    if (file.binary && !/^[A-Za-z0-9+/]*={0,2}$/.test(file.content)) throw new Error("Invalid project asset.");
    seen.add(file.path.toLowerCase()); total += new TextEncoder().encode(file.content).length;
  }
  if (total > LATEX_LIMIT) throw new Error("Keep the project smaller than 12 MB.");
  if (!project.files.some(file => file.path === project.main && !file.binary && /\.tex$/i.test(file.path))) throw new Error("Select an existing .tex file as the main document.");
  return { name: project.name.slice(0, 100), main: project.main, files: project.files.map(file => ({ path: file.path, content: file.content, binary: !!file.binary })) };
}
export const LATEX_TEMPLATES: Record<string, { label: string; source: string }> = {
  article: { label: "Article", source: String.raw`\documentclass[11pt,a4paper]{article}
\usepackage[margin=1in]{geometry}
\usepackage{amsmath,amssymb}
\usepackage{graphicx}
\usepackage{hyperref}
\title{A new idea starts here}
\author{Your name}
\date{\today}

\begin{document}
\maketitle

\begin{abstract}
A short summary of your work. Write, explore, and turn your ideas into a beautifully typeset document.
\end{abstract}

\section{Introduction}
Welcome to your LaTeX workspace. Edit the source on the left and click \textbf{Recompile} to see your changes.

\section{A little mathematics}
The quadratic formula is
\begin{equation}
  x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}.
\end{equation}

\subsection{Your next steps}
\begin{itemize}
  \item Add sections and organize your ideas.
  \item Upload images or include other \texttt{.tex} files.
  \item Download your PDF or the complete source project.
\end{itemize}

\section{Conclusion}
Something worth sharing.
\end{document}
` },
  report: { label: "Report", source: String.raw`\documentclass[11pt,a4paper]{report}
\usepackage[margin=1in]{geometry}
\usepackage{amsmath,graphicx}
\title{Project report}
\author{Your name}
\date{\today}
\begin{document}
\maketitle
\tableofcontents
\chapter{Introduction}
Describe the purpose of your project.
\section{Background}
Add context and related work here.
\chapter{Results}
Present your findings.
\chapter{Conclusion}
Summarize your work and future directions.
\end{document}
` },
  letter: { label: "Letter", source: String.raw`\documentclass[11pt]{letter}
\usepackage[margin=1in]{geometry}
\signature{Your name}
\address{Your address\\Your city}
\begin{document}
\begin{letter}{Recipient\\Their address}
\opening{Dear recipient,}
Write your letter here.
\closing{Sincerely,}
\end{letter}
\end{document}
` },
  blank: { label: "Blank document", source: String.raw`\documentclass{article}
\begin{document}
Hello, world!
\end{document}
` },
};
export function newLatexProject(template = "article"): LatexProject {
  return { name: "Untitled project", main: "main.tex", files: [{ path: "main.tex", content: (LATEX_TEMPLATES[template] || LATEX_TEMPLATES.article).source }] };
}
export function latexOutline(source: string) {
  return Array.from(source.matchAll(/^\s*\\(chapter|section|subsection|subsubsection)\*?(?:\[[^\]]*\])?\{([^}]+)\}/gm), match => ({ title: match[2], level: match[1], offset: match.index || 0 }));
}
