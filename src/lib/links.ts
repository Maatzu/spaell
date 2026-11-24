import type { Episode } from './feed';
import type { IconName } from './icons';

export const FEED_URL =
  'https://www.omnycontent.com/d/playlist/d79bdbb3-8eae-4ad2-b1f6-b0bc00cd1540/b0b974e4-d76a-4f77-905a-b3ef00b49619/12340bdf-8da5-4473-88e7-b3ef00b49642/podcast.rss';

export const SPOTIFY_SHOW_ID = '1iKntCOfIHmaBI3Mm2d2vD';
export const SPOTIFY_SHOW_URL = `https://open.spotify.com/show/${SPOTIFY_SHOW_ID}`;

export const PATREON_URL = 'https://www.patreon.com/lolbua';

type Link = { label: string; href: string; icon: IconName };

export const LISTEN_LINKS: Link[] = [
  { label: 'Apple Podcasts', icon: 'applepodcasts', href: 'https://podcasts.apple.com/no/podcast/sp%C3%A6ll/id1498119699' },
  { label: 'Spotify', icon: 'spotify', href: SPOTIFY_SHOW_URL },
  { label: 'RSS', icon: 'rss', href: FEED_URL },
];

export const SOCIAL_LINKS: Link[] = [
  { label: 'Patreon', icon: 'patreon', href: PATREON_URL },
  { label: 'Discord', icon: 'discord', href: 'https://discord.gg/PZrtNvSmP3' },
  { label: 'Facebook', icon: 'facebook', href: 'https://www.facebook.com/Spaell' },
  { label: 'Facebook-gruppe', icon: 'facebook', href: 'https://www.facebook.com/groups/2290099547870968' },
  { label: 'Instagram', icon: 'instagram', href: 'https://www.instagram.com/spaell.podcast' },
  { label: 'Merch', icon: 'merch', href: 'https://spaell.myspreadshop.no/' },
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
