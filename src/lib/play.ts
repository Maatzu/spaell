import { sizedImage, type Episode } from './feed';
import { url } from './links';

/** data-attributtene avspilleren leser når noe med data-play klikkes. */
export function playData(episode: Episode) {
  return {
    'data-play': episode.id,
    'data-src': episode.audioUrl,
    'data-title': episode.fullTitle,
    'data-image': sizedImage(episode.image, 'Small'),
    'data-href': url(`episode/${episode.slug}/`),
    'data-duration': episode.duration,
    'data-chapters': episode.chapters.length ? JSON.stringify(episode.chapters) : undefined,
  };
}
