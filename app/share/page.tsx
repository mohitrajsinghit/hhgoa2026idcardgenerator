import type { Metadata } from "next";

type Props = {
  searchParams: { img?: string; name?: string; title?: string };
};

/**
 * Bug #11 – Security: validate that the `img` query param is a Cloudinary URL
 * from our own cloud before injecting it into Open Graph <meta> tags.
 * Without this, any URL could be stuffed into OG image tags by anyone crafting
 * a /share link, turning the page into an open-redirect / image-injection vector
 * for Twitter/X crawlers.
 */
function sanitizeImgUrl(img: string | undefined): string | undefined {
  if (!img) return undefined;
  try {
    const url = new URL(img);
    // Only allow HTTPS Cloudinary URLs from the configured cloud name.
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const allowedHost = cloudName
      ? `res.cloudinary.com`
      : null;
    if (
      url.protocol !== "https:" ||
      !allowedHost ||
      url.hostname !== allowedHost ||
      // Ensure path starts with /<cloudName>/ to scope to our uploads only
      !url.pathname.startsWith(`/${cloudName}/`)
    ) {
      return undefined;
    }
    return img;
  } catch {
    return undefined;
  }
}

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const img = sanitizeImgUrl(searchParams.img);
  const who = searchParams.name?.trim();
  const badgeTitle = searchParams.title?.trim();

  const headline = who
    ? `${who}'s HH Goa 2026 Builder Badge`
    : "HH Goa 2026 Builder Badge";
  const description = badgeTitle
    ? `${badgeTitle} — built for HH Goa 2026. #FrameInGoa`
    : "Generated for HH Goa 2026. #FrameInGoa";

  return {
    title: headline,
    description,
    openGraph: {
      title: headline,
      description,
      images: img ? [{ url: img, width: 1200, height: 628 }] : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: headline,
      description,
      images: img ? [img] : [],
    },
  };
}

export default function SharePage({ searchParams }: Props) {
  const img = sanitizeImgUrl(searchParams.img);

  return (
    <div className="share-page">
      <div className="share-card">
        {img ? (
          <img src={img} alt="HH Goa 2026 builder badge" />
        ) : (
          <p style={{ color: "#FBF6EC" }}>No badge to show.</p>
        )}
        <br />
        <a className="cta" href="/">
          Make your own badge →
        </a>
      </div>
    </div>
  );
}

