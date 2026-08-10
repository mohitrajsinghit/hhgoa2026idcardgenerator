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
  height: number, lean: number
) {
  ctx.save();
  ctx.strokeStyle = COLORS.forestMid;
  ctx.lineCap = "round";

  // Trunk
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(baseX, baseY);
  ctx.quadraticCurveTo(baseX + lean * 0.4, baseY - height * 0.55, baseX + lean, baseY - height);
  ctx.stroke();

  const topX = baseX + lean;
  const topY = baseY - height;

  // Fronds
  const fronds = [
    { ax: -28, ay: -18, bx: -60, by: -6 },
    { ax: -18, ay: -32, bx: -38, by: -56 },
    { ax: -4, ay: -36, bx:  4, by: -66 },
    { ax: 16, ay: -30, bx: 42, by: -52 },
    { ax: 26, ay: -14, bx: 60, by:  -4 },
    { ax: 20, ay: 4,  bx: 48, by:  18 },
  ];

  for (const f of fronds) {
    const w = 8 - Math.abs(f.bx) * 0.06;
    ctx.lineWidth = Math.max(3, w);
    ctx.strokeStyle = COLORS.forestLight;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(topX + f.ax, topY + f.ay, topX + f.bx, topY + f.by);
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

  // ── 2a. "HH GOA 2026" pink badge (top-center) ───────────────────────
  const badgeW = 180, badgeH = 40, badgeR = 20;
  const badgeX = CARD_W / 2 - badgeW / 2;
  const badgeY = IT + 14;
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
  ctx.fillText("HH  GOA  2026", CARD_W / 2, badgeY + badgeH / 2);

  // ── 2b. Left stamp — "GOA INDIA" ────────────────────────────────────
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

  // ── 2c. Right circular seal ──────────────────────────────────────────
  const sealCx = IL + IW - 56, sealCy = IT + 60, sealR = 44;
  ctx.strokeStyle = COLORS.yellow;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(sealCx, sealCy, sealR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(sealCx, sealCy, sealR - 8, 0, Math.PI * 2);
  ctx.setLineDash([3, 4]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Curved text "BUILD IN GOA" (top arc)
  ctx.fillStyle = COLORS.yellow;
  ctx.font = `700 8px ${fonts.mono}`;
  const arcText = "BUILD IN GOA · SHIP FROM PARADISE ·";
  const arcLen = arcText.length;
  for (let i = 0; i < arcLen; i++) {
    const angle = (i / arcLen) * Math.PI * 2 - Math.PI / 2;
    ctx.save();
    ctx.translate(sealCx + (sealR - 5) * Math.cos(angle), sealCy + (sealR - 5) * Math.sin(angle));
    ctx.rotate(angle + Math.PI / 2);
    ctx.fillText(arcText[i], 0, 0);
    ctx.restore();
  }
  ctx.font = "18px serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("🌴", sealCx, sealCy);

  // ── 3. "HACKER गोवा HOUSE" title ────────────────────────────────────
  const titleY = IT + HDR_H + 4;
  const titleH = 100;

  const displayFontWithFallback = `${fonts.display}, "Noto Sans Devanagari", "Segoe UI", sans-serif`;

  // Measure and draw the title pieces side by side
  ctx.textBaseline = "alphabetic";

  // "HACKER"
  ctx.font = `800 72px ${fonts.display}`;
  const hackerW = ctx.measureText("HACKER").width;
  // "HOUSE"
  const houseW = ctx.measureText("HOUSE").width;
  // "गोवा" (Devanagari font fallback)
  ctx.font = `800 52px ${displayFontWithFallback}`;
  const goaW = ctx.measureText("गोवा").width;

  const gap = 16;
  const totalTitleW = hackerW + gap + goaW + gap + houseW;
  let tx = (CARD_W - totalTitleW) / 2;
  const titleBaseline = titleY + titleH - 14;

  // Draw "HACKER"
  ctx.font = `800 72px ${fonts.display}`;
  ctx.fillStyle = COLORS.forestDark;
  ctx.textAlign = "left";
  ctx.fillText("HACKER", tx, titleBaseline);
  tx += hackerW + gap;

  // Draw "गोवा" in hot pink with slight background treatment
  ctx.font = `800 56px ${displayFontWithFallback}`;
  // Pink background pill behind गोवा
  const goaPillPad = 8;
  pill(ctx, tx - goaPillPad, titleBaseline - 50, goaW + goaPillPad * 2, 58, 8);
  ctx.fillStyle = COLORS.pink;
  ctx.fill();
  ctx.fillStyle = COLORS.yellow;
  ctx.fillText("गोवा", tx, titleBaseline);
  tx += goaW + gap;

  // Draw "HOUSE"
  ctx.font = `800 72px ${fonts.display}`;
  ctx.fillStyle = COLORS.forestDark;
  ctx.fillText("HOUSE", tx, titleBaseline);

  // Sub-badge row
  ctx.font = `600 11px ${fonts.mono}`;
  ctx.fillStyle = COLORS.forestMid;
  ctx.textAlign = "center";
  ctx.fillText("GOA, INDIA  ·  28 – 31 OCT 2026  ·  2:47 PM STUDIO", CARD_W / 2, titleY + titleH + 6);

  // ── 4. Pink rule above illustration zone ────────────────────────────
  ctx.fillStyle = COLORS.pink;
  ctx.fillRect(IL, titleY + titleH + 16, IW, 2);

  // ── 5. Illustration zone ─────────────────────────────────────────────
  const illY = titleY + titleH + 22;   // ~240

  // Left vertical date strip
  ctx.save();
  ctx.fillStyle = COLORS.forestMid;
  ctx.font = `700 11px ${fonts.mono}`;
  ctx.textAlign = "center";
  ctx.translate(IL + 26, illY + 170);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("28 – 31 OCT 2026", 0, 0);
  ctx.restore();

  // Right vertical "GOA, INDIA"
  ctx.save();
  ctx.fillStyle = COLORS.pink;
  ctx.font = `700 11px ${fonts.mono}`;
  ctx.textAlign = "center";
  ctx.translate(IL + IW - 20, illY + 160);
  ctx.rotate(Math.PI / 2);
  ctx.fillText("GOA, INDIA", 0, 0);
  ctx.restore();

  // ── 5a. Palm trees ──────────────────────────────────────────────────
  palmTree(ctx, IL + 70, illY + 310, 200, -30);
  palmTree(ctx, IL + 95, illY + 320, 160, -20);
  palmTree(ctx, IL + IW - 80, illY + 295, 195, 25);

  // ── 5b. Signpost (BUILD / SHIP / REPEAT) ────────────────────────────
  const spX = IL + 46, spY = illY + 80;
  ctx.fillStyle = COLORS.forestDark;
  ctx.fillRect(spX + 36, spY, 5, 155);  // post

  arrowSign(ctx, "BUILD",  spX, spY + 8,  80, 26, COLORS.forestDark, COLORS.cream, fonts);
  arrowSign(ctx, "SHIP",   spX - 4, spY + 44, 88, 26, COLORS.pink, COLORS.white, fonts);
  arrowSign(ctx, "REPEAT", spX - 8, spY + 80, 96, 26, COLORS.yellow, COLORS.forestDark, fonts);

  // Stars scattered
  sparkle(ctx, IL + 160, illY + 52, 10, COLORS.yellow);
  sparkle(ctx, IL + 200, illY + 160, 7, COLORS.pink);
  sparkle(ctx, IL + IW - 170, illY + 44, 10, COLORS.yellow);
  sparkle(ctx, IL + IW - 120, illY + 200, 7, COLORS.pink);
  sparkle(ctx, CARD_W / 2 - 50, illY + 28, 8, COLORS.gold);
  sparkle(ctx, CARD_W / 2 + 60, illY + 36, 6, COLORS.yellow);

  // Diamond dots
  diamond(ctx, IL + 148, illY + 144, 7, COLORS.pink);
  diamond(ctx, IL + IW - 158, illY + 130, 7, COLORS.yellow);

  // Birds
  bird(ctx, IL + 160, illY + 30, 5, COLORS.forestMid);
  bird(ctx, IL + IW - 200, illY + 22, 4, COLORS.forestMid);

  // ── 5c. "LET'S BUILD!" sticker ──────────────────────────────────────
  ctx.save();
  ctx.translate(IL + IW - 78, illY + 88);
  ctx.rotate((14 * Math.PI) / 180);
  pill(ctx, -46, -24, 92, 48, 24);
  ctx.fillStyle = COLORS.yellow;
  ctx.fill();
  ctx.strokeStyle = COLORS.forestDark;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = COLORS.forestDark;
  ctx.font = `800 10px ${fonts.display}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("LET'S", 0, -8);
  ctx.fillText("BUILD!", 0, 8);
  ctx.restore();

  // ── 5d. Goa house + scooter (right side) ────────────────────────────
  goaHouse(ctx, IL + IW - 126, illY + 148, 0.82);
  scooter(ctx, IL + IW - 128, illY + 290, COLORS.pink);

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

  // Column labels
  const colLabels = ["✦ BUILDER CLASS ✦", "✦ BEACH BAG ✦", "✦ CURRENTLY SHIPPING ✦"];
  colLabels.forEach((lbl, i) => {
    ctx.fillStyle = COLORS.pink;
    ctx.font = `700 9px ${fonts.mono}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(lbl, colCenters[i], colY + 2);
  });

  // Col 1: Builder Class
  const titleLines = title.split(" ");
  const line1 = titleLines.slice(0, Math.ceil(titleLines.length / 2)).join(" ");
  const line2 = titleLines.slice(Math.ceil(titleLines.length / 2)).join(" ");
  ctx.fillStyle = COLORS.teal;
  ctx.font = `800 13px ${fonts.display}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(line1.toUpperCase(), colCenters[0], colY + 22);
  if (line2) ctx.fillText(line2.toUpperCase(), colCenters[0], colY + 38);

  // Col 2: Beach Bag
  beachBag.slice(0, 3).forEach((item, i) => {
    const itemY = colY + 20 + i * 26;
    ctx.font = `400 14px serif`;
    ctx.textAlign = "left";
    ctx.fillStyle = COLORS.ink;
    ctx.fillText(item.emoji, colCenters[1] - 44, itemY);
    ctx.font = `600 10px ${fonts.mono}`;
    ctx.fillStyle = COLORS.forestMid;
    ctx.fillText(item.label, colCenters[1] - 22, itemY + 2);
  });

  // Col 3: Currently Shipping
  const shipStr = shipping || "BUILDING THE FUTURE";
  const shipWords = shipStr.toUpperCase().split(" ");
  ctx.fillStyle = COLORS.forestDark;
  ctx.font = `800 12px ${fonts.display}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  // Wrap up to 2 lines
  let shLine = "", shLines: string[] = [];
  for (const w of shipWords) {
    const testLine = shLine + (shLine ? " " : "") + w;
    if (ctx.measureText(testLine).width > (divs[1] - col3X) * -1 + 110 && shLine) {
      shLines.push(shLine); shLine = w;
    } else { shLine = testLine; }
  }
  shLines.push(shLine);
  shLines.slice(0, 3).forEach((l, i) => {
    ctx.fillText(l, colCenters[2], colY + 20 + i * 18);
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

  // QR code
  qrPlaceholder(ctx, IL + 28, botY + 4, 70);
  ctx.font = `600 7px ${fonts.mono}`;
  ctx.fillStyle = COLORS.forestMid;
  ctx.textAlign = "center";
  ctx.fillText("SCAN QR", IL + 28 + 35, botY + 80);

  // Builder ID (center)
  ctx.fillStyle = COLORS.pink;
  ctx.font = `700 9px ${fonts.mono}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("BUILDER ID", CARD_W / 2, botY + 22);
  ctx.fillStyle = COLORS.forestDark;
  ctx.font = `800 16px ${fonts.mono}`;
  ctx.fillText(`#HH-GOA-${entryNo}`, CARD_W / 2, botY + 44);
  ctx.fillStyle = COLORS.forestMid;
  ctx.font = `600 9px ${fonts.mono}`;
  ctx.fillText("2:47 PM STUDIO", CARD_W / 2, botY + 62);

  // Barcode (right)
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
  ctx.font = `600 9px ${fonts.mono}`;
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
