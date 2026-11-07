// Generates live GitHub activity cards as SVGs committed to this repo.
// No third-party stats servers — runs inside GitHub Actions.
//   GH_TOKEN=... GH_LOGIN=shreyas0917 node scripts/generate-stats.mjs
//   node scripts/generate-stats.mjs --mock   (local preview with fake data)
import { mkdirSync, writeFileSync } from "node:fs";
import { C, SERIF, SANS, MONO, esc, frame, corners } from "./theme.mjs";

const OUT = new URL("../assets/generated/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const LOGIN = process.env.GH_LOGIN || "shreyas0917";
const MOCK = process.argv.includes("--mock");

const QUERY = `query($login:String!){
  user(login:$login){
    followers{ totalCount }
    pullRequests{ totalCount }
    repositories(ownerAffiliations:OWNER, isFork:false, first:100, orderBy:{field:PUSHED_AT, direction:DESC}){
      totalCount
      nodes{ stargazerCount languages(first:8, orderBy:{field:SIZE, direction:DESC}){ edges{ size node{ name } } } }
    }
    contributionsCollection{
      totalCommitContributions
      totalPullRequestContributions
      restrictedContributionsCount
      contributionCalendar{ totalContributions weeks{ contributionDays{ date contributionCount } } }
    }
  }
}`;

async function fetchData() {
  const token = process.env.GH_TOKEN;
  if (!token) throw new Error("GH_TOKEN is not set");
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { Authorization: `bearer ${token}`, "Content-Type": "application/json", "User-Agent": "profile-metrics" },
    body: JSON.stringify({ query: QUERY, variables: { login: LOGIN } }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data.user;
}

function mockData() {
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const weeks = [];
  const start = new Date();
  start.setDate(start.getDate() - 364 - start.getDay());
  for (let w = 0; w < 53; w++) {
    const days = [];
    for (let d = 0; d < 7; d++) {
      const dt = new Date(start); dt.setDate(start.getDate() + w * 7 + d);
      const busy = w > 34 || w % 9 < 2;
      days.push({ date: dt.toISOString().slice(0, 10), contributionCount: rnd() < (busy ? 0.7 : 0.15) ? Math.floor(rnd() * 12) : 0 });
    }
    weeks.push({ contributionDays: days });
  }
  const lang = (n, s) => ({ size: s, node: { name: n } });
  return {
    followers: { totalCount: 1 }, pullRequests: { totalCount: 23 },
    repositories: { totalCount: 47, nodes: [
      { stargazerCount: 3, languages: { edges: [lang("Go", 90000), lang("TypeScript", 40000)] } },
      { stargazerCount: 2, languages: { edges: [lang("JavaScript", 70000), lang("Python", 30000)] } },
      { stargazerCount: 1, languages: { edges: [lang("Java", 25000), lang("Shell", 6000), lang("HCL", 4000)] } },
    ] },
    contributionsCollection: { totalCommitContributions: 612, totalPullRequestContributions: 23, restrictedContributionsCount: 120,
      contributionCalendar: { totalContributions: 0, weeks } },
  };
}

const fmt = (n) => n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, "") + "k" : String(n);

function streaks(days) {
  let longest = 0, run = 0;
  for (const d of days) { run = d.contributionCount > 0 ? run + 1 : 0; longest = Math.max(longest, run); }
  let current = 0, i = days.length - 1;
  if (i >= 0 && days[i].contributionCount === 0) i--; // today may still be empty
  for (; i >= 0 && days[i].contributionCount > 0; i--) current++;
  return { current, longest };
}

/* ───────────── Overview card: KPIs + language bar ───────────── */
function overview(u) {
  const cc = u.contributionsCollection;
  const days = cc.contributionCalendar.weeks.flatMap((w) => w.contributionDays);
  const total = days.reduce((a, d) => a + d.contributionCount, 0);
  const stars = u.repositories.nodes.reduce((a, r) => a + r.stargazerCount, 0);
  const { current, longest } = streaks(days);

  const kpis = [
    [fmt(total), "CONTRIBUTIONS", "last 12 months"],
    [fmt(cc.totalCommitContributions), "COMMITS", "last 12 months"],
    [fmt(u.pullRequests.totalCount), "PULL REQUESTS", "all time"],
    [fmt(u.repositories.totalCount), "REPOSITORIES", stars > 0 ? `${stars} ★ earned` : "original work"],
    [`${current}d`, "CURRENT STREAK", `longest ${longest}d`],
  ];
  const W = 1200, colW = (W - 128) / kpis.length;
  const kpiSvg = kpis.map(([v, l, s], i) => {
    const x = 64 + i * colW + colW / 2;
    const sep = i ? `<line x1="${64 + i * colW}" y1="58" x2="${64 + i * colW}" y2="150" stroke="${C.line}"/>` : "";
    return `${sep}
      <text x="${x}" y="64" text-anchor="middle" font-family="${MONO}" font-size="10.5" letter-spacing="3" fill="${C.muted}">${l}</text>
      <text x="${x}" y="122" text-anchor="middle" font-family="${SERIF}" font-size="52" font-weight="500" fill="url(#gold)">${esc(v)}</text>
      <text x="${x}" y="148" text-anchor="middle" font-family="${SANS}" font-size="12.5" fill="${C.dim}">${esc(s)}</text>`;
  }).join("");

  // Languages by bytes across owned repos
  const bytes = {};
  for (const r of u.repositories.nodes) for (const e of r.languages.edges) bytes[e.node.name] = (bytes[e.node.name] || 0) + e.size;
  const sorted = Object.entries(bytes).sort((a, b) => b[1] - a[1]);
  const top = sorted.slice(0, 5);
  const rest = sorted.slice(5).reduce((a, [, s]) => a + s, 0);
  if (rest) top.push(["Other", rest]);
  const sum = top.reduce((a, [, s]) => a + s, 0) || 1;
  const tones = ["#F1D798", "#E3C178", "#C9A35A", "#A8823C", "#7E6230", "#4E4130"];
  const barX = 64, barW = W - 128, barY = 196;
  let bx = barX;
  const segs = top.map(([, s], i) => {
    const w = (s / sum) * barW;
    const r = `<rect x="${bx}" y="${barY}" width="${Math.max(w - 3, 1)}" height="10" fill="${tones[i]}"/>`;
    bx += w; return r;
  }).join("");
  let lx = barX;
  const legend = top.map(([n, s], i) => {
    const label = `${n}  ${((s / sum) * 100).toFixed(1)}%`;
    const g = `<g transform="translate(${lx} 238)"><rect width="9" height="9" rx="2" y="-8" fill="${tones[i]}"/>
      <text x="17" y="0" font-family="${MONO}" font-size="12" fill="${C.ivory}" fill-opacity="0.85">${esc(label)}</text></g>`;
    lx += label.length * 7.4 + 44; return g;
  }).join("");

  const H = 270;
  const inner = `${corners(W, H)}${kpiSvg}
    <text x="64" y="184" font-family="${MONO}" font-size="10.5" letter-spacing="3" fill="${C.muted}">LANGUAGES · BY CODE VOLUME</text>
    <clipPath id="bar"><rect x="${barX}" y="${barY}" width="${barW}" height="10" rx="5"/></clipPath>
    <g clip-path="url(#bar)"><rect x="${barX}" y="${barY}" width="${barW}" height="10" fill="${C.panel}"/>${segs}</g>
    ${legend}`;
  writeFileSync(OUT + "overview.svg", frame(W, H, inner));
}

/* ───────────── Contribution heatmap in gold ───────────── */
function heatmap(u) {
  const weeks = u.contributionsCollection.contributionCalendar.weeks.slice(-53);
  const days = weeks.flatMap((w) => w.contributionDays);
  const total = days.reduce((a, d) => a + d.contributionCount, 0);
  const max = Math.max(1, ...days.map((d) => d.contributionCount));
  const levels = ["#16161B", "#3A3020", "#6B552B", "#A8823C", "#E3C178"];
  const lvl = (n) => (n === 0 ? 0 : Math.min(4, Math.ceil((n / max) * 4)));

  const W = 1200, cell = 15, gap = 4, step = cell + gap;
  const gridW = weeks.length * step - gap;
  const x0 = Math.round((W - gridW) / 2) + 14, y0 = 92;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  let lastM = -1;
  const monthLabels = [];
  const cells = weeks.map((w, wi) => {
    const first = new Date(w.contributionDays[0].date + "T00:00:00Z");
    if (first.getUTCMonth() !== lastM && first.getUTCDate() <= 7 && wi < weeks.length - 2) {
      lastM = first.getUTCMonth();
      monthLabels.push(`<text x="${x0 + wi * step}" y="${y0 - 12}" font-family="${MONO}" font-size="11" fill="${C.muted}">${months[lastM]}</text>`);
    }
    return w.contributionDays.map((d) => {
      const dow = new Date(d.date + "T00:00:00Z").getUTCDay();
      const l = lvl(d.contributionCount);
      return `<rect x="${x0 + wi * step}" y="${y0 + dow * step}" width="${cell}" height="${cell}" rx="3.5" fill="${levels[l]}"${l === 4 ? ` stroke="${C.goldPale}" stroke-opacity="0.5"` : ""}><title>${d.contributionCount} on ${d.date}</title></rect>`;
    }).join("");
  }).join("");
  const dayLabels = [["Mon", 1], ["Wed", 3], ["Fri", 5]].map(([t, i]) =>
    `<text x="${x0 - 12}" y="${y0 + i * step + 11}" text-anchor="end" font-family="${MONO}" font-size="10.5" fill="${C.dim}">${t}</text>`).join("");
  const H = y0 + 7 * step + 58;
  const legend = levels.map((c, i) => `<rect x="${W - 64 - 5 * 19 + i * 19}" y="${H - 42}" width="14" height="14" rx="3" fill="${c}"/>`).join("");
  const updated = new Date().toISOString().slice(0, 10);

  const inner = `${corners(W, H)}
    <text x="64" y="50" font-family="${MONO}" font-size="10.5" letter-spacing="3" fill="${C.muted}">CONTRIBUTIONS · LAST 12 MONTHS</text>
    <text x="${W - 64}" y="54" text-anchor="end" font-family="${SERIF}" font-size="30" font-style="italic" fill="url(#gold)">${total.toLocaleString("en-IN")} contributions</text>
    ${monthLabels.join("")}${dayLabels}${cells}
    <text x="64" y="${H - 31}" font-family="${MONO}" font-size="10.5" letter-spacing="2" fill="${C.dim}">UPDATED ${updated} · SELF-HOSTED VIA GITHUB ACTIONS</text>
    <text x="${W - 64 - 5 * 19 - 10}" y="${H - 31}" text-anchor="end" font-family="${MONO}" font-size="10.5" fill="${C.dim}">less</text>
    ${legend}
    <text x="${W - 58}" y="${H - 31}" font-family="${MONO}" font-size="10.5" fill="${C.dim}">more</text>`;
  writeFileSync(OUT + "contributions.svg", frame(W, H, inner));
}

const data = MOCK ? mockData() : await fetchData();
overview(data);
heatmap(data);
console.log("metrics written to", OUT);
