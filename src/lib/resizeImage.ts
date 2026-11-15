/** Scales an image down (phone photos are several MB) and re-encodes it as JPEG, honoring EXIF rotation. */
export async function resizeImage(file: File, maxDim = 1200, quality = 0.82): Promise<Blob> {
  const source = await loadSource(file);
  const scale = Math.min(1, maxDim / Math.max(source.width, source.height));
  const width = Math.max(1, Math.round(source.width * scale));
  const height = Math.max(1, Math.round(source.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error("This browser can't process photos.");
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(source, 0, 0, width, height);
  if ('close' in source) source.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Couldn't process that photo."))),
      'image/jpeg',
      quality,
    );
  });
}

async function loadSource(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      /* fall back to an <img> element below */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } catch {
    throw new Error("Couldn't read that photo. Try a JPEG or PNG.");
  } finally {
    URL.revokeObjectURL(url);
  }
}
