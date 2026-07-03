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
 * Advanced AI-like filter to remove lighting gradients, shadows, and reflections.
 * It builds a low-frequency light map and normalises the image against it.
 */
function flattenLighting(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // 1. Generate 16x16 light map (averages out the tile texture)
  const mapSize = 16;
  const mapCanvas = document.createElement("canvas");
  mapCanvas.width = mapSize;
  mapCanvas.height = mapSize;
  const mapCtx = mapCanvas.getContext("2d", { willReadFrequently: true })!;
  mapCtx.drawImage(ctx.canvas, 0, 0, mapSize, mapSize);

  // 2. Scale back up to target size (bilinear blur creates a smooth illumination map)
  const blurCanvas = document.createElement("canvas");
  blurCanvas.width = w;
  blurCanvas.height = h;
  const blurCtx = blurCanvas.getContext("2d", { willReadFrequently: true })!;
  blurCtx.imageSmoothingEnabled = true;
  blurCtx.imageSmoothingQuality = "high";
  blurCtx.drawImage(mapCanvas, 0, 0, w, h);

  // 3. Process pixels
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  const mapData = blurCtx.getImageData(0, 0, w, h).data;
  
  // Calculate global average colour
  let sumR = 0, sumG = 0, sumB = 0;
  for (let i = 0; i < data.length; i += 4) {
    sumR += data[i];
    sumG += data[i+1];
    sumB += data[i+2];
  }
  const pixels = w * h;
  const meanR = sumR / pixels;
  const meanG = sumG / pixels;
  const meanB = sumB / pixels;

  const strength = 0.90; // High flattening strength to match edges
  
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i], g = data[i+1], b = data[i+2];
    let lr = mapData[i], lg = mapData[i+1], lb = mapData[i+2];
    
    // Prevent division by zero
    lr = Math.max(5, lr);
    lg = Math.max(5, lg);
    lb = Math.max(5, lb);

    // Hard highlight / reflection suppression
    // If a pixel is extremely bright and has low saturation, it's glare from a light
    const maxVal = Math.max(r, g, b);
    const minVal = Math.min(r, g, b);
    const saturation = maxVal === 0 ? 0 : (maxVal - minVal) / maxVal;
    
    if (maxVal > 190 && saturation < 0.15) {
      // Suppress glare by aggressively pulling it towards the local tile colour
      const glareAmount = Math.min(1, (maxVal - 190) / 65); // 0 to 1
      r = r * (1 - glareAmount) + lr * glareAmount;
      g = g * (1 - glareAmount) + lg * glareAmount;
      b = b * (1 - glareAmount) + lb * glareAmount;
    }

    // Shading correction: multiply pixel by the ratio of global average to local light
    // This perfectly evens out vignettes, shadows, and broad glare.
    const targetR = r * (meanR / lr);
    const targetG = g * (meanG / lg);
    const targetB = b * (meanB / lb);
    
    data[i] = Math.min(255, Math.max(0, r * (1 - strength) + targetR * strength));
    data[i+1] = Math.min(255, Math.max(0, g * (1 - strength) + targetG * strength));
    data[i+2] = Math.min(255, Math.max(0, b * (1 - strength) + targetB * strength));
  }
  
  ctx.putImageData(imageData, 0, 0);
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
  flattenLighting(ctx, TARGET, TARGET); // removes reflections & evens out edges
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
