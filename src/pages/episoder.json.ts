import { getPodcast } from '../lib/feed';
import { toTrack } from '../lib/play';

// Alle episodene som Track, nyeste først. Avspilleren henter lista når en episode er ferdig,
// for å spille av den forrige (eldre) episoden.
export async function GET() {
  const { episodes } = await getPodcast();
  return new Response(JSON.stringify(episodes.map(toTrack)), {
    headers: { 'Content-Type': 'application/json' },
  });
}
