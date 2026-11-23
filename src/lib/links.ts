import { FEED_URL } from './feed';

export const LISTEN_LINKS = [
  { label: 'Apple Podcasts', href: 'https://podcasts.apple.com/no/podcast/sp%C3%A6ll/id1498119699' },
  { label: 'Spotify', href: 'https://open.spotify.com/show/1iKntCOfIHmaBI3Mm2d2vD' },
  { label: 'RSS', href: FEED_URL },
];

export const SOCIAL_LINKS = [
  { label: 'Patreon', href: 'https://www.patreon.com/lolbua' },
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
