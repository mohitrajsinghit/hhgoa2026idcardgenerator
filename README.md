# HH Goa 2026 — Builder ID Card Generator

A one-pass, no-login web tool: upload a photo → fill in name + stack/role →
get a branded "boarding pass" builder badge → download or share straight to
X with `#FrameInGoa`.

Built for the [HH Goa 2026 shortlisting task](.) (Format B: Builder ID Card).

## How it works (and why it's fast + scalable)

- **Everything renders client-side on `<canvas>`.** There's no upload-to-a-
  server step to generate the card, so there's no server compute cost per
  user and no queue — generation is near-instant regardless of how many
  people use it at once.
- **Photo positioning is interactive.** Drag to reposition, pinch or scroll
  to zoom — the crop always fully covers the frame no matter the photo's
  aspect ratio or orientation.
- **HEIC/HEIF (iPhone photos)** are converted to JPEG in the browser
  (`heic2any`) before hitting the canvas.
- **Download** uses `canvas.toBlob()` → a real downloadable PNG file.
- **Share to X** tries three strategies, in order:
  1. **Native share sheet** (`navigator.share` with the image file attached)
     — used on most phones, including the X app. This is a true attached
     image, no hosting needed.
  2. **Desktop fallback:** the PNG is uploaded client-side, directly to
     Cloudinary (no backend involved — see setup below), and a tweet intent
     opens linking to this app's `/share` page, which sets Open Graph /
     Twitter Card meta tags to that image so the link preview shows the
     actual badge.
  3. **No Cloudinary configured:** the badge downloads and a text-only tweet
     intent opens, asking the user to attach the file manually.

Because generation is client-side and hosting is offloaded to Cloudinary's
CDN, this scales to a lot of concurrent users on Vercel's free tier without
any backend to provision.

## Run locally

```bash
npm install
cp .env.example .env.local   # optional, see Cloudinary setup below
npm run dev
```

Open http://localhost:3000.

## Cloudinary setup (optional, ~2 minutes)

Only needed for the **desktop** share flow (mobile uses the native share
sheet regardless). Without it, the app still works end-to-end — desktop
users just get the download + manual-attach fallback.

1. Create a free account at https://cloudinary.com.
2. In the dashboard, copy your **Cloud name**.
3. Go to **Settings → Upload → Upload presets → Add upload preset**.
   - Set **Signing Mode** to **Unsigned**.
   - Save, and copy the preset name.
4. Set these in `.env.local` (and in your Vercel project's Environment
   Variables):
   ```
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-preset-name
   ```

These are public/unsigned by design (the same pattern client-side upload
widgets use) — the preset should only allow image uploads into the
`hhgoa2026-builder-cards` folder this app writes to.

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import it at https://vercel.com/new.
3. Add the two `NEXT_PUBLIC_CLOUDINARY_*` env vars (optional, see above).
4. Deploy. That's your live link for the submission form.

No other configuration needed — it's a stock Next.js app.

## Customizing

- **Palette / fonts:** `lib/theme.ts` (colors) and `lib/fonts.ts` (Google
  Fonts — Space Grotesk / JetBrains Mono / Inter).
- **Card layout & size:** `lib/cardLayout.ts` (currently 1200×628, which also
  doubles as a good Open Graph image size).
- **Card drawing:** `lib/drawCard.ts` — everything is drawn with the Canvas
  2D API, so it's easy to add/remove elements (stamp, barcode, perforation,
  etc.).
- **Builder titles:** `lib/titles.ts` — keyword-matched pools based on the
  stack/role field, with a shuffle fallback.

## Known limitations

- Google Fonts are fetched at **build time** by `next/font`, so the build
  machine needs internet access (Vercel's does; a fully offline/sandboxed
  build environment won't be able to fetch them).
- EXIF auto-rotation for photos relies on the browser's native handling of
  `<img>` decoding, which is correct in current Chrome/Safari/Firefox but
  not guaranteed on very old browsers.
