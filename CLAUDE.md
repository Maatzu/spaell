# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Unofficial fan site (Astro, fully static) listing every episode of the Norwegian games podcast Spæll. All user-facing text, code comments and commit messages are in Norwegian (bokmål) — keep it that way.

## Commands

```sh
npm install
npm run dev      # http://localhost:4321/  (base is / in dev, /spaell in build/preview)
npm run build    # type-checks .astro/.ts and fetches the live feed
npm run preview
npm test         # checks feed parsing against test/feed.rss, offline (node --test, Node ≥ 22.18 for .ts)
```

`npm test` is the only test, and there is no linter. TypeScript uses `astro/tsconfigs/strict`.

The user usually has `astro dev` running already (often on port 4322). Starting another one just prints "already running", so check that server instead. To check layout, use headless Chrome. Plain `--window-size` can't go narrower than 500px. For phone widths, drive Chrome over CDP with `Emulation.setDeviceMetricsOverride` (`mobile: true`). Real clicks via `Input.dispatchMouseEvent` are needed to open the styled `<select>` pickers. Headless Chrome blocks autoplay, so "is playing" UI has to be forced by adding the `is-playing` class.

## Architecture

**Data comes from the live RSS feed at build time.** `src/lib/feed.ts` fetches the Omny RSS feed (`FEED_URL`) once per build (`getPodcast()` caches the promise), parses it with `parseFeed()` from `src/lib/parse-feed.ts` into `Podcast`/`Episode` objects, then adds tags and Spotify links. `parse-feed.ts` must only import npm packages and types (no Astro modules, no extensionless value imports) so `npm test` can run it in plain Node. `test/feed.rss` is a trimmed copy of the feed with one normal episode, one SpællBreak and one spesial. The build fails if the feed can't be fetched, so builds need network access. There's no content collection or local data. Parsing details that matter:
- Episode number is pulled from `#NNN` in the title; titles without a number are `spesial`, titles starting with "SpællBreak" are `spaellbreak`.
- Descriptions drop the recurring link boilerplate (`BOILERPLATE` regexes) and are sanitized with `sanitize-html`.
- Chapters come from `psc:chapters`.
- Slugs are `<number>-<slugified title>`. Duplicates get an id suffix.
- `sizedImage()` swaps Omny's `size=` query param. Real sizes: `Thumbnail` 64px, `Small` 256px, `Medium` 600px, `Large` 3000px (~350 kB).
- Covers are rendered with `<Image>` from `astro:assets`. `www.omnycontent.com` is allowed in `astro.config.mjs`, so the build downloads them and emits resized WebP files with `srcset`. Use `Medium` as the source unless the image is shown larger than ~300px. `Large` is only for the front-page hero and `og:image`. The player's `data-image` stays a remote Omny `Small` URL, because it is set from JS.

**Spotify:** `src/lib/spotify.ts` fetches the show's episodes from the Spotify Web API (client credentials from `SPOTIFY_CLIENT_ID`/`SPOTIFY_CLIENT_SECRET`, GitHub secrets in CI, `.env` locally) and `getPodcast()` sets `episode.spotifyUrl`, matched on title, else on release date. Without keys, or if Spotify fails, every episode links to the show page and the build continues. `SpotifyButton.astro` («Spill av i Spotify», shortened to «Spotify» at ≤760px) sits next to `PlayButton` on the front-page hero and the episode page.

**Tags:** `src/data/tags.ts` holds hand-written tags (plattform, studio, produsent, sjanger, serie, tema) keyed by episode slug. `feed.ts` attaches them as `episode.tags`. They are added to the search text and shown on the episode page, where each tag links to the filtered front page. New episodes get no tags automatically; add them to the file by hand. If an episode title changes in the feed, its slug changes and its tags stop matching.

**Search:** `src/lib/search.ts` owns the front-page search:
- `searchData(episode)` gives each card its `data-search`/`data-year`/`data-type` attributes (search text is title, description and tags, lowercased). `readEntry()` reads them back.
- `matcher(filter, entries)` decides whether a card matches the query, year span and type. It is pure, so it runs without the DOM. It tries levels in order and uses the first one where any card (within years/type) matches: episode number (`120`/`#120`), then title + tags (`data-search`), then also the description (`data-text`). A query that is exactly a tag name must match as whole words.
- `tagSearchUrl(tag)` builds the `?q=<tag>#episoder` links on the episode page.
- `filterFromUrl()`/`filterToUrl()` map the filter state to the URL (`q`, `fra`, `til`, `type`, `sortering`; defaults left out). The filter script writes it with `history.replaceState(history.state, …)` (keep the state, Astro stores scroll there), so the search survives going back from an episode page.

The filter script in `index.astro` only updates the page (hide/sort cards, counts, view transitions). Change what matches in `search.ts`, not there.

**Deployment:** `.github/workflows/deploy.yml` builds and publishes to GitHub Pages on push to `main`, nightly, and hourly on Tuesdays (new episodes usually land then), so the site picks up new episodes without code changes. The site lives under `base: '/spaell'` in production, but `astro.config.mjs` sets base to `/` when running `astro dev`. Always build internal links with `url()` from `src/lib/links.ts`, never hardcoded `/` paths.

**Pages:**
- `index.astro`: front page with the latest episode, the «Følg Spæll» social links beside it (there is no site footer; the listen links live only in the header), and below it the full episode grid (`#episoder`, which the «Episoder» menu item links to) with client-side search, a two-handle year-range slider (handles may cross; the span is always min–max) and filters for type and sort.
- `episode/[slug].astro`: one page per episode via `getStaticPaths`, with JSON-LD. «Forrige/Neste episode» sits at the top and bottom; «Forrige» is the older episode. On desktop the header, description and a side column («Om episoden» tags + chapters) share one grid, so the side column starts level with the cover. Below 900px it falls under the description.
- `om.astro`: about page.

All pages use `layouts/Base.astro`, which holds the header (with active-menu marking), the theme script and the persistent player.

**Client-side navigation:** Base uses Astro's `<ClientRouter />` (view transitions). Consequences:
- Page scripts must initialize on `astro:page-load`, not on module load (see the filter script in `index.astro`).
- The theme is applied again on `astro:after-swap`. The swap removes every attribute on `<html>`, including inline `style`, so the player sets `--player-h`/`--player-space` again there too.
- `Player.astro` is `transition:persist`, so audio keeps playing across navigation.
- Manual view transitions use types that `global.css` keys animations off:
  - `filter`: filtering on the front page.
  - `theme`: switching theme.
  - `jump` / `jump-up` / `jump-down`: same-page anchor links, intercepted in a capture-phase click listener in `Base.astro`.
  - `player`: minimizing/expanding the player.

**Player contract:** any element with `data-play` starts an episode. A document-level click listener in `Player.astro` handles the click. `src/lib/play.ts` owns the whole contract: produce the attributes with `playData(episode, { start?, ariaLabel? })` rather than writing them by hand. `start` (seconds) jumps to a timestamp (chapter links); `ariaLabel` is for buttons without visible text. `markPlaying(el, active)` decides how a button shows it is playing (`is-playing`, the `[data-play-label]` text, the aria-label; buttons with a start point are never marked), so the player only calls it on every `[data-play]`. The player stores state in `localStorage` under the `spaell:` prefix: `pos:<id>` for resume position, plus `speed`, `volume`, `muted`, `current` (last track, `null` after close), `minimized` and `theme`. All of it goes through `store` in `src/lib/storage.ts`, which adds the prefix and wraps every access in try/catch (`get`/`set` for JSON, `getText`/`setText` for plain text). The theme is plain text because the inline theme script in `Base.astro` reads it directly and keeps its own copy of the rule.

Player layout:
- **Full bar:** three areas (now / center / side).
- **Minimized:** the `.mini` cover icon. Both share `view-transition-name: player`, so only one may be visible at a time.
- **Mobile (≤760px):** `.center`, `.controls` and `.side` become `display: contents`, and the buttons are placed on a five-column grid. The volume control is hidden (phones have hardware buttons, and iOS ignores `audio.volume`).
- **`--player-h` / `--player-space`:** set by a `ResizeObserver` on `.bar` and `.mini`. `--player-h` is the bar's height (0 when minimized or closed). `--player-space` drives the page's bottom padding and `scroll-padding-bottom`: bar height + 24px, or the mini icon + 32px when minimized, 0 when closed.

**Theming:** dark is the default. `data-theme="light"` on `<html>` switches palettes via CSS variables in `src/styles/global.css`. The player deliberately uses the opposite palette (`--player-*` vars, incl. `--player-scheme` for native controls), so it is silver in dark mode and dark in light mode. Check both themes when touching player styles.

**Mobile:**
- **Header:** stays on one row at ≤760px. Listen links become icon-only, and the «Spæll» wordmark is hidden at ≤420px. `#episoder` uses a fixed `scroll-margin-top: 88px` that depends on this.
- **Hero:** the front-page hero and the episode header switch to a small cover beside the title.

**Filters:** the `<select>`s use `appearance: base-select` inside `@supports`, so other browsers fall back to native. Each has a fixed width so the bar doesn't shift when the value changes. The search placeholder is picked at runtime: the longest of several that fits, measured with canvas.

**Links/icons:** external listen/social links live in `src/lib/links.ts`. Each has an `icon` key into `src/lib/icons.ts`, which holds Simple Icons (CC0) paths rendered by `LinkIcon.astro` in `currentColor`. `public/favicon.png` and `public/apple-touch-icon.png` were made from the podcast logo (the transparent original PNG from Omny). The resized versions Omny serves are white-background JPEGs, which is why the logo gets `mix-blend-mode: multiply` in light theme.
