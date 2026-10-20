# Technische documentatie

Voor wie de site technisch beheert. Voor de leiding is er `docs/HANDLEIDING.md`.

## Overzicht

- **Site:** Astro (statische output), inhoud in `src/content/`, schema's in `src/content.config.ts`.
- **CMS:** Sveltia CMS, bereikbaar op `/admin/`. De configuratie staat in `src/cms/config.ts`.
- **Hosting:** GitHub Pages, gebouwd door GitHub Actions bij elke commit op `main`.
- **Login CMS:** GitHub OAuth via de `sveltia-cms-auth` Worker op Cloudflare (nog op te zetten, zie de verhuischecklist).

## Alles wat van de eigenaar afhangt

Staat op één plek: `deployment.config.ts`. Elke waarde kan ook via een omgevingsvariabele (bv. in de deploy-workflow).

| Waarde | Variabele | Nu | Na de verhuis |
|---|---|---|---|
| Repo voor de CMS | `CMS_REPO` | `BentJ-01/scoutsvosselaar` | `<organisatie>/scoutsvosselaar` |
| Branch | `CMS_BRANCH` | `main` | `main` |
| Site-URL | `SITE_URL` | `https://bentj-01.github.io` | `https://scoutsvosselaar.be` |
| Base path | `BASE_PATH` | `/scoutsvosselaar` | `/` |
| Auth-URL | `CMS_AUTH_URL` | leeg | URL van de Worker |

Zolang `CMS_AUTH_URL` leeg is, toont de CMS enkel "Inloggen met een toegangstoken" (en op localhost "Werken met een lokale repository").

## Lokaal ontwikkelen

```sh
pnpm install
pnpm dev          # site op http://localhost:4321/scoutsvosselaar/
pnpm check        # typecontrole
pnpm test         # unit tests (datums, content-helpers)
pnpm test:e2e     # Playwright: CMS-flows op desktop en gsm
pnpm build
```

### CMS lokaal gebruiken

1. `pnpm dev`
2. Open `http://localhost:4321/scoutsvosselaar/admin/index.html` in Chrome, Edge of een andere Chromium-browser. (In de devserver werkt enkel het adres met `index.html`; online werkt ook `/admin/`.)
3. Kies "Werken met een lokale repository" en selecteer de map van de repo.

De CMS schrijft dan rechtstreeks in je bestanden, zonder commits. Controleer met `git diff` en commit zelf.

De admin is bewust een statisch bestand (`public/admin/index.html`) en geen Astro-pagina: de devserver herlaadt Astro-pagina's bij elke bestandswijziging, wat opslaan in de lokale modus kan onderbreken. De integratie `src/cms/integration.ts` bundelt `src/cms/admin.ts` met de configuratie naar `public/admin/app/` bij elke start van `pnpm dev` en `pnpm build`. Die map staat in `.gitignore`. Wijzig je `src/cms/config.ts`, herstart dan `pnpm dev`.

### Afspraken in de inhoud

- **Afbeeldingen** komen in `src/assets/uploads/<collectie>/`. In de inhoud staat een pad relatief aan het bestand (`../../assets/uploads/posts/foto.webp`), zodat `astro:assets` ze optimaliseert. Bij upload zet de CMS foto's om naar webp, max 2000 px breed, kwaliteit 80. Daarbij verdwijnen EXIF-gegevens, ook GPS (getest in `tests/e2e/cms.spec.ts`).
- **PDF's van 't Voske** komen in `public/voske/`, in de inhoud als `/voske/<bestand>.pdf` (zonder base path; de site zet dat ervoor).
- **Tijden** zijn Belgische tijd zonder tijdzone, bv. `2026-10-25T14:00`. De CMS zet de invoer altijd vast op `Europe/Brussels`, ook als de browser van de redacteur in een andere tijdzone staat. De site rekent nooit met de tijdzone van de buildserver (`src/lib/dates.ts`).
- **Bestandsnamen** van berichten en evenementen: `JJJJ-MM-DD-titel`, met de datum van het bericht of het begin van het evenement.
- **Inhoudsfouten breken de build niet.** Ongeldige waarden, ontbrekende afbeeldingen en verwijzingen naar verwijderde leiding of takken verschijnen als `[inhoud]`-waarschuwing in de buildlog en worden overgeslagen. Astro meldt een verwijzing naar een verwijderd item zelf ook als `[ERROR] Invalid content reference`, maar de build loopt gewoon door.

## Verhuis naar de organisatie

Voer dit uit zodra de GitHub-organisatie en het Cloudflare-account van de scouts bestaan. Gebruik voor alle accounts het gedeelde scoutsadres met tweestapsverificatie, en noteer alles in `docs/OVERDRACHT.md`.

### 1. GitHub-organisatie klaarzetten

- [ ] Organisatie aanmaken (plan Free). Eigenaars: het gedeelde scoutsaccount en Bent.
- [ ] Settings → Authentication security: "Require two-factor authentication" aan.
- [ ] Team "Redactie" aanmaken.

### 2. Repo overdragen

- [ ] In `BentJ-01/scoutsvosselaar`: Settings → General → Danger Zone → Transfer ownership → naar de organisatie.
- [ ] Controleer dat de repo publiek is.
- [ ] Repo → Settings → Collaborators and teams: team "Redactie" met rol **Write**.
- [ ] Lokaal: `git remote set-url origin https://github.com/<organisatie>/scoutsvosselaar.git`

GitHub stuurt het oude adres door, maar pas toch alles aan.

### 3. Configuratie aanpassen

- [ ] In `deployment.config.ts` de standaardwaarden aanpassen: `repo` naar `<organisatie>/scoutsvosselaar`. Laat `siteUrl` en `basePath` voorlopig staan tot het domein gekoppeld is (stap 7); werk je tussentijds op `<organisatie>.github.io/scoutsvosselaar`, zet `siteUrl` dan op `https://<organisatie>.github.io`.
- [ ] Commit en push op `main`.

### 4. GitHub Pages aanzetten

- [ ] Repo → Settings → Pages → Source: **GitHub Actions**.
- [ ] Repo → Actions: workflows toestaan als GitHub dat vraagt.
- [ ] Workflow "Deploy" handmatig starten (Actions → Deploy → Run workflow) en controleren dat de site op `https://<organisatie>.github.io/scoutsvosselaar/` staat.
- [ ] Branch protection op `main` (Settings → Rules → Rulesets): force push en verwijderen blokkeren. Rechtstreeks committen moet toegelaten blijven, want de CMS commit op `main`.

### 5. OAuth App registreren

- [ ] Organisatie → Settings → Developer settings → OAuth Apps → New OAuth App.
  - Application name: `Scouts Vosselaar CMS`
  - Homepage URL: de site-URL
  - Authorization callback URL: `https://<worker-url>/callback` (de Worker-URL komt uit stap 6; vul eerst iets tijdelijks in en pas daarna aan)
- [ ] Client ID noteren, een client secret aanmaken. **Het secret komt nooit in de repo**, enkel in de Worker (stap 6) en in de wachtwoordkluis van de scouts.

### 6. Worker deployen

- [ ] In het Cloudflare-account van de scouts de Worker `sveltia-cms-auth` deployen. Volg de README van [sveltia/sveltia-cms-auth](https://github.com/sveltia/sveltia-cms-auth) (knop "Deploy to Cloudflare" of `wrangler deploy`). Lees de README van de dan actuele versie; namen van variabelen kunnen wijzigen.
- [ ] Bij de Worker de variabelen zetten (Settings → Variables and Secrets):
  - `GITHUB_CLIENT_ID`: uit stap 5
  - `GITHUB_CLIENT_SECRET`: uit stap 5, als **Secret** (versleuteld)
  - `ALLOWED_DOMAINS`: het domein van de site, bv. `scoutsvosselaar.be, <organisatie>.github.io`
- [ ] De callback-URL van de OAuth App aanpassen naar `https://<worker-url>/callback`.
- [ ] In `deployment.config.ts` `cmsAuthUrl` op `https://<worker-url>` zetten, committen en pushen.
- [ ] Testen: `/admin/` openen, "Inloggen met GitHub", een bericht als concept opslaan en weer verwijderen.

### 7. Domein koppelen

Pas na een volledige test op `github.io`.

- [ ] Domein verifiëren: organisatie → Settings → Pages → Add a domain → `scoutsvosselaar.be`. Zet het TXT-record dat GitHub vraagt bij de DNS-beheerder. Dit voorkomt dat iemand anders het domein op GitHub Pages claimt.
- [ ] In `deployment.config.ts`: `siteUrl` naar `https://scoutsvosselaar.be`, `basePath` naar `/`. Committen en pushen.
- [ ] Repo → Settings → Pages → Custom domain: `scoutsvosselaar.be`.
- [ ] Bij de DNS-beheerder **enkel** de webrecords aanpassen:
  - apex `scoutsvosselaar.be`: A-records `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` (en eventueel AAAA `2606:50c0:8000::153` tot `2606:50c0:8003::153`)
  - `www`: CNAME naar `<organisatie>.github.io`
  - Controleer de actuele IP-adressen in de GitHub-documentatie ("Managing a custom domain for your GitHub Pages site").
- [ ] **MX-, SPF- (TXT), DKIM- en andere mailrecords niet aanraken.** Noteer ze vooraf, en controleer achteraf dat ze ongewijzigd zijn en dat mail naar `info@scoutsvosselaar.be` nog aankomt.
- [ ] Zodra het certificaat klaar is: "Enforce HTTPS" aan.
- [ ] `ALLOWED_DOMAINS` van de Worker en de Homepage URL van de OAuth App nakijken.

### 8. Afronden

- [ ] Leiding met redactietoegang uitnodigen in team "Redactie".
- [ ] `docs/OVERDRACHT.md` invullen: accounts, eigenaars, waar de credentials staan.
- [ ] Bent blijft mede-eigenaar, nooit enige eigenaar.

## Sveltia CMS updaten

Sveltia is nog pre-1.0 en verschijnt vaak. De versie staat exact gepind in `package.json`.

1. Lees de release notes van alle versies sinds de huidige (GitHub releases van `sveltia/sveltia-cms`).
2. `pnpm add -E @sveltia/cms@<versie>`
3. `pnpm check && pnpm test && pnpm test:e2e`
4. Test kort zelf in de lokale modus en daarna online.

Dependabot stelt maandelijks updates voor, maar merge een Sveltia-update nooit zonder de stappen hierboven.
