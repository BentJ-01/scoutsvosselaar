# Scouts Don Bosco Vosselaar

Website van Scouts Don Bosco Vosselaar (A4108G). Statische site met Astro, inhoud beheerd via Sveltia CMS.

## Lokaal ontwikkelen

Vereist Node 22 en pnpm.

```sh
pnpm install
pnpm dev      # ontwikkelserver
pnpm check    # typecontrole
pnpm test     # unit tests
pnpm build    # statische build in dist/
```

## Structuur

- `src/content/`: alle inhoud (berichten, evenementen, leiding, takken, werkjaren, 't Voske, fotoalbums, instellingen)
- `src/content.config.ts`: schema's van de inhoud
- `src/lib/`: datums (altijd Europe/Brussels), content-helpers
- `src/site.config.ts`: vaste gegevens en menu
- `docs/`: handleiding, technische documentatie en bronmateriaal

Inhoudsfouten breken de build nooit: ze verschijnen als `[inhoud]`-waarschuwing in de buildlog.
