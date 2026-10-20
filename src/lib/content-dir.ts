/**
 * Folder with the content collections. Normally `src/content`; tests build the
 * site from `tests/fixtures/site/content` by setting `CONTENT_DIR`.
 */
export const CONTENT_DIR = process.env.CONTENT_DIR?.trim() || 'src/content';
