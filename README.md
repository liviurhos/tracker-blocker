# Tracker Blocker

Extensie de browser (Manifest V3 - Chrome, Edge, Brave) pentru blocarea
tracker-elor si protectia confidentialitatii in navigare.

## Ce face

- Blocheaza pixeli de tracking cunoscuti: Facebook Pixel, Google Analytics,
  Doubleclick, Bing UET, LinkedIn Insight, TikTok Pixel si altele, folosind
  atat reguli proprii cat si lista publica **EasyPrivacy** (parte din
  proiectul EasyList), convertita automat in format compatibil cu
  `declarativeNetRequest`.
- Curata automat parametri de tracking din URL-uri: `fbclid`, `gclid`,
  `gclsrc`, `dclid`, `wbraid`, `gbraid`, `msclkid`, `utm_source`,
  `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, `yclid`,
  `igshid`, `mc_eid`, `twclid`, `ttclid` si altii.
- Detecteaza **CNAME cloaking** (tracker-e deghizate sub un subdomeniu al
  site-ului vizitat), folosind DNS-over-HTTPS si un calcul corect al
  domeniului radacina, bazat pe **Public Suffix List**.
- Reduce **fingerprinting-ul**: zgomot controlat pe canvas, WebGL,
  AudioContext, normalizare `hardwareConcurrency`/`deviceMemory`, eliminare
  Battery API. Cu comutator global si allowlist per site.
- Protectie **WebRTC** impotriva scurgerii adresei IP locale.
- Curatare periodica de cookie-uri pentru domenii de tracking cunoscute.
- **Jurnal de activitate** local: ce site-uri au incercat sa incarce ce
  tracker-e, si ce domenii au setat cookie-uri de tracking - pentru
  constientizare, nu pentru colectare de date (nimic nu paraseste
  dispozitivul).

## Instalare

### Din Chrome Web Store
[Link catre extensie](#) *(de completat dupa publicare)*

### Manual (Load unpacked)
1. Descarca sau cloneaza acest repository.
2. Deschide `chrome://extensions` (sau `edge://extensions`).
3. Activeaza "Modul dezvoltator".
4. Apasa "Incarca extensie neambalata" si selecteaza folderul repository-ului.

## Confidentialitate

Extensia nu colecteaza si nu trimite date catre niciun server propriu. Toate
datele (jurnalul de activitate, setarile) raman local, in `chrome.storage.local`.
Singura comunicare externa e o interogare DNS-over-HTTPS anonima catre
Cloudflare, necesara pentru detectia CNAME cloaking.

Politica completa: [docs/privacy.md](./docs/privacy.md) (versiune publicata:
vezi GitHub Pages, dupa activare, la `https://liviurhos.github.io/tracker-blocker/privacy`
sau `.../privacy` in functie de configurare).

## Actualizarea listei EasyPrivacy

```
python3 convert_easyprivacy.py <fisiere_sursa_easyprivacy> rules-easyprivacy.json
```

Fisierele sursa se descarca din repository-ul oficial
[easylist/easylist](https://github.com/easylist/easylist), din folderul
`easyprivacy/`. EasyPrivacy se actualizeaza la cateva zile, deci merita
reimprospatata periodic si republicata extensia.

## Licenta

Cod sursa licentiat sub [GNU GPL v3](./LICENSE).

Extensia include date derivate din EasyPrivacy (The EasyList authors,
https://easylist.to/) si din Public Suffix List (Mozilla, MPL-2.0). Detalii
complete in [ATTRIBUTIONS.md](./ATTRIBUTIONS.md).

## Limitari cunoscute

Aceasta extensie ofera o protectie rezonabila, nu una completa:

- Detectia CNAME cloaking are o fereastra de expunere la prima cerere catre
  un subdomeniu nou.
- Lista de tracker-e e statica intre versiuni; se invechieste daca nu e
  reimprospatata.
- Protectia de fingerprinting poate fi detectata si, teoretic, ocolita de
  scripturi dedicate.
- Nu acopera tracking server-side (site -> server propriu -> tracker) si nu
  atinge evercookies stocate in moduri neconventionale.
