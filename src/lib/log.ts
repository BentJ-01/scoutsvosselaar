/**
 * Content problems are logged as warnings and never break the build.
 * Only real code errors may fail a build.
 */
const seen = new Set<string>();

export function contentWarning(message: string): void {
  if (seen.has(message)) return;
  seen.add(message);
  console.warn(`[inhoud] ${message}`);
}
