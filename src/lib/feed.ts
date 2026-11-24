import { TAGS } from '../data/tags';
import { FEED_URL } from './links';
import { parseFeed, type Podcast } from './parse-feed';
import { getSpotifyLookup } from './spotify';

export type { Chapter, Episode, EpisodeType, Podcast } from './parse-feed';

let cached: Promise<Podcast> | undefined;

/** Henter og tolker feeden én gang per bygg. Feiler bygget hvis feeden ikke kan hentes. */
export function getPodcast(): Promise<Podcast> {
  cached ??= Promise.all([
    fetch(FEED_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`Kunne ikke hente RSS-feeden: ${res.status}`);
        return res.text();
      })
      .then(parseFeed),
    getSpotifyLookup(),
  ]).then(([podcast, spotifyUrl]) => {
    for (const ep of podcast.episodes) {
      ep.tags = TAGS[ep.slug] ?? {};
      ep.spotifyUrl = spotifyUrl(ep.fullTitle, ep.date);
    }
    // Sluggen lages av tittelen, så en endret tittel i feeden gjør at tagsene slutter å matche.
    // Dette kjøres bare én gang per bygg (se cached), så hver advarsel skrives én gang.
    const slugs = new Set(podcast.episodes.map((ep) => ep.slug));
    for (const key of Object.keys(TAGS)) {
      if (!slugs.has(key)) console.warn(`[tags] Advarsel: «${key}» i src/data/tags.ts matcher ingen episode i feeden. Har tittelen endret seg?`);
    }
    return podcast;
  });
  return cached;
}
