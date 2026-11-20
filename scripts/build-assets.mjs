// Generates the animated SVG cards used in README.md.
// Usage: node scripts/build-assets.mjs
import { mkdirSync, writeFileSync } from 'node:fs';

const OUT = new URL('../assets/', import.meta.url);

const themes = {
  dark: {
    bg: '#0d1117', grid: '#161b22', border: '#30363d', title: '#e6edf3', text: '#8b949e',
    muted: '#6e7681', accent: '#58a6ff', accent2: '#1f6feb', chipBg: '#161b22', chipBorder: '#30363d',
    gold: '#e3b341', goldSoft: '#e3b341', glow: 0.18,
  },
  light: {
    bg: '#ffffff', grid: '#f0f3f6', border: '#d1d9e0', title: '#1f2328', text: '#59636e',
    muted: '#818b98', accent: '#0969da', accent2: '#0969da', chipBg: '#f6f8fa', chipBorder: '#d1d9e0',
    gold: '#9a6700', goldSoft: '#d4a72c', glow: 0.08,
  },
};

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const MONO = "Consolas, Menlo, 'SF Mono', 'DejaVu Sans Mono', monospace";
const SANS = "'Segoe UI', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif";
const REDUCED = '@media (prefers-reduced-motion: reduce) { * { animation: none !important; } }';

const baseKeyframes = `
  @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes grow   { from { transform: scaleX(0); } to { transform: scaleX(1); } }
  @keyframes pop    { from { opacity: 0; transform: scale(.85); } to { opacity: 1; transform: none; } }
  @keyframes sweep  { 0% { transform: translateX(-400px); } 55%, 100% { transform: translateX(var(--sweep-end)); } }`;

const gridDefs = (t, id = 'grid') => `
    <pattern id="${id}" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="${t.grid}" stroke-width="1"/>
    </pattern>`;

// ---------- project card motifs (top-right, ~140x90 box at 620,36) ----------
const motifs = {
  network: (t) => {
    const nodes = [[640, 96], [690, 52], [744, 84], [716, 124], [662, 140]];
    const edges = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [1, 3], [0, 2]];
    const lines = edges.map(([a, b], i) =>
      `<line class="edge" style="animation-delay:${0.6 + i * 0.12}s" x1="${nodes[a][0]}" y1="${nodes[a][1]}" x2="${nodes[b][0]}" y2="${nodes[b][1]}" stroke="${t.accent}" stroke-opacity=".45" stroke-width="1.6" pathLength="1"/>`).join('');
    const dots = nodes.map(([x, y], i) =>
      `<circle class="node" style="animation-delay:${i * 0.5}s" cx="${x}" cy="${y}" r="${i === 2 ? 7 : 5}" fill="${i === 2 ? t.accent : t.bg}" stroke="${t.accent}" stroke-width="2"/>`).join('');
    return {
      css: `.edge { stroke-dasharray: 1; animation: draw 1s ease-out both; }
            .node { transform-box: fill-box; transform-origin: center; animation: breathe 2.5s ease-in-out infinite; }
            .ring { transform-box: fill-box; transform-origin: center; animation: ping 2.5s ease-out 1.5s infinite; }
            @keyframes draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
            @keyframes breathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.25); } }
            @keyframes ping { 0% { transform: scale(1); opacity: .8; } 80%, 100% { transform: scale(3); opacity: 0; } }`,
      svg: `${lines}<circle class="ring" cx="744" cy="84" r="7" fill="none" stroke="${t.accent}" stroke-width="2"/>${dots}`,
    };
  },
  pin: (t) => ({
    css: `.pin { animation: bob 2.4s ease-in-out infinite; }
          .ripple { transform-box: fill-box; transform-origin: center; animation: ripple 2.4s ease-out infinite; }
          .ripple2 { animation-delay: 1.2s; }
          @keyframes bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
          @keyframes ripple { 0% { transform: scale(.3); opacity: .9; } 100% { transform: scale(1.6); opacity: 0; } }`,
    svg: `
      <ellipse class="ripple" cx="700" cy="132" rx="30" ry="9" fill="none" stroke="${t.accent}" stroke-width="2"/>
      <ellipse class="ripple ripple2" cx="700" cy="132" rx="30" ry="9" fill="none" stroke="${t.accent}" stroke-width="2"/>
      <g class="pin">
        <path d="M 700 128 C 690 112 676 98 676 80 A 24 24 0 0 1 724 80 C 724 98 710 112 700 128 Z" fill="${t.accent}" fill-opacity=".9"/>
        <circle cx="700" cy="80" r="9" fill="${t.bg}"/>
      </g>`,
  }),
  sync: (t) => ({
    css: `.spin { transform-box: view-box; transform-origin: 700px 88px; animation: spin 3.2s cubic-bezier(.6,0,.4,1) infinite; }
          .status { animation: status 6.4s steps(1) infinite; }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          @keyframes status { 0%, 50% { fill: ${t.muted}; } 50.01%, 100% { fill: ${t.accent}; } }`,
    svg: `
      <g class="spin" fill="none" stroke="${t.accent}" stroke-width="5" stroke-linecap="round">
        <path d="M 672 80 A 30 30 0 0 1 726 72"/>
        <path d="M 728 96 A 30 30 0 0 1 674 104"/>
        <path d="M 716 62 L 728 72 L 714 80" stroke-linejoin="round"/>
        <path d="M 684 114 L 672 104 L 686 96" stroke-linejoin="round"/>
      </g>
      <circle class="status" cx="752" cy="132" r="6" fill="${t.accent}"/>`,
  }),
  pulse: (t) => ({
    css: `.ecg { stroke-dasharray: 60 240; animation: trace 2.4s linear infinite; }
          .ecg-base { stroke-opacity: .25; }
          .beacon { transform-box: fill-box; transform-origin: center; animation: ping 2.4s ease-out infinite; }
          @keyframes trace { from { stroke-dashoffset: 300; } to { stroke-dashoffset: 0; } }
          @keyframes ping { 0% { transform: scale(1); opacity: .8; } 80%, 100% { transform: scale(2.6); opacity: 0; } }`,
    svg: `
      <path class="ecg-base" d="M 630 100 H 668 L 680 76 L 694 128 L 708 58 L 720 112 L 730 100 H 768" fill="none" stroke="${t.accent}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
      <path class="ecg" d="M 630 100 H 668 L 680 76 L 694 128 L 708 58 L 720 112 L 730 100 H 768" pathLength="300" fill="none" stroke="${t.accent}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/>
      <circle class="beacon" cx="768" cy="100" r="6" fill="none" stroke="${t.gold}" stroke-width="2"/>
      <circle cx="768" cy="100" r="5" fill="${t.gold}"/>`,
  }),
  browser: (t) => {
    const rows = [[652, 86, 90], [652, 102, 64], [652, 118, 78]];
    const lines = rows.map(([x, y, w], i) =>
      `<rect class="sk" style="animation-delay:${i * 0.25}s" x="${x}" y="${y}" width="${w}" height="7" rx="3.5" fill="${t.accent}"/>`).join('');
    return {
      css: `.sk { animation: shimmer 2.4s ease-in-out infinite; }
            .caret { animation: blinkc 1.1s steps(1) infinite; }
            @keyframes shimmer { 0%, 100% { fill-opacity: .25; } 50% { fill-opacity: .8; } }
            @keyframes blinkc { 0%, 50% { opacity: 1; } 50.01%, 100% { opacity: 0; } }`,
      svg: `
      <rect x="636" y="48" width="132" height="94" rx="10" fill="${t.bg}" stroke="${t.accent}" stroke-opacity=".7" stroke-width="2"/>
      <line x1="636" y1="68" x2="768" y2="68" stroke="${t.accent}" stroke-opacity=".5" stroke-width="2"/>
      <circle cx="650" cy="58" r="3.5" fill="${t.accent}" fill-opacity=".8"/>
      <circle cx="662" cy="58" r="3.5" fill="${t.accent}" fill-opacity=".55"/>
      <circle cx="674" cy="58" r="3.5" fill="${t.accent}" fill-opacity=".3"/>
      ${lines}
      <rect class="caret" x="734" y="116" width="3" height="12" fill="${t.accent}"/>`,
    };
  },
  bars: (t) => {
    const hs = [26, 42, 34, 58, 76];
    const bars = hs.map((h, i) =>
      `<rect class="bar" style="animation-delay:${i * 0.18}s" x="${650 + i * 22}" y="${140 - h}" width="14" height="${h}" rx="3" fill="${t.accent}" fill-opacity="${0.45 + i * 0.12}"/>`).join('');
    return {
      css: `.bar { transform-box: fill-box; transform-origin: bottom; animation: rise 4s cubic-bezier(.2,.7,.2,1) infinite; }
            @keyframes rise { 0% { transform: scaleY(.15); } 25%, 80% { transform: scaleY(1); } 100% { transform: scaleY(.15); } }`,
      svg: `<line x1="642" y1="141" x2="766" y2="141" stroke="${t.border}" stroke-width="2"/>${bars}`,
    };
  },
};

function chips(items, t, x0, y, delay0) {
  let x = x0;
  return items.map((label, i) => {
    const w = Math.round(label.length * 12.4 + 34);
    const g = `<g class="chip" style="animation-delay:${delay0 + i * 0.1}s">
      <rect x="${x}" y="${y}" width="${w}" height="44" rx="22" fill="${t.chipBg}" stroke="${t.chipBorder}"/>
      <text x="${x + w / 2}" y="${y + 30}" text-anchor="middle" font-family="${MONO}" font-size="21" fill="${t.text}">${esc(label)}</text>
    </g>`;
    x += w + 10;
    return g;
  }).join('');
}

function projectCard(p, t) {
  const m = motifs[p.motif](t);
  const desc = p.lines.map((l, i) =>
    `<text x="40" y="${200 + i * 36}" font-family="${SANS}" font-size="25" fill="${t.text}">${esc(l)}</text>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="350" viewBox="0 0 800 350">
  <style>
    .card   { animation: fadeUp .7s ease-out both; }
    .tag    { animation: fadeIn .6s ease-out .2s both; }
    .title  { animation: fadeUp .7s ease-out .25s both; }
    .accent { transform-box: fill-box; transform-origin: left center; animation: grow .8s cubic-bezier(.2,.7,.2,1) .5s both; }
    .desc   { animation: fadeIn .8s ease-out .6s both; }
    .chip   { transform-box: fill-box; transform-origin: center; animation: pop .45s ease-out both; }
    .shine  { --sweep-end: 1200px; animation: sweep 6s ease-in-out 1.5s infinite; }
    ${m.css}
    ${baseKeyframes}
    ${REDUCED}
  </style>
  <defs>${gridDefs(t)}
    <radialGradient id="glow" cx="88%" cy="20%" r="55%">
      <stop offset="0%" stop-color="${t.accent2}" stop-opacity="${t.glow}"/>
      <stop offset="100%" stop-color="${t.accent2}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="line" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${t.accent}"/><stop offset="100%" stop-color="${t.accent2}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="shine" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${t.accent}" stop-opacity="0"/>
      <stop offset="50%" stop-color="${t.accent}" stop-opacity=".9"/>
      <stop offset="100%" stop-color="${t.accent}" stop-opacity="0"/>
    </linearGradient>
    <clipPath id="clip"><rect x="1" y="1" width="798" height="348" rx="16"/></clipPath>
  </defs>
  <g class="card">
    <g clip-path="url(#clip)">
      <rect width="800" height="350" fill="${t.bg}"/>
      <rect width="800" height="350" fill="url(#grid)"/>
      <rect width="800" height="350" fill="url(#glow)"/>
      <rect class="shine" x="0" y="0" width="400" height="3" fill="url(#shine)"/>
    </g>
    <rect x="1" y="1" width="798" height="348" rx="16" fill="none" stroke="${t.border}" stroke-width="2"/>
    <text class="tag" x="40" y="60" font-family="${MONO}" font-size="19" fill="${t.accent}">${esc(p.tag)}</text>
    <text class="title" x="40" y="118" font-family="${SANS}" font-size="44" font-weight="700" fill="${t.title}">${esc(p.title)}</text>
    <rect class="accent" x="40" y="138" width="120" height="3" rx="1.5" fill="url(#line)"/>
    <g class="desc">${desc}</g>
    ${chips(p.stack, t, 40, 272, 0.9)}
    ${m.svg}
  </g>
</svg>
`;
}

function stackMarquee(rows, t) {
  const W = 1000, H = 136;
  const rowSvg = rows.map((row, r) => {
    let x = 0;
    const items = row.items.map((label) => {
      const w = Math.round(label.length * 10.8 + 50);
      const g = `<g transform="translate(${x} 0)">
        <rect width="${w}" height="46" rx="23" fill="${t.chipBg}" stroke="${t.chipBorder}"/>
        <circle cx="22" cy="23" r="4.5" fill="${t.accent}" fill-opacity="${row.dot}"/>
        <text x="36" y="29" font-family="${MONO}" font-size="18" fill="${t.title}">${esc(label)}</text>
      </g>`;
      x += w + 12;
      return g;
    }).join('');
    const span = x; // width of one full set
    const dur = (span / 45).toFixed(1);
    const y = 12 + r * 66;
    return {
      css: `.row${r} { animation: ${r % 2 ? 'scrollR' : 'scrollL'}${r} ${dur}s linear infinite; }
            @keyframes scrollL${r} { from { transform: translateX(0); } to { transform: translateX(-${span}px); } }
            @keyframes scrollR${r} { from { transform: translateX(-${span}px); } to { transform: translateX(0); } }`,
      svg: `<g transform="translate(0 ${y})"><g class="row${r}">${items}<g transform="translate(${span} 0)">${items}</g><g transform="translate(${span * 2} 0)">${items}</g></g></g>`,
    };
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <style>
    .wrap { animation: fadeIn .8s ease-out both; }
    ${rowSvg.map((r) => r.css).join('\n')}
    ${baseKeyframes}
    ${REDUCED}
  </style>
  <defs>
    <linearGradient id="fadeL" x1="0%" x2="100%"><stop offset="0%" stop-color="${t.bg}"/><stop offset="100%" stop-color="${t.bg}" stop-opacity="0"/></linearGradient>
    <linearGradient id="fadeR" x1="0%" x2="100%"><stop offset="0%" stop-color="${t.bg}" stop-opacity="0"/><stop offset="100%" stop-color="${t.bg}"/></linearGradient>
    <clipPath id="clip"><rect width="${W}" height="${H}" rx="16"/></clipPath>
  </defs>
  <g class="wrap" clip-path="url(#clip)">
    <rect width="${W}" height="${H}" fill="${t.bg}"/>
    ${rowSvg.map((r) => r.svg).join('\n')}
    <rect width="140" height="${H}" fill="url(#fadeL)"/>
    <rect x="${W - 140}" width="140" height="${H}" fill="url(#fadeR)"/>
  </g>
</svg>
`;
}

// ---------- content ----------
const projects = [
  {
    file: 'foodsave', motif: 'pin', tag: '// sistem informasi bisnis · live demo', title: 'FoodSave',
    lines: ['Routes surplus food from shops and canteens', 'in Malang to people nearby, tracking CO₂e saved.'],
    stack: ['Laravel 12', 'PHP', 'Tailwind', 'Alpine.js'],
  },
  {
    file: 'jala', motif: 'network', tag: '// bpjs healthkathon 2026 · live demo', title: 'JALA Fraud Analytics',
    lines: ['Graph-based audit prioritization for health', 'claims: 436 vs. 91 fraud cases caught (synthetic).'],
    stack: ['Python', 'Streamlit', 'NetworkX', 'scikit-learn'],
  },
  {
    file: 'civicpulse', motif: 'pulse', tag: '// web in action · mia 2026 · team', title: 'CivicPulse',
    lines: ['AI-assisted civic reporting with photo recognition,', 'explainable priority scores, citizen-verified fixes.'],
    stack: ['React', 'Hono', 'Supabase', 'CLIP'],
  },
  {
    file: 'kedai', motif: 'sync', tag: '// local-first pwa · live demo', title: 'Kedai Rakdjat POS',
    lines: ['Point of sale that keeps selling offline and', 'syncs on reconnect, with kitchen display & QRIS.'],
    stack: ['React', 'TypeScript', 'Supabase', 'Dexie'],
  },
  {
    file: 'tandur', motif: 'bars', tag: '// islamic finance · live demo', title: 'Tandur',
    lines: ['Digitizes akad salam financing for Islamic', 'co-ops, with stress-tested contracts & audit trail.'],
    stack: ['JavaScript', 'HTML', 'CSS', 'Vercel'],
  },
  {
    file: 'portyance', motif: 'browser', tag: '// personal portfolio · live', title: 'Portyance',
    lines: ['My portfolio: project case studies, organization', 'experience, and an interactive animated intro.'],
    stack: ['Next.js', 'React', 'Vercel'],
  },
];

const stack = [
  { dot: 1, items: ['Python', 'Pandas', 'scikit-learn', 'NetworkX', 'Streamlit', 'Plotly', 'SQL', 'MySQL', 'Kotlin', 'Jetpack Compose'] },
  { dot: 0.55, items: ['Laravel', 'PHP', 'React', 'Next.js', 'TypeScript', 'JavaScript', 'Tailwind CSS', 'Supabase', 'Vite', 'Hono', 'Git', 'GitHub Actions', 'Figma', 'Vercel'] },
];

// ---------- numbers (odometer count-up) ----------
function numbersCard(stats, t) {
  const W = 1500, H = 180, LH = 76, colW = W / stats.length;
  const cols = stats.map((s, i) => {
    const cx = colW * i + colW / 2;
    const digits = Array.from({ length: s.value + 1 }, (_, d) =>
      `<text x="0" y="${d * LH}" text-anchor="end" font-family="${SANS}" font-size="68" font-weight="700" fill="${s.gold ? t.gold : t.accent}">${d}</text>`).join('');
    const end = s.value * LH;
    const sep = i ? `<line x1="${colW * i}" y1="44" x2="${colW * i}" y2="136" stroke="${t.border}" stroke-width="2"/>` : '';
    return {
      css: `.odo${i} { transform: translateY(-${end}px); animation: roll${i} 1.6s cubic-bezier(.15,.8,.2,1) ${0.3 + i * 0.2}s both; }
            @keyframes roll${i} { from { transform: translateY(0); } to { transform: translateY(-${end}px); } }`,
      svg: `${sep}
      <g transform="translate(${cx + (s.suffix ? 4 : 18)} 96)">
        <g clip-path="url(#digit)"><g class="odo${i}">${digits}</g></g>
      </g>
      ${s.suffix ? `<text class="lbl" x="${cx + 6}" y="96" font-family="${SANS}" font-size="34" font-weight="700" fill="${s.gold ? t.gold : t.accent}">${esc(s.suffix)}</text>` : ''}
      <text class="lbl" x="${cx}" y="142" text-anchor="middle" font-family="${SANS}" font-size="24" fill="${t.text}">${esc(s.label)}</text>`,
    };
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <style>
    .card { animation: fadeUp .7s ease-out both; }
    .lbl  { animation: fadeIn .8s ease-out .6s both; }
    ${cols.map((c) => c.css).join('\n')}
    ${baseKeyframes}
    ${REDUCED}
  </style>
  <defs>${gridDefs(t)}
    <clipPath id="digit"><rect x="-80" y="-62" width="160" height="${LH}"/></clipPath>
    <clipPath id="clip"><rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="16"/></clipPath>
  </defs>
  <g class="card">
    <g clip-path="url(#clip)">
      <rect width="${W}" height="${H}" fill="${t.bg}"/>
      <rect width="${W}" height="${H}" fill="url(#grid)"/>
    </g>
    <rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="16" fill="none" stroke="${t.border}" stroke-width="2"/>
    ${cols.map((c) => c.svg).join('\n')}
  </g>
</svg>
`;
}

// ---------- journey timeline ----------
function timelineCard(items, t) {
  const W = 1500, H = 340, LY = 170, x0 = 175, step = (W - 2 * x0) / (items.length - 1);
  const nodes = items.map((it, i) => {
    const x = x0 + i * step;
    const up = i % 2 === 0;
    const color = it.gold ? t.gold : t.accent;
    const d = (0.5 + i * 0.28).toFixed(2);
    const [yY, yT, yS] = up ? [58, 92, 122] : [232, 266, 296];
    const tick = up ? `M ${x} ${LY - 14} V ${LY - 34}` : `M ${x} ${LY + 14} V ${LY + 34}`;
    const ring = it.gold || it.now
      ? `<circle class="ring" style="animation-delay:${(+d + 0.6).toFixed(2)}s" cx="${x}" cy="${LY}" r="9" fill="none" stroke="${color}" stroke-width="2.5"/>` : '';
    return `
    <g class="item" style="animation-delay:${d}s">
      <path d="${tick}" stroke="${color}" stroke-opacity=".5" stroke-width="2"/>
      <text x="${x}" y="${yY}" text-anchor="middle" font-family="${MONO}" font-size="19" fill="${color}">${esc(it.when)}</text>
      <text x="${x}" y="${yT}" text-anchor="middle" font-family="${SANS}" font-size="25" font-weight="700" fill="${t.title}">${esc(it.title)}</text>
      <text x="${x}" y="${yS}" text-anchor="middle" font-family="${SANS}" font-size="20" fill="${t.text}">${esc(it.sub)}</text>
    </g>
    ${ring}
    <circle class="node" style="animation-delay:${d}s" cx="${x}" cy="${LY}" r="${it.gold || it.now ? 10 : 8}" fill="${it.now ? t.bg : color}" stroke="${color}" stroke-width="3"/>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <style>
    .card  { animation: fadeUp .7s ease-out both; }
    .track { transform-box: fill-box; transform-origin: left center; animation: grow 1.8s cubic-bezier(.3,.6,.2,1) .2s both; }
    .item  { animation: fadeUp .6s ease-out both; }
    .node  { transform-box: fill-box; transform-origin: center; animation: pop .45s cubic-bezier(.2,1.5,.4,1) both; }
    .ring  { transform-box: fill-box; transform-origin: center; opacity: 0; animation: ping 2.4s ease-out infinite; }
    .comet { animation: travel 6s ease-in-out 2.4s infinite; opacity: 0; }
    @keyframes ping { 0% { transform: scale(1); opacity: .8; } 80%, 100% { transform: scale(2.8); opacity: 0; } }
    @keyframes travel { 0% { transform: translateX(0); opacity: 0; } 8% { opacity: 1; } 85% { opacity: 1; } 100% { transform: translateX(${W - 2 * x0}px); opacity: 0; } }
    ${baseKeyframes}
    ${REDUCED}
  </style>
  <defs>${gridDefs(t)}
    <linearGradient id="track" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${t.accent2}" stop-opacity=".35"/>
      <stop offset="70%" stop-color="${t.accent}"/>
      <stop offset="100%" stop-color="${t.accent}"/>
    </linearGradient>
    <radialGradient id="comet"><stop offset="0%" stop-color="${t.accent}"/><stop offset="100%" stop-color="${t.accent}" stop-opacity="0"/></radialGradient>
    <clipPath id="clip"><rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="16"/></clipPath>
  </defs>
  <g class="card">
    <g clip-path="url(#clip)">
      <rect width="${W}" height="${H}" fill="${t.bg}"/>
      <rect width="${W}" height="${H}" fill="url(#grid)"/>
    </g>
    <rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="16" fill="none" stroke="${t.border}" stroke-width="2"/>
    <rect class="track" x="${x0}" y="${LY - 2}" width="${W - 2 * x0}" height="4" rx="2" fill="url(#track)"/>
    <circle class="comet" cx="${x0}" cy="${LY}" r="14" fill="url(#comet)"/>
    ${nodes}
  </g>
</svg>
`;
}

const numbers = [
  { value: 6, label: 'apps shipped & live' },
  { value: 4, label: 'hackathons & competitions' },
  { value: 2, label: 'competition wins', gold: true },
  { value: 5, label: 'student organization roles' },
];

const journey = [
  { when: '2025', title: 'KBMDSI', sub: '3 organization roles' },
  { when: '2026', title: 'BPJS Healthkathon', sub: 'built JALA' },
  { when: '2026', title: 'Web In Action MIA', sub: 'CivicPulse · team' },
  { when: 'NOV 2026', title: '2× 1st Place', sub: 'YES-C & UMPWR business plan', gold: true },
  { when: '2026', title: 'Shipped 2 products', sub: 'Kedai Rakdjat · FoodSave' },
  { when: 'NOW', title: 'Open to internships', sub: 'BI · data · web', now: true },
];

mkdirSync(new URL('cards/', OUT), { recursive: true });
for (const [name, t] of Object.entries(themes)) {
  for (const p of projects) writeFileSync(new URL(`cards/${p.file}-${name}.svg`, OUT), projectCard(p, t));
  writeFileSync(new URL(`cards/stack-${name}.svg`, OUT), stackMarquee(stack, t));
  writeFileSync(new URL(`cards/numbers-${name}.svg`, OUT), numbersCard(numbers, t));
  writeFileSync(new URL(`cards/journey-${name}.svg`, OUT), timelineCard(journey, t));
}
console.log('assets generated');
