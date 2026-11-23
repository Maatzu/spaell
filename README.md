# Spæll – uoffisiell episodeoversikt

Statisk nettside (Astro) med alle episodene til spillpodcasten Spæll. Episodene hentes fra podcastens RSS-feed hos Omny når siden bygges.

```sh
npm install
npm run dev      # http://localhost:4321/spaell/
npm run build
```

GitHub Actions (`.github/workflows/deploy.yml`) bygger og publiserer til GitHub Pages ved push til `main`, hver natt og hver time på tirsdager.
