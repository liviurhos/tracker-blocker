# Politica de confidentialitate - Tracker Blocker

Ultima actualizare: 9 septembrie 2026

## Ce face extensia

Tracker Blocker blocheaza cereri de retea catre domenii cunoscute de tracking (pixeli publicitari, servicii de analytics) si elimina parametri de tracking (fbclid, gclid, utm_* si altii) din URL-urile pe care le vizitezi.

## Ce date colecteaza extensia

Niciuna. Extensia nu trimite date catre niciun server extern, nu foloseste analytics propriu si nu colecteaza istoric de navigare.

Informatiile stocate local (numarul de cereri blocate, numarul de tracker-e deghizate detectate, starea comutatorului on/off) sunt salvate doar pe dispozitiv, prin `chrome.storage.local`, si nu sunt accesibile autorului extensiei.

## De ce cere extensia acces la toate site-urile (host_permissions)

Regulile de blocare si de curatare a URL-urilor trebuie sa poata evalua orice cerere de retea, indiferent de site, pentru a functiona. Extensia nu citeste continutul paginilor si nu are alt scop decat filtrarea cererilor descrise mai sus, conform fisierului `rules.json` inclus in cod, disponibil public.

## Jurnal de activitate (constientizare)

Extensia tine un jurnal local cu site-urile vizitate si tracker-ele detectate pe ele (domeniu tracker, tip de detectie, numar de aparitii, data ultimei aparitii), plus o lista separata cu domeniile si numele cookie-urilor setate de tracker-e cunoscute. Acest jurnal:

- Ramane exclusiv pe dispozitivul tau, in `chrome.storage.local`; nu e trimis niciodata catre autorul extensiei sau catre oricine altcineva.
- Nu contine niciodata valoarea cookie-urilor, doar domeniul si numele lor (de exemplu "doubleclick.net" si "IDE", nu continutul cookie-ului).
- E limitat la cateva sute de intrari (cele mai vechi si mai putin active sunt eliminate automat cand se atinge limita).
- Poate fi sters oricand din pagina de jurnal (buton "Sterge tot jurnalul") sau exportat local ca fisier JSON, la cererea ta.

## Servicii terte

Pentru a detecta tracker-e deghizate sub un subdomeniu al site-ului vizitat (CNAME cloaking), extensia trimite catre resolver-ul public DNS-over-HTTPS al Cloudflare (`cloudflare-dns.com`) numele acelui subdomeniu, atunci cand pare a apartine domeniului pe care il vizitezi deja. Nu se trimite adresa completa a paginii, cookie-uri, sau alt continut - doar numele de domeniu interogat. Aceasta este singura comunicare cu un serviciu tert facuta de extensie. Politica de confidentialitate a Cloudflare pentru acest serviciu: https://developers.cloudflare.com/1.1.1.1/privacy/public-dns-resolver/

Extensia foloseste local (fara conexiune la internet) o copie a Public Suffix List (publicata de Mozilla) pentru a calcula corect domeniul unui site, si o copie a listei EasyPrivacy (publicata de proiectul EasyList) pentru a bloca tracker-e cunoscute. Ambele sunt liste publice, incluse in cod, nu servicii la care extensia se conecteaza in timp real.

Extensia nu integreaza niciun SDK sau biblioteca de analytics proprie.

## Curatare de date si protectie WebRTC

Extensia sterge periodic (o data pe ora) cookie-uri, localStorage si alte date stocate de domeniile aflate pe lista sa de furnizori de tracking cunoscuti. Aceasta stergere se intampla local, prin API-ul standard al browser-ului (`chrome.browsingData`), si nu implica nicio transmisie de date catre extern.

Extensia modifica setarea browser-ului privind gestionarea adreselor IP in conexiuni WebRTC (`chrome.privacy.network.webRTCIPHandlingPolicy`), pentru a reduce riscul ca adresa ta IP locala sa fie expusa unor site-uri terte prin aceasta tehnologie. Poti dezactiva aceasta protectie oricand din popup.

## Contact

Pentru intrebari legate de aceasta politica sau despre extensie: https://github.com/liviurhos/tracker-blocker/issues
