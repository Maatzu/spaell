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
    return podcast;
  });
  return cached;
}
