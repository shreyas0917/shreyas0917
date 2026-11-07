// Live GitHub telemetry rendered as animated SVGs, committed to this repo by GitHub Actions.
// No third-party stats servers.
//   GH_TOKEN=... GH_LOGIN=shreyas0917 node scripts/generate-stats.mjs
//   node scripts/generate-stats.mjs --mock     (local preview with fake data)
import { mkdirSync, writeFileSync } from "node:fs";
import { C, SANS, MONO, esc, r1, svg, panel, shade, ramp } from "./theme.mjs";

const OUT = new URL("../assets/generated/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const LOGIN = process.env.GH_LOGIN || "shreyas0917";
const MOCK = process.argv.includes("--mock");
const TZ_OFFSET_MIN = 330; // IST

/* ─────────────────────────── data ─────────────────────────── */
const Q_MAIN = `query($login:String!){
  user(login:$login){
    id
    followers{ totalCount }
    pullRequests{ totalCount }
    issues{ totalCount }
    repositories(ownerAffiliations:OWNER, isFork:false, first:100, orderBy:{field:PUSHED_AT, direction:DESC}){
      totalCount
      nodes{ name stargazerCount languages(first:8, orderBy:{field:SIZE, direction:DESC}){ edges{ size node{ name } } } }
    }
    contributionsCollection{
      totalCommitContributions
      totalPullRequestContributions
      totalPullRequestReviewContributions
      totalIssueContributions
      totalRepositoriesWithContributedCommits
      commitContributionsByRepository(maxRepositories:12){ repository{ name isPrivate } contributions{ totalCount } }
      contributionCalendar{ totalContributions weeks{ contributionDays{ date contributionCount } } }
    }
  }
}`;
const Q_COMMITS = `query($login:String!, $id:ID!, $since:GitTimestamp!){
  user(login:$login){
    repositories(ownerAffiliations:OWNER, isFork:false, first:25, orderBy:{field:PUSHED_AT, direction:DESC}){
      nodes{ defaultBranchRef{ target{ ... on Commit{ history(first:100, author:{id:$id}, since:$since){ nodes{ committedDate } } } } } }
    }
  }
}`;

async function gql(query, variables) {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { Authorization: `bearer ${process.env.GH_TOKEN}`, "Content-Type": "application/json", "User-Agent": "profile-telemetry" },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

async function liveData() {
  if (!process.env.GH_TOKEN) throw new Error("GH_TOKEN is not set");
  const { user } = await gql(Q_MAIN, { login: LOGIN });
  let commitTimes = [];
  try {
    const since = new Date(Date.now() - 365 * 864e5).toISOString();
    const d = await gql(Q_COMMITS, { login: LOGIN, id: user.id, since });
    commitTimes = d.user.repositories.nodes.flatMap((r) => r.defaultBranchRef?.target?.history?.nodes ?? []).map((n) => n.committedDate);
  } catch (e) { console.warn("commit-time query failed, clock will be empty:", e.message); }
  return { user, commitTimes };
}

function mockData() {
  let seed = 11;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const weeks = [], start = new Date();
  start.setUTCDate(start.getUTCDate() - 364 - start.getUTCDay());
  for (let w = 0; w < 53; w++) {
    const days = [];
    for (let d = 0; d < 7; d++) {
      const dt = new Date(start); dt.setUTCDate(start.getUTCDate() + w * 7 + d);
      const busy = w > 34 || w % 9 < 2;
      days.push({ date: dt.toISOString().slice(0, 10), contributionCount: rnd() < (busy ? 0.7 : 0.15) ? Math.floor(rnd() * 14) : 0 });
    }
    weeks.push({ contributionDays: days });
  }
  const lang = (n, s) => ({ size: s, node: { name: n } });
  const commitTimes = Array.from({ length: 300 }, () => {
    const h = [10, 11, 15, 21, 22, 23, 0, 1][Math.floor(rnd() * 8)];
    return new Date(Date.UTC(2026, 9, 1, (h + 24 - 5) % 24, 30)).toISOString();
  });
  return {
    commitTimes,
    user: {
      followers: { totalCount: 1 }, pullRequests: { totalCount: 21 }, issues: { totalCount: 4 },
      repositories: { totalCount: 44, nodes: [
        { name: "a", stargazerCount: 0, languages: { edges: [lang("TypeScript", 90000), lang("Go", 40000)] } },
        { name: "b", stargazerCount: 0, languages: { edges: [lang("Python", 70000), lang("JavaScript", 50000)] } },
        { name: "c", stargazerCount: 0, languages: { edges: [lang("Java", 25000), lang("Shell", 6000)] } },
      ] },
      contributionsCollection: {
        totalCommitContributions: 304, totalPullRequestContributions: 21, totalPullRequestReviewContributions: 6,
        totalIssueContributions: 4, totalRepositoriesWithContributedCommits: 18,
        commitContributionsByRepository: [["marketpulse", 62], ["Premium-Portfolio", 41], ["Invoice-3-Way-Match", 33], ["seatlock", 27], ["tax-pl-engine", 22], ["Retrace", 15]]
          .map(([name, n]) => ({ repository: { name }, contributions: { totalCount: n } })),
        contributionCalendar: { totalContributions: 0, weeks },
      },
    },
  };
}

/* ─────────────────────────── helpers ─────────────────────────── */
const fmt = (n) => (n >= 10000 ? (n / 1000).toFixed(1).replace(/\.0$/, "") + "k" : n.toLocaleString("en-IN"));
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const prettyDate = (iso) => { const d = new Date(iso + "T00:00:00Z"); return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`; };

function streaks(days) {
  let longest = 0, run = 0;
  for (const d of days) { run = d.contributionCount > 0 ? run + 1 : 0; longest = Math.max(longest, run); }
  let current = 0, i = days.length - 1;
  if (i >= 0 && days[i].contributionCount === 0) i--;
  for (; i >= 0 && days[i].contributionCount > 0; i--) current++;
  return { current, longest };
}

const label = (x, y, t, anchor = "start", fill = C.muted) =>
  `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="${MONO}" font-size="10.5" letter-spacing="2.5" fill="${fill}">${esc(t)}</text>`;

const growCss = `
  @keyframes growY { from { transform: scaleY(0) } to { transform: scaleY(1) } }
  @keyframes growX { from { transform: scaleX(0) } to { transform: scaleX(1) } }
  .gy { transform-box: fill-box; transform-origin: 50% 100%; animation: growY 1s cubic-bezier(.2,.8,.2,1) both; }
  .gx { transform-box: fill-box; transform-origin: 0 50%; animation: growX 1.1s cubic-bezier(.2,.8,.2,1) both; }
  .gr { transform-box: fill-box; transform-origin: 50% 100%; animation: growY .9s cubic-bezier(.2,.8,.2,1) both; }`;

/* ═════════════════ 1. 3D contribution skyline ═════════════════ */
function skyline(u) {
  const cc = u.contributionsCollection;
  const weeks = cc.contributionCalendar.weeks.slice(-53);
  const days = weeks.flatMap((w) => w.contributionDays);
  const total = days.reduce((a, d) => a + d.contributionCount, 0);
  const max = Math.max(1, ...days.map((d) => d.contributionCount));
  const best = days.reduce((a, d) => (d.contributionCount > a.contributionCount ? d : a), days[0]);
  const { current, longest } = streaks(days);
  const active = days.filter((d) => d.contributionCount > 0).length;

  const W = 1200, H = 540;
  const Ux = 17, Uy = 2.7, Vx = -10, Vy = 8.2;
  const x0 = 600 - (53 * Ux + 7 * Vx) / 2 + 20, y0 = 262;
  const P = (c, r) => [x0 + c * Ux + r * Vx, y0 + c * Uy + r * Vy];
  const pts = (arr) => arr.map((p) => `${r1(p[0])},${r1(p[1])}`).join(" ");

  const bars = [];
  weeks.forEach((w, c) => w.contributionDays.forEach((d) => {
    const r = new Date(d.date + "T00:00:00Z").getUTCDay();
    bars.push({ c, r, n: d.contributionCount, date: d.date });
  }));
  bars.sort((a, b) => (a.c * Uy + a.r * Vy) - (b.c * Uy + b.r * Vy));

  const k = 0.8, off = (1 - k) / 2;
  const body = bars.map(({ c, r, n, date }) => {
    const A = P(c + off, r + off), B = P(c + 1 - off, r + off), Cc = P(c + 1 - off, r + 1 - off), D = P(c + off, r + 1 - off);
    const t = Math.log1p(n) / Math.log1p(max);
    const h = n ? 6 + Math.pow(t, 1.3) * 104 : 1.4;
    const up = (p) => [p[0], p[1] - h];
    const col = n ? ramp(t) : null;
    const top = n ? shade(col, -0.05) : "#1c2129";
    const right = n ? shade(col, -0.45) : "#14181f";
    const left = n ? shade(col, -0.62) : "#10141a";
    const stroke = n ? shade(col, 0.15) : "#262c36";
    return `<g class="gr" style="animation-delay:${r1(c * 0.025 + r * 0.01)}s"><title>${n} contributions on ${date}</title>
<polygon points="${pts([B, Cc, up(Cc), up(B)])}" fill="${right}"/>
<polygon points="${pts([D, Cc, up(Cc), up(D)])}" fill="${left}"/>
<polygon points="${pts([up(A), up(B), up(Cc), up(D)])}" fill="${top}" stroke="${stroke}" stroke-width="0.5" stroke-opacity="0.6"/></g>`;
  }).join("");

  // month labels along front edge
  let lastM = -1;
  const months = weeks.map((w, c) => {
    const d = new Date(w.contributionDays[0].date + "T00:00:00Z");
    if (d.getUTCMonth() === lastM || c > 50) return "";
    lastM = d.getUTCMonth();
    const [mx, my] = P(c + 0.5, 7.9);
    return `<text x="${r1(mx)}" y="${r1(my + 14)}" font-family="${MONO}" font-size="10.5" fill="${C.dim}">${MONTHS[lastM]}</text>`;
  }).join("");

  const kpi = (x, value, name, sub, color) => `
    <g class="rise">${label(x, 52, name)}
    <text x="${x}" y="90" font-family="${SANS}" font-size="30" font-weight="800" fill="${color}">${esc(value)}</text>
    <text x="${x}" y="110" font-family="${SANS}" font-size="12" fill="${C.dim}">${esc(sub)}</text></g>`;

  const out = `
  ${panel(W, H, 20)}
  <g clip-path="url(#clip)"><circle class="drift" cx="900" cy="330" r="200" fill="${C.indigo}" opacity="0.12" filter="url(#blur40)"/></g>
  ${label(56, 52, "CONTRIBUTION SKYLINE · 12 MONTHS", C.indigo)}
  <text x="54" y="104" font-family="${SANS}" font-size="54" font-weight="800" letter-spacing="-1.5" fill="url(#auroraMove)">${fmt(total)}</text>
  <text x="58" y="128" font-family="${SANS}" font-size="13" fill="${C.muted}">contributions across ${active} active days</text>
  ${kpi(560, fmt(cc.totalCommitContributions), "COMMITS", "last 12 months", C.cyan)}
  ${kpi(720, `${current}d`, "CURRENT STREAK", `longest ${longest}d`, C.indigo)}
  ${kpi(880, String(best.contributionCount), "BEST DAY", prettyDate(best.date), C.pink)}
  ${kpi(1030, fmt(cc.totalRepositoriesWithContributedCommits), "REPOS TOUCHED", "with commits", C.green)}
  ${body}
  ${months}
  ${label(56, H - 26, `UPDATED ${new Date().toISOString().slice(0, 10)} · SELF-HOSTED`, "start", C.dim)}
  <g transform="translate(${W - 230} ${H - 38})">${label(0, 12, "LESS", "start", C.dim)}
    ${[0, 0.25, 0.5, 0.75, 1].map((t, i) => `<rect x="${44 + i * 20}" y="2" width="14" height="14" rx="3" fill="${t ? ramp(t) : "#1c2129"}"/>`).join("")}
    ${label(152, 12, "MORE", "start", C.dim)}</g>`;
  writeFileSync(OUT + "skyline.svg", svg(W, H, out, { defs: `<clipPath id="clip"><rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="20"/></clipPath>`, css: growCss }));
}

/* ═════════════════ 2. Insights: mix · clock · weekday ═════════════════ */
function insights(u, commitTimes) {
  const cc = u.contributionsCollection;
  const W = 1200, H = 400, colW = 400;

  // a) contribution mix donut
  const mix = [
    ["Commits", cc.totalCommitContributions, C.cyan],
    ["Pull requests", cc.totalPullRequestContributions, C.indigo],
    ["Code reviews", cc.totalPullRequestReviewContributions, C.pink],
    ["Issues", cc.totalIssueContributions, C.green],
  ];
  const mixTotal = mix.reduce((a, m) => a + m[1], 0) || 1;
  const R = 74, CIRC = 2 * Math.PI * R, dcx = 120, dcy = 220;
  let acc = 0;
  const arcs = mix.map(([, v, col], i) => {
    const len = Math.max(0, (v / mixTotal) * CIRC - (v ? 3 : 0));
    const a = `<circle cx="${dcx}" cy="${dcy}" r="${R}" stroke="${col}" stroke-width="16" stroke-linecap="butt"
      stroke-dasharray="${r1(len)} ${r1(CIRC)}" stroke-dashoffset="${r1(-acc)}" transform="rotate(-90 ${dcx} ${dcy})">
      <animate attributeName="stroke-dasharray" values="0 ${r1(CIRC)};${r1(len)} ${r1(CIRC)}" dur="${1 + i * 0.2}s" fill="freeze"/></circle>`;
    acc += (v / mixTotal) * CIRC; return a;
  }).join("");
  const legend = mix.map(([n, v, col], i) => `<g class="rise" style="animation-delay:${0.2 + i * 0.1}s">
    <rect x="232" y="${158 + i * 34}" width="10" height="10" rx="3" fill="${col}"/>
    <text x="252" y="${167 + i * 34}" font-family="${SANS}" font-size="13" fill="${C.muted}">${n}</text>
    <text x="370" y="${167 + i * 34}" text-anchor="end" font-family="${SANS}" font-size="14" font-weight="700" fill="${C.text}">${fmt(v)}</text></g>`).join("");

  // b) commit clock (IST)
  const hours = Array(24).fill(0);
  for (const t of commitTimes) {
    const d = new Date(t);
    const m = (d.getUTCHours() * 60 + d.getUTCMinutes() + TZ_OFFSET_MIN) % 1440;
    hours[Math.floor(m / 60)]++;
  }
  const hMax = Math.max(1, ...hours);
  const peak = hours.indexOf(Math.max(...hours));
  const hourName = (h) => `${h % 12 || 12} ${h < 12 ? "AM" : "PM"}`;
  const ccx = colW + 200, ccy = 246, rin = 44, rlen = 62;
  const spokes = hours.map((n, h) => {
    const ang = (h / 24) * 2 * Math.PI - Math.PI / 2;
    const len = 3 + (n / hMax) * rlen;
    const x1 = ccx + Math.cos(ang) * rin, y1 = ccy + Math.sin(ang) * rin;
    const x2 = ccx + Math.cos(ang) * (rin + len), y2 = ccy + Math.sin(ang) * (rin + len);
    const col = n ? ramp(n / hMax) : C.edge;
    const L = r1(len);
    return `<line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}" stroke="${col}" stroke-width="7" stroke-linecap="round" stroke-dasharray="${L} ${L}">
      <animate attributeName="stroke-dashoffset" values="${L};0" dur="${0.6 + h * 0.03}s" fill="freeze"/></line>`;
  }).join("");
  const ticks = [[0, "12a"], [6, "6a"], [12, "12p"], [18, "6p"]].map(([h, t]) => {
    const ang = (h / 24) * 2 * Math.PI - Math.PI / 2, rr = rin + rlen + 18;
    return `<text x="${r1(ccx + Math.cos(ang) * rr)}" y="${r1(ccy + Math.sin(ang) * rr + 4)}" text-anchor="middle" font-family="${MONO}" font-size="10" fill="${C.dim}">${t}</text>`;
  }).join("");
  const hasClock = commitTimes.length > 0;

  // c) weekday rhythm
  const wd = Array(7).fill(0);
  for (const w of cc.contributionCalendar.weeks) for (const d of w.contributionDays) wd[new Date(d.date + "T00:00:00Z").getUTCDay()] += d.contributionCount;
  const order = [1, 2, 3, 4, 5, 6, 0], names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const wMax = Math.max(1, ...wd);
  const bestWd = wd.indexOf(Math.max(...wd));
  const bx0 = 2 * colW + 50, baseY = 318, bh = 150, bw = 30, bgap = 14;
  const wbars = order.map((di, i) => {
    const h = Math.max(3, (wd[di] / wMax) * bh), x = bx0 + i * (bw + bgap);
    const col = ramp(wd[di] / wMax);
    return `<rect x="${x}" y="${baseY - bh}" width="${bw}" height="${bh}" rx="8" fill="${C.panel}"/>
      <rect class="gy" style="animation-delay:${i * 0.08}s" x="${x}" y="${r1(baseY - h)}" width="${bw}" height="${r1(h)}" rx="8" fill="url(#wg${i})"/>
      <text x="${x + bw / 2}" y="${baseY + 22}" text-anchor="middle" font-family="${MONO}" font-size="11" fill="${di === bestWd ? C.text : C.dim}">${names[di]}</text>
      <linearGradient id="wg${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${col}"/><stop offset="1" stop-color="${shade(col, -0.6)}"/></linearGradient>`;
  }).join("");

  const sep = (x) => `<line x1="${x}" y1="40" x2="${x}" y2="${H - 40}" stroke="${C.edge}" stroke-opacity="0.7"/>`;
  const out = `
  ${panel(W, H, 20)}
  ${sep(colW)}${sep(2 * colW)}
  ${label(40, 56, "CONTRIBUTION MIX", C.cyan)}
  <text x="40" y="88" font-family="${SANS}" font-size="20" font-weight="800" fill="${C.text}">How I ship</text>
  <circle cx="${dcx}" cy="${dcy}" r="${R}" stroke="${C.panel}" stroke-width="16"/>
  ${arcs}
  <text x="${dcx}" y="${dcy + 6}" text-anchor="middle" font-family="${SANS}" font-size="28" font-weight="800" fill="${C.text}">${fmt(mixTotal)}</text>
  <text x="${dcx}" y="${dcy + 26}" text-anchor="middle" font-family="${MONO}" font-size="9.5" letter-spacing="2" fill="${C.dim}">TOTAL</text>
  ${legend}

  ${label(colW + 40, 56, "COMMIT CLOCK · IST", C.indigo)}
  <text x="${colW + 40}" y="88" font-family="${SANS}" font-size="20" font-weight="800" fill="${C.text}">${hasClock ? `Peak hour: ${hourName(peak)}` : "When I commit"}</text>
  <circle cx="${ccx}" cy="${ccy}" r="${rin - 10}" fill="${C.bg}" stroke="${C.edge}"/>
  ${spokes}${ticks}
  <text x="${ccx}" y="${ccy + 5}" text-anchor="middle" font-family="${SANS}" font-size="15" font-weight="800" fill="${C.text}">${hasClock ? fmt(commitTimes.length) : "—"}</text>
  <text x="${ccx}" y="${ccy + 20}" text-anchor="middle" font-family="${MONO}" font-size="8.5" letter-spacing="1.5" fill="${C.dim}">COMMITS</text>

  ${label(2 * colW + 40, 56, "WEEKLY RHYTHM", C.pink)}
  <text x="${2 * colW + 40}" y="88" font-family="${SANS}" font-size="20" font-weight="800" fill="${C.text}">Most active on ${["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"][bestWd]}</text>
  ${wbars}`;
  writeFileSync(OUT + "insights.svg", svg(W, H, out, { css: growCss }));
}

/* ═════════════════ 3. Top repos + languages ═════════════════ */
function reposLangs(u) {
  const cc = u.contributionsCollection;
  const W = 1200, H = 360, half = 600;
  const repos = cc.commitContributionsByRepository.filter((r) => !r.repository.isPrivate).map((r) => [r.repository.name, r.contributions.totalCount]).slice(0, 6);
  const rMax = Math.max(1, ...repos.map((r) => r[1]));
  const rows = repos.map(([name, n], i) => {
    const y = 112 + i * 38, w = Math.max(6, (n / rMax) * 300);
    return `<g class="rise" style="animation-delay:${i * 0.07}s">
      <text x="40" y="${y + 13}" font-family="${MONO}" font-size="12.5" fill="${C.text}">${esc(name.length > 22 ? name.slice(0, 21) + "…" : name)}</text>
      <rect x="230" y="${y}" width="300" height="18" rx="9" fill="${C.panel}"/>
      <rect class="gx" style="animation-delay:${0.2 + i * 0.08}s" x="230" y="${y}" width="${r1(w)}" height="18" rx="9" fill="url(#aurora)" opacity="${1 - i * 0.1}"/>
      <text x="548" y="${y + 13}" text-anchor="end" font-family="${SANS}" font-size="12.5" font-weight="700" fill="${C.muted}">${n}</text></g>`;
  }).join("");

  const bytes = {};
  for (const r of u.repositories.nodes) for (const e of r.languages.edges) bytes[e.node.name] = (bytes[e.node.name] || 0) + e.size;
  const sorted = Object.entries(bytes).sort((a, b) => b[1] - a[1]);
  const top = sorted.slice(0, 5);
  const rest = sorted.slice(5).reduce((a, [, s]) => a + s, 0);
  if (rest) top.push(["Other", rest]);
  const sum = top.reduce((a, [, s]) => a + s, 0) || 1;
  const tones = [C.cyan, C.indigo, C.pink, C.green, C.amber, C.dim];
  const R = 70, CIRC = 2 * Math.PI * R, dcx = half + 130, dcy = 205;
  let acc = 0;
  const arcs = top.map(([, s], i) => {
    const len = Math.max(0, (s / sum) * CIRC - 3);
    const a = `<circle cx="${dcx}" cy="${dcy}" r="${R}" stroke="${tones[i]}" stroke-width="22" stroke-dasharray="${r1(len)} ${r1(CIRC)}" stroke-dashoffset="${r1(-acc)}" transform="rotate(-90 ${dcx} ${dcy})">
      <animate attributeName="stroke-dasharray" values="0 ${r1(CIRC)};${r1(len)} ${r1(CIRC)}" dur="${1 + i * 0.15}s" fill="freeze"/></circle>`;
    acc += (s / sum) * CIRC; return a;
  }).join("");
  const legend = top.map(([n, s], i) => `<g class="rise" style="animation-delay:${0.2 + i * 0.08}s">
    <rect x="${half + 250}" y="${114 + i * 36}" width="10" height="10" rx="3" fill="${tones[i]}"/>
    <text x="${half + 270}" y="${123 + i * 36}" font-family="${SANS}" font-size="13.5" fill="${C.text}">${esc(n)}</text>
    <text x="${W - 50}" y="${123 + i * 36}" text-anchor="end" font-family="${MONO}" font-size="12.5" fill="${C.muted}">${((s / sum) * 100).toFixed(1)}%</text></g>`).join("");

  const stars = u.repositories.nodes.reduce((a, r) => a + r.stargazerCount, 0);
  const out = `
  ${panel(W, H, 20)}
  <line x1="${half}" y1="40" x2="${half}" y2="${H - 40}" stroke="${C.edge}" stroke-opacity="0.7"/>
  ${label(40, 56, "WHERE THE COMMITS WENT", C.cyan)}
  <text x="40" y="88" font-family="${SANS}" font-size="20" font-weight="800" fill="${C.text}">Most active repositories</text>
  ${rows}
  ${label(half + 50, 56, "LANGUAGES · BY CODE VOLUME", C.pink)}
  <text x="${half + 50}" y="88" font-family="${SANS}" font-size="20" font-weight="800" fill="${C.text}">${fmt(u.repositories.totalCount)} repositories${stars ? ` · ${stars} ★` : ""}</text>
  <circle cx="${dcx}" cy="${dcy}" r="${R}" stroke="${C.panel}" stroke-width="22"/>
  ${arcs}
  <text x="${dcx}" y="${dcy + 6}" text-anchor="middle" font-family="${SANS}" font-size="16" font-weight="800" fill="${C.text}">${esc(top[0]?.[0] ?? "—")}</text>
  <text x="${dcx}" y="${dcy + 22}" text-anchor="middle" font-family="${MONO}" font-size="9" letter-spacing="1.5" fill="${C.dim}">TOP</text>
  ${legend}`;
  writeFileSync(OUT + "repos.svg", svg(W, H, out, { css: growCss }));
}

const { user, commitTimes } = MOCK ? mockData() : await liveData();
skyline(user);
insights(user, commitTimes);
reposLangs(user);
console.log("telemetry written to", OUT);
