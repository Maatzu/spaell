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

/** data-attributtene avspilleren leser når noe med data-play klikkes. */
export function playData(episode: Episode) {
  return {
    'data-play': episode.id,
    'data-src': episode.audioUrl,
    'data-title': episode.fullTitle,
    'data-image': sizedImage(episode.image, 'Small'),
    'data-href': episodeUrl(episode),
    'data-duration': episode.duration,
    'data-chapters': episode.chapters.length ? JSON.stringify(episode.chapters) : undefined,
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
