/**
 * Downscales an image file in the browser before upload so creators don't ship
 * multi-megabyte originals that are later shown as small thumbnails.
 * Returns a data URL (WebP when supported, otherwise JPEG/PNG). Falls back to the
 * original file when decoding fails or the original is already smaller.
 */
export async function resizeImageToDataUrl(file: File, maxSize: number, quality = 0.86): Promise<string> {
  const original = await readAsDataUrl(file);
  try {
    const img = await loadImage(original);
    const scale = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight));
    const width = Math.max(1, Math.round(img.naturalWidth * scale));
    const height = Math.max(1, Math.round(img.naturalHeight * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return original;
    ctx.drawImage(img, 0, 0, width, height);

    const webp = canvas.toDataURL("image/webp", quality);
    const resized = webp.startsWith("data:image/webp")
      ? webp
      : canvas.toDataURL(file.type === "image/png" ? "image/png" : "image/jpeg", quality);
    return resized.length < original.length ? resized : original;
  } catch {
    return original;
  }
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
