// Portrait Builder Pass — 800×1120 (5:7 ratio)
// Matches the HH Goa 2026 sample ID card format.
export const CARD_W = 800;
export const CARD_H = 1120;

// Circular photo — centered horizontally, in the upper-middle of the card.
export const PHOTO_CX = CARD_W / 2;    // 400
export const PHOTO_CY = 455;            // vertical center of photo
export const PHOTO_R = 150;             // radius of the circle crop

// Square bounding box for pan/zoom calculations (photoTransform math stays unchanged).
export const PHOTO_W = PHOTO_R * 2;    // 300
export const PHOTO_H = PHOTO_R * 2;    // 300
export const PHOTO_X = PHOTO_CX - PHOTO_R;  // 250
export const PHOTO_Y = PHOTO_CY - PHOTO_R;  // 305

export const PHOTO_RADIUS = PHOTO_R;   // kept for compatibility

// Legacy alias (no longer used for frame-split but kept so any import doesn't break)
export const STUB_W = 0;
export const PERF_X = 0;

export const PHOTO_ASPECT = PHOTO_W / PHOTO_H;
