// Shared visual language for every SVG on the profile.
export const C = {
  bg: "#0A0A0C",
  panel: "#0F0F13",
  line: "#2A2419",
  gold: "#E3C178",
  goldDeep: "#A8823C",
  goldPale: "#F6E7C1",
  ivory: "#ECE6D9",
  muted: "#8C8573",
  dim: "#5B564A",
};

export const SERIF = `'Cormorant Garamond','Playfair Display',Didot,'Bodoni 72',Georgia,'Times New Roman',serif`;
export const SANS = `'Inter','Segoe UI','Helvetica Neue',Helvetica,Arial,sans-serif`;
export const MONO = `'JetBrains Mono','SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace`;

export const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Gold gradient + subtle shimmer, reused across files.
export const goldDefs = (id = "gold", shimmer = false) => `
  <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0" gradientUnits="objectBoundingBox">
    <stop offset="0" stop-color="${C.goldDeep}"/>
    <stop offset="0.35" stop-color="${C.gold}"/>
    <stop offset="0.5" stop-color="${C.goldPale}"/>
    <stop offset="0.65" stop-color="${C.gold}"/>
    <stop offset="1" stop-color="${C.goldDeep}"/>
    ${shimmer ? `<animateTransform attributeName="gradientTransform" type="translate" values="-1 0;1 0;-1 0" dur="9s" repeatCount="indefinite"/>` : ""}
  </linearGradient>`;

export const frame = (w, h, inner, extraDefs = "") => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none">
<defs>
  ${goldDefs("gold")}
  <linearGradient id="edge" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${C.gold}" stop-opacity="0.55"/>
    <stop offset="0.5" stop-color="${C.line}" stop-opacity="1"/>
    <stop offset="1" stop-color="${C.gold}" stop-opacity="0.35"/>
  </linearGradient>
  ${extraDefs}
</defs>
<rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" rx="16" fill="${C.bg}" stroke="url(#edge)"/>
${inner}
</svg>
`;

// Little L-shaped ornaments in the four corners.
export const corners = (w, h, inset = 14, len = 18) => {
  const c = C.gold, o = 0.7;
  return `<g stroke="${c}" stroke-opacity="${o}" stroke-width="1">
    <path d="M${inset} ${inset + len}V${inset}H${inset + len}"/>
    <path d="M${w - inset - len} ${inset}H${w - inset}V${inset + len}"/>
    <path d="M${inset} ${h - inset - len}V${h - inset}H${inset + len}"/>
    <path d="M${w - inset - len} ${h - inset}H${w - inset}V${h - inset - len}"/>
  </g>`;
};
