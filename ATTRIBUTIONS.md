# Atribuiri

## EasyPrivacy / EasyList

Fisierul `rules-easyprivacy.json` este o lucrare derivata, convertita automat
(prin `convert_easyprivacy.py`) din listele publice EasyPrivacy, parte a
proiectului EasyList:

- Sursa: https://easylist.to/ (repository: https://github.com/easylist/easylist)
- Autori: The EasyList authors (https://easylist.to/)
- Licenta originala: dubla, GNU GPL v3 (sau ulterioara) ori Creative Commons
  Attribution-ShareAlike 3.0 Unported (CC BY-SA 3.0), la alegere
- Licenta aleasa pentru fisierul derivat `rules-easyprivacy.json`, si pentru
  intregul repository al acestei extensii: **GNU GPL v3** (vezi `LICENSE`),
  pentru consistenta - o singura licenta pentru tot codul si datele derivate

Fisierul ramane disponibil sub GPL v3: poate fi folosit, modificat si
redistribuit, cu conditia sa fie atribuit "The EasyList authors
(https://easylist.to/)" ca sursa, si ca orice lucrare derivata din el sa fie
distribuita tot sub GPL v3 (sau o versiune ulterioara).

Codul original al extensiei (background.js, popup.js, options.js,
fingerprint-guard.js, psl.js etc.) este licentiat sub GNU GPL v3, vezi
fisierul `LICENSE` din radacina repository-ului.

## Public Suffix List

Fisierul `psl-data.js` contine datele din Public Suffix List, publicata de
Mozilla:

- Sursa: https://publicsuffix.org/list/public_suffix_list.dat
- Licenta: Mozilla Public License 2.0 (MPL-2.0) - https://mozilla.org/MPL/2.0/

## Rezolvare CNAME cloaking

Verificarea CNAME foloseste resolver-ul public DNS-over-HTTPS al Cloudflare
(https://cloudflare-dns.com/dns-query), un serviciu public, fara relatie
contractuala sau de parteneriat cu aceasta extensie.
