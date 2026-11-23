import { FEED_URL } from './feed';
import type { IconName } from './icons';

type Link = { label: string; href: string; icon: IconName };

export const LISTEN_LINKS: Link[] = [
  { label: 'Apple Podcasts', icon: 'applepodcasts', href: 'https://podcasts.apple.com/no/podcast/sp%C3%A6ll/id1498119699' },
  { label: 'Spotify', icon: 'spotify', href: 'https://open.spotify.com/show/1iKntCOfIHmaBI3Mm2d2vD' },
  { label: 'RSS', icon: 'rss', href: FEED_URL },
];

export const SOCIAL_LINKS: Link[] = [
  { label: 'Patreon', icon: 'patreon', href: 'https://www.patreon.com/lolbua' },
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
