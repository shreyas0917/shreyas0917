// Static artwork for the profile README: hero, section titles, project cards, toolkit, footer.
// Run: node scripts/build-static.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { C, SANS, MONO, esc, svg, panel, prism, shade, ramp } from "./theme.mjs";

const OUT = new URL("../assets/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const save = (name, s) => writeFileSync(OUT + name, s);
const chipW = (t, px, pad) => Math.round(t.length * px + pad);

const neonPrism = (x, y, a, h, color, extra = {}) =>
  prism(x, y, a, h, {
    top: shade(color, -0.25), left: shade(color, -0.62), right: shade(color, -0.75),
    stroke: color, sw: 1, ...extra,
  });

const aurora = (W, H) => `
  <g clip-path="url(#clip)" opacity="0.55">
    <circle class="drift" cx="${W * 0.78}" cy="${H * 0.35}" r="150" fill="${C.indigo}" filter="url(#blur40)" opacity="0.35"/>
    <circle class="drift" style="animation-delay:-5s;animation-duration:18s" cx="${W * 0.92}" cy="${H * 0.8}" r="120" fill="${C.pink}" filter="url(#blur40)" opacity="0.25"/>
    <circle class="drift" style="animation-delay:-9s;animation-duration:20s" cx="${W * 0.12}" cy="${H * 0.1}" r="130" fill="${C.cyan}" filter="url(#blur40)" opacity="0.18"/>
  </g>`;
const clip = (W, H, rx = 18) => `<clipPath id="clip"><rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="${rx}"/></clipPath>`;

/* ═════════════════════════════ HERO ═════════════════════════════ */
function hero() {
  const W = 1200, H = 430;

  // Rotating role line (typed-terminal feel)
  const roles = ["DevOps Engineer", "Cloud Engineer", "Site Reliability Engineer", "Platform Engineer"];
  const roleLines = roles.map((r, i) =>
    `<text class="role" style="animation-delay:${i * 3}s" x="96" y="262" font-family="${MONO}" font-size="20" fill="${C.cyan}">${esc(r)}</text>`).join("");

  // Tech chips
  let x = 72;
  const chips = ["Kubernetes", "AWS", "GCP", "Azure", "Argo CD", "Go", "Kafka"].map((t, i) => {
    const w = chipW(t, 7.3, 26);
    const g = `<g class="rise" style="animation-delay:${0.6 + i * 0.08}s"><g transform="translate(${x} 318)">
      <rect width="${w}" height="30" rx="15" fill="${C.panel}" stroke="${C.edge}"/>
      <text x="${w / 2}" y="19.5" text-anchor="middle" font-family="${MONO}" font-size="12" fill="${C.text}">${t}</text></g></g>`;
    x += w + 8;
    return g;
  }).join("");

  // ── Isometric cluster ──
  const cx = 905, py = 238, u = 62;
  const platform = `
    <g class="floatS" style="animation-duration:7s">
      ${prism(cx, py + 60, 215, 16, { top: "#121a2b", left: "#0b1120", right: "#080d18", stroke: C.indigo, sw: 1 })}
      ${prism(cx, py + 60, 215, 0.01, { top: "url(#gridFill)", left: "none", right: "none" })}
    </g>`;
  const pos = (i, j) => [cx + (i - j) * u, py + 60 + (i + j - 2) * (u / 2)];

  // lanes + travelling packets on the platform surface
  const lanes = [];
  const packets = [];
  for (let k = 0; k < 3; k++) {
    const [ax, ay] = pos(k, -0.6), [bx, by] = pos(k, 2.6);
    const [cx1, cy1] = pos(-0.6, k), [dx, dy] = pos(2.6, k);
    lanes.push(`<line x1="${ax}" y1="${ay}" x2="${bx}" y2="${by}"/>`, `<line x1="${cx1}" y1="${cy1}" x2="${dx}" y2="${dy}"/>`);
    const col = [C.cyan, C.pink, C.indigo][k];
    packets.push(
      `<circle r="3.2" fill="${col}" filter="url(#glow)"><animateMotion dur="${3 + k * 0.7}s" repeatCount="indefinite" path="M${ax},${ay} L${bx},${by}"/></circle>`,
      `<circle r="3.2" fill="${col}" filter="url(#glow)"><animateMotion dur="${3.6 + k * 0.5}s" begin="-${k}s" repeatCount="indefinite" path="M${dx},${dy} L${cx1},${cy1}"/></circle>`);
  }

  const heights = [[124, 92, 70], [96, 78, 54], [72, 56, 38]];
  const cubes = [];
  for (let s = 0; s <= 4; s++) for (let i = 0; i < 3; i++) {
    const j = s - i; if (j < 0 || j > 2) continue;
    const [bx, by] = pos(i, j), h = heights[i][j], col = ramp((i + j) / 4);
    const pod = `<circle cx="${bx}" cy="${by - h}" r="3" fill="${C.text}" class="pulse" style="animation-delay:${(i * 3 + j) * 0.3}s"/>`;
    cubes.push(`<g class="float" style="animation-delay:-${(i * 3 + j) * 0.7}s;animation-duration:${5 + ((i + j) % 3)}s">
      ${neonPrism(bx, by - h, 25, h, col)}${pod}</g>`);
  }

  const tag = (tx, ty, dot, label, delay) => {
    const w = chipW(label, 7, 36);
    return `<g class="floatS" style="animation-delay:${delay}s"><g transform="translate(${tx} ${ty})">
      <rect width="${w}" height="28" rx="8" fill="${C.bg}" fill-opacity="0.85" stroke="${C.edge}"/>
      <circle cx="14" cy="14" r="3.5" fill="${dot}"/>
      <text x="25" y="18.5" font-family="${MONO}" font-size="11.5" fill="${C.text}">${esc(label)}</text></g></g>`;
  };

  const orbit = `<ellipse cx="${cx}" cy="${py + 60}" rx="268" ry="134" stroke="${C.indigo}" stroke-opacity="0.18" stroke-dasharray="3 8"/>
    <circle r="4" fill="${C.pink}" filter="url(#glow)"><animateMotion dur="14s" repeatCount="indefinite" path="M${cx - 268},${py + 60} a268,134 0 1,0 536,0 a268,134 0 1,0 -536,0"/></circle>`;

  const body = `
  ${panel(W, H, 20)}
  ${aurora(W, H)}

  <g class="fade">
    <g transform="translate(72 64)">
      <rect width="300" height="30" rx="15" fill="${C.green}" fill-opacity="0.08" stroke="${C.green}" stroke-opacity="0.35"/>
      <circle class="ping" cx="18" cy="15" r="4" fill="${C.green}"/>
      <circle cx="18" cy="15" r="4" fill="${C.green}"/>
      <text x="32" y="19.5" font-family="${MONO}" font-size="11.5" letter-spacing="1" fill="${C.green}">ALL SYSTEMS OPERATIONAL · 99.9%</text>
    </g>
  </g>

  <g class="rise" style="animation-delay:.1s">
    <text x="68" y="172" font-family="${SANS}" font-size="74" font-weight="800" letter-spacing="-2" fill="url(#auroraMove)">Shreyas Wani</text>
  </g>
  <g class="rise" style="animation-delay:.25s">
    <text x="72" y="214" font-family="${SANS}" font-size="21" font-weight="500" fill="${C.text}">Advanced Associate Software Engineer <tspan fill="${C.muted}">@</tspan> <tspan fill="${C.indigo}" font-weight="700">Accenture</tspan></text>
  </g>
  <g class="rise" style="animation-delay:.4s">
    <text x="72" y="262" font-family="${MONO}" font-size="20" fill="${C.pink}">❯</text>
    ${roleLines}
  </g>
  <text x="72" y="292" font-family="${SANS}" font-size="14.5" fill="${C.muted}" class="fade">Building cloud platforms that stay up — and breaking them on purpose to prove it.</text>
  ${chips}
  <text x="72" y="392" font-family="${MONO}" font-size="12.5" fill="${C.cyan}" class="fade">↗ shreyaswani.vercel.app</text>
  <text x="270" y="392" font-family="${MONO}" font-size="12.5" fill="${C.dim}" class="fade">·  Pune, India</text>

  ${orbit}
  ${platform}
  <g stroke="${C.indigo}" stroke-opacity="0.25" stroke-dasharray="2 6">${lanes.join("")}</g>
  ${packets.join("")}
  ${cubes.join("")}
  ${tag(1010, 62, C.green, "argo-cd  synced", -1)}
  ${tag(650, 108, C.cyan, "p99  42ms", -2.5)}
  ${tag(1015, 360, C.pink, "pods  9/9 ready", -1.8)}`;

  const defs = `${clip(W, H, 20)}
  <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" stroke="${C.indigo}" stroke-opacity="0.15"/></pattern>
  <linearGradient id="gridFill" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.cyan}" stop-opacity="0.10"/><stop offset="1" stop-color="${C.pink}" stop-opacity="0.08"/></linearGradient>`;
  const css = `
  @keyframes cycle { 0% { opacity:0; transform: translateY(8px) } 3% { opacity:1; transform: translateY(0) } 22% { opacity:1; transform: translateY(0) } 25% { opacity:0; transform: translateY(-8px) } 100% { opacity:0 } }
  .role { opacity:0; animation: cycle 12s infinite; }`;
  save("hero.svg", svg(W, H, body, { defs, css }));
}

/* ═════════════════════════ SECTION TITLES ═════════════════════════ */
function title(file, num, label, sub) {
  const W = 1200, H = 100;
  const body = `
  <text x="600" y="24" text-anchor="middle" font-family="${MONO}" font-size="12" letter-spacing="4" fill="${C.indigo}">${num}</text>
  <text x="600" y="62" text-anchor="middle" font-family="${SANS}" font-size="32" font-weight="800" letter-spacing="-0.5" fill="${C.text}">${esc(label)}</text>
  <rect x="540" y="76" width="120" height="3" rx="1.5" fill="url(#aurora)" opacity="0.35"/>
  <clipPath id="u"><rect x="540" y="76" width="120" height="3" rx="1.5"/></clipPath>
  <g clip-path="url(#u)"><rect class="sw" x="540" y="76" width="50" height="3" fill="url(#aurora)"/></g>
  <text x="600" y="97" text-anchor="middle" font-family="${SANS}" font-size="13" fill="${C.muted}">${esc(sub)}</text>`;
  const css = `@keyframes sw { from { transform: translateX(-60px) } to { transform: translateX(130px) } } .sw { animation: sw 2.6s ease-in-out infinite alternate; }`;
  save(file, svg(W, H, body, { css }));
}

/* ═════════════════════════ PROJECT CARDS ═════════════════════════ */
const projects = [
  { slug: "marketpulse", tag: "SRE · PLATFORM", hue: C.cyan, name: "MarketPulse",
    lines: ["Market-data service operated like production —", "30-day SLOs, GitOps, chaos drills, postmortems."],
    stack: ["Kubernetes", "Argo CD", "Redis Streams"], metric: ["SLO", "99.9%"] },
  { slug: "seatlock", tag: "DISTRIBUTED SYSTEMS", hue: C.indigo, name: "SeatLock",
    lines: ["Concurrent seat booking with time-bound holds", "and a fail-closed policy when the cache dies."],
    stack: ["Go", "PostgreSQL", "Redis"], metric: ["DOUBLE-BOOKS", "0"] },
  { slug: "eventguard", tag: "EVENT STREAMING", hue: C.pink, name: "EventGuard",
    lines: ["Idempotent payment pipeline — exactly-once", "effects over at-least-once delivery."],
    stack: ["Kafka", "Idempotency", "Payments"], metric: ["DELIVERY", "1×"] },
  { slug: "taxpl", tag: "FINTECH BACKEND", hue: C.green, name: "Tax P&L Engine",
    lines: ["Multi-broker capital-gains and tax P&L", "for Indian equity traders."],
    stack: ["Go", "React", "Docker"], metric: ["BROKERS", "MULTI"] },
  { slug: "retrace", tag: "AI ENGINEERING", hue: C.violet, name: "Retrace",
    lines: ["Pinpoints where a RAG pipeline failed —", "retrieval, ranking or generation."],
    stack: ["Python", "LLMs", "RAG"], metric: ["STAGES", "3"] },
  { slug: "invoice", tag: "ENTERPRISE · SAP", hue: C.amber, name: "Invoice 3-Way Match",
    lines: ["PO ↔ GRN ↔ Invoice matching with an", "exception workbench for finance teams."],
    stack: ["SAP CAP", "Node.js", "Fiori"], metric: ["MATCH", "3-WAY"] },
];

function card(p, idx) {
  const W = 580, H = 250;
  let x = 30;
  const chips = p.stack.map((s) => {
    const w = chipW(s, 7, 22);
    const g = `<g transform="translate(${x} 188)"><rect width="${w}" height="28" rx="8" fill="${C.bg}" stroke="${C.edge}"/>
      <text x="${w / 2}" y="18.5" text-anchor="middle" font-family="${MONO}" font-size="11.5" fill="${C.text}">${esc(s)}</text></g>`;
    x += w + 8; return g;
  }).join("");
  // 3 floating iso slabs
  const sx = 470, sy = 92;
  const slabs = [2, 1, 0].map((k) =>
    `<g class="floatS" style="animation-delay:-${k * 0.8}s;animation-duration:${4 + k}s">${prism(sx, sy + k * 26, 52, 10, {
      top: k === 0 ? shade(p.hue, -0.15) : shade(p.hue, -0.55 + k * 0.05), left: shade(p.hue, -0.7), right: shade(p.hue, -0.8),
      stroke: p.hue, sw: k === 0 ? 1.2 : 0.8 })}</g>`).join("");
  const body = `
  ${panel(W, H, 18)}
  <g clip-path="url(#clip)"><circle cx="${W - 60}" cy="40" r="110" fill="${p.hue}" opacity="0.10" filter="url(#blur40)"/></g>
  <g class="rise">
    <rect x="30" y="30" width="${chipW(p.tag, 7.9, 22)}" height="24" rx="12" fill="${p.hue}" fill-opacity="0.1" stroke="${p.hue}" stroke-opacity="0.4"/>
    <text x="41" y="46" font-family="${MONO}" font-size="10.5" letter-spacing="1.5" fill="${p.hue}">${esc(p.tag)}</text>
    <text x="30" y="98" font-family="${SANS}" font-size="30" font-weight="800" letter-spacing="-0.5" fill="${C.text}">${esc(p.name)}</text>
    <text font-family="${SANS}" font-size="14.5" fill="${C.muted}"><tspan x="30" y="130">${esc(p.lines[0])}</tspan><tspan x="30" y="152">${esc(p.lines[1])}</tspan></text>
  </g>
  ${slabs}
  <text x="${sx}" y="196" text-anchor="middle" font-family="${MONO}" font-size="10" letter-spacing="1.5" fill="${C.dim}">${esc(p.metric[0])}</text>
  <text x="${sx}" y="222" text-anchor="middle" font-family="${SANS}" font-size="22" font-weight="800" fill="${p.hue}">${esc(p.metric[1])}</text>
  ${chips}`;
  save(`card-${p.slug}.svg`, svg(W, H, body, { defs: clip(W, H) }));
}

/* ═════════════════════════ TOOLKIT (3D stack) ═════════════════════════ */
function toolkit() {
  const layers = [
    ["Frontend", "UI layer", C.violet, ["React", "TypeScript", "Tailwind CSS"]],
    ["Backend", "Services", C.indigo, ["Go", "Java · Spring Boot", "Node.js · Express", "Python", "SAP CAP"]],
    ["Data & Streaming", "State & events", C.pink, ["PostgreSQL", "Redis", "Kafka", "MongoDB", "MySQL", "Supabase"]],
    ["DevOps & SRE", "Delivery · reliability", C.cyan, ["Docker", "Kubernetes", "Argo CD", "GitHub Actions", "Prometheus", "Grafana", "Linux"]],
    ["Cloud", "Infrastructure", C.green, ["AWS", "Google Cloud · GKE", "Microsoft Azure", "Vercel"]],
  ];
  const W = 1200, H = 540, sx = 200, top = 104, gap = 82, A = 128;
  // draw bottom layer first so upper layers sit in front
  const slabs = layers.map((l, i) => ({ l, i })).reverse().map(({ l, i }) => {
    const y = top + i * gap;
    return `<g class="floatS" style="animation-delay:-${i * 0.6}s;animation-duration:5s">
      ${prism(sx, y, A, 16, { top: shade(l[2], -0.72), left: shade(l[2], -0.8), right: shade(l[2], -0.86), stroke: l[2], sw: 1.2 })}
      <circle cx="${sx}" cy="${y}" r="4" fill="${l[2]}" class="pulse" style="animation-delay:${i * 0.4}s" filter="url(#glow)"/>
    </g>`;
  }).join("");
  const rows = layers.map((l, i) => {
    const y = top + i * gap;
    let x = 540;
    const chips = l[3].map((t) => {
      const w = chipW(t, 7.2, 20);
      const g = `<g transform="translate(${x} ${y - 13})"><rect width="${w}" height="30" rx="9" fill="${C.bg}" stroke="${shade(l[2], -0.45)}"/>
        <text x="${w / 2}" y="19.5" text-anchor="middle" font-family="${MONO}" font-size="12" fill="${C.text}">${esc(t)}</text></g>`;
      x += w + 7; return g;
    }).join("");
    return `<g class="rise" style="animation-delay:${0.15 * i}s">
      <path d="M${sx + A} ${y} H${384}" stroke="${l[2]}" stroke-opacity="0.5" stroke-dasharray="3 4"/>
      <circle cx="${sx + A}" cy="${y}" r="3" fill="${l[2]}"/>
      <text x="396" y="${y - 2}" font-family="${SANS}" font-size="17" font-weight="700" fill="${C.text}">${esc(l[0])}</text>
      <text x="396" y="${y + 18}" font-family="${SANS}" font-size="12" fill="${C.muted}">${esc(l[1])}</text>
      ${chips}
    </g>`;
  }).join("");
  const body = `${panel(W, H, 20)}${aurora(W, H)}${slabs}${rows}`;
  save("stack.svg", svg(W, H, body, { defs: clip(W, H, 20) }));
}

/* ═════════════════════════ FOOTER ═════════════════════════ */
function footer() {
  const W = 1200, H = 130;
  const ekg = "M40 60 H250 L262 30 L276 92 L290 44 L300 60 H880 L892 22 L906 98 L920 48 L930 60 H1160";
  const body = `
  <path d="${ekg}" stroke="${C.edge}" stroke-width="1.5"/>
  <path d="${ekg}" stroke="url(#aurora)" stroke-width="2" filter="url(#glow)" stroke-dasharray="260 1600">
    <animate attributeName="stroke-dashoffset" from="1600" to="-260" dur="4s" repeatCount="indefinite"/>
  </path>
  <rect x="440" y="44" width="320" height="34" rx="17" fill="${C.bg}"/>
  <text x="600" y="67" text-anchor="middle" font-family="${SANS}" font-size="17" font-weight="700" fill="${C.text}">Designed for the failure case.</text>
  <text x="600" y="118" text-anchor="middle" font-family="${MONO}" font-size="11" letter-spacing="3" fill="${C.dim}">SHREYAS WANI · SHREYASWANI.VERCEL.APP</text>`;
  save("footer.svg", svg(W, H, body));
}

hero();
title("title-work.svg", "01 / PROJECTS", "Selected Work", "Systems built to be operated, not just demoed");
title("title-stack.svg", "02 / TOOLKIT", "The Stack, Layer by Layer", "From cloud infrastructure up to the UI");
title("title-activity.svg", "03 / TELEMETRY", "Engineering Activity", "Live from GitHub · refreshed every 6 hours");
projects.forEach(card);
toolkit();
footer();
console.log("static assets written to", OUT);
