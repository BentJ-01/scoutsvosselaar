import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { getPosts } from '@/lib/content';
import { url } from '@/lib/paths';
import { site as group } from '@/site.config';

export const GET: APIRoute = async ({ site }) =>
  rss({
    title: `Berichten van ${group.name}`,
    description: `Nieuws en uitnodigingen van ${group.name}.`,
    site: new URL(import.meta.env.BASE_URL, site).href,
    customData: '<language>nl-be</language>',
    items: (await getPosts()).slice(0, 30).map((post) => ({
      title: post.data.title,
      description: post.data.excerpt,
      pubDate: post.data.date?.utc,
      link: url(`/berichten/${post.id}/`),
    })),
  });
