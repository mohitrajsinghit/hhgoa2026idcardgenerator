import { COLORS } from "./theme";
import { PhotoTransform, resolvePan } from "./photoTransform";
import { CardFonts } from "./drawCard";

export const PFP_SIZE = 1000;
const FRAME_PAD = 50;

export const PFP_CX = PFP_SIZE / 2;
export const PFP_CY = 468; // Shifted up from 500 so circle does not overlap the bottom ribbon

export const PFP_PHOTO_W = PFP_SIZE - FRAME_PAD * 2;
export const PFP_PHOTO_H = PFP_SIZE - FRAME_PAD * 2;

export const PFP_INNER_R = 345; // circle radius for circular PFP crop
const INNER_R = PFP_INNER_R;

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
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

export type PfpData = {
  photoImg: HTMLImageElement;
  transform: PhotoTransform;
  name: string;
  title: string;
  fonts: CardFonts;
};

export function renderPfpFrame(ctx: CanvasRenderingContext2D, data: PfpData) {
  const { photoImg, transform, name, title, fonts } = data;
  const CX = PFP_CX, CY = PFP_CY;

  ctx.clearRect(0, 0, PFP_SIZE, PFP_SIZE);

  // ── Outer rounded clip ────────────────────────────────────────────────
  ctx.save();
  roundRectPath(ctx, 0, 0, PFP_SIZE, PFP_SIZE, 44);
  ctx.clip();

  // Background — dark forest green
  ctx.fillStyle = COLORS.forestDark;
  ctx.fillRect(0, 0, PFP_SIZE, PFP_SIZE);

  // Gradient overlay
  const grad = ctx.createRadialGradient(CX, CY, 0, CX, CY, PFP_SIZE * 0.7);
  grad.addColorStop(0, "rgba(26,74,46,0.8)");
  grad.addColorStop(1, "rgba(8,32,20,0.95)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, PFP_SIZE, PFP_SIZE);

  // ── Sparkles ──────────────────────────────────────────────────────────
  sparkle(ctx, 80, 80, 18, COLORS.yellow);
  sparkle(ctx, PFP_SIZE - 80, 80, 18, COLORS.yellow);
  sparkle(ctx, 80, PFP_SIZE - 200, 14, COLORS.pink);
  sparkle(ctx, PFP_SIZE - 80, PFP_SIZE - 200, 14, COLORS.pink);

  // ── Top badge: "HACKER HOUSE गोवा" ──────────────────────────────────
  const displayFontWithFallback = `${fonts.display}, "Noto Sans Devanagari", "Segoe UI", sans-serif`;
  ctx.font = `800 24px ${displayFontWithFallback}`;
  const badgeText = "HACKER HOUSE गोवा";
  const textW = ctx.measureText(badgeText).width;
  const topBadgeW = Math.max(480, textW + 80);
  const topBadgeH = 64;
  const topBadgeX = CX - topBadgeW / 2;
  const topBadgeY = FRAME_PAD - 28;

  roundRectPath(ctx, topBadgeX, topBadgeY, topBadgeW, topBadgeH, topBadgeH / 2);
  ctx.fillStyle = COLORS.pink;
  ctx.fill();
  ctx.strokeStyle = COLORS.yellow;
  ctx.lineWidth = 3.5;
  ctx.stroke();

  ctx.fillStyle = COLORS.white;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(badgeText, CX, topBadgeY + topBadgeH / 2);

  // Sparkles near top badge
  sparkle(ctx, CX - topBadgeW / 2 - 25, topBadgeY + topBadgeH / 2, 10, COLORS.yellow);
  sparkle(ctx, CX + topBadgeW / 2 + 25, topBadgeY + topBadgeH / 2, 10, COLORS.yellow);

  // ── Bottom ribbon: name + title ───────────────────────────────────────
  const botRibbonH = 110;
  const botRibbonY = PFP_SIZE - FRAME_PAD - botRibbonH + 10;
  const botRibbonX = FRAME_PAD - 10;
  const botRibbonW = PFP_SIZE - (FRAME_PAD - 10) * 2;

  roundRectPath(ctx, botRibbonX, botRibbonY, botRibbonW, botRibbonH, 20);
  ctx.fillStyle = "rgba(8,32,20,0.92)";
  ctx.fill();
  ctx.strokeStyle = COLORS.yellow;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.textAlign = "center";

  const nameStr = (name || "BUILDER").toUpperCase();
  ctx.fillStyle = COLORS.cream;
  ctx.font = `800 32px ${fonts.display}`;
  ctx.textBaseline = "top";
  ctx.fillText(nameStr, CX, botRibbonY + 18);

  const subStr = title || "HH GOA 2026 · #FrameInGoa";
  ctx.fillStyle = COLORS.yellow;
  ctx.font = `600 16px ${fonts.mono}`;
  ctx.fillText(subStr, CX, botRibbonY + 62);

  // ── #FRAMEINGOA footer bar ───────────────────────────────────────────
  const ftrY = PFP_SIZE - 48;
  ctx.fillStyle = COLORS.pink;
  ctx.fillRect(FRAME_PAD, ftrY, PFP_SIZE - FRAME_PAD * 2, 34);
  ctx.fillStyle = COLORS.white;
  ctx.font = `800 14px ${fonts.display}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("#FRAMEINGOA", CX, ftrY + 17);

  // ── Circular photo (Layered on top to overlap bottom ribbon) ─────────
  // Outer yellow dashed ring
  ctx.beginPath();
  ctx.arc(CX, CY, INNER_R + 20, 0, Math.PI * 2);
  ctx.strokeStyle = COLORS.yellow;
  ctx.lineWidth = 6;
  ctx.setLineDash([10, 10]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Pink ring
  ctx.beginPath();
  ctx.arc(CX, CY, INNER_R + 8, 0, Math.PI * 2);
  ctx.strokeStyle = COLORS.pink;
  ctx.lineWidth = 3;
  ctx.stroke();

  // Photo clip
  ctx.save();
  ctx.beginPath();
  ctx.arc(CX, CY, INNER_R, 0, Math.PI * 2);
  ctx.clip();

  const boxW = INNER_R * 2, boxH = INNER_R * 2;
  const { displayedW, displayedH, offsetX, offsetY } = resolvePan(
    photoImg.naturalWidth, photoImg.naturalHeight,
    boxW, boxH, transform
  );
  ctx.drawImage(
    photoImg,
    CX - boxW / 2 + (boxW - displayedW) / 2 - offsetX,
    CY - boxH / 2 + (boxH - displayedH) / 2 - offsetY,
    displayedW, displayedH
  );
  ctx.restore();

  // Photo border
  ctx.beginPath();
  ctx.arc(CX, CY, INNER_R, 0, Math.PI * 2);
  ctx.strokeStyle = COLORS.forestDark;
  ctx.lineWidth = 4;
  ctx.stroke();

  // ── Stamp badge (top-right) ───────────────────────────────────────────
  ctx.save();
  ctx.setLineDash([]);
  const stampCx = PFP_SIZE - FRAME_PAD - 80;
  const stampCy = FRAME_PAD + 82;
  ctx.translate(stampCx, stampCy);
  ctx.rotate((12 * Math.PI) / 180);

  const stampR = 76;
  ctx.beginPath();
  ctx.arc(0, 0, stampR, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.pink;
  ctx.fill();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, 0, stampR - 10, 0, Math.PI * 2);
  ctx.strokeStyle = COLORS.yellow;
  ctx.lineWidth = 2.5;
  ctx.setLineDash([5, 5]);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = COLORS.white;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `800 17px ${fonts.mono}`;
  ctx.fillText("BUILDER", 0, -12);
  ctx.fillStyle = COLORS.yellow;
  ctx.font = `800 16px ${fonts.mono}`;
  ctx.fillText("2026", 0, 12);
  ctx.restore();

  ctx.restore(); // outer clip
}
