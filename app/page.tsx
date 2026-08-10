"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { renderCard } from "@/lib/drawCard";
import { renderPfpFrame, PFP_SIZE, PFP_PHOTO_W, PFP_PHOTO_H, PFP_INNER_R } from "@/lib/drawPfpFrame";
import { CARD_W, CARD_H, PHOTO_W, PHOTO_H, PHOTO_CX, PHOTO_CY, PHOTO_R } from "@/lib/cardLayout";
import {
  PhotoTransform,
  defaultTransform,
  clampTransform,
  MIN_ZOOM,
  MAX_ZOOM,
} from "@/lib/photoTransform";
import {
  generateBuilderTitle,
  generateEntryNumber,
  generateBeachBag,
  BeachItem,
  DEFAULT_TITLE,
  DEFAULT_ENTRY_NO,
} from "@/lib/titles";
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
  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [beachBag, setBeachBag] = useState<BeachItem[]>(() => generateBeachBag(""));
  const [entryNo, setEntryNo] = useState(DEFAULT_ENTRY_NO);

  const [dragging, setDragging] = useState(false);
  const [fontsReady, setFontsReady] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState<"" | "photo" | "download" | "share">("");
  const [status, setStatus] = useState<{ text: string; error?: boolean }>({
    text: "",
  });

  // Keep transformRef in sync on every render.
  transformRef.current = transform;

  useEffect(() => {
    document.fonts.ready.then(() => setFontsReady(true));
    // Generate unique random entry number on client mount safely
    setEntryNo(generateEntryNumber(String(Math.random())));

    const onScroll = () => {
      setShowScrollTop(window.scrollY > 280);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const copyPostText = async () => {
    try {
      await navigator.clipboard.writeText(caption());
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setStatus({ text: "Failed to copy to clipboard.", error: true });
    }
  };

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

  function isPointInsidePhoto(pt: { x: number; y: number }, currentFormat: "badge" | "pfp"): boolean {
    if (currentFormat === "badge") {
      return Math.hypot(pt.x - PHOTO_CX, pt.y - PHOTO_CY) <= PHOTO_R + 15;
    } else {
      const cx = PFP_SIZE / 2;
      const cy = PFP_SIZE / 2;
      return Math.hypot(pt.x - cx, pt.y - cy) <= PFP_INNER_R + 20;
    }
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
    const pt = canvasPointFromClient(e.clientX, e.clientY);
    if (!isPointInsidePhoto(pt, format)) return;

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
    if (!pointers.current.has(e.pointerId)) {
      if (photoImg) {
        const pt = canvasPointFromClient(e.clientX, e.clientY);
        const inside = isPointInsidePhoto(pt, format);
        (e.target as HTMLCanvasElement).style.cursor = inside ? "grab" : "default";
      }
      return;
    }
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
      const dx = e.clientX - dragLast.current.x;
      const dy = e.clientY - dragLast.current.y;
      dragLast.current = { x: e.clientX, y: e.clientY };
      applyPanDelta(dx, dy);
    }
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size === 0) {
      setDragging(false);
      dragLast.current = null;
      pinchStart.current = null;
      if (photoImg) {
        const pt = canvasPointFromClient(e.clientX, e.clientY);
        const inside = isPointInsidePhoto(pt, format);
        (e.target as HTMLCanvasElement).style.cursor = inside ? "grab" : "default";
      }
    } else if (pointers.current.size === 1) {
      const remaining = Array.from(pointers.current.values())[0];
      dragLast.current = { x: remaining.x, y: remaining.y };
      pinchStart.current = null;
    }
  };

  const endPointer = onPointerUp;
  const onPointerCancel = onPointerUp;

  // Zoom via mouse wheel is attached as a non-passive listener in useEffect so e.preventDefault() works.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handler = (e: WheelEvent) => {
      if (!photoImg) return;
      // Only zoom when the mouse pointer is hovering inside the photo boundary.
      // Outside the photo, allow default mouse scroll to scroll the webpage naturally.
      const pt = canvasPointFromClient(e.clientX, e.clientY);
      if (!isPointInsidePhoto(pt, format)) {
        return;
      }
      e.preventDefault(); // Intercept and zoom only when hovering directly on the photo.
      applyZoomTo(clamp(transformRef.current.zoom - e.deltaY * 0.0015, MIN_ZOOM, MAX_ZOOM));
    };
    canvas.addEventListener("wheel", handler, { passive: false });
    return () => canvas.removeEventListener("wheel", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoImg, format, curW, curH]);

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

  const caption = () => {
    const roleText = stack ? `I'm a ${stack}` : "I'm a builder";
    const idText = `Builder ID: #GOA-2026-${entryNo}`;
    const cardTitle =
      format === "badge"
        ? "Hacker House Goa 26 ID Card! 🪪"
        : "Hacker House Goa 26 PFP! 🖼️";
    return `Hey there, Here is my ${cardTitle}\n\n${roleText}\n${idText}\n\nSee you all in Goa. 🌴☀️🚀\n\n#FrameInGoa #HHGoa2026`;
  };

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

      const file = new File([blob], `hhgoa2026-${fileSlug()}.png`, {
        type: "image/png",
      });

      // Detect mobile browsers (Android, iOS, etc.)
      const isMobile =
        typeof navigator !== "undefined" &&
        (/Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(
          navigator.userAgent || ""
        ) ||
          (navigator.maxTouchPoints > 1 &&
            /Macintosh/i.test(navigator.userAgent || "")));

      const nav = navigator as Navigator & {
        canShare?: (data: { files: File[] }) => boolean;
        share?: (data: {
          files?: File[];
          text?: string;
          title?: string;
        }) => Promise<void>;
      };

      // 1) Mobile device share: uses the native OS share sheet (X mobile app)
      if (isMobile && nav.canShare?.({ files: [file] }) && nav.share) {
        await nav.share({
          files: [file],
          text: caption(),
          title: "HH Goa 2026 Builder Badge",
        });
        setStatus({ text: "Shared!" });
        return;
      }

      // 2) PC / Desktop / Laptop workflow:
      // Always trigger automatic download of the ID card PNG
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hhgoa2026-${fileSlug()}.png`;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);

      // Open the interactive desktop Share Modal Popup
      setShowShareModal(true);
      setStatus({
        text: "Badge downloaded! Copy text and share on X.",
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
              {busy === "download" ? (
                "Saving…"
              ) : (
                <>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  <span>Download</span>
                </>
              )}
            </button>
            <button
              className="btn btn-primary"
              onClick={handleShare}
              disabled={!photoImg || busy !== ""}
            >
              {busy === "share" ? (
                "Sharing…"
              ) : (
                <>
                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                  <span>Share to</span>
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </>
              )}
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

      {showScrollTop && (
        <button
          type="button"
          className="scroll-top-btn"
          onClick={scrollToTop}
          aria-label="Scroll to top"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </button>
      )}

      {/* ── Desktop Share to X Modal Popup ────────────────────────── */}
      {showShareModal && (
        <div className="modal-backdrop" onClick={() => setShowShareModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setShowShareModal(false)}
              aria-label="Close modal"
            >
              ✕
            </button>

            <div className="modal-header">
              <div className="modal-icon">𝕏</div>
              <div className="modal-title-group">
                <h3>Share to X / Twitter</h3>
                <p className="modal-subtitle">
                  Your ID badge has been downloaded automatically!
                </p>
              </div>
            </div>

            <div className="modal-steps">
              <div className="step-item step-done">
                <span className="step-badge">1</span>
                <span>ID badge saved to Downloads folder ✅</span>
              </div>
              <div className="step-item">
                <span className="step-badge">2</span>
                <span>Copy the pre-generated post content below</span>
              </div>
              <div className="step-item">
                <span className="step-badge">3</span>
                <span>Click &quot;Open X to Post&quot; and attach your badge</span>
              </div>
            </div>

            <div className="post-preview-box">
              <div className="post-preview-header">
                <span>Generated Post Content</span>
                <button
                  type="button"
                  className="copy-chip"
                  onClick={copyPostText}
                >
                  {copied ? "✅ Copied!" : "📋 Copy Text"}
                </button>
              </div>
              <pre className="post-preview-text">{caption()}</pre>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={copyPostText}
              >
                {copied ? "✅ Copied!" : "📋 Copy Post Text"}
              </button>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(caption())}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                onClick={() => setShowShareModal(false)}
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                <span>Open X to Post</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}
