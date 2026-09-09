# Privacy Policy - Tracker Blocker

Last updated: September 9, 2026

## What the extension does

Tracker Blocker blocks network requests to known tracking domains
(advertising pixels, analytics services) and strips tracking parameters
(fbclid, gclid, utm_* and others) from the URLs you visit.

## What data the extension collects

None. The extension does not send data to any external server, does not
use its own analytics, and does not collect browsing history.

Information stored locally (number of blocked requests, number of detected
cloaked trackers, on/off switch states) is saved only on your device, via
`chrome.storage.local`, and is not accessible to the extension's author.

## Why the extension requests access to all sites (host_permissions)

The blocking and URL-cleaning rules need to be able to evaluate any network
request, regardless of site, in order to work. The extension does not read
page content and has no purpose other than filtering the requests described
above, according to the `rules.json` file included in the code, which is
publicly available.

## Activity log (awareness)

The extension keeps a local log of visited sites and the trackers detected
on them (tracker domain, detection type, number of occurrences, date of last
occurrence), plus a separate list of domains and names of cookies set by
known trackers. This log:

- Stays exclusively on your device, in `chrome.storage.local`; it is never
  sent to the extension's author or to anyone else.
- Never contains the value of cookies, only their domain and name (for
  example "doubleclick.net" and "IDE", never the cookie's content).
- Is capped at a few hundred entries (the oldest and least active ones are
  automatically removed once the limit is reached).
- Can be cleared anytime from the log page ("Clear entire log" button) or
  exported locally as a JSON file, at your request.

## Third-party services

To detect trackers disguised under a subdomain of the site you're visiting
(CNAME cloaking), the extension sends the name of that subdomain to
Cloudflare's public DNS-over-HTTPS resolver (`cloudflare-dns.com`), when it
appears to belong to the domain you're already visiting. The full page
address, cookies, or any other content is never sent - only the domain name
queried. This is the only communication with a third-party service made by
the extension. Cloudflare's privacy policy for this service:
https://developers.cloudflare.com/1.1.1.1/privacy/public-dns-resolver/

The extension uses, locally (with no internet connection required), a copy
of the Public Suffix List (published by Mozilla) to correctly compute a
site's root domain, and a copy of the EasyPrivacy list (published by the
EasyList project) to block known trackers. Both are public lists, bundled
in the code, not services the extension connects to in real time.

The extension does not integrate any SDK or analytics library of its own.

## Data cleanup and WebRTC protection

The extension periodically (once an hour) deletes cookies, localStorage, and
other data stored by domains on its list of known tracking vendors. This
deletion happens locally, through the browser's standard API
(`chrome.browsingData`), and involves no external data transmission.

The extension changes the browser's setting for handling IP addresses in
WebRTC connections (`chrome.privacy.network.webRTCIPHandlingPolicy`), to
reduce the risk of your local IP address being exposed to third-party sites
through this technology. You can disable this protection anytime from the
popup.

## Contact

For questions about this policy or about the extension:
https://github.com/liviurhos/tracker-blocker/issues
