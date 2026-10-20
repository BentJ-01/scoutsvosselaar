# Design: drie stijlrichtingen (fase 4)

Statische mockups van de homepagina en een takpagina (Welpen), op gsm- en desktopformaat. Open de HTML-bestanden rechtstreeks in een browser, of bekijk de screenshots in `screenshots/`.

| Richting | Idee | Bestanden |
|---|---|---|
| **Kampvuur** | Warm en avondlijk: donkergroene nacht, gloed van het vuur, klassieke serif (Fraunces) met Inter. Bordeaux als accent. | `kampvuur/index.html`, `kampvuur/tak.html` |
| **Veldgids** | Een scoutshandboek: kraftpapier met hoogtelijnen, smalle hoofdletters (Barlow Condensed), stempels, polaroid en gestippelde lijnen. | `veldgids/index.html`, `veldgids/tak.html` |
| **Das** | Bordeaux van de das als hoofdkleur, grote ronde letters (Bricolage Grotesque) met Nunito, gele stickers en een strepenband. | `das/index.html`, `das/tak.html` |

Elke richting heeft een eigen voorstel voor de takkleuren. Fonts zijn self-hosted (`fonts/`, alle OFL-licentie).

De teksten, leeftijden, evenementen en leiding zijn **voorbeeldtekst**: de echte inhoud komt uit `docs/huidige-site/inhoud.md` in fase 3. De illustraties staan op de plaats van echte groepsfoto's.

Opnieuw genereren: `node docs/design/mockups.mjs`. Na de keuze vervangen de echte componenten deze mockups.
