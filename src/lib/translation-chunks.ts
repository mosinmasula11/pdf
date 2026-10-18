export function translationChunks(text: string, maximumBytes = 400) {
  const chunks: string[] = [];
  const encoder = new TextEncoder();
  let chunk = "", size = 0;
  for (const character of text) {
    const bytes = encoder.encode(character).length;
    if (size + bytes > maximumBytes && chunk) { chunks.push(chunk); chunk = ""; size = 0; }
    chunk += character; size += bytes;
  }
  if (chunk) chunks.push(chunk);
  return chunks;
}
