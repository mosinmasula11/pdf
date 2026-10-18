/**
 * Microsoft ICO file format generator.
 * Encodes multi-resolution icons into a single standard .ico binary file
 * using PNG-compressed frames (Windows Vista+ / Modern Web Standard).
 */

export interface IconFrame {
  width: number;
  height: number;
  pngBytes: Uint8Array;
}

export function buildIcoFile(frames: IconFrame[]): Blob {
  if (!frames.length) {
    throw new Error("At least one icon resolution frame is required.");
  }

  const count = frames.length;
  const headerSize = 6;
  const entrySize = 16;
  const dirSize = headerSize + count * entrySize;

  const totalImageBytes = frames.reduce((acc, f) => acc + f.pngBytes.byteLength, 0);
  const totalFileSize = dirSize + totalImageBytes;

  const buffer = new ArrayBuffer(totalFileSize);
  const view = new DataView(buffer);
  const uint8View = new Uint8Array(buffer);

  // 1. Write ICONDIR Header (6 bytes)
  view.setUint16(0, 0, true); // Reserved, must be 0
  view.setUint16(2, 1, true); // Type: 1 = ICO
  view.setUint16(4, count, true); // Count of images

  // 2. Write ICONDIRENTRY descriptors and copy image bytes
  let currentOffset = dirSize;

  frames.forEach((frame, index) => {
    const entryOffset = headerSize + index * entrySize;
    const widthByte = frame.width >= 256 ? 0 : frame.width;
    const heightByte = frame.height >= 256 ? 0 : frame.height;
    const bytesCount = frame.pngBytes.byteLength;

    view.setUint8(entryOffset + 0, widthByte); // Width (0 means 256)
    view.setUint8(entryOffset + 1, heightByte); // Height (0 means 256)
    view.setUint8(entryOffset + 2, 0); // Color count (0 = no palette or >= 256 colors)
    view.setUint8(entryOffset + 3, 0); // Reserved, must be 0
    view.setUint16(entryOffset + 4, 1, true); // Color planes (1)
    view.setUint16(entryOffset + 6, 32, true); // Bits per pixel (32 bpp ARGB)
    view.setUint32(entryOffset + 8, bytesCount, true); // Size of image data in bytes
    view.setUint32(entryOffset + 12, currentOffset, true); // Offset of image data

    // Copy PNG bytes into the buffer
    uint8View.set(frame.pngBytes, currentOffset);
    currentOffset += bytesCount;
  });

  return new Blob([buffer], { type: "image/x-icon" });
}

export async function canvasToPngBytes(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => {
      if (b) resolve(b);
      else reject(new Error("Failed to render canvas to PNG."));
    }, "image/png");
  });

  const arrayBuffer = await blob.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

export function renderToSquareCanvas(
  image: HTMLImageElement | ImageBitmap,
  size: number,
  fitMode: "contain" | "cover" | "stretch" = "contain",
  backgroundColor?: string
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not initialize 2D canvas.");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  if (backgroundColor && backgroundColor !== "transparent") {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, size, size);
  }

  const srcW = image.width || size;
  const srcH = image.height || size;

  if (fitMode === "stretch") {
    ctx.drawImage(image, 0, 0, size, size);
  } else if (fitMode === "cover") {
    const scale = Math.max(size / srcW, size / srcH);
    const drawW = srcW * scale;
    const drawH = srcH * scale;
    const dx = (size - drawW) / 2;
    const dy = (size - drawH) / 2;
    ctx.drawImage(image, dx, dy, drawW, drawH);
  } else {
    // "contain"
    const scale = Math.min(size / srcW, size / srcH);
    const drawW = srcW * scale;
    const drawH = srcH * scale;
    const dx = (size - drawW) / 2;
    const dy = (size - drawH) / 2;
    ctx.drawImage(image, dx, dy, drawW, drawH);
  }

  return canvas;
}

