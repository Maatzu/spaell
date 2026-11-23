import { XMLParser } from 'fast-xml-parser';
import sanitizeHtml from 'sanitize-html';

export const FEED_URL =
  'https://www.omnycontent.com/d/playlist/d79bdbb3-8eae-4ad2-b1f6-b0bc00cd1540/b0b974e4-d76a-4f77-905a-b3ef00b49619/12340bdf-8da5-4473-88e7-b3ef00b49642/podcast.rss';

export type EpisodeType = 'episode' | 'spaellbreak' | 'spesial';

export interface Chapter {
  start: number;
  title: string;
}

export interface Episode {
  id: string;
  slug: string;
  number: number | null;
  /** Tittel uten «#NNN». */
  title: string;
  fullTitle: string;
  type: EpisodeType;
  date: string;
  year: number;
  duration: number;
  audioUrl: string;
  image: string;
  descriptionHtml: string;
  /** Hele beskrivelsen som ren tekst, brukt til søk. */
  text: string;
  summary: string;
  chapters: Chapter[];
}

export interface Podcast {
  title: string;
  description: string;
  image: string;
  episodes: Episode[];
}

// Avsnitt i Spælls faste lenkeblokk, som står i (nesten) hver beskrivelse.
const BOILERPLATE = [
  /gjerne sjekk oss ut/i,
  /patreon/i,
  /discord\.gg/i,
  /facebook\.com\/(spaell|groups)/i,
  /instagram\.com/i,
  /myspreadshop|spreadshirt/i,
  /omnystudio\.com\/listener/i,
  /support the show/i,
];

const ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  aring: 'å', Aring: 'Å', aelig: 'æ', AElig: 'Æ', oslash: 'ø', Oslash: 'Ø',
  eacute: 'é', hellip: '…', ndash: '–', mdash: '—', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“',
};

export function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, name) => ENTITIES[name] ?? m);
}

function toText(html: string): string {
  return decodeEntities(html.replace(/<\/?(p|br|li)\b[^>]*>/gi, ' ').replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
}

function cleanDescription(html: string): string {
  const kept = html
    .split(/(?=<p[\s>])|(?<=<\/p>)/i)
    .filter((p) => toText(p) !== '' && !BOILERPLATE.some((re) => re.test(p)));
  return sanitizeHtml(kept.join(''), {
    allowedTags: ['p', 'br', 'strong', 'b', 'em', 'i', 'a', 'ul', 'ol', 'li'],
    allowedAttributes: { a: ['href', 'target', 'rel'] },
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { target: '_blank', rel: 'noopener' }),
    },
  });
}

function parseTime(t: string): number {
  return t.split(':').reduce((acc, part) => acc * 60 + Number(part), 0);
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/æ/g, 'ae').replace(/ø/g, 'o').replace(/å/g, 'a')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function sizedImage(url: string, size: string): string {
  return url.replace(/([?&])size=\w+/, `$1size=${size}`);
}

const asArray = <T,>(x: T | T[] | undefined): T[] => (x === undefined ? [] : Array.isArray(x) ? x : [x]);

function parseFeed(xml: string): Podcast {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    isArray: (name) => name === 'item' || name === 'psc:chapter',
  });
  const channel = parser.parse(xml).rss.channel;
  const channelImage = channel['itunes:image'].href as string;

  const episodes: Episode[] = asArray<any>(channel.item).map((item) => {
    const fullTitle = decodeEntities(String(item.title)).trim();
    const match = fullTitle.match(/\s*#(\d+)\s*/);
    const number = match ? Number(match[1]) : null;
    const title = match ? fullTitle.replace(match[0], ' ').trim() : fullTitle;
    const type: EpisodeType = /^spællbreak/i.test(fullTitle) ? 'spaellbreak' : number === null ? 'spesial' : 'episode';
    const descriptionHtml = cleanDescription(String(item['content:encoded'] ?? item.description ?? ''));
    const pubDate = new Date(item.pubDate);
    const image = (item['itunes:image']?.href as string | undefined) ?? channelImage;
    const text = toText(descriptionHtml);

    return {
      id: String(item['omny:clipId'] ?? item.guid?.['#text'] ?? item.guid),
      slug: number === null ? slugify(title) : `${number}-${slugify(title)}`,
      number,
      title,
      fullTitle,
      type,
      date: pubDate.toISOString(),
      year: pubDate.getUTCFullYear(),
      duration: Number(item['itunes:duration']) || 0,
      audioUrl: item.enclosure.url,
      image,
      descriptionHtml,
      text,
      summary: text.length > 220 ? text.slice(0, 217).replace(/\s+\S*$/, '') + '…' : text,
      chapters: asArray<any>(item['psc:chapters']?.['psc:chapter']).map((c) => ({
        start: parseTime(String(c.start)),
        title: decodeEntities(String(c.title)),
      })),
    };
  });

  episodes.sort((a, b) => b.date.localeCompare(a.date));

  const seen = new Set<string>();
  for (const ep of episodes) {
    if (seen.has(ep.slug)) ep.slug = `${ep.slug}-${ep.id.slice(0, 8)}`;
    seen.add(ep.slug);
  }

  return {
    title: decodeEntities(String(channel.title)),
    description: decodeEntities(String(channel.description)),
    image: channelImage,
    episodes,
  };
}

let cached: Promise<Podcast> | undefined;

/** Henter og tolker feeden én gang per bygg. Feiler bygget hvis feeden ikke kan hentes. */
export function getPodcast(): Promise<Podcast> {
  cached ??= fetch(FEED_URL)
    .then((res) => {
      if (!res.ok) throw new Error(`Kunne ikke hente RSS-feeden: ${res.status}`);
      return res.text();
    })
    .then(parseFeed);
  return cached;
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return h > 0 ? `${h} t ${m} min` : `${m} min`;
}

export function formatDate(iso: string, month: 'long' | 'short' = 'long'): string {
  return new Date(iso).toLocaleDateString('nb-NO', { day: 'numeric', month, year: 'numeric', timeZone: 'Europe/Oslo' });
}

export function formatTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const mm = String(m).padStart(h ? 2 : 1, '0');
  return `${h ? h + ':' : ''}${mm}:${String(s).padStart(2, '0')}`;
}

export const TYPE_LABEL: Record<EpisodeType, string> = {
  episode: 'Episode',
  spaellbreak: 'SpællBreak',
  spesial: 'Spesial',
};
