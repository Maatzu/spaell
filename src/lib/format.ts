import type { Episode, EpisodeType } from './feed';

// Ingen avhengigheter utover typer, så alt her kan også brukes i klientskript.

export const TYPE_LABEL: Record<EpisodeType, string> = {
  episode: 'Episode',
  spaellbreak: 'SpællBreak',
  spesial: 'Spesial',
};

/** «#123» for nummererte episoder, ellers typen. */
export function episodeLabel(episode: Pick<Episode, 'number' | 'type'>): string {
  return episode.number !== null ? `#${episode.number}` : TYPE_LABEL[episode.type];
}

export function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h} t ${m} min` : `${m} min`;
}

export function formatDate(iso: string, month: 'long' | 'short' = 'long'): string {
  return new Date(iso).toLocaleDateString('nb-NO', { day: 'numeric', month, year: 'numeric', timeZone: 'Europe/Oslo' });
}

/** «1:02:03» eller «2:03». Tåler NaN, som audio.duration er før lyden er lastet. */
export function formatTimestamp(seconds: number): string {
  const total = Math.floor(seconds || 0);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = String(total % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
}

/** Størrelsene Omny leverer bildene i. */
export type ImageSize = 'Thumbnail' | 'Small' | 'Medium' | 'Large';

export function sizedImage(url: string, size: ImageSize): string {
  return url.replace(/([?&])size=\w+/, `$1size=${size}`);
}
