// Branded placeholder artwork for blueprints, drawn as SVG in the site's own colours.
// Served by /api/art/<kind> so the same URL works on every client domain.
// Clients replace these with real photos later; until then sites never look empty.
//
//   /api/art/hero?scene=terminal&g=box&a=0ea5e9&b=6366f1      hero illustration (4:3)
//   /api/art/photo?g=bag&a=be185d&b=f59e0b&s=3                  card / gallery / product tile
//   /api/art/icon?g=shield&a=0ea5e9&b=6366f1                    small square icon
//   /api/art/avatar?a=0ea5e9&b=6366f1&s=2                       team member placeholder

/** 24×24 stroke glyphs (drawn for this project). */
export const GLYPHS: Record<string, string> = {
  box: "M3 7l9-4 9 4v10l-9 4-9-4z M3 7l9 4 9-4 M12 11v10",
  cloud: "M7 18h10a4 4 0 0 0 .5-7.97A6 6 0 0 0 6 9.5 4.5 4.5 0 0 0 7 18z",
  rocket: "M5 15c-1 1-2 4-2 6 2 0 5-1 6-2 M9 15l-3-3c2-6 7-9 13-9 0 6-3 11-9 13z M15 9.5a1.5 1.5 0 1 0-.01 0",
  code: "M8 6l-6 6 6 6 M16 6l6 6-6 6",
  terminal: "M4 6l6 6-6 6 M12 18h8",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z M9 12l2 2 4-4",
  chart: "M4 20V10 M10 20V4 M16 20v-7 M22 20H2",
  pulse: "M2 12h4l3-8 4 16 3-8h6",
  globe: "M12 2a10 10 0 1 0 0.01 0 M2 12h20 M12 2c3 3 4 6.5 4 10s-1 7-4 10c-3-3-4-6.5-4-10s1-7 4-10z",
  gear: "M12 9a3 3 0 1 0 .01 0 M12 2v3 M12 19v3 M4.9 4.9l2.1 2.1 M17 17l2.1 2.1 M2 12h3 M19 12h3 M4.9 19.1L7 17 M17 7l2.1-2.1",
  bolt: "M13 2L4 14h7l-1 8 9-12h-7z",
  lock: "M5 11h14v10H5z M8 11V7a4 4 0 0 1 8 0v4",
  users: "M9 11a4 4 0 1 0 .01 0 M2 21c0-4 3-6 7-6s7 2 7 6 M16 3.5a4 4 0 0 1 0 7.5 M18 15c2.5.5 4 2.5 4 6",
  bag: "M5 8h14l-1 13H6z M9 8V6a3 3 0 0 1 6 0v2",
  book: "M2 5h7a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H2z M22 5h-7a3 3 0 0 0-3 3v12a2 2 0 0 1 2-2h8z",
  cap: "M2 9l10-5 10 5-10 5z M6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5 M22 9v6",
  building: "M4 21V5l8-3v19 M12 8h8v13 M2 21h20 M7 8h2 M7 12h2 M7 16h2 M15 12h2 M15 16h2",
  scale: "M12 3v18 M6 21h12 M4 7h16 M7 7l-3 7a3 3 0 0 0 6 0z M17 7l-3 7a3 3 0 0 0 6 0z",
  heart: "M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-3 4.5 4.5 0 0 1 8 3c0 6-8 11-8 11z",
  star: "M12 2l3 7h7l-5.5 4.5 2 7.5-6.5-4.5L5.5 21l2-7.5L2 9h7z",
  leaf: "M5 21c0-9 6-15 16-16-1 10-7 16-16 16z M5 21l8-8",
  pen: "M3 21l4-1 12-12-3-3L4 17z M14 6l3 3",
  home: "M3 11l9-8 9 8 M5 9v12h14V9 M10 21v-6h4v6",
  cart: "M3 4h2l2.5 11h11L21 7H6.5 M9 20a1 1 0 1 0 .01 0 M18 20a1 1 0 1 0 .01 0",
  shirt: "M8 3l-5 3 2 4 3-1v12h8V9l3 1 2-4-5-3c0 2-2 3-4 3s-4-1-4-3z",
  coffee: "M4 9h13v5a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6z M17 10h2a2.5 2.5 0 0 1 0 5h-2 M8 3v3 M12 3v3",
  gift: "M3 9h18v4H3z M5 13h14v8H5z M12 9v12 M12 9c-2-5-6-4-6-2s3 2 6 2c3 0 6 0 6-2s-4-3-6 2z",
  sparkle: "M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z",
  flask: "M9 3h6 M10 3v6L4 19a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3l-6-10V3",
  trophy: "M7 4h10v5a5 5 0 0 1-10 0z M7 6H4a3 3 0 0 0 3 4 M17 6h3a3 3 0 0 1-3 4 M12 14v4 M8 21h8",
  music: "M9 18V5l12-2v13 M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0z M21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z",
  layers: "M12 2l10 5-10 5L2 7z M2 12l10 5 10-5 M2 17l10 5 10-5",
  plug: "M9 2v6 M15 2v6 M6 8h12v4a6 6 0 0 1-12 0z M12 18v4",
  branch: "M6 3v12 M18 6a3 3 0 1 0 .01 0 M6 15a3 3 0 1 0 .01 0 M18 9c0 5-6 4-11 7",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z M12 9a3 3 0 1 0 .01 0",
  truck: "M2 6h12v10H2z M14 10h4l3 3v3h-7 M6 19a2 2 0 1 0 .01 0 M17 19a2 2 0 1 0 .01 0",
  pin: "M12 22s7-7 7-12a7 7 0 0 0-14 0c0 5 7 12 7 12z M12 7a3 3 0 1 0 .01 0",
  clock: "M12 2a10 10 0 1 0 .01 0 M12 6v6l4 2",
  check: "M4 12l5 5L20 6",
  database: "M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3z M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6 M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3",
  wrench: "M14.5 6.5a4 4 0 0 0 5 5L12 19a2 2 0 0 1-3-3l7.5-7.5a4 4 0 0 0-2-2z M3 21l3-3",
  tooth: "M7 3c-3 0-4 3-3 6s1 5 2 9c.5 2 2 3 2.5 0S10 13 12 13s2.5 2 3.5 5 2 2 2.5 0c1-4 1-6 2-9s0-6-3-6c-2 0-3 1-5 1S9 3 7 3z",
  dumbbell: "M2 12h2 M20 12h2 M6 7v10 M18 7v10 M4 9v6 M20 9v6 M6 12h12",
  camera: "M3 7h4l2-3h6l2 3h4v13H3z M12 10a4 4 0 1 0 .01 0",
  plane: "M2 16l20-8-4 12-6-4-4 4v-6l10-6",
};

const HEX = /^[0-9a-f]{6}$/i;

export type ArtParams = { a: string; b: string; g: string; s: number; scene: string };

export function parseArtParams(q: URLSearchParams): ArtParams {
  const a = HEX.test(q.get("a") ?? "") ? (q.get("a") as string) : "4f46e5";
  const b = HEX.test(q.get("b") ?? "") ? (q.get("b") as string) : "06b6d4";
  const g = GLYPHS[q.get("g") ?? ""] ? (q.get("g") as string) : "sparkle";
  const s = Math.abs(parseInt(q.get("s") ?? "1", 10) || 1) % 1000;
  const scene = q.get("scene") ?? "showcase";
  return { a, b, g, s, scene };
}

/** Small deterministic random generator so the same URL always draws the same picture. */
function rng(seed: number) {
  let t = seed * 9301 + 49297;
  return () => {
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function glyph(name: string, x: number, y: number, size: number, color: string, width = 1.8) {
  const k = size / 24;
  return `<g transform="translate(${x} ${y}) scale(${k})" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"><path d="${GLYPHS[name] ?? GLYPHS.sparkle}"/></g>`;
}

function defs(a: string, b: string) {
  return `<defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#${a}"/><stop offset="1" stop-color="#${b}"/></linearGradient>
    <linearGradient id="soft" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#${a}" stop-opacity=".16"/><stop offset="1" stop-color="#${b}" stop-opacity=".22"/></linearGradient>
    <pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.6" fill="#fff" fill-opacity=".22"/></pattern>
    <filter id="sh" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#0f172a" flood-opacity=".28"/></filter>
  </defs>`;
}

function svg(w: number, h: number, body: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice">${body}</svg>`;
}

/** Window chrome: rounded panel with three dots. */
function windowFrame(x: number, y: number, w: number, h: number, fill: string, bar: string) {
  return `<g filter="url(#sh)"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="22" fill="${fill}"/></g>
    <rect x="${x}" y="${y}" width="${w}" height="46" rx="22" fill="${bar}"/><rect x="${x}" y="${y + 24}" width="${w}" height="22" fill="${bar}"/>
    <circle cx="${x + 28}" cy="${y + 23}" r="7" fill="#f87171"/><circle cx="${x + 52}" cy="${y + 23}" r="7" fill="#fbbf24"/><circle cx="${x + 76}" cy="${y + 23}" r="7" fill="#34d399"/>`;
}

function backdrop(w: number, h: number, r: () => number) {
  const blobs = Array.from({ length: 3 }, () => {
    const cx = Math.round(r() * w), cy = Math.round(r() * h), rad = Math.round(120 + r() * 220);
    return `<circle cx="${cx}" cy="${cy}" r="${rad}" fill="#fff" fill-opacity="${(0.06 + r() * 0.08).toFixed(2)}"/>`;
  }).join("");
  return `<rect width="${w}" height="${h}" fill="url(#bg)"/><rect width="${w}" height="${h}" fill="url(#dots)"/>${blobs}`;
}

/** Floating badge with a glyph. */
function badge(x: number, y: number, size: number, g: string, a: string) {
  return `<g filter="url(#sh)"><rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${size * 0.26}" fill="#fff"/></g>${glyph(g, x + size * 0.22, y + size * 0.22, size * 0.56, `#${a}`, 2)}`;
}

function heroScene(p: ArtParams) {
  const W = 1200, H = 900;
  const r = rng(p.s);
  const { a, b } = p;
  let main = "";
  switch (p.scene) {
    case "terminal": {
      main = windowFrame(150, 170, 900, 560, "#0b1220", "#151e31");
      const lines: [string, number][] = [["#34d399", 220], ["#e2e8f0", 420], ["#94a3b8", 360], [`#${b}`, 300], ["#e2e8f0", 470], ["#94a3b8", 260], ["#34d399", 340], ["#e2e8f0", 200]];
      main += lines.map(([c, len], i) => `<rect x="${200 + (i % 3 === 0 ? 0 : 36)}" y="${260 + i * 52}" width="${len}" height="16" rx="8" fill="${c}" fill-opacity="${i % 3 === 0 ? 1 : 0.75}"/>${i % 3 === 0 ? `<rect x="180" y="${260 + i * 52}" width="10" height="16" rx="3" fill="#${a}"/>` : ""}`).join("");
      main += `<rect x="236" y="676" width="16" height="22" fill="#e2e8f0"><animate attributeName="opacity" values="1;0;1" dur="1.2s" repeatCount="indefinite"/></rect>`;
      main += badge(960, 110, 150, p.g, a);
      break;
    }
    case "nodes": {
      main = windowFrame(130, 150, 940, 600, "#ffffff", "#f1f5f9");
      const pts = [[300, 330], [600, 290], [900, 340], [420, 560], [760, 580], [600, 450]];
      main += pts.flatMap(([x1, y1], i) => pts.slice(i + 1).filter(() => r() > 0.45).map(([x2, y2]) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#${a}" stroke-opacity=".35" stroke-width="4" stroke-dasharray="10 10"/>`)).join("");
      main += pts.map(([x, y], i) => `<rect x="${x - 62}" y="${y - 50}" width="124" height="100" rx="20" fill="${i === 5 ? `#${a}` : "#fff"}" stroke="#${i === 5 ? a : b}" stroke-width="4"/>${glyph(i === 5 ? p.g : ["box", "database", "cloud", "layers", "gear"][i % 5], x - 26, y - 26, 52, i === 5 ? "#fff" : `#${a}`, 2)}`).join("");
      break;
    }
    case "pipeline": {
      main = windowFrame(110, 200, 980, 500, "#ffffff", "#f1f5f9");
      const stages = ["branch", "code", "check", "box", "rocket"];
      main += `<line x1="230" y1="440" x2="970" y2="440" stroke="#${a}" stroke-opacity=".25" stroke-width="10" stroke-linecap="round"/>`;
      main += `<line x1="230" y1="440" x2="${230 + 185 * 3}" y2="440" stroke="#${a}" stroke-width="10" stroke-linecap="round"/>`;
      main += stages.map((g, i) => {
        const x = 230 + i * 185, done = i < 4;
        return `<circle cx="${x}" cy="440" r="56" fill="${done ? `#${a}` : "#fff"}" stroke="#${a}" stroke-width="6"/>${glyph(g, x - 26, 414, 52, done ? "#fff" : `#${a}`, 2.2)}<rect x="${x - 60}" y="530" width="120" height="14" rx="7" fill="#cbd5e1"/><rect x="${x - 40}" y="556" width="80" height="12" rx="6" fill="#e2e8f0"/>`;
      }).join("");
      main += `<rect x="170" y="290" width="260" height="22" rx="11" fill="#0f172a" fill-opacity=".8"/><rect x="170" y="326" width="170" height="14" rx="7" fill="#94a3b8"/>`;
      main += `<rect x="850" y="282" width="180" height="48" rx="24" fill="#dcfce7"/><circle cx="880" cy="306" r="9" fill="#16a34a"/><rect x="900" y="299" width="100" height="14" rx="7" fill="#16a34a"/>`;
      break;
    }
    case "app": {
      main = windowFrame(110, 140, 980, 640, "#ffffff", "#f1f5f9");
      main += `<rect x="110" y="186" width="200" height="594" fill="#f8fafc"/>`;
      main += Array.from({ length: 6 }, (_, i) => `<rect x="140" y="${226 + i * 52}" width="${110 + (i % 2) * 30}" height="16" rx="8" fill="${i === 1 ? `#${a}` : "#cbd5e1"}"/>`).join("");
      main += [0, 1, 2].map((i) => `<rect x="${350 + i * 235}" y="230" width="210" height="110" rx="18" fill="${i === 0 ? `#${a}` : "#f1f5f9"}"/><rect x="${374 + i * 235}" y="258" width="90" height="14" rx="7" fill="${i === 0 ? "#fff" : "#94a3b8"}" fill-opacity=".8"/><rect x="${374 + i * 235}" y="290" width="130" height="26" rx="10" fill="${i === 0 ? "#fff" : "#0f172a"}" fill-opacity="${i === 0 ? 1 : 0.8}"/>`).join("");
      const bars = Array.from({ length: 12 }, () => 60 + Math.round(r() * 220));
      main += `<rect x="350" y="370" width="680" height="370" rx="18" fill="#f8fafc"/>`;
      main += bars.map((h, i) => `<rect x="${385 + i * 53}" y="${715 - h}" width="30" height="${h}" rx="8" fill="${i % 3 === 2 ? `#${b}` : `#${a}`}" fill-opacity="${i % 3 === 2 ? 0.9 : 0.75}"/>`).join("");
      main += badge(1000, 640, 140, p.g, a);
      break;
    }
    case "plain": {
      // Quiet backdrop for heroes with text on top: one large, faint glyph off to the right.
      main = `<g opacity=".18">${glyph(p.g, 760, 260, 520, "#fff", 1)}</g>`;
      break;
    }
    case "products": {
      const tiles = [[160, 170], [480, 120], [800, 190], [260, 480], [600, 450], [900, 500]];
      const gl = [p.g, "bag", "gift", "star", "heart", "sparkle"];
      main = tiles.map(([x, y], i) => `<g filter="url(#sh)"><rect x="${x}" y="${y}" width="250" height="300" rx="28" fill="#fff"/></g><rect x="${x + 18}" y="${y + 18}" width="214" height="180" rx="18" fill="url(#soft)"/>${glyph(gl[i], x + 85, y + 68, 80, `#${a}`, 1.6)}<rect x="${x + 22}" y="${y + 218}" width="150" height="16" rx="8" fill="#0f172a" fill-opacity=".75"/><rect x="${x + 22}" y="${y + 250}" width="70" height="20" rx="10" fill="#${a}"/>`).join("");
      break;
    }
    default: {
      // "showcase": a large glyph in a glowing disc with floating cards around it.
      const sats = ["star", "check", "users", "chart", "heart", "sparkle", "globe", "clock"];
      main = `<circle cx="600" cy="450" r="260" fill="#fff" fill-opacity=".14"/><circle cx="600" cy="450" r="190" fill="#fff" fill-opacity=".9"/>${glyph(p.g, 480, 330, 240, `#${a}`, 1.4)}`;
      const spots = [[180, 200], [880, 170], [150, 600], [900, 610]];
      main += spots.map(([x, y], i) => `<g filter="url(#sh)"><rect x="${x}" y="${y}" width="200" height="110" rx="24" fill="#fff"/></g><circle cx="${x + 48}" cy="${y + 55}" r="28" fill="url(#bg)"/>${glyph(sats[(p.s + i) % sats.length], x + 34, y + 41, 28, "#fff", 2.2)}<rect x="${x + 90}" y="${y + 38}" width="88" height="13" rx="6.5" fill="#0f172a" fill-opacity=".75"/><rect x="${x + 90}" y="${y + 62}" width="58" height="11" rx="5.5" fill="#94a3b8"/>`).join("");
    }
  }
  return svg(W, H, defs(a, b) + backdrop(W, H, r) + main);
}

function photo(p: ArtParams) {
  const W = 1200, H = 900;
  const r = rng(p.s);
  const body = backdrop(W, H, r) + `<circle cx="600" cy="450" r="230" fill="#fff" fill-opacity=".16"/>` + glyph(p.g, 450, 300, 300, "#fff", 1.3);
  return svg(W, H, defs(p.a, p.b) + body);
}

function icon(p: ArtParams) {
  return svg(96, 96, defs(p.a, p.b) + `<rect width="96" height="96" rx="24" fill="url(#bg)"/>` + glyph(p.g, 24, 24, 48, "#fff", 2));
}

function avatar(p: ArtParams) {
  const r = rng(p.s);
  const W = 800, H = 800;
  return svg(W, H, defs(p.a, p.b) + backdrop(W, H, r) + `<circle cx="400" cy="320" r="130" fill="#fff" fill-opacity=".92"/><path d="M160 800c0-150 110-250 240-250s240 100 240 250z" fill="#fff" fill-opacity=".92"/>`);
}

export function renderArt(kind: string, p: ArtParams): string | null {
  switch (kind) {
    case "hero": return heroScene(p);
    case "photo": return photo(p);
    case "icon": return icon(p);
    case "avatar": return avatar(p);
    default: return null;
  }
}

/** Build an art URL (relative, so it works on any client domain). */
export function artUrl(kind: "hero" | "photo" | "icon" | "avatar", opts: { a: string; b: string; g?: string; s?: number; scene?: string }) {
  const q = new URLSearchParams({ a: opts.a.replace("#", ""), b: opts.b.replace("#", "") });
  if (opts.g) q.set("g", opts.g);
  if (opts.s) q.set("s", String(opts.s));
  if (opts.scene) q.set("scene", opts.scene);
  return `/api/art/${kind}?${q.toString()}`;
}
