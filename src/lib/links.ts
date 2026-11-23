import type { Episode } from './feed';

export const FEED_URL =
  'https://www.omnycontent.com/d/playlist/d79bdbb3-8eae-4ad2-b1f6-b0bc00cd1540/b0b974e4-d76a-4f77-905a-b3ef00b49619/12340bdf-8da5-4473-88e7-b3ef00b49642/podcast.rss';

export const PATREON_URL = 'https://www.patreon.com/lolbua';

export const LISTEN_LINKS = [
  { label: 'Apple Podcasts', href: 'https://podcasts.apple.com/no/podcast/sp%C3%A6ll/id1498119699' },
  { label: 'Spotify', href: 'https://open.spotify.com/show/1iKntCOfIHmaBI3Mm2d2vD' },
  { label: 'RSS', href: FEED_URL },
];

export const SOCIAL_LINKS = [
  { label: 'Patreon', href: PATREON_URL },
  { label: 'Discord', href: 'https://discord.gg/PZrtNvSmP3' },
  { label: 'Facebook', href: 'https://www.facebook.com/Spaell' },
  { label: 'Facebook-gruppe', href: 'https://www.facebook.com/groups/2290099547870968' },
  { label: 'Instagram', href: 'https://www.instagram.com/spaell.podcast' },
  { label: 'Merch', href: 'https://spaell.myspreadshop.no/' },
];

/** Lenke innad på siden, med base-stien til GitHub Pages. */
export function url(path = ''): string {
  return `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

/** Full URL med domene, til canonical, Open Graph og JSON-LD. Tar en sti som allerede har base. */
export function absoluteUrl(path = url()): string {
  return new URL(path, import.meta.env.SITE).href;
}

export function episodeUrl(episode: Pick<Episode, 'slug'>): string {
  return url(`episode/${episode.slug}/`);
}
