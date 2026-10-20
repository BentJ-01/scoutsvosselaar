import type { APIRoute } from 'astro';
import { indexable } from '../../deployment.config';

const base = import.meta.env.BASE_URL.replace(/\/$/, '');

export const GET: APIRoute = ({ site }) => {
  // Not on the own domain yet: keep the whole site out of search engines.
  const body = indexable
    ? `User-agent: *\nDisallow: ${base}/admin/\n\nSitemap: ${new URL(`${base}/sitemap-index.xml`, site)}\n`
    : 'User-agent: *\nDisallow: /\n';
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
