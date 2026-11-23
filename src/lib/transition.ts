/**
 * Kjører update i en view transition av gitt type, eller rett ut når nettleseren
 * mangler støtte eller brukeren har bedt om redusert bevegelse.
 */
export function withViewTransition(update: () => void, type: string): ViewTransition | undefined {
  if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    update();
    return;
  }
  try {
    return document.startViewTransition({ update, types: [type] });
  } catch {
    // Eldre nettlesere støtter bare en callback, uten typer.
    return document.startViewTransition(update);
  }
}
