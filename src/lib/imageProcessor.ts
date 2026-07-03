/**
 * Client-side tile image processor — "AI-Enhanced" pipeline:
 *
 * 1. Auto-crop to square (intelligent center crop)
 * 2. Resize to target resolution (800×800)
 * 3. Unsharp-mask sharpening pass
 * 4. Contrast & saturation boost
 * 5. Export as optimised JPEG
 */

const TARGET = 800; // px — output square dimension

/** Load an image file into an HTMLImageElement. */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Apply a 3×3 unsharp-mask to sharpen the image.
 * This simulates the enhancement step of "AI upscaling".
 */
function sharpen(ctx: CanvasRenderingContext2D, w: number, h: number, amount = 0.35) {
  const imageData = ctx.getImageData(0, 0, w, h);
  const { data } = imageData;
  const copy = new Uint8ClampedArray(data);

  // Simple 3×3 unsharp kernel
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = (y * w + x) * 4;
      for (let c = 0; c < 3; c++) {
        const center = copy[i + c];
        const blur =
          (copy[i - 4 + c] +
            copy[i + 4 + c] +
            copy[i - w * 4 + c] +
            copy[i + w * 4 + c] +
            copy[i - w * 4 - 4 + c] +
            copy[i - w * 4 + 4 + c] +
            copy[i + w * 4 - 4 + c] +
            copy[i + w * 4 + 4 + c]) /
          8;
        data[i + c] = Math.min(255, Math.max(0, center + amount * (center - blur)));
      }
    }
  }
  ctx.putImageData(imageData, 0, 0);
}

/** Boost contrast & saturation slightly for a punchier tile photo. */
function enhance(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const imageData = ctx.getImageData(0, 0, w, h);
  const { data } = imageData;
  const contrast = 1.08;
  const saturation = 1.12;

  for (let i = 0; i < data.length; i += 4) {
    // Contrast
    data[i] = Math.min(255, Math.max(0, (data[i] - 128) * contrast + 128));
    data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * contrast + 128));
    data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * contrast + 128));

    // Saturation (simple approach via luminance)
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    data[i] = Math.min(255, Math.max(0, lum + saturation * (data[i] - lum)));
    data[i + 1] = Math.min(255, Math.max(0, lum + saturation * (data[i + 1] - lum)));
    data[i + 2] = Math.min(255, Math.max(0, lum + saturation * (data[i + 2] - lum)));
  }
  ctx.putImageData(imageData, 0, 0);
}

export interface ProcessResult {
  /** Object URL of the processed image for preview. */
  previewUrl: string;
  /** The processed image as a Blob. */
  blob: Blob;
  /** Suggested filename (kebab-case). */
  filename: string;
}

/**
 * Process a raw tile photo into a website-ready square image.
 * The pipeline: load → smart-crop to square → resize to 800×800 → sharpen → enhance → export JPEG.
 */
export async function processTileImage(
  file: File,
  tileName?: string,
): Promise<ProcessResult> {
  const img = await loadImage(file);
  const { naturalWidth: nw, naturalHeight: nh } = img;

  // Smart square crop — use center of the longer axis
  const side = Math.min(nw, nh);
  const sx = Math.floor((nw - side) / 2);
  const sy = Math.floor((nh - side) / 2);

  // Create output canvas
  const canvas = document.createElement("canvas");
  canvas.width = TARGET;
  canvas.height = TARGET;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;

  // High-quality rendering
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Draw cropped & resized
  ctx.drawImage(img, sx, sy, side, side, 0, 0, TARGET, TARGET);

  // AI enhancement pipeline
  sharpen(ctx, TARGET, TARGET, 0.4);
  enhance(ctx, TARGET, TARGET);
  // Second subtle sharpen pass for extra crispness
  sharpen(ctx, TARGET, TARGET, 0.2);

  // Free the object URL
  URL.revokeObjectURL(img.src);

  // Export as JPEG blob
  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.92);
  });

  // Suggested filename
  const slug = (tileName || file.name.replace(/\.[^.]+$/, ""))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const filename = `${slug}.jpg`;

  return {
    previewUrl: URL.createObjectURL(blob),
    blob,
    filename,
  };
}
