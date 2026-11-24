import type { Episode, EpisodeType } from './feed';
import { url } from './links';

// Alt om søket på forsiden: hva et kort kan søkes på, hvordan et søk matcher og hvordan
// tag-lenker fra episodesidene ser ut. Brukes både ved bygging og i filterskriptet.

/** Det filteret trenger å vite om ett kort. */
interface SearchEntry {
  number: number | null;
  /** Tittel og tagger. */
  main: string;
  /** Beskrivelsen, som bare søkes i når ingen kort treffer på tittel og tagger. */
  text: string;
  tags: string[];
  year: number;
  type: EpisodeType;
}

/** Valgene i filterlinja. Tom type betyr alle typer. */
export interface Filter {
  query: string;
  from: number;
  to: number;
  type: EpisodeType | '';
}

/** data-attributtene filterskriptet leser fra hvert kort. */
export function searchData(episode: Episode) {
  const tags = Object.values(episode.tags).flat();
  return {
    'data-number': episode.number ?? undefined,
    'data-search': `${episode.fullTitle} ${tags.join(' ')}`.toLowerCase(),
    'data-text': episode.text.toLowerCase(),
    'data-tags': tags.join('|').toLowerCase(),
    'data-year': episode.year,
    'data-type': episode.type,
  };
}

/** Motstykket til searchData: gjør data-attributtene om til et SearchEntry. */
export function readEntry(d: DOMStringMap): SearchEntry {
  return { number: d.number ? Number(d.number) : null, main: d.search!, text: d.text!, tags: d.tags ? d.tags.split('|') : [], year: Number(d.year), type: d.type as EpisodeType };
}

/**
 * Treffer der søkeordet står først i et ord, så «pc» ikke treffer «capcom», mens
 * «zel» treffer «zelda» og «120» treffer «#120». Med wholeWord må ordet også slutte der.
 * Uten lookbehind, som eldre Safari mangler.
 */
function wordStart(term: string, wholeWord = false): RegExp {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?:^|[^\\p{L}\\p{N}])${escaped}${wholeWord ? '(?![\\p{L}\\p{N}])' : ''}`, 'u');
}

/**
 * Lager en test for filteret, slik at søket deles opp én gang og ikke per kort.
 * Søket prøver i rekkefølge: episodenummer («120» eller «#120»), tittel og tagger, og til
 * sist beskrivelsene. Første nivå der et kort innenfor årene og typen treffer, gjelder,
 * så «nes» ikke drar med seg «Are Ness» og «neste» fra beskrivelsene.
 * Er hele søket navnet på en tag, må det stå som egne ord.
 */
export function matcher(filter: Filter, entries: SearchEntry[]): (entry: SearchEntry) => boolean {
  const query = filter.query.toLowerCase().trim().replace(/\s+/g, ' ');
  const isTag = entries.some((e) => e.tags.includes(query));
  const terms = isTag ? [wordStart(query, true)] : query.split(' ').filter(Boolean).map((t) => wordStart(t));
  const inFilter = (entry: SearchEntry) =>
    entry.year >= filter.from && entry.year <= filter.to && (!filter.type || entry.type === filter.type);
  const inMain = (entry: SearchEntry) => terms.every((t) => t.test(entry.main));
  const inAll = (entry: SearchEntry) => terms.every((t) => t.test(entry.main) || t.test(entry.text));
  const number = /^#?\d+$/.test(query) ? Number(query.replace('#', '')) : null;
  const inNumber = (entry: SearchEntry) => number !== null && entry.number === number;
  const test = [inNumber, inMain, inAll].find((t) => entries.some((e) => inFilter(e) && t(e))) ?? inAll;
  return (entry) => inFilter(entry) && test(entry);
}

/** Lenke til episodelista på forsiden, filtrert på en tag. */
export function tagSearchUrl(tag: string): string {
  return url(`?q=${encodeURIComponent(tag)}#episoder`);
}

/**
 * Søket og filtervalgene slik de står i adressen. Tomme felt og null betyr standardvalget,
 * og står ikke i adressen. Tag-lenkene bruker bare q.
 */
export interface UrlFilter {
  query: string;
  from: number | null;
  to: number | null;
  type: string;
  sort: string;
}

/** Leser søket og filtervalgene fra adressen, så de er der igjen når man går tilbake til forsiden. */
export function filterFromUrl(search: string): UrlFilter {
  const params = new URLSearchParams(search);
  const year = (key: string) => {
    const value = Number(params.get(key));
    return params.has(key) && Number.isInteger(value) ? value : null;
  };
  return {
    query: params.get('q') ?? '',
    from: year('fra'),
    to: year('til'),
    type: params.get('type') ?? '',
    sort: params.get('sortering') ?? '',
  };
}

/** Motstykket til filterFromUrl: query-delen av adressen, med «?», eller tom streng. */
export function filterToUrl(filter: UrlFilter): string {
  const params = new URLSearchParams();
  if (filter.query.trim()) params.set('q', filter.query.trim());
  if (filter.from !== null) params.set('fra', String(filter.from));
  if (filter.to !== null) params.set('til', String(filter.to));
  if (filter.type) params.set('type', filter.type);
  if (filter.sort) params.set('sortering', filter.sort);
  const search = params.toString();
  return search ? `?${search}` : '';
}
