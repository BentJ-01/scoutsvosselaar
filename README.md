# Scouts Don Bosco Vosselaar

Website van Scouts Don Bosco Vosselaar (A4108G). Statische site met Astro, inhoud beheerd via Sveltia CMS.

## Lokaal ontwikkelen

Vereist Node 22 en pnpm.

```sh
pnpm install
pnpm dev      # ontwikkelserver
pnpm check    # typecontrole
pnpm test     # unit tests
pnpm test:e2e # CMS-flows in de browser (Playwright)
pnpm build    # statische build in dist/
```

## Structuur

- `src/content/`: alle inhoud (berichten, evenementen, leiding, takken, werkjaren, 't Voske, fotoalbums, instellingen)
- `src/content.config.ts`: schema's van de inhoud
- `src/lib/`: datums (altijd Europe/Brussels), content-helpers
- `src/site.config.ts`: vaste gegevens en menu
- `src/cms/`: configuratie van Sveltia CMS (`/admin/`)
- `deployment.config.ts`: alles wat van de eigenaar afhangt (repo, URL's, login)
- `docs/`: handleiding, technische documentatie en bronmateriaal

Inhoudsfouten breken de build nooit: ze verschijnen als `[inhoud]`-waarschuwing in de buildlog.

Zie `docs/TECHNISCH.md` voor de CMS in lokale modus en de checklist voor de verhuis naar de organisatie.
