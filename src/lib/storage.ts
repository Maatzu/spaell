/**
 * Lagring i nettleseren. Alle nøkler får prefikset «spaell:», og hver tilgang er pakket i
 * try/catch, så siden virker også når lagring er blokkert (f.eks. i privat modus).
 * Temaskriptet i Base.astro må ligge inline og har sin egen kopi av denne regelen.
 */

const PREFIX = 'spaell:';

export const store = {
  /** Leser en verdi lagret som JSON. */
  get<T>(key: string): T | null {
    const v = store.getText(key);
    if (v === null) return null;
    try {
      return JSON.parse(v) as T;
    } catch {
      return null;
    }
  },
  /** Lagrer en verdi som JSON. */
  set(key: string, value: unknown) {
    store.setText(key, JSON.stringify(value));
  },
  /** Leser ren tekst, som temaet, som temaskriptet i Base.astro leser rett fra localStorage. */
  getText(key: string): string | null {
    try {
      return localStorage.getItem(PREFIX + key);
    } catch {
      return null;
    }
  },
  /** Lagrer ren tekst, uten JSON-koding. */
  setText(key: string, value: string) {
    try {
      localStorage.setItem(PREFIX + key, value);
    } catch {}
  },
};
