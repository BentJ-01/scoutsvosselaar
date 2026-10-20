/**
 * Main CMS flows in Sveltia's local repository mode, on desktop and phone.
 *
 * The browser's directory picker is replaced by a folder in the origin private
 * file system, filled with tests/fixtures/cms-repo. After the flows, the files
 * the CMS wrote are read back and checked.
 */
import { expect, test, type Page } from '@playwright/test';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import sharp from 'sharp';

const FIXTURE = join(import.meta.dirname, '../fixtures/cms-repo');

function fixtureFiles(): [string, string][] {
  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const path = join(dir, name);
      return statSync(path).isDirectory() ? walk(path) : [path];
    });
  return [['.git/HEAD', btoa('ref: refs/heads/main\n')], ...walk(FIXTURE).map((p): [string, string] => [relative(FIXTURE, p), readFileSync(p).toString('base64')])];
}

/** A 3000 px wide JPEG with camera and GPS data in its EXIF. */
async function photoWithGps(background = '#3a6b35'): Promise<Buffer> {
  return sharp({ create: { width: 3000, height: 2000, channels: 3, background } })
    .jpeg()
    .withExif({
      IFD0: { Make: 'TestCam', Model: 'X1' },
      IFD3: { GPSLatitudeRef: 'N', GPSLatitude: '51/1 18/1 0/1', GPSLongitudeRef: 'E', GPSLongitude: '4/1 53/1 0/1' },
    })
    .toBuffer();
}

async function openLocalRepository(page: Page) {
  await page.addInitScript(() => {
    Object.assign(window, {
      showDirectoryPicker: async () => (await navigator.storage.getDirectory()).getDirectoryHandle('repo'),
    });
  });
  await page.goto('admin/index.html');
  await page.evaluate(async (files) => {
    const root = await navigator.storage.getDirectory();
    await root.removeEntry('repo', { recursive: true }).catch(() => {});
    const repo = await root.getDirectoryHandle('repo', { create: true });
    for (const [path, b64] of files) {
      const parts = path.split('/');
      let dir = repo;
      for (const part of parts.slice(0, -1)) dir = await dir.getDirectoryHandle(part, { create: true });
      const writable = await (await dir.getFileHandle(parts.at(-1)!, { create: true })).createWritable();
      await writable.write(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)));
      await writable.close();
    }
  }, fixtureFiles());
  await page.reload();
  await expect(page.getByText('Welkom bij')).toBeVisible();
  await page.getByRole('button', { name: 'Werken met een lokale repository' }).click();
  await expect(page.getByText('Collecties').first()).toBeVisible();
}

async function readRepoFile(page: Page, path: string): Promise<Buffer> {
  const b64 = await page.evaluate(async (path) => {
    let dir = await (await navigator.storage.getDirectory()).getDirectoryHandle('repo');
    const parts = path.split('/');
    for (const part of parts.slice(0, -1)) dir = await dir.getDirectoryHandle(part);
    const bytes = new Uint8Array(await (await (await dir.getFileHandle(parts.at(-1)!)).getFile()).arrayBuffer());
    let s = '';
    for (const b of bytes) s += String.fromCharCode(b);
    return btoa(s);
  }, path);
  return Buffer.from(b64, 'base64');
}

async function save(page: Page) {
  await page.evaluate(() => document.getElementById('saved-notice')?.remove());
  await page.getByRole('button', { name: 'Opslaan', exact: true }).click();
  await expect(page.locator('#saved-notice')).toBeVisible();
  // Saved: the editor shows no unsaved changes any more, or the CMS went back to the list.
  await expect(page.getByRole('button', { name: 'Opslaan', exact: true }).and(page.locator(':enabled'))).toHaveCount(0);
}

/** Opens a CMS route and waits until its editor is ready. */
async function open(page: Page, admin: string, route: string, ready: string) {
  // After saving, the CMS may stay in the editor; leave it first like a user would.
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Opslaan', exact: true })).toHaveCount(0);
  await page.goto(`${admin}#/${route}`);
  await expect(page.getByRole('textbox', { name: ready })).toBeEditable();
}

test('bericht, evenement en nieuw werkjaar', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openLocalRepository(page);
  const admin = page.url().split('#')[0] ?? '';
  const photo = { name: 'foto.jpg', mimeType: 'image/jpeg', buffer: await photoWithGps() };

  // Bericht met coverfoto en galerij
  await open(page, admin, 'collections/posts/new', 'Titel');
  await page.getByRole('textbox', { name: 'Titel' }).fill('Dag van de Scout');
  await page.getByRole('textbox', { name: 'Korte samenvatting' }).fill('Kom allemaal!');
  const fileInput = (field: string) => page.locator(`section[data-key-path="${field}"] input[type=file]`).first();
  await fileInput('coverImage').setInputFiles(photo);
  await fileInput('gallery').setInputFiles([photo, { ...photo, name: 'foto2.jpg', buffer: await photoWithGps('#7a1f2b') }]);
  await page.locator('[contenteditable=true]').first().click();
  await page.keyboard.type('Hallo iedereen.');
  await page.getByText('Kapoenen', { exact: true }).first().click();
  await save(page);

  // Evenement voor twee takken
  await open(page, admin, 'collections/events/new', 'Titel');
  await page.getByRole('textbox', { name: 'Titel' }).fill('Halloweentocht');
  await page.locator('input[type=datetime-local]').nth(0).fill('2026-10-25T14:00');
  await page.locator('input[type=datetime-local]').nth(1).fill('2026-10-25T16:30');
  await page.getByText('Kapoenen', { exact: true }).first().click();
  await page.getByText('Welpen', { exact: true }).first().click();
  await save(page);

  // Nieuw werkjaar door het vorige te dupliceren
  await open(page, admin, 'collections/scout-years/entries/2026-2027', 'Werkjaar');
  await page.getByRole('button', { name: 'Editoropties tonen' }).click();
  await page.getByRole('menuitem').filter({ hasText: 'Dupliceren' }).click();
  await expect(page).not.toHaveURL(/entries\/2026-2027$/);
  await page.getByRole('textbox', { name: 'Werkjaar' }).fill('2027-2028');
  await save(page);

  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/New_York' });
  const post = (await readRepoFile(page, `src/content/posts/${today}-dag-van-de-scout.md`)).toString();
  expect(post).toContain('coverImage: ../../assets/uploads/posts/foto.webp');
  // The same file uploaded twice is stored once.
  expect(post).toMatch(/gallery:\n\s+- \.\.\/\.\.\/assets\/uploads\/posts\/foto\.webp\n\s+- \.\.\/\.\.\/assets\/uploads\/posts\/foto2\.webp/);
  expect(post).toContain('  - kapoenen');

  const event = (await readRepoFile(page, 'src/content/events/2026-10-25-halloweentocht.md')).toString();
  // Brussels wall-clock time, even though the browser runs in New York.
  expect(event).toContain('start: 2026-10-25T14:00');
  expect(event).toContain('end: 2026-10-25T16:30');
  expect(event).toMatch(/sections:\n\s+- kapoenen\n\s+- welpen/);

  const year = JSON.parse((await readRepoFile(page, 'src/content/scout-years/2027-2028.json')).toString());
  expect(year.label).toBe('2027-2028');
  expect(year.sectionTeams[0].section).toBe('kapoenen');

  const meta = await sharp(await readRepoFile(page, 'src/assets/uploads/posts/foto.webp')).metadata();
  expect(meta.format).toBe('webp');
  expect(meta.width).toBe(2000);
  expect(meta.exif).toBeUndefined();

  expect(errors).toEqual([]);
});
