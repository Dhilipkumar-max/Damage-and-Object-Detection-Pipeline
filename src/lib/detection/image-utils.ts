/**
 * Client-side image utilities for the Damage & Object Detection Pipeline.
 */

/**
 * Reads a File / Blob as a JPEG data URL, downscaled to maxEdge.
 * Returns { dataUrl, width, height }.
 */
export async function fileToCompressedDataUrl(
  file: File | Blob,
  maxEdge = 1024,
  quality = 0.85,
): Promise<{ dataUrl: string; width: number; height: number }> {
  const bitmap = await fileToBitmap(file);
  const { width, height } = bitmap;
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  const targetW = Math.round(width * scale);
  const targetH = Math.round(height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  ctx.drawImage(bitmap, 0, 0, targetW, targetH);
  bitmap.close?.();
  const dataUrl = canvas.toDataURL("image/jpeg", quality);
  return { dataUrl, width: targetW, height: targetH };
}

async function fileToBitmap(file: File | Blob): Promise<ImageBitmap> {
  if ("createImageBitmap" in self) {
    try {
      return await createImageBitmap(file);
    } catch {
      // fall through to HTMLImageElement path
    }
  }
  // Fallback for browsers without createImageBitmap.
  const url = URL.createObjectURL(file);
  try {
    const img = await loadHtmlImage(url);
    return {
      width: img.naturalWidth,
      height: img.naturalHeight,
      close() {},
      // Minimal ImageBitmap-like shim
    } as unknown as ImageBitmap;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadHtmlImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = url;
  });
}

/**
 * Formats milliseconds as a human-readable string.
 */
export function formatMs(ms: number): string {
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

/**
 * Formats an ISO date string into a short relative-time string.
 */
export function formatRelative(iso: string): string {
  const d = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - d);
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

/**
 * Draws detection bounding boxes on a canvas overlaying an image.
 * The canvas is sized in CSS pixels; we set width/height attributes for crispness.
 */
export function drawDetections(
  canvas: HTMLCanvasElement,
  imgWidth: number,
  imgHeight: number,
  detections: import("@/lib/detection/types").Detection[],
  options: {
    showLabels?: boolean;
    selectedId?: string | null;
  } = {},
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  // Use the displayed canvas size; assume the canvas has already been sized by the caller.
  const cssW = canvas.clientWidth;
  const cssH = canvas.clientHeight;
  if (cssW === 0 || cssH === 0) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);

  // Fit the image into the canvas preserving aspect ratio (letterbox).
  const imgAspect = imgWidth / imgHeight;
  const canvasAspect = cssW / cssH;
  let drawW: number;
  let drawH: number;
  let offsetX: number;
  let offsetY: number;
  if (imgAspect > canvasAspect) {
    drawW = cssW;
    drawH = cssW / imgAspect;
    offsetX = 0;
    offsetY = (cssH - drawH) / 2;
  } else {
    drawH = cssH;
    drawW = cssH * imgAspect;
    offsetX = (cssW - drawW) / 2;
    offsetY = 0;
  }

  for (const det of detections) {
    const x = offsetX + det.bbox.x * drawW;
    const y = offsetY + det.bbox.y * drawH;
    const w = det.bbox.w * drawW;
    const h = det.bbox.h * drawH;
    const isDamage = det.category === "damage";
    const color = isDamage ? "#ef4444" : "#10b981";
    const isSelected = options.selectedId === det.id;
    const lineWidth = isSelected ? 4 : 2.5;
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = color;
    if (isSelected) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
    } else {
      ctx.shadowBlur = 0;
    }
    ctx.strokeRect(x, y, w, h);

    // Label background
    if (options.showLabels !== false) {
      const label = `${det.displayName} ${(det.confidence * 100).toFixed(0)}%`;
      ctx.font = "600 12px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";
      const metrics = ctx.measureText(label);
      const padX = 6;
      const padY = 3;
      const labelW = metrics.width + padX * 2;
      const labelH = 18;
      let labelY = y - labelH - 2;
      if (labelY < 0) labelY = y + 2;
      ctx.fillStyle = color;
      ctx.shadowBlur = 0;
      ctx.fillRect(x, labelY, labelW, labelH);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(label, x + padX, labelY + labelH - padY - 1);
    }
  }
  ctx.shadowBlur = 0;
}
