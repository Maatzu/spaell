import { url } from '../links';
import { TRACKS_PATH, type Track } from '../play';

// Episodelista hentes første gang den trengs og gjenbrukes, også på tvers av sidebytter.
let tracks: Promise<Track[]> | undefined;

/** Episoden som kom ut før den med denne id-en, eller undefined for den eldste (eller hvis lista ikke kan hentes). */
export async function olderTrack(id: string): Promise<Track | undefined> {
  tracks ??= fetch(url(TRACKS_PATH))
    .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
    .catch(() => {
      // Prøv igjen neste gang i stedet for å huske feilen.
      tracks = undefined;
      return [];
    });
  const list = await tracks;
  const index = list.findIndex((t) => t.id === id);
  return index >= 0 ? list[index + 1] : undefined;
}
