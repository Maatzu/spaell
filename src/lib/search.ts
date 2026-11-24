import type { Episode, EpisodeType } from './feed';
import { url } from './links';

// Alt om søket på forsiden: hva et kort kan søkes på, hvordan et søk matcher og hvordan
// tag-lenker fra episodesidene ser ut. Brukes både ved bygging og i filterskriptet.

/** Det filteret trenger å vite om ett kort. */
interface SearchEntry {
  text: string;
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
  const text = `${episode.fullTitle} ${episode.text} ${Object.values(episode.tags).flat().join(' ')}`;
  return {
    'data-search': text.toLowerCase(),
    'data-year': episode.year,
    'data-type': episode.type,
  };
}

/** Motstykket til searchData: gjør data-attributtene om til et SearchEntry. */
export function readEntry(d: DOMStringMap): SearchEntry {
  return { text: d.search!, year: Number(d.year), type: d.type as EpisodeType };
}

/**
 * Lager en test for filteret, slik at søket deles opp én gang og ikke per kort.
 * Hvert søkeord må matche starten av et ord, så «pc» ikke treffer «capcom», mens
 * «zel» treffer «zelda» og «120» treffer «#120».
 */
export function matcher(filter: Filter): (entry: SearchEntry) => boolean {
  const terms = filter.query
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => new RegExp(`(?<![\\p{L}\\p{N}])${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'u'));
  return (entry) =>
    terms.every((t) => t.test(entry.text)) &&
    entry.year >= filter.from &&
    entry.year <= filter.to &&
    (!filter.type || entry.type === filter.type);
}

/** Lenke til episodelista på forsiden, filtrert på en tag. */
export function tagSearchUrl(tag: string): string {
  return url(`?q=${encodeURIComponent(tag)}#episoder`);
}

/** Søket i en tag-lenke, eller null. */
export function queryFromUrl(search: string): string | null {
  return new URLSearchParams(search).get('q');
}
