/**
 * Kjører update i en view transition med de gitte typene (som global.css styrer animasjonen etter),
 * eller rett ut når nettleseren mangler støtte eller brukeren har bedt om redusert bevegelse.
 */
export function withViewTransition(update: () => void, ...types: string[]): ViewTransition | undefined {
  if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    update();
    return;
  }
  try {
    return document.startViewTransition({ update, types });
  } catch {
    // Eldre nettlesere støtter bare en callback, uten typer.
    return document.startViewTransition(update);
  }
}
