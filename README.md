# Tracker Blocker

*[Citeste in romana / Read in Romanian](./README.ro.md)*

Browser extension (Manifest V3 - Chrome, Edge, Brave) for blocking trackers
and protecting your privacy while browsing.

## What it does

- Blocks known advertising and analytics tracking pixels, using both
  built-in rules and the public **EasyPrivacy** list (part of the EasyList
  project), automatically converted into `declarativeNetRequest` format.
- Automatically strips tracking parameters from URLs: `fbclid`, `gclid`,
  `gclsrc`, `dclid`, `wbraid`, `gbraid`, `msclkid`, `utm_source`,
  `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, `yclid`,
  `igshid`, `mc_eid`, `twclid`, `ttclid`, and others.
- Detects **CNAME cloaking** (trackers disguised under a subdomain of the
  site you're visiting), using DNS-over-HTTPS and a correct root-domain
  calculation based on the **Public Suffix List**.
- Reduces **fingerprinting**: controlled noise on canvas, WebGL,
  AudioContext, normalized `hardwareConcurrency`/`deviceMemory`, Battery API
  removed. With a global switch and a per-site allowlist.
- **WebRTC** protection against local IP address leaks.
- Periodic cookie cleanup for known tracking domains.
- Local **activity log**: which sites tried to load which trackers, and
  which domains set tracking cookies - for awareness, not data collection
  (nothing ever leaves the device).

## Installation

### From the Chrome Web Store
[Extension link](https://chromewebstore.google.com/detail/tracker-blocker/bkehmkekkpijaflkififhgnpjmmcgfcj)

### Manual (Load unpacked)
1. Download or clone this repository.
2. Open `chrome://extensions` (or `edge://extensions`).
3. Enable "Developer mode".
4. Click "Load unpacked" and select the repository folder.

## Privacy

The extension does not collect or send data to any server of its own. All
data (activity log, settings) stays local, in `chrome.storage.local`. The
only outbound communication is an anonymous DNS-over-HTTPS query to
Cloudflare, needed for CNAME cloaking detection.

Full policy: [docs/privacy-en.md](./docs/privacy-en.md), published at
`https://liviurhos.github.io/tracker-blocker/privacy-en`.

## Updating the EasyPrivacy list

```
python3 convert_easyprivacy.py <easyprivacy_source_files> rules-easyprivacy.json
```

Source files can be downloaded from the official
[easylist/easylist](https://github.com/easylist/easylist) repository, in
the `easyprivacy/` folder. EasyPrivacy is updated every few days, so it's
worth refreshing periodically and republishing the extension.

## License

Source code licensed under [GNU GPL v3](./LICENSE).

The extension includes data derived from EasyPrivacy (The EasyList authors,
https://easylist.to/) and from the Public Suffix List (Mozilla, MPL-2.0).
Full details in [ATTRIBUTIONS.md](./ATTRIBUTIONS.md).

## Known limitations

This extension provides reasonable protection, not complete protection:

- CNAME cloaking detection has a window of exposure on the first request to
  a new subdomain.
- The tracker list is static between versions; it goes stale if not
  refreshed.
- Fingerprinting protection can be detected and, in theory, worked around
  by dedicated scripts.
- Does not cover server-side tracking (site -> own server -> tracker) and
  does not touch evercookies stored in unconventional ways.
