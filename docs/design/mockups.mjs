// Generates the static design mockups of fase 4 (docs/design/<richting>/*.html).
// Throwaway: once a direction is chosen, the real components replace this.
//
//   node docs/design/mockups.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT = import.meta.dirname;

// ---------------------------------------------------------------- content

const site = { name: 'Scouts Don Bosco Vosselaar', short: 'Scouts Vosselaar', slogan: 'Scouting? DAS Goesting!' };

const nav = ['Home', 'Kalender', 'Takken', 'Leiding', "Foto's", "'t Voske", 'Inschrijven', 'Praktisch', 'Verhuur', 'Onze groep'];

// Voorbeeldtekst: de echte leeftijden, teksten en leiding komen uit docs/huidige-site/inhoud.md.
const sections = [
  { id: 'kapoenen', name: 'Kapoenen', age: '6 en 7 jaar' },
  { id: 'welpen', name: 'Welpen', age: '8 tot 10 jaar' },
  { id: 'wolven', name: 'Wolven', age: '8 tot 10 jaar' },
  { id: 'jongverkenners', name: 'Jongverkenners', age: '11 tot 13 jaar' },
  { id: 'verkenners', name: 'Verkenners', age: '14 tot 16 jaar' },
  { id: 'jin', name: 'Jin', age: '17 jaar' },
  { id: 'akabe', name: 'Akabe', age: 'Aangepaste werking' },
];

const events = [
  { day: '24', month: 'okt', weekday: 'za', title: 'Halloweentocht', time: '18u tot 21u', place: 'Lokaal', for: ['kapoenen', 'welpen', 'wolven'] },
  { day: '14', month: 'nov', weekday: 'za', title: 'Spaghettiavond', time: 'vanaf 17u', place: 'Parochiezaal', for: [], price: '€12' },
  { day: '22', month: 'nov', weekday: 'zo', title: 'Sinterklaasvergadering', time: '14u tot 16u30', place: 'Lokaal', for: ['kapoenen', 'welpen'] },
  { day: '11', month: 'dec', weekday: 'vr', title: 'Kerstmarkt Vosselaar', time: '17u tot 22u', place: 'Markt', for: [] },
];

const pinned = {
  label: 'Vastgepind',
  title: 'Inschrijvingen 2026-2027 zijn open',
  excerpt: 'Schrijf je kind in voor het nieuwe werkjaar. Het lidgeld blijft 50 euro, met UiTPAS en recht op verminderd tarief 15 euro.',
  button: 'Inschrijven',
};

const posts = [
  { title: 'Smoutebollenbak: bestel nu je portie', date: '12 oktober 2026', excerpt: 'Op zaterdag 7 november bakken we weer smoutebollen. Bestel vooraf en haal ze warm op aan het lokaal.', tags: ['Hele groep'] },
  { title: 'Overgang 2026: een weekend vol vuur', date: '28 september 2026', excerpt: 'Met een spannend spel en een groot kampvuur namen we afscheid van het oude werkjaar.', tags: ['Hele groep'] },
  { title: 'Welpen op tocht in de Liereman', date: '20 september 2026', excerpt: 'Twee uur stappen, een verborgen schat en natte voeten. De welpen hebben zich geamuseerd.', tags: ['Welpen'] },
];

const groupLeaders = ['Neil Scheltjens', 'Joppe Adriaensen', 'Annemijn de Vries', 'Daan Scheyltjens'];

const tak = {
  ...sections[1],
  meeting: 'Zondag 14u tot 16u30',
  email: 'welpen@scoutsvosselaar.be',
  who: 'De welpen zijn jongens en meisjes van 8 tot 10 jaar. Ze leven in een groep waarin iedereen meetelt en samen speelt.',
  what: 'Elke zondag spelen we in het bos, bouwen we hutten en trekken we op avontuur. Af en toe is er een weekend of een uitstap.',
  camp: 'In de zomer trekken de welpen tien dagen op kamp. Daar leren ze koken op vuur, slapen ze in tenten en maken ze herinneringen voor het leven.',
  leaders: [
    { name: 'Voornaam Naam', totem: 'Totem', lead: true },
    { name: 'Voornaam Naam', totem: 'Totem', lead: true },
    { name: 'Voornaam Naam', totem: 'Totem' },
    { name: 'Voornaam Naam', totem: 'Totem' },
    { name: 'Voornaam Naam', totem: 'Totem' },
    { name: 'Voornaam Naam', totem: 'Totem' },
  ],
};

// ---------------------------------------------------------------- themes

const themes = {
  kampvuur: {
    label: 'Kampvuur',
    tagline: 'Warm en avondlijk: dennen, gloed en een klassieke serif.',
    colors: { kapoenen: '#e8a33d', welpen: '#5f8f3e', wolven: '#3f7f7a', jongverkenners: '#2f5d8a', verkenners: '#9b2335', jin: '#c8562b', akabe: '#7a5b93' },
    fonts: `
      @font-face { font-family: 'Fraunces'; src: url(../fonts/fraunces-latin-full-normal.woff2) format('woff2'); font-weight: 100 900; font-display: swap; }
      @font-face { font-family: 'Inter'; src: url(../fonts/inter-latin-wght-normal.woff2) format('woff2'); font-weight: 100 900; font-display: swap; }
      @font-face { font-family: 'Caveat'; src: url(../fonts/caveat-latin-700-normal.woff2) format('woff2'); font-weight: 700; font-display: swap; }`,
    css: `
      :root { --ink: #231a14; --muted: #6b5a4c; --paper: #f7f0e4; --card: #fffaf2; --line: #e5d8c3; --night: #1b2a24; --night-2: #26392f; --ember: #e0782f; --brand: #8c1d2c; --radius: 14px; }
      body { font-family: 'Inter', system-ui, sans-serif; background: var(--paper); color: var(--ink); }
      h1, h2, h3, .brand { font-family: 'Fraunces', Georgia, serif; font-optical-sizing: auto; }
      h2 { font-size: clamp(1.6rem, 3vw, 2.2rem); font-weight: 700; letter-spacing: -0.01em; }
      .hand { font-family: 'Caveat', cursive; color: var(--ember); font-size: 1.5rem; }
      .site-header { background: var(--night); color: #f3e8d6; }
      .brand { font-weight: 800; font-size: 1.15rem; line-height: 1.05; }
      .brand small { display: block; font-family: 'Inter', sans-serif; font-weight: 500; font-size: .7rem; letter-spacing: .14em; text-transform: uppercase; color: #d7b98f; }
      .nav a { color: #f3e8d6; } .nav a[aria-current] { color: #ffd59a; box-shadow: inset 0 -2px #e0782f; }
      .btn { background: var(--ember); color: #1d130c; border-radius: 999px; font-weight: 700; }
      .btn.ghost { background: transparent; color: inherit; box-shadow: inset 0 0 0 2px currentColor; }
      .hero { background: var(--night); color: #fbf1e1; }
      .hero h1 { font-size: clamp(2.6rem, 7vw, 5rem); font-weight: 800; line-height: .95; letter-spacing: -0.02em; }
      .hero h1 em { font-style: italic; color: #ffb565; font-weight: 600; }
      .hero p { color: #e2d3bd; }
      .hero-photo { border-radius: 22px 22px 22px 4px; box-shadow: 0 30px 60px -20px rgb(0 0 0 / .6); }
      .pinned { background: var(--card); border: 1px solid var(--line); border-left: 6px solid var(--brand); border-radius: var(--radius); }
      .pinned .label { color: var(--brand); }
      .event { background: var(--card); border: 1px solid var(--line); border-radius: var(--radius); }
      .date-badge { background: var(--night); color: #ffd59a; border-radius: 10px; font-family: 'Fraunces', serif; }
      .card { background: var(--card); border-radius: var(--radius); border: 1px solid var(--line); overflow: hidden; }
      .tile { border-radius: var(--radius); color: #fff; }
      .chip { border-radius: 999px; }
      .site-footer { background: var(--night); color: #d9c8b0; }
      .section-hero { background: var(--night); color: #fbf1e1; }
      .block { background: var(--card); border: 1px solid var(--line); border-radius: var(--radius); }
      .block h2 { font-size: 1.5rem; }
      .leader .avatar { border-radius: 50%; font-family: 'Fraunces', serif; }
      .divider { height: 28px; background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 28'%3E%3Cpath d='M0 20 Q 25 4 50 18 T 100 16 T 150 20 T 200 14' fill='none' stroke='%23e0782f' stroke-width='3' stroke-linecap='round'/%3E%3C/svg%3E") center / 200px 28px no-repeat; }
    `,
    hero: (w, h) => `
      <svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Plaats voor een groepsfoto" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="glow" cx="50%" cy="85%" r="60%"><stop offset="0" stop-color="#ffb04a" stop-opacity=".85"/><stop offset=".4" stop-color="#c8562b" stop-opacity=".35"/><stop offset="1" stop-color="#1b2a24" stop-opacity="0"/></radialGradient>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#22362d"/><stop offset="1" stop-color="#3b2b22"/></linearGradient>
        </defs>
        <rect width="${w}" height="${h}" fill="url(#sky)"/>
        <rect width="${w}" height="${h}" fill="url(#glow)"/>
        ${trees(w, h, '#14201b', 0.62, 11)}
        ${trees(w, h, '#0e1713', 0.8, 7)}
        <g transform="translate(${w / 2} ${h * 0.86})"><path d="M-46 10 L46 -6 M-46 -6 L46 10" stroke="#3a2416" stroke-width="10" stroke-linecap="round"/><path d="M0 -70 C 22 -40 30 -20 0 0 C -30 -20 -18 -44 0 -70Z" fill="#ffb04a"/><path d="M0 -40 C 10 -26 12 -14 0 -2 C -12 -14 -8 -28 0 -40Z" fill="#fff1c9"/></g>
        <text x="24" y="${h - 22}" fill="#f3e8d6" opacity=".7" font-family="Inter, sans-serif" font-size="15">Groepsfoto van het werkjaar</text>
      </svg>`,
  },

  veldgids: {
    label: 'Veldgids',
    tagline: 'Kraftpapier, hoogtelijnen en stempels: een scoutshandboek in de bus.',
    colors: { kapoenen: '#d99a1e', welpen: '#4e7d3a', wolven: '#2e7468', jongverkenners: '#2d5f86', verkenners: '#8e2433', jin: '#b9542c', akabe: '#6c5592' },
    fonts: `
      @font-face { font-family: 'Barlow Condensed'; src: url(../fonts/barlow-condensed-latin-800-normal.woff2) format('woff2'); font-weight: 800; font-display: swap; }
      @font-face { font-family: 'Barlow Condensed'; src: url(../fonts/barlow-condensed-latin-600-normal.woff2) format('woff2'); font-weight: 600; font-display: swap; }
      @font-face { font-family: 'Barlow'; src: url(../fonts/barlow-latin-400-normal.woff2) format('woff2'); font-weight: 400; font-display: swap; }
      @font-face { font-family: 'Barlow'; src: url(../fonts/barlow-latin-600-normal.woff2) format('woff2'); font-weight: 600; font-display: swap; }`,
    css: `
      :root { --ink: #22281f; --muted: #5a5e4e; --paper: #efe4cf; --card: #f8f1e2; --line: #cdbb98; --forest: #2f4a2c; --brand: #8e2433; --radius: 4px; }
      body { font-family: 'Barlow', system-ui, sans-serif; background: var(--paper) ${topo('#d8c7a6')}; color: var(--ink); font-size: 1.05rem; }
      h1, h2, h3, .brand, .date-badge, .btn, .label, .nav a { font-family: 'Barlow Condensed', 'Arial Narrow', sans-serif; text-transform: uppercase; letter-spacing: .02em; }
      h2 { font-size: clamp(1.8rem, 3.4vw, 2.6rem); font-weight: 800; }
      h2::before { content: ''; display: inline-block; width: .55em; height: .55em; margin-right: .3em; border: 3px solid var(--brand); border-radius: 50%; vertical-align: .05em; }
      .site-header { background: var(--forest); color: #f1e8d5; border-bottom: 4px solid var(--brand); }
      .brand { font-weight: 800; font-size: 1.35rem; line-height: .95; }
      .brand small { display: block; font-weight: 600; font-size: .8rem; letter-spacing: .2em; color: #c9d6a8; }
      .nav a { color: #f1e8d5; font-weight: 600; font-size: 1.05rem; } .nav a[aria-current] { background: #f1e8d5; color: var(--forest); }
      .btn { background: var(--brand); color: #fff; border-radius: 3px; font-weight: 800; font-size: 1.1rem; box-shadow: 3px 3px 0 #22281f; }
      .btn.ghost { background: #f8f1e2; color: var(--ink); }
      .hero { background: transparent; color: var(--ink); }
      .hero h1 { font-size: clamp(3rem, 9vw, 6.4rem); font-weight: 800; line-height: .86; }
      .hero h1 em { font-style: normal; color: var(--brand); display: block; }
      .hero p { color: var(--muted); font-size: 1.15rem; }
      .hero-photo { border: 10px solid #fffaf0; box-shadow: 0 18px 30px -12px rgb(40 30 10 / .45); transform: rotate(1.5deg); border-radius: 2px; }
      .hero-photo::after { content: 'Groepsfoto 2026-2027'; position: absolute; left: 50%; bottom: -26px; transform: translateX(-50%) rotate(-2deg); background: #f3d36b; padding: 4px 14px; font-family: 'Barlow Condensed'; font-weight: 600; text-transform: uppercase; box-shadow: 1px 2px 4px rgb(0 0 0 / .2); }
      .pinned { background: var(--card); border: 2px dashed var(--brand); border-radius: var(--radius); }
      .pinned .label { background: var(--brand); color: #fff; padding: 2px 10px; transform: rotate(-2deg); display: inline-block; }
      .event { background: var(--card); border: 2px solid var(--ink); border-radius: var(--radius); box-shadow: 4px 4px 0 var(--line); }
      .date-badge { background: transparent; color: var(--brand); border: 3px solid var(--brand); border-radius: 50%; aspect-ratio: 1; transform: rotate(-8deg); }
      .card { background: var(--card); border: 2px solid var(--ink); border-radius: var(--radius); overflow: hidden; }
      .tile { border-radius: var(--radius); color: #fff; box-shadow: 4px 4px 0 var(--ink); }
      .tile::after { content: ''; position: absolute; right: -18px; bottom: -18px; width: 90px; height: 90px; border: 3px dashed rgb(255 255 255 / .45); border-radius: 50%; }
      .chip { border-radius: 2px; font-family: 'Barlow Condensed'; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; }
      .site-footer { background: var(--forest); color: #dfe3c6; }
      .section-hero { background: transparent; }
      .block { background: var(--card); border: 2px solid var(--ink); border-radius: var(--radius); }
      .block h2 { font-size: 1.8rem; }
      .leader .avatar { border-radius: 50%; border: 3px solid #fffaf0; box-shadow: 0 0 0 2px var(--ink); font-family: 'Barlow Condensed'; font-weight: 800; }
      .divider { height: 16px; background: repeating-linear-gradient(90deg, var(--ink) 0 14px, transparent 14px 24px) center / 100% 3px no-repeat; }
    `,
    hero: (w, h) => `
      <svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Plaats voor een groepsfoto" preserveAspectRatio="xMidYMid slice">
        <defs><linearGradient id="vsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a9c6c8"/><stop offset="1" stop-color="#e8dcc0"/></linearGradient></defs>
        <rect width="${w}" height="${h}" fill="url(#vsky)"/>
        <circle cx="${w * 0.78}" cy="${h * 0.28}" r="${h * 0.12}" fill="#f6d77a"/>
        <path d="M0 ${h * 0.7} Q ${w * 0.25} ${h * 0.5} ${w * 0.5} ${h * 0.68} T ${w} ${h * 0.6} V ${h} H 0Z" fill="#7d9a5a"/>
        ${trees(w, h, '#3d5a33', 0.72, 9)}
        <path d="M0 ${h * 0.86} Q ${w * 0.4} ${h * 0.76} ${w} ${h * 0.9} V ${h} H 0Z" fill="#4c6b3c"/>
        <path d="M${w * 0.5} ${h} Q ${w * 0.46} ${h * 0.86} ${w * 0.56} ${h * 0.78}" stroke="#e7d7b1" stroke-width="10" fill="none" stroke-dasharray="2 14" stroke-linecap="round"/>
      </svg>`,
  },

  das: {
    label: 'Das',
    tagline: 'Bordeaux van de das, grote letters en stickers: fris en eigenzinnig.',
    colors: { kapoenen: '#f2b92c', welpen: '#3f9a52', wolven: '#178f8a', jongverkenners: '#2f6fd0', verkenners: '#7d1428', jin: '#ef6a2c', akabe: '#8f5bd6' },
    fonts: `
      @font-face { font-family: 'Bricolage Grotesque'; src: url(../fonts/bricolage-grotesque-latin-opsz-normal.woff2) format('woff2'); font-weight: 200 800; font-display: swap; }
      @font-face { font-family: 'Nunito'; src: url(../fonts/nunito-latin-wght-normal.woff2) format('woff2'); font-weight: 200 1000; font-display: swap; }`,
    css: `
      :root { --ink: #1c1418; --muted: #5d4d55; --paper: #fffaf6; --card: #ffffff; --line: #f0dfe2; --brand: #7d1428; --brand-2: #a3203a; --sun: #f2b92c; --radius: 22px; }
      body { font-family: 'Nunito', system-ui, sans-serif; background: var(--paper); color: var(--ink); }
      h1, h2, h3, .brand, .date-badge { font-family: 'Bricolage Grotesque', system-ui, sans-serif; letter-spacing: -0.02em; }
      h2 { font-size: clamp(1.8rem, 3.6vw, 2.8rem); font-weight: 800; }
      .site-header { background: var(--paper); color: var(--ink); border-bottom: 1px solid var(--line); }
      .brand { font-weight: 800; font-size: 1.2rem; line-height: 1; color: var(--brand); }
      .brand small { display: block; font-family: 'Nunito'; font-weight: 700; font-size: .72rem; color: var(--muted); letter-spacing: .02em; }
      .nav a { color: var(--ink); font-weight: 700; border-radius: 999px; } .nav a[aria-current] { background: var(--brand); color: #fff; }
      .btn { background: var(--brand); color: #fff; border-radius: 999px; font-weight: 800; }
      .btn.ghost { background: #fff; color: var(--brand); box-shadow: inset 0 0 0 2px var(--brand); }
      .hero { background: var(--brand); color: #fff; overflow: hidden; }
      .hero::before { content: ''; position: absolute; inset: auto -10% -60px -10%; height: 140px; background: repeating-linear-gradient(-12deg, var(--sun) 0 22px, transparent 22px 44px); transform: rotate(-4deg); opacity: .9; }
      .hero h1 { font-size: clamp(2.8rem, 8vw, 5.6rem); font-weight: 800; line-height: .9; }
      .hero h1 em { font-style: normal; background: var(--sun); color: var(--brand); padding: 0 .15em; border-radius: .2em; display: inline-block; transform: rotate(-2deg); }
      .hero p { color: #fde5ea; }
      .hero-photo { border-radius: 36px; transform: rotate(-2deg); box-shadow: 0 24px 50px -18px rgb(0 0 0 / .5); }
      .hero-photo::after { content: 'Zondag = scoutsdag'; position: absolute; right: 4px; top: -18px; width: 110px; height: 110px; display: grid; place-items: center; text-align: center; background: var(--sun); color: var(--brand); border-radius: 50%; font-family: 'Bricolage Grotesque'; font-weight: 800; font-size: .95rem; line-height: 1; padding: 10px; transform: rotate(12deg); box-shadow: 0 6px 14px rgb(0 0 0 / .2); }
      .hero .btn { background: var(--sun); color: var(--brand); }
      .hero .btn.ghost { background: transparent; color: #fff; box-shadow: inset 0 0 0 2px #fff; }
      .site-footer .brand { color: #fff; }
      .pinned { background: var(--sun); border-radius: var(--radius); }
      .pinned .label { color: var(--brand); }
      .pinned .btn { background: var(--ink); }
      .event { background: var(--card); border-radius: var(--radius); box-shadow: 0 1px 0 var(--line), 0 10px 24px -16px rgb(125 20 40 / .35); }
      .date-badge { background: var(--brand); color: #fff; border-radius: 16px; }
      .card { background: var(--card); border-radius: var(--radius); overflow: hidden; box-shadow: 0 12px 28px -18px rgb(125 20 40 / .45); }
      .tile { border-radius: var(--radius); color: #fff; }
      .tile:nth-child(odd) { transform: rotate(-1deg); } .tile:nth-child(even) { transform: rotate(1deg); }
      .chip { border-radius: 999px; }
      .site-footer { background: var(--ink); color: #e8d9dd; }
      .section-hero { color: #fff; }
      .block { background: var(--card); border-radius: var(--radius); box-shadow: 0 12px 28px -20px rgb(125 20 40 / .5); }
      .block h2 { font-size: 1.7rem; color: var(--brand); }
      .leader .avatar { border-radius: 30% 70% 60% 40% / 40% 40% 60% 60%; font-family: 'Bricolage Grotesque'; font-weight: 800; }
      .divider { height: 22px; background: repeating-linear-gradient(-45deg, var(--brand) 0 8px, transparent 8px 16px) center / 100% 10px no-repeat; }
    `,
    hero: (w, h) => `
      <svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Plaats voor een groepsfoto" preserveAspectRatio="xMidYMid slice">
        <defs><linearGradient id="dsky" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd8a8"/><stop offset="1" stop-color="#f4a59a"/></linearGradient></defs>
        <rect width="${w}" height="${h}" fill="url(#dsky)"/>
        ${trees(w, h, '#2f5b3b', 0.66, 8)}
        <path d="M0 ${h * 0.8} Q ${w / 2} ${h * 0.68} ${w} ${h * 0.82} V ${h} H 0Z" fill="#3f7a45"/>
        ${[0.3, 0.42, 0.54, 0.66].map((x, i) => person(w * x, h * 0.83, ['#7d1428', '#f2b92c', '#178f8a', '#2f6fd0'][i])).join('')}
      </svg>`,
  },
};

// ---------------------------------------------------------------- svg helpers

function trees(w, h, color, baseline, count) {
  let out = '';
  for (let i = 0; i < count; i++) {
    const x = (w / (count - 1)) * i + ((i * 37) % 23) - 11;
    const th = h * (0.22 + ((i * 53) % 17) / 100);
    const y = h * baseline;
    const tw = th * 0.42;
    out += `<path d="M${x} ${y - th} L${x + tw / 2} ${y - th * 0.45} L${x + tw * 0.32} ${y - th * 0.45} L${x + tw * 0.62} ${y} L${x - tw * 0.62} ${y} L${x - tw * 0.32} ${y - th * 0.45} L${x - tw / 2} ${y - th * 0.45}Z" fill="${color}"/>`;
  }
  return out + `<rect x="0" y="${h * baseline - 1}" width="${w}" height="${h}" fill="${color}"/>`;
}

function person(x, y, scarf) {
  return `<g transform="translate(${x} ${y})"><rect x="-16" y="-70" width="32" height="54" rx="14" fill="#5b6b4a"/><circle cy="-86" r="15" fill="#f1c7a3"/><path d="M-12 -70 L0 -50 L12 -70Z" fill="${scarf}"/><rect x="-13" y="-18" width="10" height="20" fill="#3c3a33"/><rect x="3" y="-18" width="10" height="20" fill="#3c3a33"/></g>`;
}

function topo(color) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='600' viewBox='0 0 600 600' fill='none' stroke='${color}' stroke-width='1.4'>${Array.from({ length: 9 }, (_, i) => `<path d='M-20 ${70 + i * 60} C 120 ${30 + i * 64} 220 ${120 + i * 55} 330 ${70 + i * 62} S 520 ${20 + i * 66} 640 ${80 + i * 58}'/>`).join('')}<ellipse cx='430' cy='170' rx='60' ry='34'/><ellipse cx='430' cy='170' rx='34' ry='18'/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

const initials = (name) => {
  const parts = name.split(' ');
  return `${parts[0][0]}${parts.at(-1)[0]}`.toUpperCase();
};

// ---------------------------------------------------------------- markup

function layout(theme, key, title, body, current) {
  return `<!doctype html>
<html lang="nl-BE">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} | Mockup ${theme.label}</title>
<style>
${theme.fonts}
${BASE_CSS}
${theme.css}
</style>
</head>
<body class="theme-${key}">
<p class="mock-banner">Mockup richting <strong>${theme.label}</strong>: ${theme.tagline} Teksten zijn voorbeeldtekst.</p>
<header class="site-header">
  <div class="wrap header-row">
    <a class="brand" href="index.html">Scouts Don Bosco<br>Vosselaar<small>Scouting? DAS Goesting!</small></a>
    <nav class="nav desktop" aria-label="Hoofdmenu"><ul>${nav.map((n) => `<li><a href="${n === 'Takken' ? 'tak.html' : 'index.html'}"${n === current ? ' aria-current="page"' : ''}>${n}</a></li>`).join('')}</ul></nav>
    <div class="quick"><a class="btn small" href="#kalender">Kalender</a><a class="btn small ghost" href="#">Inschrijven</a><button class="menu-btn" type="button" aria-label="Menu">☰</button></div>
  </div>
</header>
<main>
${body}
</main>
<footer class="site-footer">
  <div class="wrap footer-grid">
    <div><p class="brand">Scouts Don Bosco Vosselaar</p><p>Groep A4108G · Scouts en Gidsen Vlaanderen</p></div>
    <div><p>Adres van het lokaal</p><p><a href="#">info@scoutsvosselaar.be</a></p></div>
    <div><p><a href="#">Inschrijven</a></p><p><a href="#">Privacy</a></p></div>
  </div>
</footer>
</body>
</html>`;
}

const chips = (theme, ids) =>
  (ids.length ? ids : ['groep'])
    .map((id) => {
      const s = sections.find((x) => x.id === id);
      return s ? `<span class="chip" style="--c:${theme.colors[id]}">${s.name}</span>` : `<span class="chip" style="--c:var(--ink)">Hele groep</span>`;
    })
    .join('');

function eventList(theme, items) {
  return `<ul class="events">${items
    .map(
      (e) => `<li class="event">
        <div class="date-badge"><span class="wd">${e.weekday}</span><span class="d">${e.day}</span><span class="m">${e.month}</span></div>
        <div class="event-body"><h3>${e.title}</h3><p class="meta">${e.time} · ${e.place}${e.price ? ` · ${e.price}` : ''}</p><p class="chips">${chips(theme, e.for)}</p></div>
      </li>`,
    )
    .join('')}</ul>`;
}

function home(theme, key) {
  const body = `
<section class="hero">
  <div class="wrap hero-grid">
    <div class="hero-text">
      <p class="hand">Welkom bij de scouts!</p>
      <h1>Scouting?<br><em>DAS Goesting!</em></h1>
      <p>Elke zondag spelen, bouwen en op avontuur trekken in Vosselaar. Voor iedereen van 6 tot 17 jaar, en met Akabe ook voor kinderen en jongeren met een beperking.</p>
      <p class="actions"><a class="btn" href="#kalender">Bekijk de kalender</a><a class="btn ghost" href="#">Word lid</a></p>
    </div>
    <div class="hero-photo">${theme.hero(800, 560)}</div>
  </div>
</section>

<div class="wrap stack">
  <section class="pinned" aria-labelledby="pinned-title">
    <p class="label">${pinned.label}</p>
    <h2 id="pinned-title">${pinned.title}</h2>
    <p>${pinned.excerpt}</p>
    <p><a class="btn" href="#">${pinned.button}</a></p>
  </section>

  <div class="two-col">
    <section id="kalender" aria-labelledby="events-title">
      <div class="section-head"><h2 id="events-title">Binnenkort</h2><a href="#">Volledige kalender →</a></div>
      ${eventList(theme, events)}
    </section>

    <section aria-labelledby="posts-title">
      <div class="section-head"><h2 id="posts-title">Nieuws</h2><a href="#">Alle berichten →</a></div>
      <div class="posts">${posts
        .map(
          (p, i) => `<article class="card post">
          <div class="cover" style="--h:${[28, 140, 95][i]}">${theme.hero(600, 300).replace(/id="(\w+)"/g, `id="$1${i}"`).replace(/url\(#(\w+)\)/g, `url(#$1${i})`)}</div>
          <div class="card-body"><p class="meta">${p.date}</p><h3>${p.title}</h3><p>${p.excerpt}</p></div>
        </article>`,
        )
        .join('')}</div>
    </section>
  </div>

  <div class="divider" role="presentation"></div>

  <section aria-labelledby="takken-title">
    <div class="section-head"><h2 id="takken-title">Onze takken</h2></div>
    <ul class="tiles">${sections
      .map((s) => `<li><a class="tile" href="tak.html" style="--c:${theme.colors[s.id]}"><span class="tile-name">${s.name}</span><span class="tile-age">${s.age}</span></a></li>`)
      .join('')}</ul>
  </section>

  <section class="group-leaders" aria-labelledby="gl-title">
    <h2 id="gl-title">Groepsleiding</h2>
    <ul class="leaders">${groupLeaders.map((n) => `<li class="leader"><span class="avatar" style="--c:var(--brand)">${initials(n)}</span><span class="name">${n}</span></li>`).join('')}</ul>
  </section>
</div>`;
  return layout(theme, key, 'Home', body, 'Home');
}

function takPage(theme, key) {
  const c = theme.colors[tak.id];
  const body = `
<section class="section-hero" style="--c:${c}">
  <div class="wrap">
    <p class="crumbs"><a href="index.html">Home</a> / <a href="index.html">Takken</a> / ${tak.name}</p>
    <div class="section-hero-grid">
      <div>
        <h1>${tak.name}</h1>
        <dl class="facts">
          <div><dt>Leeftijd</dt><dd>${tak.age}</dd></div>
          <div><dt>Vergaderen</dt><dd>${tak.meeting}</dd></div>
          <div><dt>Mail</dt><dd><a href="mailto:${tak.email}">${tak.email}</a></dd></div>
        </dl>
      </div>
      <div class="hero-photo small">${theme.hero(640, 400).replace(/id="(\w+)"/g, 'id="$1t"').replace(/url\(#(\w+)\)/g, 'url(#$1t)')}</div>
    </div>
  </div>
</section>
<div class="wrap stack">
  <div class="blocks">
    <section class="block" style="--c:${c}"><h2>Wie?</h2><p>${tak.who}</p></section>
    <section class="block" style="--c:${c}"><h2>Wat?</h2><p>${tak.what}</p></section>
    <section class="block" style="--c:${c}"><h2>Kamp?</h2><p>${tak.camp}</p></section>
  </div>

  <section aria-labelledby="leiding-title">
    <div class="section-head"><h2 id="leiding-title">Leiding 2026-2027</h2></div>
    <ul class="leaders big">${tak.leaders
      .map(
        (l) => `<li class="leader"><span class="avatar" style="--c:${c}">VN</span><span class="name">${l.name}</span><span class="totem">${l.totem}</span>${l.lead ? '<span class="lead-badge">Takleiding</span>' : ''}</li>`,
      )
      .join('')}</ul>
  </section>

  <section aria-labelledby="tak-events">
    <div class="section-head"><h2 id="tak-events">Binnenkort bij de ${tak.name.toLowerCase()}</h2><a href="#">Abonneer in je agenda →</a></div>
    ${eventList(theme, events.filter((e) => e.for.length === 0 || e.for.includes(tak.id)))}
  </section>
</div>`;
  return layout(theme, key, tak.name, body, 'Takken');
}

// Layout shared by all directions; each direction restyles it.
const BASE_CSS = `
*, *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body { margin: 0; line-height: 1.55; }
img, svg { display: block; max-width: 100%; }
a { color: inherit; }
h1, h2, h3 { margin: 0; line-height: 1.1; }
p { margin: 0; }
ul { list-style: none; margin: 0; padding: 0; }
:focus-visible { outline: 3px solid #f2b92c; outline-offset: 2px; }
.wrap { width: min(1180px, 100% - 32px); margin-inline: auto; }
.stack > * + * { margin-top: clamp(40px, 6vw, 72px); }
.stack { padding-block: clamp(32px, 5vw, 64px); }
.mock-banner { margin: 0; padding: 8px 16px; font: 600 13px/1.4 system-ui, sans-serif; background: #111; color: #fff; text-align: center; }
.site-header { position: sticky; top: 0; z-index: 10; }
.header-row { display: flex; align-items: center; gap: 16px; padding-block: 12px; }
.brand { text-decoration: none; margin-right: auto; }
.nav.desktop { display: none; }
.nav ul { display: flex; gap: 2px; flex-wrap: wrap; }
.nav a { display: block; padding: 8px 10px; text-decoration: none; border-radius: 6px; }
.quick { display: flex; gap: 8px; align-items: center; }
.menu-btn { width: 40px; height: 40px; border: 0; border-radius: 10px; background: rgb(127 127 127 / .18); color: inherit; font-size: 20px; }
.btn { display: inline-flex; align-items: center; justify-content: center; min-height: 44px; padding: 10px 20px; text-decoration: none; }
.btn.small { min-height: 38px; padding: 6px 14px; font-size: .9rem; }
@media (min-width: 1100px) { .nav.desktop { display: block; } .quick { display: none; } }
.hero { position: relative; padding-block: clamp(36px, 7vw, 96px); overflow-x: clip; }
main { overflow-x: clip; }
.hero-grid { position: relative; display: grid; gap: 32px; align-items: center; }
@media (min-width: 860px) { .hero-grid { grid-template-columns: 1.05fr 1fr; } }
.hero-text > * + * { margin-top: 18px; }
.hero p { max-width: 34em; font-size: 1.1rem; }
.actions { display: flex; flex-wrap: wrap; gap: 12px; }
.hero-photo { position: relative; overflow: visible; }
.hero-photo svg { width: 100%; height: auto; aspect-ratio: 10 / 7; border-radius: inherit; }
.hero-photo.small svg { aspect-ratio: 16 / 10; }
.pinned { padding: clamp(20px, 4vw, 36px); }
.pinned > * + * { margin-top: 12px; }
.label { font-weight: 800; text-transform: uppercase; letter-spacing: .1em; font-size: .8rem; }
.two-col { display: grid; gap: 48px; }
@media (min-width: 960px) { .two-col { grid-template-columns: 1fr 1.1fr; } }
.section-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 20px; }
.section-head a { font-weight: 700; }
.events { display: grid; gap: 14px; }
.event { display: flex; gap: 16px; padding: 14px; align-items: center; }
.date-badge { flex: none; width: 68px; display: grid; justify-items: center; padding: 8px 4px; line-height: 1; }
.date-badge .wd, .date-badge .m { font-size: .75rem; text-transform: uppercase; letter-spacing: .08em; font-weight: 700; }
.date-badge .d { font-size: 1.9rem; font-weight: 800; margin-block: 2px; }
.event h3 { font-size: 1.2rem; }
.meta { color: var(--muted); font-size: .92rem; margin-top: 2px; }
.chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.chip { font-size: .78rem; font-weight: 700; padding: 3px 10px; background: color-mix(in srgb, var(--c) 16%, white); color: color-mix(in srgb, var(--c) 75%, black); }
.posts { display: grid; gap: 18px; }
.post { display: grid; grid-template-columns: 120px 1fr; }
.post .cover svg { height: 100%; width: 100%; aspect-ratio: auto; }
.card-body { padding: 14px 16px; }
.card-body h3 { font-size: 1.1rem; margin-top: 2px; }
.card-body p:last-child { margin-top: 6px; font-size: .95rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
@media (min-width: 600px) { .post { grid-template-columns: 180px 1fr; } }
.tiles { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
@media (min-width: 700px) { .tiles { grid-template-columns: repeat(4, 1fr); } }
@media (min-width: 1100px) { .tiles { grid-template-columns: repeat(7, 1fr); } }
.tile { position: relative; overflow: hidden; display: flex; flex-direction: column; justify-content: flex-end; min-height: 130px; padding: 16px; background: var(--c); text-decoration: none; }
.tile-name { font-weight: 800; font-size: 1.2rem; line-height: 1.1; }
.tile-age { font-size: .85rem; opacity: .92; }
.leaders { display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px; margin-top: 20px; }
@media (min-width: 700px) { .leaders { grid-template-columns: repeat(4, 1fr); } .leaders.big { grid-template-columns: repeat(6, 1fr); } }
.leader { display: grid; justify-items: center; align-content: start; text-align: center; gap: 4px; position: relative; }
.avatar { width: 88px; height: 88px; display: grid; place-items: center; background: var(--c); color: #fff; font-size: 1.6rem; font-weight: 800; }
.leader .name { font-weight: 700; }
.leader .totem { color: var(--muted); font-style: italic; font-size: .92rem; }
.lead-badge { font-size: .72rem; font-weight: 800; text-transform: uppercase; letter-spacing: .06em; padding: 2px 8px; border-radius: 999px; background: var(--ink); color: #fff; }
.site-footer { padding-block: 40px; margin-top: 24px; }
.footer-grid { display: grid; gap: 20px; }
@media (min-width: 700px) { .footer-grid { grid-template-columns: 2fr 1.5fr 1fr; } }
.section-hero { padding-block: 28px 44px; background: var(--c) !important; color: #fff; }
.theme-veldgids .section-hero { background: linear-gradient(transparent 0 0) !important; color: var(--ink); border-bottom: 6px solid var(--c); }
.crumbs { font-size: .9rem; opacity: .85; margin-bottom: 18px; }
.section-hero h1 { font-size: clamp(3rem, 9vw, 5.5rem); font-weight: 800; }
.section-hero-grid { display: grid; gap: 28px; align-items: center; }
@media (min-width: 860px) { .section-hero-grid { grid-template-columns: 1fr 1fr; } }
.facts { display: grid; gap: 10px; margin: 20px 0 0; }
.facts div { display: grid; grid-template-columns: 110px 1fr; gap: 8px; }
.facts dt { font-weight: 800; text-transform: uppercase; font-size: .8rem; letter-spacing: .08em; opacity: .85; padding-top: 3px; }
.facts dd { margin: 0; font-size: 1.1rem; font-weight: 600; }
.blocks { display: grid; gap: 18px; }
@media (min-width: 860px) { .blocks { grid-template-columns: repeat(3, 1fr); } }
.block { padding: 22px; border-top: 6px solid var(--c) !important; }
.block p { margin-top: 10px; }
.theme-veldgids .tile-name { font-family: 'Barlow Condensed'; text-transform: uppercase; font-size: 1.5rem; }
.theme-das .tile-name { font-family: 'Bricolage Grotesque'; font-size: 1.35rem; }
.theme-kampvuur .tile-name { font-family: 'Fraunces', serif; font-size: 1.35rem; }
`;

for (const [key, theme] of Object.entries(themes)) {
  const dir = join(OUT, key);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), home(theme, key));
  writeFileSync(join(dir, 'tak.html'), takPage(theme, key));
}
console.log('Mockups geschreven:', Object.keys(themes).join(', '));
