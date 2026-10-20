/**
 * Builds a link that respects the configured base path, so the site works on
 * `<user>.github.io/<repo>/` as well as on its own domain.
 */
export function url(path: string): string {
  if (/^[a-z]+:/i.test(path) || path.startsWith('#')) return path;
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}/${path.replace(/^\//, '')}`;
}

/** True when `href` is the current page or a parent of it (home only matches itself). */
export function isActive(href: string, pathname: string): boolean {
  const current = pathname.endsWith('/') ? pathname : `${pathname}/`;
  const target = url(href);
  return target === url('/') ? current === target : current.startsWith(target);
}
