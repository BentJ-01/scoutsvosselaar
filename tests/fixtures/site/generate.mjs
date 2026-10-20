// Generates the fixture site used by the smoke tests (CONTENT_DIR=tests/fixtures/site/content).
// Fictional content: names and texts are placeholders, not real people.
//
//   node tests/fixtures/site/generate.mjs
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const sharp = createRequire(import.meta.url)('sharp');
const ROOT = import.meta.dirname;
const C = join(ROOT, 'content');
const A = join(ROOT, 'assets/uploads');
rmSync(C, { recursive: true, force: true });
rmSync(A, { recursive: true, force: true });

const write = (path, data) => {
  mkdirSync(join(path, '..'), { recursive: true });
  writeFileSync(path, typeof data === 'string' ? data : `${JSON.stringify(data, null, 2)}\n`);
};

async function scene(name, sky, ground, w = 1200, h = 800) {
  const trees = Array.from({ length: 9 }, (_, i) => {
    const x = (w / 8) * i, th = h * (0.3 + ((i * 7) % 5) / 30), y = h * 0.72;
    return `<path d="M${x} ${y - th} L${x + th * 0.22} ${y} L${x - th * 0.22} ${y}Z" fill="${ground}"/>`;
  }).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky}"/><stop offset="1" stop-color="#f4ecdd"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/>${trees}<rect y="${h * 0.72}" width="${w}" height="${h}" fill="${ground}"/></svg>`;
  mkdirSync(A, { recursive: true });
  await sharp(Buffer.from(svg)).webp({ quality: 70 }).toFile(join(A, `${name}.webp`));
  return `../../assets/uploads/${name}.webp`;
}

const sections = [
  ['kapoenen', 'Kapoenen', '6 en 7 jaar', '#996208', 1],
  ['welpen', 'Welpen', '8 tot 10 jaar', '#4c7a30', 2],
  ['wolven', 'Wolven', '8 tot 10 jaar', '#2c6e68', 3],
  ['jongverkenners', 'Jongverkenners', '11 tot 13 jaar', '#2f5d8a', 4],
  ['verkenners', 'Verkenners', '14 tot 16 jaar', '#8c1d2c', 5],
  ['jin', 'Jin', '17 jaar', '#b2461b', 6],
  ['akabe', 'Akabe', 'Vanaf 6 jaar', '#6d4f8a', 7],
];
for (const [id, name, ageRange, color, order] of sections) {
  write(join(C, 'sections', `${id}.json`), {
    name, ageRange, color, order,
    shortDescription: `Testtekst voor de ${name.toLowerCase()}: spelen, ravotten en samen op avontuur.`,
    who: `De **${name.toLowerCase()}** zijn een testgroep.\n\nDit is voorbeeldtekst.`,
    what: 'Elke zondag spelen we buiten:\n\n- bosspelen\n- hutten bouwen\n- tochten',
    camp: 'In de zomer gaan we tien dagen op kamp.',
    meetingTime: 'Zondag 14u tot 16u30',
    email: `${id === 'jin' ? 'jins' : id}@scoutsvosselaar.be`,
    leaderLabel: id === 'jin' ? 'Begeleiding' : 'Leiding',
  });
}

const leaders = [
  ['an', 'Test', 'Speelse Bever', true], ['bo', 'Test', 'Wijze Uil', false], ['cas', 'Test', 'Snelle Hinde', true],
  ['dirk', 'Test', '', false], ['eva', 'Test', 'Trouwe Das', true], ['fien', 'Test', 'Dappere Lynx', false],
  ['gust', 'Test', 'Rustige Reiger', false], ['hanne', 'Test', 'Vrolijke Vink', true],
];
for (const [first, last, totem, withPhoto] of leaders) {
  const data = { firstName: first[0].toUpperCase() + first.slice(1), lastName: last };
  if (totem) data.totem = totem;
  if (withPhoto) data.photo = await scene(`leider-${first}`, '#c9a27a', '#5a3d2b', 400, 400);
  if (first === 'an') Object.assign(data, { email: 'an@example.com', phone: '0470 00 00 00' });
  write(join(C, 'leaders', `${data.firstName.toLowerCase()}-test.json`), data);
}
const L = (n) => `${n}-test`;

const groupPhoto = await scene('groepsfoto-2026', '#a9c6c8', '#3d5a33');
const groupPhoto2 = await scene('groepsfoto-2026-b', '#e7b98a', '#2f4a2c');
write(join(C, 'scout-years', '2026-2027.json'), {
  label: '2026-2027', startDate: '2026-09-01', endDate: '2027-08-31',
  groupLeaders: [L('an'), L('bo'), 'verwijderd-persoon'],
  sectionTeams: [
    { section: 'kapoenen', leaders: [L('an'), L('cas'), L('dirk')], sectionLeads: [L('cas')] },
    { section: 'welpen', leaders: [L('eva'), L('fien'), L('gust'), L('an')], sectionLeads: [L('eva'), L('fien')] },
    { section: 'jin', leaders: [L('hanne')], sectionLeads: [L('hanne')] },
  ],
  groupPhotos: [groupPhoto, groupPhoto2],
});
write(join(C, 'scout-years', '2025-2026.json'), {
  label: '2025-2026', startDate: '2025-09-01', endDate: '2026-08-31', groupLeaders: [], sectionTeams: [],
  groupPhotos: [await scene('groepsfoto-2025', '#b7c7e0', '#34493d')],
});
write(join(C, 'settings', 'site.json'), { currentYear: '2026-2027' });

const cover1 = await scene('bericht-1', '#f3c58a', '#4c7a30');
const cover2 = await scene('bericht-2', '#9fc0d8', '#2c6e68');
const posts = [
  ['2026-10-12-inschrijvingen-open', { title: 'Inschrijvingen 2026-2027 zijn open', date: '2026-10-12', excerpt: 'Schrijf je kind in voor het nieuwe werkjaar.', coverImage: cover1, pinned: true, buttonUrl: 'https://example.com/inschrijven', buttonLabel: 'Inschrijven' }, 'Beste ouders,\n\nDe inschrijvingen zijn open. Dit is **testinhoud**.\n\n## Praktisch\n\n- Lidgeld: 50 euro\n- Met UiTPAS: 15 euro'],
  ['2026-10-05-smoutebollenbak', { title: 'Smoutebollenbak', date: '2026-10-05', excerpt: 'Bestel je smoutebollen vooraf.', coverImage: cover2, gallery: [groupPhoto, groupPhoto2], videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', sections: ['welpen', 'jin'] }, 'Testbericht met galerij en video.'],
  ['2026-09-20-overgang', { title: 'Overgang 2026', date: '2026-09-20', excerpt: 'Een weekend vol vuur.', pinned: true }, 'Ouder vastgepind bericht: mag niet bovenaan staan.'],
  ['2026-09-01-concept', { title: 'Concept dat niet getoond wordt', date: '2026-09-01', excerpt: 'Concept.', draft: true }, 'Concept.'],
];
for (let i = 0; i < 12; i++) {
  const day = String(10 + i).padStart(2, '0');
  posts.push([`2025-03-${day}-archief-${i + 1}`, { title: `Archiefbericht ${i + 1}`, date: `2025-03-${day}`, excerpt: 'Ouder bericht voor de paginering.' }, 'Archief.']);
}
for (const [id, data, body] of posts) {
  write(join(C, 'posts', `${id}.md`), `---\n${Object.entries(data).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join('\n')}\n---\n\n${body}\n`);
}

const events = [
  ['2025-06-01-voorbij', { title: 'Voorbij evenement', start: '2025-06-01T14:00', sections: [] }],
  ['2026-10-24-halloweentocht', { title: 'Halloweentocht', start: '2026-10-24T18:00', end: '2026-10-24T21:00', location: 'Lokaal', sections: ['kapoenen', 'welpen'] }],
  ['2026-10-25-wintertijd', { title: 'Activiteit op de dag van de wintertijd', start: '2026-10-25T14:00', end: '2026-10-25T16:30', location: 'Verrassing', sections: ['welpen'] }],
  ['2026-11-14-spaghettiavond', { title: 'Spaghettiavond', start: '2026-11-14T17:00', location: 'Parochiezaal', price: '€12', linkUrl: 'https://example.com/form', linkLabel: 'Inschrijven', sections: [] }],
  ['2026-11-22-geannuleerd', { title: 'Geannuleerde tocht', start: '2026-11-22T10:00', cancelled: true, sections: ['jin'] }],
  ['2026-12-05-leidingsweekend', { title: 'Leidingsweekend', start: '2026-12-05', end: '2026-12-06', allDay: true, forLeaders: true, sections: [] }],
  ['2027-03-28-zomertijd', { title: 'Activiteit op de dag van de zomertijd', start: '2027-03-28T14:00', sections: ['kapoenen'] }],
];
for (const [id, data] of events) {
  write(join(C, 'events', `${id}.md`), `---\n${Object.entries(data).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join('\n')}\n---\n\nBeschrijving van ${data.title}.\n`);
}

write(join(C, 'voskes', 't-voske-2024.json'), { title: "'t Voske 2024", date: '2024-12-01', pdf: '/voske/test.pdf', cover: await scene('voske-2024', '#e8d4b0', '#8c1d2c', 600, 850) });
write(join(C, 'voskes', 't-voske-2023.json'), { title: "'t Voske 2023", date: '2023-12-01', pdf: '/voske/test.pdf' });
write(join(C, 'albums', '2026-kamp-welpen.json'), { title: 'Kamp Welpen 2026', date: '2026-07-20', sections: ['welpen'], coverImage: cover2, albumUrl: 'https://photos.example.com/kamp' });
write(join(C, 'albums', '2025-kamp-jin.json'), { title: 'Kamp Jin 2025', date: '2025-07-15', sections: ['jin'], coverImage: cover1, albumUrl: 'https://photos.example.com/jin' });
console.log('Fixtures geschreven.');
