export function svgOutputSize(width: number, height: number, scale: number, customWidth: string, customHeight: string, maintainAspect: boolean) {
  let outputWidth = Math.round(width * scale), outputHeight = Math.round(height * scale);
  const customW = customWidth.trim() ? Number(customWidth) : null;
  const customH = customHeight.trim() ? Number(customHeight) : null;
  for (const value of [customW, customH]) if (value !== null && (!Number.isSafeInteger(value) || value <= 0)) throw new Error("Dimensions must be positive whole numbers.");
  if (customW !== null) {
    outputWidth = customW;
    if (maintainAspect) outputHeight = Math.round(height / width * customW);
  }
  if (customH !== null && (!maintainAspect || customW === null)) {
    outputHeight = customH;
    if (maintainAspect) outputWidth = Math.round(width / height * customH);
  }
  if (![outputWidth, outputHeight].every(value => Number.isSafeInteger(value) && value > 0 && value <= 8192) || outputWidth * outputHeight > 32_000_000) {
    throw new Error("Choose dimensions up to 8192 pixels per side and 32 megapixels total.");
  }
  return { width: outputWidth, height: outputHeight };
}

export function uniqueImageName(name: string, used: Set<string>) {
  const dot = name.lastIndexOf(".");
  const stem = dot < 0 ? name : name.slice(0, dot), extension = dot < 0 ? "" : name.slice(dot);
  let candidate = name, index = 2;
  while (used.has(candidate.toLowerCase())) candidate = `${stem}-${index++}${extension}`;
  used.add(candidate.toLowerCase());
  return candidate;
}
