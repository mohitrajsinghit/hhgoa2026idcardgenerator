export async function loadImageFile(file: File): Promise<HTMLImageElement> {
  const isHeic =
    /\.hei[cf]$/i.test(file.name) ||
    file.type === "image/heic" ||
    file.type === "image/heif";

  let blob: Blob = file;

  if (isHeic) {
    const heic2any = (await import("heic2any")).default;
    const converted = await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: 0.92,
    });
    blob = Array.isArray(converted) ? converted[0] : converted;
  }

  const url = URL.createObjectURL(blob);

  // Bug #16: Do NOT revoke the object URL with a heuristic timer.
  // The HTMLImageElement stored in React state uses this URL as its src; if the
  // browser needs to re-decode the image (e.g. under memory pressure) after the
  // URL is revoked, decoding will silently fail. Because we hold at most one
  // photo at a time (replaced on next upload), the memory impact is negligible.
  // The browser will release the underlying blob when the page unloads.
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Could not read that image file."));
    el.src = url;
  });

  return img;
}

