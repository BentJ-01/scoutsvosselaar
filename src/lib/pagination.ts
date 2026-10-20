/** Splits a list into pages of `size` items. Page 1 is first. */
export function paginate<T>(items: readonly T[], size: number): T[][] {
  const pages: T[][] = [];
  for (let i = 0; i < items.length; i += size) pages.push(items.slice(i, i + size));
  return pages.length ? pages : [[]];
}

export const POSTS_PER_PAGE = 12;

/** URL of a page of the post overview: /berichten/ and /berichten/pagina/2/. */
export const postsPageHref = (page: number) => (page <= 1 ? '/berichten/' : `/berichten/pagina/${page}/`);
