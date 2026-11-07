// "Aurora Glass" — tuned to GitHub's dark canvas (#0d1117) so panels blend into the page.
export const C = {
  bg: "#0d1117",
  bg2: "#111827",
  panel: "#161b22",
  edge: "#30363d",
  text: "#e6edf3",
  muted: "#8b949e",
  dim: "#6e7681",
  cyan: "#22d3ee",
  indigo: "#818cf8",
  violet: "#a78bfa",
  pink: "#e879f9",
  green: "#34d399",
  amber: "#fbbf24",
};

export const SANS = `'Inter','Segoe UI',-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif`;
export const MONO = `'JetBrains Mono','SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace`;

export const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const r1 = (n) => Math.round(n * 10) / 10;

// Shared defs: aurora gradient (animated), glass panel, rotating border, glow filter.
export const baseDefs = () => `
  <linearGradient id="aurora" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="${C.cyan}"/>
    <stop offset="0.5" stop-color="${C.indigo}"/>
    <stop offset="1" stop-color="${C.pink}"/>
  </linearGradient>
  <linearGradient id="auroraMove" x1="0" y1="0" x2="2" y2="0" gradientUnits="objectBoundingBox" spreadMethod="reflect">
    <stop offset="0" stop-color="${C.cyan}"/>
    <stop offset="0.33" stop-color="${C.indigo}"/>
    <stop offset="0.66" stop-color="${C.pink}"/>
    <stop offset="1" stop-color="${C.cyan}"/>
    <animateTransform attributeName="gradientTransform" type="translate" values="0 0;-1 0" dur="6s" repeatCount="indefinite"/>
  </linearGradient>
  <linearGradient id="glass" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${C.panel}" stop-opacity="0.95"/>
    <stop offset="1" stop-color="${C.bg}" stop-opacity="0.95"/>
  </linearGradient>
  <linearGradient id="spin" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="400" y2="0">
    <stop offset="0" stop-color="${C.cyan}" stop-opacity="0"/>
    <stop offset="0.45" stop-color="${C.cyan}" stop-opacity="0.9"/>
    <stop offset="0.55" stop-color="${C.pink}" stop-opacity="0.9"/>
    <stop offset="1" stop-color="${C.pink}" stop-opacity="0"/>
  </linearGradient>
  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
    <feGaussianBlur stdDeviation="3" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <filter id="blur40" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="40"/></filter>`;

export const baseCss = `
  @keyframes float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-8px) } }
  @keyframes floatS { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-4px) } }
  @keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: .35 } }
  @keyframes ping { 0% { transform: scale(1); opacity: .8 } 100% { transform: scale(2.6); opacity: 0 } }
  @keyframes rise { from { opacity: 0; transform: translateY(18px) } to { opacity: 1; transform: translateY(0) } }
  @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
  @keyframes drift { 0%,100% { transform: translate(0,0) } 50% { transform: translate(40px,-20px) } }
  @keyframes dash { to { stroke-dashoffset: 0 } }
  @keyframes sweep { 0% { transform: translateX(-30%) } 100% { transform: translateX(130%) } }
  .float { animation: float 6s ease-in-out infinite; }
  .floatS { animation: floatS 4s ease-in-out infinite; }
  .rise { animation: rise .9s cubic-bezier(.2,.8,.2,1) both; }
  .fade { animation: fadeIn 1.2s ease both; }
  .pulse { animation: pulse 2s ease-in-out infinite; }
  .ping { animation: ping 2s cubic-bezier(0,0,.2,1) infinite; transform-box: fill-box; transform-origin: center; }
  .drift { animation: drift 14s ease-in-out infinite; }`;

// Glass panel with a slowly travelling light along its border.
export const panel = (w, h, rx = 18, animated = true) => `
  <rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="${rx}" fill="url(#glass)" stroke="${C.edge}"/>
  ${animated ? (() => {
    const P = Math.round(2 * (w + h));
    return `<rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="${rx}" fill="none" stroke="url(#aurora)" stroke-width="1.6" stroke-linecap="round"
      stroke-dasharray="${Math.round(P * 0.16)} ${Math.round(P * 0.84)}" filter="url(#glow)">
      <animate attributeName="stroke-dashoffset" from="${P}" to="0" dur="9s" repeatCount="indefinite"/>
    </rect>`;
  })() : ""}`;

export const svg = (w, h, body, { defs = "", css = "" } = {}) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none">
<defs>${baseDefs()}${defs}</defs>
<style>${baseCss}${css}</style>
${body}
</svg>
`;

/* ───────── Isometric helpers ───────── */
// Iso prism: centre of top face (x,y), half-width a, height h (drawn downward from top face).
export function prism(x, y, a, h, { top, left, right, stroke = "none", sw = 1 } = {}) {
  const b = a / 2;
  const N = [x, y - b], E = [x + a, y], S = [x, y + b], W = [x - a, y];
  const p = (pts) => pts.map((q) => `${r1(q[0])},${r1(q[1])}`).join(" ");
  const d = (q) => [q[0], q[1] + h];
  return `<polygon points="${p([W, S, d(S), d(W)])}" fill="${left}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>
<polygon points="${p([S, E, d(E), d(S)])}" fill="${right}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>
<polygon points="${p([N, E, S, W])}" fill="${top}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>`;
}

// Mix hex colour with black (t<0) or white (t>0).
export function shade(hex, t) {
  const n = parseInt(hex.slice(1), 16);
  let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const f = (c) => Math.round(t < 0 ? c * (1 + t) : c + (255 - c) * t);
  return "#" + [f(r), f(g), f(b)].map((v) => v.toString(16).padStart(2, "0")).join("");
}

// Interpolate along cyan → indigo → pink.
export function ramp(t) {
  const stops = [C.cyan, C.indigo, C.pink];
  const s = Math.min(0.9999, Math.max(0, t)) * (stops.length - 1);
  const i = Math.floor(s), f = s - i;
  const a = parseInt(stops[i].slice(1), 16), b = parseInt(stops[i + 1].slice(1), 16);
  const mix = (sh) => Math.round(((a >> sh) & 255) * (1 - f) + ((b >> sh) & 255) * f);
  return "#" + [mix(16), mix(8), mix(0)].map((v) => v.toString(16).padStart(2, "0")).join("");
}
