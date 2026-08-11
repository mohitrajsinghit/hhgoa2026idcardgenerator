import { COLORS } from "./theme";
import {
  CARD_W, CARD_H,
  PHOTO_CX, PHOTO_CY, PHOTO_R,
  PHOTO_W, PHOTO_H, PHOTO_X, PHOTO_Y,
} from "./cardLayout";
import { PhotoTransform, resolvePan } from "./photoTransform";
import type { BeachItem } from "./titles";

export type CardFonts = {
  display: string;   // e.g. '"Syne", sans-serif'
  mono: string;      // e.g. '"JetBrains Mono", monospace'
  body: string;      // e.g. '"Inter", sans-serif'
};

export type CardData = {
  photoImg: HTMLImageElement;
  transform: PhotoTransform;
  name: string;
  handle: string;        // @twitter handle (optional)
  stack: string;         // role/tech stack
  title: string;         // builder class title (generated)
  shipping: string;      // "currently shipping" text
  beachBag: BeachItem[]; // 3 beach bag items
  entryNo: string;
  fonts: CardFonts;
};

// ─────────────────────────────────────────────
// Small helpers
// ─────────────────────────────────────────────

let rightSealImgCache: HTMLImageElement | null = null;

function getRightSealImg(
  ctx?: CanvasRenderingContext2D,
  sealX?: number,
  sealY?: number,
  sealW?: number,
  sealH?: number
): HTMLImageElement | null {
  if (typeof window === "undefined") return null;
  if (!rightSealImgCache) {
    const img = new Image();
    img.src = "/179-vector-54-30944.svg";
    img.onload = () => {
      rightSealImgCache = img;
      if (ctx && sealX !== undefined && sealY !== undefined && sealW && sealH) {
        ctx.drawImage(img, sealX, sealY, sealW, sealH);
      }
    };
    rightSealImgCache = img;
  }
  return rightSealImgCache;
}

function pill(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  const rad = Math.min(r, h / 2, w / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.arcTo(x + w, y, x + w, y + rad, rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.arcTo(x + w, y + h, x + w - rad, y + h, rad);
  ctx.lineTo(x + rad, y + h);
  ctx.arcTo(x, y + h, x, y + h - rad, rad);
  ctx.lineTo(x, y + rad);
  ctx.arcTo(x, y, x + rad, y, rad);
  ctx.closePath();
}

function sparkle(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.translate(cx, cy);
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    const r = i % 2 === 0 ? size : size * 0.38;
    if (i === 0) ctx.moveTo(r * Math.cos(angle), r * Math.sin(angle));
    else ctx.lineTo(r * Math.cos(angle), r * Math.sin(angle));
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function diamond(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy - size);
  ctx.lineTo(cx + size * 0.6, cy);
  ctx.lineTo(cx, cy + size);
  ctx.lineTo(cx - size * 0.6, cy);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function bird(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = size * 0.3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + size, y - size * 0.5, x + size * 2, y);
  ctx.moveTo(x + size * 2, y);
  ctx.quadraticCurveTo(x + size * 3, y - size * 0.5, x + size * 4, y);
  ctx.stroke();
  ctx.restore();
}

function palmTree(
  ctx: CanvasRenderingContext2D,
  baseX: number, baseY: number,
  height: number, lean: number,
  frondScale: number = 1
) {
  ctx.save();
  ctx.strokeStyle = COLORS.forestMid;
  ctx.lineCap = "round";

  // Trunk
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(baseX, baseY);
  ctx.quadraticCurveTo(baseX + lean * 0.4, baseY - height * 0.55, baseX + lean, baseY - height);
  ctx.stroke();

  const topX = baseX + lean;
  const topY = baseY - height;

  // Fronds
  const fronds = [
    { ax: -22, ay: -14, bx: -46, by: -5 },
    { ax: -14, ay: -25, bx: -30, by: -44 },
    { ax: -3,  ay: -28, bx:   3, by: -52 },
    { ax: 13,  ay: -24, bx:  34, by: -42 },
    { ax: 21,  ay: -11, bx:  46, by: -3 },
    { ax: 16,  ay: 3,   bx:  38, by: 14 },
  ];

  for (const f of fronds) {
    const bx = f.bx * frondScale;
    const by = f.by * frondScale;
    const ax = f.ax * frondScale;
    const ay = f.ay * frondScale;
    const w = 7 - Math.abs(bx) * 0.05;
    ctx.lineWidth = Math.max(2.5, w);
    ctx.strokeStyle = COLORS.forestLight;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(topX + ax, topY + ay, topX + bx, topY + by);
    ctx.stroke();
  }

  ctx.restore();
}

function arrowSign(
  ctx: CanvasRenderingContext2D,
  label: string,
  x: number, y: number,
  w: number, h: number,
  bgColor: string, textColor: string,
  fonts: CardFonts, pointRight: boolean = true
) {
  const tip = h * 0.5;
  ctx.beginPath();
  if (pointRight) {
    ctx.moveTo(x, y);
    ctx.lineTo(x + w - tip, y);
    ctx.lineTo(x + w, y + h / 2);
    ctx.lineTo(x + w - tip, y + h);
    ctx.lineTo(x, y + h);
  } else {
    ctx.moveTo(x + tip, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x + tip, y + h);
    ctx.lineTo(x, y + h / 2);
  }
  ctx.closePath();
  ctx.fillStyle = bgColor;
  ctx.fill();

  ctx.fillStyle = textColor;
  ctx.font = `700 11px ${fonts.mono}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x + w / 2, y + h / 2);
}

function goaHouse(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // Main body — pink
  ctx.fillStyle = "#e84d8a";
  ctx.fillRect(0, 30, 100, 75);

  // Roof — dark forest green
  ctx.fillStyle = COLORS.forestDark;
  ctx.beginPath();
  ctx.moveTo(-8, 30);
  ctx.lineTo(50, -8);
  ctx.lineTo(108, 30);
  ctx.closePath();
  ctx.fill();

  // Roof ridge detail
  ctx.fillStyle = COLORS.yellow;
  ctx.fillRect(42, -10, 16, 6);

  // Door — dark green
  ctx.fillStyle = COLORS.forestDark;
  ctx.fillRect(36, 70, 28, 35);
  // Door arch
  ctx.beginPath();
  ctx.arc(50, 70, 14, Math.PI, 0);
  ctx.fill();

  // Windows — yellow with green grid
  const winData = [[8, 35], [72, 35]];
  for (const [wx, wy] of winData) {
    ctx.fillStyle = COLORS.yellow;
    ctx.fillRect(wx, wy, 22, 22);
    ctx.strokeStyle = COLORS.forestDark;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    // cross
    ctx.moveTo(wx + 11, wy);
    ctx.lineTo(wx + 11, wy + 22);
    ctx.moveTo(wx, wy + 11);
    ctx.lineTo(wx + 22, wy + 11);
    ctx.stroke();
    // border
    ctx.strokeRect(wx, wy, 22, 22);
  }

  // Ground strip
  ctx.fillStyle = COLORS.forestLight;
  ctx.fillRect(-5, 105, 110, 6);

  ctx.restore();
}

function scooter(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = "round";

  // Body
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x + 10, y);
  ctx.quadraticCurveTo(x + 28, y - 18, x + 50, y - 16);
  ctx.lineTo(x + 62, y);
  ctx.stroke();

  // Handlebar
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x + 56, y - 16);
  ctx.lineTo(x + 65, y - 28);
  ctx.stroke();

  // Seat / back
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + 10, y - 2);
  ctx.lineTo(x + 30, y - 10);
  ctx.stroke();

  // Wheels
  [x + 16, x + 58].forEach(wx => {
    ctx.beginPath();
    ctx.arc(wx, y + 8, 11, 0, Math.PI * 2);
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(wx, y + 8, 4, 0, Math.PI * 2);
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  ctx.restore();
}

function qrPlaceholder(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  const cell = size / 10;
  const pat = [
    [1,1,1,1,0,0,1,1,0,1],
    [1,0,0,1,0,1,0,0,1,0],
    [1,0,1,1,0,1,0,1,0,1],
    [1,0,0,1,1,0,0,0,1,0],
    [1,1,1,0,0,1,1,1,0,1],
    [0,0,1,0,1,0,0,1,0,0],
    [1,1,0,1,1,0,1,0,1,1],
    [0,0,1,0,1,0,0,1,0,1],
    [1,0,0,1,0,1,1,0,1,0],
    [1,1,0,0,1,0,0,1,0,1],
  ];
  ctx.fillStyle = COLORS.ink;
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      if (pat[r][c]) {
        ctx.fillRect(x + c * cell, y + r * cell, cell - 0.5, cell - 0.5);
      }
    }
  }
}

// ─────────────────────────────────────────────
// Main render function
// ─────────────────────────────────────────────

export function renderCard(ctx: CanvasRenderingContext2D, data: CardData) {
  const { photoImg, transform, name, handle, stack, title, shipping, beachBag, entryNo, fonts } = data;

  ctx.clearRect(0, 0, CARD_W, CARD_H);

  const BRD = 14;       // border thickness
  const IW = CARD_W - BRD * 2;  // inner width
  const IL = BRD;        // inner left
  const IT = BRD;        // inner top

  // ── 1. Outer frame (dark forest green) ──────────────────────────────
  ctx.fillStyle = COLORS.forestDark;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // Cream interior
  ctx.fillStyle = COLORS.cream;
  ctx.fillRect(IL, IT, IW, CARD_H - BRD * 2);

  // ── 2. Top header band (forest green) ───────────────────────────────
  const HDR_H = 118;
  ctx.fillStyle = COLORS.forestMid;
  ctx.fillRect(IL, IT, IW, HDR_H);

  // Yellow rule under header
  ctx.fillStyle = COLORS.yellow;
  ctx.fillRect(IL, IT + HDR_H, IW, 3);

  // ── 2a. Black lanyard cutout slot (top-center) ────────────────────────
  const slotW =90, slotH = 20, slotR = 8;
  const slotX = CARD_W / 2 - slotW / 2;
  const slotY = IT + 10;
  pill(ctx, slotX, slotY, slotW, slotH, slotR);
  ctx.fillStyle = "#000000";
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // ── 2b. "HH GOA 2026" pink badge (brought down below cutout slot) ─────
  const badgeW = 180, badgeH = 38, badgeR = 19;
  const badgeX = CARD_W / 2 - badgeW / 2;
  const badgeY = IT + 54;
  pill(ctx, badgeX, badgeY, badgeW, badgeH, badgeR);
  ctx.fillStyle = COLORS.pink;
  ctx.fill();
  ctx.strokeStyle = COLORS.yellow;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = COLORS.white;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `800 14px ${fonts.mono}`;
  ctx.fillText("HHGOA-2026", CARD_W / 2, badgeY + badgeH / 2);

  // ── 2c. Left stamp — "GOA INDIA" ────────────────────────────────────
  const stX = IL + 22, stY = IT + 14, stW = 80, stH = 88;
  ctx.strokeStyle = COLORS.yellow;
  ctx.lineWidth = 2.5;
  ctx.setLineDash([]);
  ctx.strokeRect(stX, stY, stW, stH);
  ctx.fillStyle = COLORS.yellow;
  ctx.font = `700 11px ${fonts.mono}`;
  ctx.textAlign = "center";
  ctx.fillText("GOA", stX + stW / 2, stY + 18);
  ctx.fillText("INDIA", stX + stW / 2, stY + stH - 10);
  // Palm in stamp
  ctx.font = "24px serif";
  ctx.fillText("🌴", stX + stW / 2, stY + 58);
  // Wavy lines
  ctx.strokeStyle = COLORS.creamBorder;
  ctx.lineWidth = 1;
  [32, 38, 44].forEach(dy => {
    ctx.beginPath();
    for (let xi = 0; xi < 60; xi += 6) {
      const yx = Math.sin((xi / 60) * Math.PI * 2) * 2;
      if (xi === 0) ctx.moveTo(stX + 8 + xi, stY + dy + yx);
      else ctx.lineTo(stX + 8 + xi, stY + dy + yx);
    }
    ctx.stroke();
  });

  // ── 2d. Right vector graphic (179-vector-54-30944.svg) ────────────────
  const rightW = 96, rightH = 84;
  const rightX = IL + IW - rightW - 16;
  const rightY = IT + (HDR_H - rightH) / 2;

  const rightSeal = getRightSealImg(ctx, rightX, rightY, rightW, rightH);
  if (rightSeal && rightSeal.complete && rightSeal.naturalWidth > 0) {
    ctx.drawImage(rightSeal, rightX, rightY, rightW, rightH);
  }

  // ── 3. "HACKER HOUSE गोवा" title ────────────────────────────────────
  const titleY = IT + HDR_H + 4;
  const titleH = 78;

  const displayFontWithFallback = `${fonts.display}, "Noto Sans Devanagari", "Segoe UI", sans-serif`;

  // Dynamically calculate font sizes so the entire title fits comfortably within inner width
  const maxTitleW = IW - 40; // Max 732px
  let baseFontSize = 42;
  let hackerFont = `800 ${baseFontSize}px ${fonts.display}`;
  let goaFont = `800 ${Math.round(baseFontSize * 0.78)}px ${displayFontWithFallback}`;

  ctx.font = hackerFont;
  let hackerW = ctx.measureText("HACKER").width;
  let houseW = ctx.measureText("HOUSE").width;
  ctx.font = goaFont;
  let goaW = ctx.measureText("गोवा").width;
  let gap = Math.round(baseFontSize * 0.22);
  let totalTitleW = hackerW + gap + houseW + gap + goaW;

  while (totalTitleW > maxTitleW && baseFontSize > 20) {
    baseFontSize -= 1;
    hackerFont = `800 ${baseFontSize}px ${fonts.display}`;
    goaFont = `800 ${Math.round(baseFontSize * 0.78)}px ${displayFontWithFallback}`;
    ctx.font = hackerFont;
    hackerW = ctx.measureText("HACKER").width;
    houseW = ctx.measureText("HOUSE").width;
    ctx.font = goaFont;
    goaW = ctx.measureText("गोवा").width;
    gap = Math.round(baseFontSize * 0.22);
    totalTitleW = hackerW + gap + houseW + gap + goaW;
  }

  let tx = (CARD_W - totalTitleW) / 2;
  const titleBaseline = titleY + 44;

  // Draw "HACKER"
  ctx.font = hackerFont;
  ctx.fillStyle = COLORS.forestDark;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("HACKER", tx, titleBaseline);
  tx += hackerW + gap;

  // Draw "HOUSE"
  ctx.font = hackerFont;
  ctx.fillStyle = COLORS.forestDark;
  ctx.fillText("HOUSE", tx, titleBaseline);
  tx += houseW + gap;

  // Draw "गोवा" in hot pink with slight background treatment
  ctx.font = goaFont;
  const goaPillPad = Math.round(baseFontSize * 0.14);
  const goaPillH = Math.round(baseFontSize * 0.95);
  const goaPillY = titleBaseline - Math.round(baseFontSize * 0.82);
  pill(ctx, tx - goaPillPad, goaPillY, goaW + goaPillPad * 2, goaPillH, 8);
  ctx.fillStyle = COLORS.pink;
  ctx.fill();
  ctx.fillStyle = COLORS.yellow;
  ctx.fillText("गोवा", tx, titleBaseline);

  // Sub-badge row
  ctx.font = `600 10.5px ${fonts.mono}`;
  ctx.fillStyle = COLORS.forestMid;
  ctx.textAlign = "center";
  ctx.fillText("GOA, INDIA  ·  28 – 31 OCT 2026  ·  2:47 PM STUDIO", CARD_W / 2, titleY + titleH - 2);

  // ── 4. Pink rule above illustration zone ────────────────────────────
  ctx.fillStyle = COLORS.pink;
  ctx.fillRect(IL, titleY + titleH + 6, IW, 2);

  // ── 5. Illustration zone ─────────────────────────────────────────────
  const illY = titleY + titleH + 12;

  // Left vertical date strip (font 11px, brought down to illY + 205)
  ctx.save();
  ctx.fillStyle = COLORS.forestMid;
  ctx.font = `700 11px ${fonts.mono}`;
  ctx.textAlign = "center";
  ctx.translate(IL + 24, illY + 350);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("28 – 31 OCT 2026", 0, 0);
  ctx.restore();

  // Right vertical "GOA, INDIA" (font 11px, brought down to illY + 195)
  ctx.save();
  ctx.fillStyle = COLORS.pink;
  ctx.font = `700 11px ${fonts.mono}`;
  ctx.textAlign = "center";
  ctx.translate(IL + IW - 24, illY + 350);
  ctx.rotate(Math.PI / 2);
  ctx.fillText("GOA, INDIA", 0, 0);
  ctx.restore();

  // ── 5a. Palm trees (padded 5px outward on left and right) ───────────
  palmTree(ctx, IL + 77, illY + 310, 185, -14, 0.78);
  palmTree(ctx, IL + 105, illY + 320, 145, -8, 0.72);
  palmTree(ctx, IL + IW - 87, illY + 295, 175, 12, 0.74);

  // ── 5b. Signpost (BUILD / SHIP / REPEAT) (padded 5px left) ──────────
  const spX = IL + 49, spY = illY + 80;
  ctx.fillStyle = COLORS.forestDark;
  ctx.fillRect(spX + 34, spY, 5, 155);  // post

  arrowSign(ctx, "BUILD",  spX, spY + 8,  72, 24, COLORS.forestDark, COLORS.cream, fonts);
  arrowSign(ctx, "SHIP",   spX - 4, spY + 44, 80, 24, COLORS.pink, COLORS.white, fonts);
  arrowSign(ctx, "REPEAT", spX - 8, spY + 80, 88, 24, COLORS.yellow, COLORS.forestDark, fonts);

  // Stars scattered
  sparkle(ctx, IL + 150, illY + 52, 9, COLORS.yellow);
  sparkle(ctx, IL + 185, illY + 160, 7, COLORS.pink);
  sparkle(ctx, IL + IW - 160, illY + 44, 9, COLORS.yellow);
  sparkle(ctx, IL + IW - 135, illY + 200, 7, COLORS.pink);
  sparkle(ctx, CARD_W / 2 - 50, illY + 28, 8, COLORS.gold);
  sparkle(ctx, CARD_W / 2 + 60, illY + 36, 6, COLORS.yellow);

  // Diamond dots
  diamond(ctx, IL + 140, illY + 144, 6, COLORS.pink);
  diamond(ctx, IL + IW - 145, illY + 130, 6, COLORS.yellow);

  // Birds
  bird(ctx, IL + 145, illY + 30, 5, COLORS.forestMid);
  bird(ctx, IL + IW - 180, illY + 22, 4, COLORS.forestMid);

  // ── 5c. "LET'S BUILD!" sticker ──────────────────────────────────────
  ctx.save();
  ctx.translate(IL + IW - 95, illY + 82);
  ctx.rotate((12 * Math.PI) / 180);
  pill(ctx, -38, -19, 76, 38, 19);
  ctx.fillStyle = COLORS.yellow;
  ctx.fill();
  ctx.strokeStyle = COLORS.forestDark;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = COLORS.forestDark;
  ctx.font = `800 10px ${fonts.display}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("LET'S", 0, -6);
  ctx.fillText("BUILD!", 0, 6);
  ctx.restore();

  // ── 5d. Goa house + scooter (right side, padded 5px right) ─────────
  goaHouse(ctx, IL + IW - 143, illY + 152, 0.72);
  scooter(ctx, IL + IW - 137, illY + 285, COLORS.pink);

  // ── 6. Circular photo ───────────────────────────────────────────────
  // Outer decorative ring (yellow dashed)
  ctx.save();
  ctx.beginPath();
  ctx.arc(PHOTO_CX, PHOTO_CY, PHOTO_R + 18, 0, Math.PI * 2);
  ctx.strokeStyle = COLORS.yellow;
  ctx.lineWidth = 4;
  ctx.setLineDash([6, 6]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Pink ring
  ctx.beginPath();
  ctx.arc(PHOTO_CX, PHOTO_CY, PHOTO_R + 10, 0, Math.PI * 2);
  ctx.strokeStyle = COLORS.pink;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.restore();

  // Clip and draw photo
  ctx.save();
  ctx.beginPath();
  ctx.arc(PHOTO_CX, PHOTO_CY, PHOTO_R, 0, Math.PI * 2);
  ctx.clip();

  const { displayedW, displayedH, offsetX, offsetY } = resolvePan(
    photoImg.naturalWidth, photoImg.naturalHeight,
    PHOTO_W, PHOTO_H, transform
  );
  ctx.drawImage(
    photoImg,
    PHOTO_X + (PHOTO_W - displayedW) / 2 - offsetX,
    PHOTO_Y + (PHOTO_H - displayedH) / 2 - offsetY,
    displayedW, displayedH
  );
  ctx.restore();

  // Photo border ring
  ctx.beginPath();
  ctx.arc(PHOTO_CX, PHOTO_CY, PHOTO_R, 0, Math.PI * 2);
  ctx.strokeStyle = COLORS.forestDark;
  ctx.lineWidth = 3;
  ctx.stroke();

  // ── 7. Name banner ───────────────────────────────────────────────────
  const nameBandY = PHOTO_CY + PHOTO_R + 30;
  const nameBandH = 46;
  const nameBandPad = 40;

  const nameStr = (name || "YOUR NAME HERE").toUpperCase();
  ctx.font = `800 22px ${fonts.display}`;
  let nameSize = 22;
  while (ctx.measureText(nameStr).width > IW - nameBandPad * 2 - 40 && nameSize > 14) {
    nameSize -= 1;
    ctx.font = `800 ${nameSize}px ${fonts.display}`;
  }

  const nameBandW = Math.min(IW - 60, ctx.measureText(nameStr).width + 80);
  const nameBandX = CARD_W / 2 - nameBandW / 2;

  pill(ctx, nameBandX, nameBandY, nameBandW, nameBandH, nameBandH / 2);
  ctx.fillStyle = COLORS.forestDark;
  ctx.fill();
  ctx.strokeStyle = COLORS.yellow;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Diamond dots on banner
  diamond(ctx, nameBandX + 18, nameBandY + nameBandH / 2, 6, COLORS.yellow);
  diamond(ctx, nameBandX + nameBandW - 18, nameBandY + nameBandH / 2, 6, COLORS.yellow);

  ctx.fillStyle = COLORS.white;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(nameStr, CARD_W / 2, nameBandY + nameBandH / 2);

  // Handle (if provided)
  if (handle) {
    const handleStr = handle.startsWith("@") ? handle : `@${handle}`;
    ctx.font = `600 11px ${fonts.mono}`;
    ctx.fillStyle = COLORS.forestMid;
    ctx.fillText(handleStr, CARD_W / 2, nameBandY + nameBandH + 14);
  }

  // ── 8. Role pill ─────────────────────────────────────────────────────
  const rolePillY = nameBandY + nameBandH + (handle ? 28 : 18);
  const roleStr = (stack || "Builder").toUpperCase();
  ctx.font = `700 14px ${fonts.mono}`;
  const roleW = ctx.measureText(roleStr).width + 70;
  const rolePillX = CARD_W / 2 - roleW / 2;
  const rolePillH = 36;

  pill(ctx, rolePillX, rolePillY, roleW, rolePillH, rolePillH / 2);
  ctx.fillStyle = COLORS.yellow;
  ctx.fill();
  ctx.strokeStyle = COLORS.forestDark;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = COLORS.forestDark;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`⚡ ${roleStr} ⚡`, CARD_W / 2, rolePillY + rolePillH / 2);

  // ── 9. Three column info section ────────────────────────────────────
  const colY = rolePillY + rolePillH + 20;
  const colH = 120;
  const colBorderY = colY - 6;

  // Top border (dotted)
  ctx.strokeStyle = COLORS.creamBorder;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([3, 5]);
  ctx.beginPath();
  ctx.moveTo(IL + 20, colBorderY);
  ctx.lineTo(IL + IW - 20, colBorderY);
  ctx.stroke();
  ctx.setLineDash([]);

  // Column dividers
  const col1X = IL + 20;
  const col3X = IL + IW - 20;
  const divs = [IL + IW / 3 + 8, IL + (IW / 3) * 2 - 8];
  for (const dx of divs) {
    ctx.strokeStyle = COLORS.creamBorder;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 5]);
    ctx.beginPath();
    ctx.moveTo(dx, colBorderY);
    ctx.lineTo(dx, colY + colH - 4);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  const colCenters = [
    (col1X + divs[0]) / 2,
    (divs[0] + divs[1]) / 2,
    (divs[1] + col3X) / 2,
  ];

  // Column labels (Increased font size to 10px)
  const colLabels = ["✦ BUILDER CLASS ✦", "✦ BEACH BAG ✦", "✦ CURRENTLY SHIPPING ✦"];
  colLabels.forEach((lbl, i) => {
    ctx.fillStyle = COLORS.pink;
    ctx.font = `700 10px ${fonts.mono}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(lbl, colCenters[i], colY + 10);
  });

  // Col 1: Builder Class (Increased font size to 14px)
  const titleLines = title.split(" ");
  const line1 = titleLines.slice(0, Math.ceil(titleLines.length / 2)).join(" ");
  const line2 = titleLines.slice(Math.ceil(titleLines.length / 2)).join(" ");
  const maxCol1W = divs[0] - col1X - 20;
  let col1FontSize = 14;
  ctx.font = `800 ${col1FontSize}px ${fonts.display}`;
  while (
    (ctx.measureText(line1.toUpperCase()).width > maxCol1W ||
      (line2 && ctx.measureText(line2.toUpperCase()).width > maxCol1W)) &&
    col1FontSize > 10
  ) {
    col1FontSize -= 1;
    ctx.font = `800 ${col1FontSize}px ${fonts.display}`;
  }
  ctx.fillStyle = COLORS.teal;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(line1.toUpperCase(), colCenters[0], colY + 34);
  if (line2) ctx.fillText(line2.toUpperCase(), colCenters[0], colY + 34 + col1FontSize + 4);

  // Col 2: Beach Bag (Increased font size to 11px)
  beachBag.slice(0, 3).forEach((item, i) => {
    const itemY = colY + 30 + i * 25;
    ctx.font = `400 14px serif`;
    ctx.textAlign = "left";
    ctx.fillStyle = COLORS.ink;
    ctx.fillText(item.emoji, colCenters[1] - 44, itemY);
    ctx.font = `600 11px ${fonts.mono}`;
    ctx.fillStyle = COLORS.forestMid;
    ctx.fillText(item.label, colCenters[1] - 22, itemY + 2);
  });

  // Col 3: Currently Shipping (Increased font size to 13px)
  const shipStr = shipping || "BUILDING THE FUTURE";
  const shipWords = shipStr.toUpperCase().split(" ");
  const maxCol3W = col3X - divs[1] - 16;
  let shipFontSize = 13;
  ctx.font = `800 ${shipFontSize}px ${fonts.display}`;
  
  // Wrap words into lines
  let shLine = "", shLines: string[] = [];
  for (const w of shipWords) {
    const testLine = shLine ? `${shLine} ${w}` : w;
    if (ctx.measureText(testLine).width > maxCol3W && shLine) {
      shLines.push(shLine);
      shLine = w;
    } else {
      shLine = testLine;
    }
  }
  if (shLine) shLines.push(shLine);

  while (
    shLines.some((l) => ctx.measureText(l).width > maxCol3W) &&
    shipFontSize > 10
  ) {
    shipFontSize -= 1;
    ctx.font = `800 ${shipFontSize}px ${fonts.display}`;
  }

  ctx.fillStyle = COLORS.forestDark;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  shLines.slice(0, 3).forEach((l, i) => {
    ctx.fillText(l, colCenters[2], colY + 34 + i * (shipFontSize + 5));
  });

  // Bottom separator
  ctx.strokeStyle = COLORS.creamBorder;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([3, 5]);
  ctx.beginPath();
  ctx.moveTo(IL + 20, colY + colH - 2);
  ctx.lineTo(IL + IW - 20, colY + colH - 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // ── 10. QR + Builder ID + Barcode ────────────────────────────────────
  const botY = colY + colH + 8;
  const botH = 80;

  // QR code (Increased label to 8px)
  qrPlaceholder(ctx, IL + 28, botY + 4, 70);
  ctx.font = `600 8px ${fonts.mono}`;
  ctx.fillStyle = COLORS.forestMid;
  ctx.textAlign = "center";
  ctx.fillText("SCAN QR", IL + 28 + 35, botY + 80);

  // Builder ID (center) (Increased labels to 10px, number to 17px, studio to 10px)
  ctx.fillStyle = COLORS.pink;
  ctx.font = `700 10px ${fonts.mono}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("BUILDER ID", CARD_W / 2, botY + 22);
  ctx.fillStyle = COLORS.forestDark;
  ctx.font = `800 17px ${fonts.mono}`;
  ctx.fillText(`#GOA-2026-${entryNo}`, CARD_W / 2, botY + 44);
  ctx.fillStyle = COLORS.forestMid;
  ctx.font = `600 10px ${fonts.mono}`;
  ctx.fillText("2:47 PM STUDIO", CARD_W / 2, botY + 62);

  // Barcode (right) (Increased label to 10px)
  ctx.save();
  const barRightX = IL + IW - 28;
  const barStartX = barRightX - 130;
  const barTopY = botY + 8;
  const barH = 48;
  ctx.fillStyle = COLORS.ink;
  let bx = barStartX;
  for (let i = 0; i < 24; i++) {
    const bw = 2 + ((i * 13) % 3);
    ctx.fillRect(bx, barTopY, bw, barH);
    bx += bw + 2 + ((i * 7) % 3);
    if (bx > barRightX) break;
  }
  ctx.fillStyle = COLORS.forestMid;
  ctx.font = `600 10px ${fonts.mono}`;
  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  ctx.fillText(`NO. ${entryNo}`, barRightX, barTopY + barH + 5);
  ctx.restore();

  // ── 11. Pink #FRAMEINGOA footer ──────────────────────────────────────
  const footerY = botY + botH + 12;
  const footerH = CARD_H - BRD - footerY;

  ctx.fillStyle = COLORS.pink;
  ctx.fillRect(IL, footerY, IW, footerH);

  // Yellow rule at top of footer
  ctx.fillStyle = COLORS.yellow;
  ctx.fillRect(IL, footerY, IW, 3);

  // "#FRAMEINGOA" text
  ctx.fillStyle = COLORS.white;
  ctx.font = `800 22px ${fonts.display}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("#FRAMEINGOA", CARD_W / 2, footerY + footerH / 2);

  // Decorative sparkles in footer
  sparkle(ctx, IL + 60, footerY + footerH / 2, 9, COLORS.yellow);
  sparkle(ctx, IL + IW - 60, footerY + footerH / 2, 9, COLORS.yellow);
  diamond(ctx, IL + 36, footerY + footerH / 2, 5, COLORS.white);
  diamond(ctx, IL + IW - 36, footerY + footerH / 2, 5, COLORS.white);
}
