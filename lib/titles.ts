type Pool = { keywords: string[]; titles: string[] };

const POOLS: Pool[] = [
  {
    keywords: ["frontend", "front-end", "react", "next", "css", "ui", "design", "figma"],
    titles: [
      "Pixel Lifeguard",
      "Component Wave Rider",
      "Chief Vibe Renderer",
      "Div Whisperer",
      "Layout Tide Handler",
      "CSS Shoreline Sculptor",
    ],
  },
  {
    keywords: ["backend", "back-end", "server", "api", "database", "sql", "infra", "devops", "postgres"],
    titles: [
      "Server Room Sailor",
      "Uptime Lifeguard",
      "Query Deep-Diver",
      "The Ship-It Type",
      "Latency Tamer",
      "Terminal Wizard",
    ],
  },
  {
    keywords: ["ml", "ai", "model", "llm", "data scientist", "ml engineer", "gpu"],
    titles: [
      "Gradient Descent Enjoyer",
      "Prompt Beachcomber",
      "Token Tide Reader",
      "Overfit Avoider-in-Chief",
      "Inference Islander",
      "Neural Net Navigator",
    ],
  },
  {
    keywords: ["mobile", "ios", "android", "flutter", "swift", "kotlin", "react native"],
    titles: [
      "Pocket App Smuggler",
      "Thumb-Zone Architect",
      "App Store Castaway",
      "Notch Negotiator",
      "On-Device Operator",
    ],
  },
  {
    keywords: ["founder", "pm", "product", "design lead", "cofounder", "co-founder", "ceo", "cto"],
    titles: [
      "Roadmap Navigator",
      "Chief Scope Creep Officer",
      "Deadline Surfer",
      "The Pivot Captain",
      "Visionary Beach Bum",
    ],
  },
  {
    keywords: ["fullstack", "full-stack", "full stack"],
    titles: [
      "Stack Overflow Local",
      "Both-Ends Beachcomber",
      "The Full Tide Builder",
      "Frontend-to-Backend Ferry",
      "Infinite Stack Surfer",
    ],
  },
  {
    keywords: ["rust", "solana", "crypto", "web3", "blockchain", "defi"],
    titles: [
      "Rust Reef Ranger",
      "On-Chain Lifeguard",
      "Decentralized Beach Bum",
      "Consensus Layer Captain",
      "Zero-Knowledge Surfer",
    ],
  },
];

const FALLBACK_TITLES = [
  "Certified Goa Ship-It Specialist",
  "Professional Scope Surfer",
  "Sunburnt Shipping Manager",
  "Chief Bug Tide-Turner",
  "Resident Demo-Day Survivor",
  "Wi-Fi Password Diplomat",
  "Senior Vibe Engineer",
  "Beachside Build Master",
  "Build-Ship-Repeat Believer",
  "Coconut Water Debugger",
];

export function generateBuilderTitle(stackInput: string): string {
  const s = stackInput.toLowerCase();
  const matched = POOLS.filter((p) => p.keywords.some((k) => s.includes(k)));
  const pool = matched.length
    ? matched.flatMap((p) => p.titles)
    : FALLBACK_TITLES;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function generateEntryNumber(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const n = (hash + Date.now()) % 9000;
  return String(1000 + n).padStart(4, "0");
}

export type BeachItem = { emoji: string; label: string };

// Generates 3 "beach bag" items for the card's info section, based on stack.
export function generateBeachBag(stack: string): BeachItem[] {
  const s = stack.toLowerCase();
  const all: BeachItem[][] = [
    s.includes("ai") || s.includes("ml") || s.includes("llm")
      ? [{ emoji: "🤖", label: "GPU SERVER" }, { emoji: "📊", label: "DATASETS" }]
      : [],
    s.includes("react") || s.includes("next") || s.includes("vue")
      ? [{ emoji: "⚛️", label: "REACT DEV" }, { emoji: "🎨", label: "FIGMA" }]
      : [],
    s.includes("rust") || s.includes("solana") || s.includes("web3")
      ? [{ emoji: "⛓️", label: "RUST BOOK" }, { emoji: "🪙", label: "TESTNET" }]
      : [],
    s.includes("mobile") || s.includes("ios") || s.includes("flutter")
      ? [{ emoji: "📱", label: "XCODE" }, { emoji: "☕", label: "SWIFT DOCS" }]
      : [],
    s.includes("backend") || s.includes("api") || s.includes("infra")
      ? [{ emoji: "🖥️", label: "TERMINAL" }, { emoji: "🐘", label: "POSTGRES" }]
      : [],
  ];
  const flat = all.flat();
  const picks = flat.length >= 2
    ? flat.slice(0, 2)
    : [{ emoji: "🥥", label: "COCONUT" }, { emoji: "</>", label: "VS CODE" }];
  picks.push({ emoji: "🎧", label: "LO-FI BEATS" });
  return picks.slice(0, 3);
}

