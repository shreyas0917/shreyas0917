// Builds the static artwork for the profile README (hero, titles, cards, stack, footer).
// Run: node scripts/build-static.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { C, SERIF, SANS, MONO, esc, goldDefs, frame, corners } from "./theme.mjs";

const OUT = new URL("../assets/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const save = (name, svg) => writeFileSync(OUT + name, svg);

const chipW = (t, px = 7.3, pad = 26) => Math.round(t.length * px + pad);

/* ───────────────────────────── HERO ───────────────────────────── */
function hero() {
  const W = 1200, H = 380;
  const roles = ["DEVOPS", "CLOUD", "SITE RELIABILITY", "PLATFORM"];
  let x = 72;
  const roleChips = roles
    .map((r) => {
      const w = chipW(r, 9.4, 40);
      const g = `<g transform="translate(${x} 262)">
        <rect width="${w}" height="34" rx="17" fill="${C.gold}" fill-opacity="0.06" stroke="${C.gold}" stroke-opacity="0.45"/>
        <text x="${w / 2}" y="22" text-anchor="middle" font-family="${MONO}" font-size="12.5" letter-spacing="2.4" fill="${C.gold}">${r}</text>
      </g>`;
      x += w + 12;
      return g;
    })
    .join("");

  // Monogram with orbiting rings (right side)
  const cx = 985, cy = 190;
  const orbit = `
  <g>
    <circle cx="${cx}" cy="${cy}" r="128" stroke="${C.gold}" stroke-opacity="0.10"/>
    <circle cx="${cx}" cy="${cy}" r="104" stroke="${C.gold}" stroke-opacity="0.35" stroke-dasharray="2 7">
      <animateTransform attributeName="transform" type="rotate" from="0 ${cx} ${cy}" to="360 ${cx} ${cy}" dur="60s" repeatCount="indefinite"/>
    </circle>
    <circle cx="${cx}" cy="${cy}" r="80" stroke="url(#goldS)" stroke-opacity="0.9"/>
    <g>
      <circle cx="${cx + 104}" cy="${cy}" r="3.5" fill="${C.goldPale}"/>
      <animateTransform attributeName="transform" type="rotate" from="0 ${cx} ${cy}" to="-360 ${cx} ${cy}" dur="24s" repeatCount="indefinite"/>
    </g>
    <g>
      <circle cx="${cx}" cy="${cy - 128}" r="2.5" fill="${C.gold}" fill-opacity="0.8"/>
      <animateTransform attributeName="transform" type="rotate" from="0 ${cx} ${cy}" to="360 ${cx} ${cy}" dur="40s" repeatCount="indefinite"/>
    </g>
    <text x="${cx}" y="${cy + 20}" text-anchor="middle" font-family="${SERIF}" font-size="58" font-style="italic" fill="url(#goldS)">SW</text>
    <text x="${cx}" y="${cy + 150}" text-anchor="middle" font-family="${MONO}" font-size="10.5" letter-spacing="3" fill="${C.muted}">EST. 2022 · PUNE</text>
  </g>`;

  const inner = `
  <rect width="${W}" height="${H}" rx="16" fill="url(#glow)"/>
  <g opacity="0.35">${Array.from({ length: 24 }, (_, i) => `<line x1="${i * 52}" y1="0" x2="${i * 52}" y2="${H}" stroke="${C.line}" stroke-opacity="0.35"/>`).join("")}</g>
  <rect width="${W}" height="${H}" rx="16" fill="url(#fade)"/>
  ${corners(W, H)}

  <text x="72" y="74" font-family="${MONO}" font-size="12" letter-spacing="5" fill="${C.gold}" fill-opacity="0.85">◆  SHREYASWANI.VERCEL.APP</text>

  <text x="68" y="160" font-family="${SERIF}" font-size="84" font-weight="500" letter-spacing="1" fill="url(#goldS)">Shreyas Wani</text>

  <text x="72" y="204" font-family="${SANS}" font-size="21" fill="${C.ivory}">Advanced Associate Software Engineer
    <tspan fill="${C.muted}">  ·  </tspan><tspan fill="${C.gold}">Accenture</tspan></text>
  <text x="72" y="236" font-family="${SANS}" font-size="15.5" fill="${C.muted}">I build cloud platforms that stay up — and break them on purpose to prove it.</text>

  ${roleChips}

  <line x1="72" y1="330" x2="740" y2="330" stroke="url(#rule)"/>
  <text x="72" y="355" font-family="${MONO}" font-size="11" letter-spacing="2.5" fill="${C.dim}">KUBERNETES · AWS · GCP · AZURE · ARGO CD · GO · KAFKA</text>
  ${orbit}`;

  const defs = `
  ${goldDefs("goldS", true)}
  <radialGradient id="glow" cx="0.82" cy="0.45" r="0.55">
    <stop offset="0" stop-color="${C.gold}" stop-opacity="0.13"/>
    <stop offset="1" stop-color="${C.gold}" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="fade" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="${C.bg}" stop-opacity="0.95"/>
    <stop offset="0.6" stop-color="${C.bg}" stop-opacity="0.55"/>
    <stop offset="1" stop-color="${C.bg}" stop-opacity="0.2"/>
  </linearGradient>
  <linearGradient id="rule" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="${C.gold}" stop-opacity="0.7"/>
    <stop offset="1" stop-color="${C.gold}" stop-opacity="0"/>
  </linearGradient>`;
  save("hero.svg", frame(W, H, inner, defs));
}

/* ───────────────────────── SECTION TITLES ───────────────────────── */
function title(file, numeral, label) {
  const W = 1200, H = 84;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none">
<defs>${goldDefs("gold")}
  <linearGradient id="l" x1="0" x2="1"><stop offset="0" stop-color="${C.gold}" stop-opacity="0"/><stop offset="1" stop-color="${C.gold}" stop-opacity="0.6"/></linearGradient>
  <linearGradient id="r" x1="0" x2="1"><stop offset="0" stop-color="${C.gold}" stop-opacity="0.6"/><stop offset="1" stop-color="${C.gold}" stop-opacity="0"/></linearGradient>
</defs>
<text x="600" y="22" text-anchor="middle" font-family="${MONO}" font-size="11" letter-spacing="4" fill="${C.muted}">${esc(numeral)}</text>
<line x1="250" y1="54" x2="420" y2="54" stroke="url(#l)"/>
<line x1="780" y1="54" x2="950" y2="54" stroke="url(#r)"/>
<path d="M430 54l4-4 4 4-4 4z M762 54l4-4 4 4-4 4z" fill="${C.gold}"/>
<text x="600" y="64" text-anchor="middle" font-family="${SERIF}" font-size="36" font-style="italic" fill="url(#gold)">${esc(label)}</text>
</svg>
`;
  save(file, svg);
}

/* ───────────────────────── PROJECT CARDS ───────────────────────── */
const projects = [
  {
    slug: "marketpulse", n: "01", tag: "SRE · PLATFORM",
    name: "MarketPulse",
    lines: ["Market-data service operated like production:", "30-day SLOs, GitOps, chaos drills & postmortems."],
    stack: ["Kubernetes", "Argo CD", "Redis Streams", "SLOs"],
  },
  {
    slug: "seatlock", n: "02", tag: "DISTRIBUTED SYSTEMS",
    name: "SeatLock",
    lines: ["Concurrent seat booking with time-bound holds", "and a fail-closed policy when the cache dies."],
    stack: ["Go", "PostgreSQL", "Redis"],
  },
  {
    slug: "eventguard", n: "03", tag: "EVENT STREAMING",
    name: "EventGuard",
    lines: ["Idempotent payment pipeline — exactly-once", "effects over at-least-once delivery."],
    stack: ["Kafka", "Idempotency", "Payments"],
  },
  {
    slug: "taxpl", n: "04", tag: "FINTECH BACKEND",
    name: "Tax P&L Engine",
    lines: ["Multi-broker capital-gains & tax P&L", "for Indian equity traders."],
    stack: ["Go", "React", "Docker"],
  },
  {
    slug: "retrace", n: "05", tag: "AI ENGINEERING",
    name: "Retrace",
    lines: ["Pinpoints where a RAG pipeline failed —", "retrieval, ranking or generation."],
    stack: ["Python", "LLMs", "RAG"],
  },
  {
    slug: "invoice", n: "06", tag: "ENTERPRISE · SAP",
    name: "Invoice 3-Way Match",
    lines: ["PO ↔ GRN ↔ Invoice matching with an", "exception workbench for finance teams."],
    stack: ["SAP CAP", "Node.js", "Fiori"],
  },
];

function card(p) {
  const W = 580, H = 230;
  let x = 32;
  const chips = p.stack
    .map((s) => {
      const w = chipW(s, 7.1, 22);
      const g = `<g transform="translate(${x} 170)"><rect width="${w}" height="28" rx="6" fill="${C.panel}" stroke="${C.line}"/>
        <text x="${w / 2}" y="18.5" text-anchor="middle" font-family="${MONO}" font-size="11.5" fill="${C.ivory}" fill-opacity="0.85">${esc(s)}</text></g>`;
      x += w + 8;
      return g;
    })
    .join("");
  const inner = `
  <rect width="${W}" height="${H}" rx="16" fill="url(#cg)"/>
  <text x="32" y="44" font-family="${MONO}" font-size="11" letter-spacing="3" fill="${C.gold}">${esc(p.tag)}</text>
  <text x="${W - 32}" y="58" text-anchor="end" font-family="${SERIF}" font-size="44" font-style="italic" fill="${C.gold}" fill-opacity="0.18">${p.n}</text>
  <text x="32" y="92" font-family="${SERIF}" font-size="34" font-weight="500" fill="${C.ivory}">${esc(p.name)}</text>
  <text font-family="${SANS}" font-size="14.5" fill="${C.muted}">
    <tspan x="32" y="124">${esc(p.lines[0])}</tspan>
    <tspan x="32" y="146">${esc(p.lines[1])}</tspan>
  </text>
  ${chips}
  <text x="${W - 32}" y="189" text-anchor="end" font-family="${MONO}" font-size="11.5" letter-spacing="1.5" fill="${C.gold}">VIEW →</text>`;
  const defs = `<radialGradient id="cg" cx="1" cy="0" r="0.9"><stop offset="0" stop-color="${C.gold}" stop-opacity="0.08"/><stop offset="1" stop-color="${C.gold}" stop-opacity="0"/></radialGradient>`;
  save(`card-${p.slug}.svg`, frame(W, H, inner, defs));
}

/* ───────────────────────────── STACK ───────────────────────────── */
function stack() {
  const rows = [
    ["Cloud", ["AWS", "Google Cloud · GKE", "Microsoft Azure", "Vercel"]],
    ["DevOps & SRE", ["Docker", "Kubernetes", "Argo CD", "GitHub Actions", "Prometheus", "Grafana", "Linux"]],
    ["Backend", ["Go", "Java · Spring Boot", "Node.js · Express", "Python", "SAP CAP"]],
    ["Data & Streaming", ["PostgreSQL", "Redis", "Kafka", "MongoDB", "MySQL", "Supabase"]],
    ["Frontend", ["React", "TypeScript", "Tailwind CSS"]],
  ];
  const W = 1200, rowH = 62, top = 46, H = top + rows.length * rowH + 30;
  const body = rows
    .map(([label, items], i) => {
      const y = top + i * rowH;
      let x = 300;
      const chips = items
        .map((t) => {
          const w = chipW(t, 7.4, 30);
          const g = `<g transform="translate(${x} ${y})"><rect width="${w}" height="34" rx="17" fill="${C.panel}" stroke="${i < 2 ? C.goldDeep : C.line}" stroke-opacity="${i < 2 ? 0.7 : 1}"/>
            <text x="${w / 2}" y="22" text-anchor="middle" font-family="${MONO}" font-size="12.5" fill="${i < 2 ? C.goldPale : C.ivory}" fill-opacity="0.9">${esc(t)}</text></g>`;
          x += w + 10;
          return g;
        })
        .join("");
      const sep = i ? `<line x1="64" y1="${y - 14}" x2="${W - 64}" y2="${y - 14}" stroke="${C.line}" stroke-opacity="0.6"/>` : "";
      return `${sep}<text x="64" y="${y + 24}" font-family="${SERIF}" font-size="24" font-style="italic" fill="url(#gold)">${esc(label)}</text>${chips}`;
    })
    .join("");
  save("stack.svg", frame(W, H, corners(W, H) + body));
}

/* ───────────────────────────── FOOTER ───────────────────────────── */
function footer() {
  const W = 1200, H = 120;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none">
<defs>${goldDefs("gold", true)}</defs>
<path d="M596 18l4-4 4 4-4 4z" fill="${C.gold}"/>
<text x="600" y="62" text-anchor="middle" font-family="${SERIF}" font-size="28" font-style="italic" fill="url(#gold)">Designed for the failure case.</text>
<text x="600" y="94" text-anchor="middle" font-family="${MONO}" font-size="11" letter-spacing="4" fill="${C.dim}">SHREYAS WANI · PUNE, INDIA</text>
</svg>
`;
  save("footer.svg", svg);
}

hero();
title("title-work.svg", "I", "Selected Work");
title("title-stack.svg", "II", "The Toolkit");
title("title-activity.svg", "III", "Engineering Activity");
projects.forEach(card);
stack();
footer();
console.log("static assets written to", OUT);
