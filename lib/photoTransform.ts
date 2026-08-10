// All pan values are stored as *fractions of the box width/height*, not pixels.
// That makes them resolution-independent: the same state drives a small CSS
// preview and the full-resolution canvas export with pixel-identical framing.

export type PhotoTransform = {
  zoom: number; // 1 = tight cover fit, up to MAX_ZOOM
  panXFrac: number; // -1..1ish, clamped per current zoom
  panYFrac: number;
};

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 3;

export function defaultTransform(): PhotoTransform {
  return { zoom: 1, panXFrac: 0, panYFrac: 0 };
}

/** "Cover" scale: smallest scale where the image fully covers the box. */
export function coverScale(
  naturalW: number,
  naturalH: number,
  boxW: number,
  boxH: number
) {
  return Math.max(boxW / naturalW, boxH / naturalH);
}

/**
 * Given a natural image size, a box size (in ANY consistent unit — css px or
 * canvas px, doesn't matter as long as boxW/boxH share the aspect ratio used
 * when the transform was authored), and a transform, return the max pan
 * range (in that same unit) and the clamped pan.
 */
export function resolvePan(
  naturalW: number,
  naturalH: number,
  boxW: number,
  boxH: number,
  t: PhotoTransform
) {
  const base = coverScale(naturalW, naturalH, boxW, boxH);
  const scale = base * t.zoom;
  const displayedW = naturalW * scale;
  const displayedH = naturalH * scale;
  const maxOffsetX = Math.max(0, (displayedW - boxW) / 2);
  const maxOffsetY = Math.max(0, (displayedH - boxH) / 2);

  const rawX = t.panXFrac * boxW;
  const rawY = t.panYFrac * boxH;
  const offsetX = clamp(rawX, -maxOffsetX, maxOffsetX);
  const offsetY = clamp(rawY, -maxOffsetY, maxOffsetY);

  return { scale, displayedW, displayedH, offsetX, offsetY, maxOffsetX, maxOffsetY };
}

export function clampTransform(
  naturalW: number,
  naturalH: number,
  boxW: number,
  boxH: number,
  t: PhotoTransform
): PhotoTransform {
  const zoom = clamp(t.zoom, MIN_ZOOM, MAX_ZOOM);
  const resolved = resolvePan(naturalW, naturalH, boxW, boxH, { ...t, zoom });
  return {
    zoom,
    panXFrac: resolved.maxOffsetX === 0 ? 0 : resolved.offsetX / boxW,
    panYFrac: resolved.maxOffsetY === 0 ? 0 : resolved.offsetY / boxH,
  };
}

export function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}
