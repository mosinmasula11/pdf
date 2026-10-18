export function parseDelimitedText(text: string, separator = ",") {
  const rows: string[][] = [];
  let row: string[] = [], value = "", quoted = false;
  const finishRow = () => { row.push(value); if (row.some((cell) => cell.length)) rows.push(row); row = []; value = ""; };
  for (let index = 0; index < text.length; index++) {
    const character = text[index];
    if (character === '"') {
      if (quoted && text[index + 1] === '"') { value += '"'; index++; }
      else if (quoted || value === "") quoted = !quoted;
      else value += character;
    } else if (!quoted && character === separator) { row.push(value); value = ""; }
    else if (!quoted && (character === "\r" || character === "\n")) {
      if (character === "\r" && text[index + 1] === "\n") index++;
      finishRow();
    } else value += character;
  }
  if (quoted) throw new Error("The table contains an unclosed quoted value.");
  if (row.length || value) finishRow();
  return rows;
}

export function spreadsheetColumn(reference: string) {
  const letters = reference.match(/^[A-Za-z]+/)?.[0] || "A";
  return [...letters.toUpperCase()].reduce((column, letter) => column * 26 + letter.charCodeAt(0) - 64, 0) - 1;
}
