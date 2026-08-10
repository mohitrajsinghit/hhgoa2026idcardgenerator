export const COLORS = {
  // Primary backgrounds — dark forest green from hhgoa.com
  forest: "#0d3320",
  forestDark: "#082014",
  forestMid: "#1a4a2e",
  forestLight: "#236637",

  // Primary accent — bold yellow (headings, buttons on site)
  yellow: "#FFE600",
  yellowDim: "#d4c000",
  yellowPale: "#fff6a0",

  // Secondary accent — hot pink (गोवा text, badges, highlights)
  pink: "#FF007A",
  pinkLight: "#ff4da6",
  pinkDark: "#cc0062",

  // Card body — warm cream/sand
  cream: "#F5F0DC",
  creamDark: "#ede5c8",
  creamBorder: "#d4c99a",

  // Text
  ink: "#0d1f13",      // near-black green for text on cream
  white: "#FFFFFF",

  // Supporting
  gold: "#e8b33d",
  teal: "#1a7a5a",
};

// Populated at runtime from next/font instances (see app/layout.tsx),
// exposed via CSS variables so canvas drawing can reference the same
// underlying family names.
export const FONT_VARS = {
  display: "var(--font-display)",
  mono: "var(--font-mono)",
  body: "var(--font-body)",
};
