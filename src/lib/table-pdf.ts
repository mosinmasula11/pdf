import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function tableToPdf(rows: string[][], title: string) {
  const document = await PDFDocument.create();
  const font = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  const wrap = (text: string, width: number) => {
    const lines: string[] = [];
    for (const paragraph of text.split(/\r?\n/)) {
      let line = "";
      for (const character of paragraph) {
        if (line && font.widthOfTextAtSize(line + character, 9) > width) { lines.push(line); line = ""; }
        line += character;
      }
      lines.push(line);
    }
    return lines;
  };
  const columns = Math.max(1, ...rows.map((row) => row.length));
  for (let start = 0; start < columns; start += 8) {
    const count = Math.min(8, columns - start), cellWidth = 760 / count;
    const headers = Array.from({ length: count }, (_, column) => wrap(rows[0]?.[start + column] || `Column ${start + column + 1}`, cellWidth - 12));
    const headerHeight = Math.max(...headers.map((cell) => cell.length)) * 12 + 12;
    if (headerHeight > 200) throw new Error("A column heading is too long. Shorten the heading before exporting.");
    let page = document.addPage([841.89, 595.28]), y = 520;
    const heading = () => {
      page.drawText(`${title} — columns ${start + 1}–${start + count}`, { x: 40, y: 555, size: 11, font: bold });
      page.drawRectangle({ x: 40, y: y - headerHeight, width: 760, height: headerHeight, color: rgb(0.1, 0.4, 0.25) });
      headers.forEach((lines, column) => lines.forEach((line, index) => page.drawText(line, { x: 46 + column * cellWidth, y: y - 16 - index * 12, size: 9, font: bold, color: rgb(1, 1, 1) })));
      y -= headerHeight;
    };
    heading();
    for (let index = 1; index < rows.length; index++) {
      const cells = Array.from({ length: count }, (_, column) => wrap(rows[index][start + column] || "", cellWidth - 12));
      const lineCount = Math.max(...cells.map((cell) => cell.length));
      let offset = 0;
      while (offset < lineCount) {
        let available = Math.floor((y - 40 - 12) / 12);
        if (available < 1) { page = document.addPage([841.89, 595.28]); y = 550; heading(); available = Math.floor((y - 52) / 12); }
        const lines = Math.min(available, lineCount - offset), height = lines * 12 + 12;
        page.drawRectangle({ x: 40, y: y - height, width: 760, height, color: index % 2 ? rgb(0.97, 0.98, 0.99) : rgb(1, 1, 1), borderWidth: 0.3, borderColor: rgb(0.8, 0.8, 0.8) });
        cells.forEach((cell, column) => cell.slice(offset, offset + lines).forEach((line, lineIndex) => page.drawText(line, { x: 46 + column * cellWidth, y: y - 16 - lineIndex * 12, size: 9, font })));
        y -= height; offset += lines;
      }
    }
  }
  return document.save();
}
