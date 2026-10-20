import { describe, expect, it } from 'vitest';
import {
  VIDEO_UNAVAILABLE,
  convertPostHtml,
  findImages,
  findLinks,
  fixText,
  fullSizeUrl,
  imagePlaceholder,
  removeLeadingImage,
  scoutYearLabel,
  slugify,
  truncate,
  wpDate,
  youtubeUrl,
} from '../scripts/migrate/convert';

describe('convertPostHtml', () => {
  it('converts text and replaces images by placeholders', () => {
    const html = `
      <figure class="wp-block-image"><img src="https://x.be/wp-content/uploads/affiche-1024x768.jpg" alt="Affiche"></figure>
      <p>Beste ouders,</p>
      <ul><li>Eerste</li><li><strong>Tweede</strong></li></ul>
      <p><a href="https://forms.gle/abc">Inschrijven</a></p>`;
    const r = convertPostHtml(html);
    expect(r.inlineImages).toEqual(['https://x.be/wp-content/uploads/affiche.jpg']);
    expect(r.markdown).toBe(
      `![Affiche](${imagePlaceholder(0)})\n\nBeste ouders,\n\n-   Eerste\n-   **Tweede**\n\n[Inschrijven](https://forms.gle/abc)`,
    );
  });

  it('moves gallery images to the gallery', () => {
    const html = `<p>Foto's:</p><figure class="wp-block-gallery has-nested-images"><figure><img src="https://x.be/a-300x200.jpg"></figure><figure><img src="https://x.be/b.jpg" srcset="https://x.be/b-300x200.jpg 300w, https://x.be/b-1600x1200.jpg 1600w"></figure></figure>`;
    const r = convertPostHtml(html);
    expect(r.galleryImages).toEqual(['https://x.be/a.jpg', 'https://x.be/b.jpg']);
    expect(r.inlineImages).toEqual([]);
    expect(r.markdown).toBe("Foto's:");
  });

  it('takes YouTube embeds out and replaces self-hosted video by a note', () => {
    const html = `<p>Kijk:</p><iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ?feature=oembed"></iframe><figure class="wp-block-video"><video src="https://x.be/sanitair.mp4"></video></figure>`;
    const r = convertPostHtml(html);
    expect(r.videoUrl).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(r.droppedVideos).toEqual(['https://x.be/sanitair.mp4']);
    expect(r.markdown).toBe(`Kijk:\n\n${VIDEO_UNAVAILABLE}`);
  });

  it('can drop a leading image that became the cover', () => {
    const r = convertPostHtml('<p><img src="https://x.be/a.jpg"></p><p>Tekst</p><p><img src="https://x.be/b.jpg"></p>');
    expect(removeLeadingImage(r.markdown, 0)).toBe(`Tekst\n\n![](${imagePlaceholder(1)})`);
    expect(removeLeadingImage(r.markdown, 1)).toBe(r.markdown);
  });
});

describe('helpers', () => {
  it('truncates at a word boundary', () => {
    expect(truncate('Kort.')).toBe('Kort.');
    expect(truncate('Dit is wat meer tekst [&hellip;]')).toBe('Dit is wat meer tekst');
    const long = truncate('woord '.repeat(60));
    expect(long.length).toBeLessThanOrEqual(200);
    expect(long.endsWith('woord…')).toBe(true);
  });

  it('reads WordPress dates and URLs', () => {
    expect(wpDate('2023-04-12T10:00:00')).toBe('2023-04-12');
    expect(fullSizeUrl('https://x.be/foto-scaled.jpg')).toBe('https://x.be/foto.jpg');
    expect(fullSizeUrl('https://x.be/foto-1024x683.jpeg?v=2')).toBe('https://x.be/foto.jpeg?v=2');
    expect(youtubeUrl('https://youtu.be/dQw4w9WgXcQ')).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(youtubeUrl('https://vimeo.com/1')).toBeUndefined();
  });

  it('fixes known typos', () => {
    expect(fixText('verkenners@scoutsosselaar.be, contract op te nemen')).toBe('verkenners@scoutsvosselaar.be, contact op te nemen');
  });

  it('finds scout years, links, images and slugs', () => {
    expect(scoutYearLabel("Groepsfoto's 2022-2023")).toBe('2022-2023');
    expect(scoutYearLabel('Groepsfoto 2022 – 2023')).toBe('2022-2023');
    expect(scoutYearLabel('Kamp 2023')).toBeUndefined();
    expect(findLinks('<a class="b" href="https://x.be/a.pdf">Privacy&nbsp;verklaring</a>')).toEqual([
      { href: 'https://x.be/a.pdf', text: 'Privacy verklaring' },
    ]);
    expect(findImages('<img src="https://x.be/a-150x150.jpg"><img data-src="https://x.be/a.jpg">')).toEqual(['https://x.be/a.jpg']);
    expect(slugify("'t Voske: Één & twee")).toBe('t-voske-een-twee');
  });
});
