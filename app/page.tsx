"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { renderCard } from "@/lib/drawCard";
import { renderPfpFrame, PFP_SIZE, PFP_PHOTO_W, PFP_PHOTO_H } from "@/lib/drawPfpFrame";
import { CARD_W, CARD_H, PHOTO_W, PHOTO_H } from "@/lib/cardLayout";
import {
  PhotoTransform,
  defaultTransform,
  clampTransform,
  MIN_ZOOM,
  MAX_ZOOM,
} from "@/lib/photoTransform";
import { generateBuilderTitle, generateEntryNumber, generateBeachBag, BeachItem } from "@/lib/titles";
import { loadImageFile } from "@/lib/loadImageFile";
import { cloudinaryConfigured, uploadToCloudinary } from "@/lib/cloudinary";
import { displayFont, monoFont, bodyFont } from "@/lib/fonts";

const STACK_CHIPS = [
  "Fullstack", "ML / AI", "Founder", "Backend",
  "Frontend", "Mobile", "Rust / Solana", "Design",
];

const HASHTAG = "#FrameInGoa";

export default function Page() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStart = useRef<{ dist: number; zoom: number } | null>(null);
  const dragLast = useRef<{ x: number; y: number } | null>(null);

  const [format, setFormat] = useState<"badge" | "pfp">("badge");
  const [photoImg, setPhotoImg] = useState<HTMLImageElement | null>(null);
  const [transform, setTransform] = useState<PhotoTransform>(
    defaultTransform()
  );
  // Bug #3/#8: Keep a ref that is always synchronously up-to-date with the
  // latest transform so gesture handlers (onWheel, pinchStart) never read a
  // stale closure value — React state reads inside event handlers are batched.
  const transformRef = useRef<PhotoTransform>(transform);

  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [stack, setStack] = useState("");
  const [shipping, setShipping] = useState("");
  const [title, setTitle] = useState(() => generateBuilderTitle(""));
  const [beachBag, setBeachBag] = useState<BeachItem[]>(() => generateBeachBag(""));
  const [entryNo] = useState(() => generateEntryNumber(String(Math.random())));

  const [dragging, setDragging] = useState(false);
  const [fontsReady, setFontsReady] = useState(false);
  const [busy, setBusy] = useState<"" | "photo" | "download" | "share">("");
  const [status, setStatus] = useState<{ text: string; error?: boolean }>({
    text: "",
  });

  // Keep transformRef in sync on every render.
  transformRef.current = transform;

  useEffect(() => {
    document.fonts.ready.then(() => setFontsReady(true));
  }, []);

  const curW = format === "badge" ? CARD_W : PFP_SIZE;
  const curH = format === "badge" ? CARD_H : PFP_SIZE;
  // Bug #4/#15: derive photo box dims from exported constants (no magic numbers,
  // no stale-closure risk since these are plain derived values recalculated each render).
  const curPhotoW = format === "badge" ? PHOTO_W : PFP_PHOTO_W;
  const curPhotoH = format === "badge" ? PHOTO_H : PFP_PHOTO_H;

  // Redraw whenever anything relevant changes.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = curW;
    canvas.height = curH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (!photoImg) {
      ctx.clearRect(0, 0, curW, curH);
      return;
    }

    const fonts = {
      display: displayFont.style.fontFamily,
      mono: monoFont.style.fontFamily,
      body: bodyFont.style.fontFamily,
    };

    if (format === "badge") {
      renderCard(ctx, {
        photoImg,
        transform,
        name,
        handle,
        stack,
        title,
        shipping,
        beachBag,
        entryNo,
        fonts,
      });
    } else {
      renderPfpFrame(ctx, {
        photoImg,
        transform,
        name,
        title,
        fonts,
      });
    }
  }, [format, photoImg, transform, name, handle, stack, title, shipping, beachBag, entryNo, fontsReady, curW, curH]);

  const handleFile = useCallback(async (file: File) => {
    setStatus({ text: "" });
    setBusy("photo");
    try {
      if (!file.type.startsWith("image/") && !/\.hei[cf]$/i.test(file.name)) {
        throw new Error("That doesn't look like an image file.");
      }
      const img = await loadImageFile(file);
      setPhotoImg(img);
      setTransform(defaultTransform());
    } catch (e) {
      setStatus({
        text: e instanceof Error ? e.message : "Couldn't load that photo.",
        error: true,
      });
    } finally {
      setBusy("");
    }
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  // --- Pan / zoom on the canvas (mouse drag, touch drag, pinch, wheel) ---

  function canvasPointFromClient(clientX: number, clientY: number) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = curW / rect.width;
    const scaleY = curH / rect.height;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  }

  const applyPanDelta = (dx: number, dy: number) => {
    if (!photoImg) return;
    setTransform((t) =>
      clampTransform(photoImg.naturalWidth, photoImg.naturalHeight, curPhotoW, curPhotoH, {
        zoom: t.zoom,
        panXFrac: t.panXFrac - dx / curPhotoW,
        panYFrac: t.panYFrac - dy / curPhotoH,
      })
    );
  };

  const applyZoomTo = (zoom: number) => {
    if (!photoImg) return;
    setTransform((t) =>
      clampTransform(photoImg.naturalWidth, photoImg.naturalHeight, curPhotoW, curPhotoH, {
        ...t,
        zoom,
      })
    );
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!photoImg) return;
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) {
      dragLast.current = { x: e.clientX, y: e.clientY };
      setDragging(true);
    } else if (pointers.current.size === 2) {
      const pts = Array.from(pointers.current.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      // Bug #8: read from transformRef, not the stale closed-over `transform`.
      pinchStart.current = { dist, zoom: transformRef.current.zoom };
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2 && pinchStart.current) {
      const pts = Array.from(pointers.current.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const ratio = dist / Math.max(1, pinchStart.current.dist);
      // Bug #7: removed dead `scale` variable and `void scale` suppression.
      applyZoomTo(clamp(pinchStart.current.zoom * ratio, MIN_ZOOM, MAX_ZOOM));
      return;
    }

    if (pointers.current.size === 1 && dragLast.current) {
      const a = canvasPointFromClient(dragLast.current.x, dragLast.current.y);
      const b = canvasPointFromClient(e.clientX, e.clientY);
      applyPanDelta(b.x - a.x, b.y - a.y);
      dragLast.current = { x: e.clientX, y: e.clientY };
    }
  };

  const endPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size === 0) {
      setDragging(false);
      dragLast.current = null;
    }
    if (pointers.current.size < 2) {
      pinchStart.current = null;
    }
  };

  // Bug #3: onWheel MUST read the current zoom from transformRef, not the stale
  // closed-over `transform` state value. Without this, fast wheel scrolls
  // accumulate from an outdated baseline and zoom snaps or feels laggy.
  //
  // Bug #9: React attaches JSX onWheel listeners as passive (can't preventDefault).
  // We register a non-passive native listener via useEffect instead, and keep
  // this JSX handler only as a no-op placeholder so React knows to attach the
  // canvas element attribute (helps with SSR / event delegation).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handler = (e: WheelEvent) => {
      if (!photoImg) return;
      e.preventDefault(); // Works here because the listener is non-passive.
      applyZoomTo(clamp(transformRef.current.zoom - e.deltaY * 0.0015, MIN_ZOOM, MAX_ZOOM));
    };
    canvas.addEventListener("wheel", handler, { passive: false });
    return () => canvas.removeEventListener("wheel", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoImg]); // re-register when photo changes (guard check inside handler)

  // JSX onWheel left intentionally empty — real handler is the non-passive native listener above.
  const onWheel = (_e: React.WheelEvent<HTMLCanvasElement>) => {};

  // --- Download / share ---

  // Bug #10: canvasToBlob previously used optional chaining (?.) which silently
  // short-circuits to undefined when the ref is null, leaving the Promise
  // permanently pending (neither resolved nor rejected) and hanging the UI.
  function canvasToBlob(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        reject(new Error("Canvas is not available."));
        return;
      }
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Couldn't render the card."));
      }, "image/png");
    });
  }

  function fileSlug() {
    return (name || "builder").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
  }

  const caption = () =>
    `I just built my HH Goa 2026 badge — "${title}" 🏝️🛠️ ${HASHTAG}`;

  const handleDownload = async () => {
    if (!photoImg) {
      setStatus({ text: "Add a photo first.", error: true });
      return;
    }
    setBusy("download");
    setStatus({ text: "" });
    try {
      const blob = await canvasToBlob();
      const url = URL.createObjectURL(blob);
      // Bug #5: anchor must be in the DOM for Firefox / mobile WebViews to
      // honour the programmatic .click() — detached anchors are silently ignored.
      const a = document.createElement("a");
      a.href = url;
      a.download = `hhgoa2026-${fileSlug()}.png`;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      setStatus({ text: "Downloaded." });
    } catch (e) {
      setStatus({ text: (e as Error).message, error: true });
    } finally {
      setBusy("");
    }
  };

  const handleShare = async () => {
    if (!photoImg) {
      setStatus({ text: "Add a photo first.", error: true });
      return;
    }
    setBusy("share");
    setStatus({ text: "Preparing your badge…" });
    try {
      const blob = await canvasToBlob();

      // 1) Native share sheet with the actual image file (best on mobile —
      // this is a true attached-image share, X app included).
      const file = new File([blob], `hhgoa2026-${fileSlug()}.png`, {
        type: "image/png",
      });
      const nav = navigator as Navigator & {
        canShare?: (data: { files: File[] }) => boolean;
        share?: (data: {
          files?: File[];
          text?: string;
          title?: string;
        }) => Promise<void>;
      };

      if (nav.canShare?.({ files: [file] }) && nav.share) {
        await nav.share({
          files: [file],
          text: caption(),
          title: "HH Goa 2026 Builder Badge",
        });
        setStatus({ text: "Shared!" });
        return;
      }

      // 2) Desktop / unsupported: upload so the tweet link unfurls with the
      // actual graphic, then open a pre-filled tweet intent.
      if (cloudinaryConfigured()) {
        setStatus({ text: "Uploading your badge…" });
        const imgUrl = await uploadToCloudinary(blob);
        const shareUrl = `${window.location.origin}/share?img=${encodeURIComponent(
          imgUrl
        )}&name=${encodeURIComponent(name)}&title=${encodeURIComponent(title)}`;
        const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
          caption()
        )}&url=${encodeURIComponent(shareUrl)}`;
        window.open(tweetUrl, "_blank", "noopener,noreferrer");
        setStatus({ text: "Opening X…" });
        return;
      }

      // 3) Last resort: download the file and open a text-only tweet intent.
      const url = URL.createObjectURL(blob);
      // Bug #6: same anchor DOM-append fix as handleDownload.
      const a = document.createElement("a");
      a.href = url;
      a.download = `hhgoa2026-${fileSlug()}.png`;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        caption()
      )}`;
      window.open(tweetUrl, "_blank", "noopener,noreferrer");
      setStatus({
        text: "Badge downloaded — attach it to the tweet that just opened.",
      });
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setStatus({ text: (e as Error).message, error: true });
      } else {
        setStatus({ text: "" });
      }
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="page">
      {/* ── Top bar ────────────────────────────────────────────────── */}
      <div className="topbar">
        <div className="brand">
          <div className="brand-logo">🌴</div>
          <div className="brand-text">
            <span className="brand-mark">HH Goa 2026</span>
            <span className="brand-tag">Builder ID Card Generator</span>
          </div>
        </div>
        <div className="topbar-right">
          <span className="deadline-chip">28 – 31 Oct 2026</span>
          <span className="studio-tag">2:47 PM STUDIO</span>
        </div>
      </div>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <div className="hero">
        <h1 className="hero-title">
          <span>HACKER</span>
          <span className="goa-hindi">गोवा</span>
          <span>HOUSE</span>
        </h1>
        <div className="hero-sub">
          <span className="hero-meta">GOA, INDIA · 28–31 OCT 2026</span>
          <span className="hero-hashtag">{HASHTAG}</span>
          <span className="hero-meta">Build · Ship · Repeat</span>
        </div>
      </div>

      {/* ── Builder two-column layout ─────────────────────────────── */}
      <div className="builder">
        {/* Form panel */}
        <div className="panel">
          <h2>01 — Your Details</h2>

          {/* Dropzone */}
          <div
            className={`dropzone${dragging && !photoImg ? " dragging" : ""}`}
            onClick={() => document.getElementById("file-input")?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
          >
            <span className="dropzone-icon">
              {busy === "photo" ? "⏳" : photoImg ? "✅" : "📸"}
            </span>
            <strong>
              {photoImg ? "Photo loaded — tap to replace" : "Upload your photo"}
            </strong>
            <span>JPG, PNG, or iPhone HEIC · drag &amp; drop or tap</span>
            <input
              id="file-input"
              type="file"
              accept="image/*,.heic,.heif"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = "";
              }}
            />
          </div>

          {photoImg && (
            <div className="photo-controls">
              <label>
                <span>Zoom</span>
                <span>{transform.zoom.toFixed(1)}×</span>
              </label>
              <input
                type="range"
                min={MIN_ZOOM}
                max={MAX_ZOOM}
                step={0.01}
                value={transform.zoom}
                onChange={(e) => applyZoomTo(Number(e.target.value))}
              />
              <p className="hint">Drag the photo on the card to reposition it.</p>
            </div>
          )}

          {/* Name */}
          <div className="field">
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              type="text"
              placeholder="e.g. Aanya Shah"
              maxLength={36}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Twitter handle */}
          <div className="field">
            <label htmlFor="handle">X / Twitter Handle <span style={{opacity:0.5}}>(optional)</span></label>
            <input
              id="handle"
              type="text"
              placeholder="@yourhandle"
              maxLength={30}
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
            />
          </div>

          {/* Stack / Role with chips */}
          <div className="field">
            <label htmlFor="stack">Stack / Role</label>
            <input
              id="stack"
              type="text"
              placeholder="e.g. Full-stack, ML/AI, Founder"
              maxLength={36}
              value={stack}
              onChange={(e) => {
                setStack(e.target.value);
              }}
              onBlur={() => {
                setTitle(generateBuilderTitle(stack));
                setBeachBag(generateBeachBag(stack));
              }}
            />
            <div className="stack-chips">
              {STACK_CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  className={`chip${stack === chip ? " active" : ""}`}
                  onClick={() => {
                    setStack(chip);
                    setTitle(generateBuilderTitle(chip));
                    setBeachBag(generateBeachBag(chip));
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Currently Shipping */}
          <div className="field">
            <label htmlFor="shipping">Currently Shipping <span style={{opacity:0.5}}>(optional)</span></label>
            <input
              id="shipping"
              type="text"
              placeholder="e.g. Building the Future"
              maxLength={36}
              value={shipping}
              onChange={(e) => setShipping(e.target.value)}
            />
          </div>

          {/* Builder title */}
          <div className="field">
            <label>Builder Class Title</label>
            <div className="title-row">
              <div className="title-pill">{title}</div>
              <button
                type="button"
                className="shuffle-btn"
                aria-label="Shuffle builder title"
                onClick={() => {
                  setTitle(generateBuilderTitle(stack));
                  setBeachBag(generateBeachBag(stack));
                }}
              >
                🎲
              </button>
            </div>
          </div>
        </div>

        {/* Preview panel */}
        <div className="preview-panel">
          <div className="format-tabs">
            <button
              type="button"
              className={`tab-btn${format === "badge" ? " active" : ""}`}
              onClick={() => setFormat("badge")}
            >
              🎫 Builder ID Card
            </button>
            <button
              type="button"
              className={`tab-btn${format === "pfp" ? " active" : ""}`}
              onClick={() => setFormat("pfp")}
            >
              🖼️ PFP Frame
            </button>
          </div>

          <div
            className="canvas-wrap"
            style={{ aspectRatio: format === "badge" ? "800 / 1120" : "1 / 1" }}
          >
            <canvas
              ref={canvasRef}
              className={`card-canvas${dragging ? " dragging" : ""}`}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endPointer}
              onPointerCancel={endPointer}
              onPointerLeave={endPointer}
              onWheel={onWheel}
            />
            {!photoImg && (
              <div className="canvas-empty-hint">
                <span className="hint-icon">🌴</span>
                {busy === "photo"
                  ? "Loading photo…"
                  : "Your Builder Pass appears here once you upload a photo"}
              </div>
            )}
          </div>

          <div className="actions">
            <button
              className="btn btn-secondary"
              onClick={handleDownload}
              disabled={!photoImg || busy !== ""}
            >
              {busy === "download" ? "Saving…" : "⬇ Download"}
            </button>
            <button
              className="btn btn-primary"
              onClick={handleShare}
              disabled={!photoImg || busy !== ""}
            >
              {busy === "share" ? "Sharing…" : "𝕏 Share to X"}
            </button>
          </div>

          <div className={`status-line${status.error ? " error" : ""}`}>
            {status.text}
          </div>
        </div>
      </div>

      <footer className="page-footer">
        BUILT FOR HH GOA 2026 · {HASHTAG} ·{" "}
        <a href="https://hhgoa.com" target="_blank" rel="noopener noreferrer">
          hhgoa.com
        </a>
      </footer>
    </div>
  );
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}
