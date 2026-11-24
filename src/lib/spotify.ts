import { SPOTIFY_SHOW_ID, SPOTIFY_SHOW_URL } from './links';

// Spotify-lenker per episode, hentet fra Spotifys Web API ved bygging.
// Krever SPOTIFY_CLIENT_ID og SPOTIFY_CLIENT_SECRET (fra en app på developer.spotify.com).
// Uten nøkler, eller hvis Spotify feiler, peker alle episodene til programsiden i stedet.

interface SpotifyEpisode {
  name: string;
  release_date: string;
  external_urls: { spotify: string };
}

const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();

async function fetchEpisodes(clientId: string, clientSecret: string): Promise<SpotifyEpisode[]> {
  const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!tokenRes.ok) throw new Error(`token: ${tokenRes.status}`);
  const { access_token } = await tokenRes.json();

  const episodes: SpotifyEpisode[] = [];
  let next: string | null = `https://api.spotify.com/v1/shows/${SPOTIFY_SHOW_ID}/episodes?market=NO&limit=50`;
  while (next) {
    const res = await fetch(next, { headers: { Authorization: `Bearer ${access_token}` } });
    if (!res.ok) throw new Error(`episoder: ${res.status}`);
    const page = await res.json();
    episodes.push(...page.items.filter(Boolean));
    next = page.next;
  }
  return episodes;
}

/**
 * Lager en funksjon som finner Spotify-lenken til en episode, først på tittel og ellers på
 * dato (hvis bare én Spotify-episode kom ut den dagen). Faller tilbake til programsiden.
 */
export async function getSpotifyLookup(): Promise<(fullTitle: string, date: string) => string> {
  const { SPOTIFY_CLIENT_ID: id, SPOTIFY_CLIENT_SECRET: secret } = import.meta.env;
  if (!id || !secret) {
    console.warn('[spotify] Mangler SPOTIFY_CLIENT_ID/SPOTIFY_CLIENT_SECRET, lenker til programsiden.');
    return () => SPOTIFY_SHOW_URL;
  }

  let episodes: SpotifyEpisode[];
  try {
    episodes = await fetchEpisodes(id, secret);
  } catch (err) {
    console.warn(`[spotify] Kunne ikke hente episoder (${(err as Error).message}), lenker til programsiden.`);
    return () => SPOTIFY_SHOW_URL;
  }

  const byTitle = new Map(episodes.map((e) => [normalize(e.name), e.external_urls.spotify]));
  const byDate = new Map<string, string[]>();
  for (const e of episodes) byDate.set(e.release_date, [...(byDate.get(e.release_date) ?? []), e.external_urls.spotify]);

  return (fullTitle, date) => {
    const sameDay = byDate.get(date.slice(0, 10));
    return byTitle.get(normalize(fullTitle)) ?? (sameDay?.length === 1 ? sameDay[0] : SPOTIFY_SHOW_URL);
  };
}
