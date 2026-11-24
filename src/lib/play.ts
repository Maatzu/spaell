import type { Chapter, Episode } from './feed';
import { sizedImage } from './format';
import { episodeUrl } from './links';

/** Det avspilleren trenger for å spille en episode. Lagres også i localStorage. */
export interface Track {
  id: string;
  src: string;
  title: string;
  image: string;
  href: string;
  duration: number;
  chapters: Chapter[];
}

interface PlayOptions {
  /** Start på dette tidspunktet (sekunder), f.eks. for kapittellenker. Slike knapper merkes aldri som spillende. */
  start?: number;
  /** Knappen har ingen synlig tekst, så aria-label sier «Spill av»/«Pause» og tittelen. */
  ariaLabel?: boolean;
}

const label = (active: boolean) => (active ? 'Pause' : 'Spill av');

/** Det avspilleren trenger fra en episode. Brukes av playData og av episodelista avspilleren henter. */
export function toTrack(episode: Episode): Track {
  return {
    id: episode.id,
    src: episode.audioUrl,
    title: episode.fullTitle,
    image: sizedImage(episode.image, 'Small'),
    href: episodeUrl(episode),
    duration: episode.duration,
    chapters: episode.chapters,
  };
}

/** Alle episodene som Track, nyeste først (src/pages/episoder.json.ts). Brukes til å spille av neste. */
export const TRACKS_PATH = 'episoder.json';

/**
 * data-attributtene avspilleren leser når noe med data-play klikkes.
 * Knapper med synlig tekst legger den i et element med data-play-label.
 */
export function playData(episode: Episode, { start, ariaLabel = false }: PlayOptions = {}) {
  const track = toTrack(episode);
  return {
    'data-play': track.id,
    'data-src': track.src,
    'data-title': track.title,
    'data-image': track.image,
    'data-href': track.href,
    'data-duration': track.duration,
    'data-chapters': track.chapters.length ? JSON.stringify(track.chapters) : undefined,
    'data-start': start,
    'aria-label': ariaLabel ? `${label(false)} ${episode.fullTitle}` : undefined,
  };
}

/** Motstykket til playData: gjør data-attributtene om til et Track. */
export function readTrack(d: DOMStringMap): Track {
  return {
    id: d.play!,
    src: d.src!,
    title: d.title!,
    image: d.image!,
    href: d.href!,
    duration: Number(d.duration) || 0,
    chapters: d.chapters ? JSON.parse(d.chapters) : [],
  };
}

/** Startpunktet i sekunder, eller undefined hvis knappen bare spiller av episoden. */
export function readStart(d: DOMStringMap): number | undefined {
  return d.start !== undefined ? Number(d.start) : undefined;
}

/** Viser om knappen spiller av nå. Knapper med startpunkt (kapitler) merkes ikke. */
export function markPlaying(el: HTMLElement, active: boolean) {
  if (readStart(el.dataset) !== undefined) return;
  el.classList.toggle('is-playing', active);
  const text = el.querySelector('[data-play-label]');
  if (text) text.textContent = label(active);
  if (el.hasAttribute('aria-label')) el.setAttribute('aria-label', `${label(active)} ${el.dataset.title}`);
}
