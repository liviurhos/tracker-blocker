importScripts("psl-data.js", "psl.js");

const RULESET_ID = "pixel_rules";

// domenii cunoscute de furnizori de tracking, folosite frecvent ca tinta
// pentru CNAME cloaking (site-ul mascheaza trackerul sub un subdomeniu propriu)
const CNAME_VENDOR_SUFFIXES = [
  "eulerian.net",
  "clientstream.eu",
  "attentivemobile.com",
  "list-manage.com",
  "klaviyo.com",
  "customeriomail.com",
  "msgsndr.com",
  "webtrekk.net",
  "webtrekk.de",
  "xiti.com",
  "criteo.com",
  "criteo.net",
  "exponea.com",
  "bounceexchange.com",
  "sailthru.com",
  "hs-analytics.net",
  "hubspot.net",
  "adobedc.net",
  "demdex.net",
  "krxd.net",
  "bluekai.com",
  "at-o.net"
];


// --- jurnal de activitate: agregheaza site-uri + tracker-e detectate, pentru constientizare ---

let trackerDomainSet = null;
let trackerDomainSetPromise = null;

function extractDomainFromFilter(filter) {
  if (!filter || !filter.startsWith("||")) return null;
  const rest = filter.slice(2);
  const cutIndex = rest.search(/[\^/]/);
  const domain = cutIndex === -1 ? rest : rest.slice(0, cutIndex);
  return domain || null;
}

async function loadTrackerDomainSet() {
  if (trackerDomainSet) return trackerDomainSet;
  if (!trackerDomainSetPromise) {
    trackerDomainSetPromise = (async () => {
      const set = new Set(CNAME_VENDOR_SUFFIXES);
      for (const file of ["rules.json", "rules-easyprivacy.json"]) {
        try {
          const resp = await fetch(chrome.runtime.getURL(file));
          const rules = await resp.json();
          for (const rule of rules) {
            const filter = rule.condition && rule.condition.urlFilter;
            const domain = extractDomainFromFilter(filter);
            if (domain) set.add(domain);
          }
        } catch (e) {
          // fisier lipsa sau invalid, continuam cu ce am reusit sa incarcam
        }
      }
      trackerDomainSet = set;
      return set;
    })();
  }
  return trackerDomainSetPromise;
}

function findTrackerMatch(hostname, set) {
  const labels = hostname.split(".");
  for (let i = 0; i <= labels.length - 2; i++) {
    const suffix = labels.slice(i).join(".");
    if (set.has(suffix)) return suffix;
  }
  return null;
}

const MAX_LOG_ENTRIES = 800;
const MAX_COOKIE_ENTRIES = 400;
let activityLogCache = null;
let activityLogLoadPromise = null;
let cookieLogCache = null;
let cookieLogLoadPromise = null;

async function loadActivityLog() {
  if (activityLogCache) return activityLogCache;
  if (!activityLogLoadPromise) {
    activityLogLoadPromise = (async () => {
      const data = await chrome.storage.local.get("activityLog");
      activityLogCache = new Map(Object.entries(data.activityLog || {}));
      return activityLogCache;
    })();
  }
  return activityLogLoadPromise;
}

async function loadCookieLog() {
  if (cookieLogCache) return cookieLogCache;
  if (!cookieLogLoadPromise) {
    cookieLogLoadPromise = (async () => {
      const data = await chrome.storage.local.get("cookieLog");
      cookieLogCache = new Map(Object.entries(data.cookieLog || {}));
      return cookieLogCache;
    })();
  }
  return cookieLogLoadPromise;
}

function pruneOldest(map, maxSize) {
  if (map.size <= maxSize) return;
  let oldestKey = null;
  let oldestTime = Infinity;
  for (const [k, v] of map) {
    if (v.lastSeen < oldestTime) {
      oldestTime = v.lastSeen;
      oldestKey = k;
    }
  }
  if (oldestKey) map.delete(oldestKey);
}

let writeInFlight = false;
let writePending = false;

async function flushNow() {
  if (writeInFlight) {
    writePending = true;
    return;
  }
  writeInFlight = true;
  try {
    const toWrite = {};
    if (activityLogCache) toWrite.activityLog = Object.fromEntries(activityLogCache);
    if (cookieLogCache) toWrite.cookieLog = Object.fromEntries(cookieLogCache);
    await chrome.storage.local.set(toWrite);
  } catch (e) {
    // scriere esuata, incercam la urmatoarea modificare
  }
  writeInFlight = false;
  if (writePending) {
    writePending = false;
    flushNow();
  }
}

async function logActivity(pageSite, trackerDomain, category) {
  if (!pageSite || !trackerDomain || pageSite === trackerDomain) return;
  const cache = await loadActivityLog();
  const key = `${pageSite}||${trackerDomain}||${category}`;
  const now = Date.now();
  const existing = cache.get(key);
  if (existing) {
    existing.count += 1;
    existing.lastSeen = now;
  } else {
    cache.set(key, { pageSite, trackerDomain, category, count: 1, firstSeen: now, lastSeen: now });
    pruneOldest(cache, MAX_LOG_ENTRIES);
  }
  flushNow();
}

async function logCookie(domain, name) {
  const cache = await loadCookieLog();
  const key = `${domain}||${name}`;
  const now = Date.now();
  const existing = cache.get(key);
  if (existing) {
    existing.count += 1;
    existing.lastSeen = now;
  } else {
    cache.set(key, { domain, name, count: 1, firstSeen: now, lastSeen: now });
    pruneOldest(cache, MAX_COOKIE_ENTRIES);
  }
  flushNow();
}


if (chrome.cookies && chrome.cookies.onChanged) {
  chrome.cookies.onChanged.addListener(async (changeInfo) => {
    if (changeInfo.removed) return;
    const data = await chrome.storage.local.get("enabled");
    if (data.enabled === false) return;
    const domain = changeInfo.cookie.domain.replace(/^\./, "");
    const set = await loadTrackerDomainSet();
    const match = findTrackerMatch(domain, set);
    if (match) {
      // stocam doar domeniul si numele cookie-ului, niciodata valoarea
      logCookie(match, changeInfo.cookie.name);
    }
  });
}


async function getCount(key) {
  const data = await chrome.storage.local.get(key);
  return data[key] || 0;
}

async function incrementCount(key) {
  const current = await getCount(key);
  const next = current + 1;
  await chrome.storage.local.set({ [key]: next });
  return next;
}

chrome.runtime.onInstalled.addListener(async () => {
  const data = await chrome.storage.local.get("enabled");
  if (data.enabled === undefined) {
    await chrome.storage.local.set({
      enabled: true,
      blockedCount: 0,
      cnameBlockedCount: 0,
      webrtcProtectionEnabled: true,
      cookieCleanupEnabled: true,
      fingerprintProtectionEnabled: true,
      fingerprintAllowlist: []
    });
  }
  const settings = await chrome.storage.local.get(["webrtcProtectionEnabled"]);
  applyWebRTCProtection(settings.webrtcProtectionEnabled !== false);
  chrome.alarms.create(CLEANUP_ALARM, { periodInMinutes: 60 });
});

if (chrome.declarativeNetRequest.onRuleMatchedDebug) {
  chrome.declarativeNetRequest.onRuleMatchedDebug.addListener(async () => {
    const count = await incrementCount("blockedCount");
    chrome.action.setBadgeText({ text: String(count > 999 ? "999+" : count) });
    chrome.action.setBadgeBackgroundColor({ color: "#444444" });
  });
}

// --- CNAME cloaking: rezolvare prin DNS-over-HTTPS (Cloudflare) ---

const cnameCache = new Map();
const CACHE_TTL_MS = 1000 * 60 * 60;
let dynamicRuleIdCounter = 5000;

async function resolveCNAME(hostname) {
  try {
    const resp = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(hostname)}&type=CNAME`,
      { headers: { accept: "application/dns-json" } }
    );
    if (!resp.ok) return null;
    const data = await resp.json();
    if (data.Answer && data.Answer.length > 0) {
      const answer = data.Answer.find((a) => a.type === 5);
      if (answer) return answer.data.replace(/\.$/, "");
    }
    return null;
  } catch (e) {
    return null;
  }
}

async function blockHostnameDynamically(hostname) {
  const ruleId = dynamicRuleIdCounter++;
  try {
    await chrome.declarativeNetRequest.updateDynamicRules({
      addRules: [
        {
          id: ruleId,
          priority: 1,
          action: { type: "block" },
          condition: {
            urlFilter: `||${hostname}^`,
            resourceTypes: ["main_frame", "sub_frame", "image", "ping", "xmlhttprequest", "script"]
          }
        }
      ],
      removeRuleIds: []
    });
  } catch (e) {
    // hostname invalid pentru urlFilter sau limita de reguli dinamice atinsa
  }
}

async function checkCNAMECloaking(hostname, initiatorHostname) {
  if (!initiatorHostname || hostname === initiatorHostname) return;
  if (registrableDomain(hostname) !== registrableDomain(initiatorHostname)) return;

  const cached = cnameCache.get(hostname);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) return;

  const target = await resolveCNAME(hostname);
  const isVendor = !!target && CNAME_VENDOR_SUFFIXES.some((s) => target.endsWith(s));
  cnameCache.set(hostname, { vendor: isVendor ? target : null, ts: Date.now() });

  if (isVendor) {
    await blockHostnameDynamically(hostname);
    const count = await incrementCount("cnameBlockedCount");
    chrome.action.setBadgeText({ text: String(count > 999 ? "999+" : count) });
    chrome.action.setBadgeBackgroundColor({ color: "#c0392b" });
    logActivity(registrableDomain(initiatorHostname), target, "cname");
  }
}

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    try {
      const url = new URL(details.url);
      let initiatorHostname = null;
      if (details.initiator && details.initiator !== "null") {
        initiatorHostname = new URL(details.initiator).hostname;
      }
      checkCNAMECloaking(url.hostname, initiatorHostname);

      if (initiatorHostname && url.hostname !== initiatorHostname) {
        loadTrackerDomainSet().then((set) => {
          const match = findTrackerMatch(url.hostname, set);
          if (match) {
            logActivity(registrableDomain(initiatorHostname), match, "request");
          }
        });
      }
    } catch (e) {
      // url invalid, ignoram
    }
  },
  { urls: ["<all_urls>"], types: ["main_frame", "sub_frame", "xmlhttprequest", "image", "script", "ping"] }
);

// --- protectie WebRTC: previne scurgerea IP-ului local prin ICE candidates ---

async function applyWebRTCProtection(enabled) {
  try {
    if (enabled) {
      await chrome.privacy.network.webRTCIPHandlingPolicy.set({
        value: "disable_non_proxied_udp"
      });
    } else {
      await chrome.privacy.network.webRTCIPHandlingPolicy.clear({});
    }
  } catch (e) {
    // API indisponibil (ex. profil gestionat de politica organizatiei)
  }
}

// --- curatare periodica: sterge cookie-uri si storage pentru domeniile de tracking cunoscute ---

const CLEANUP_ALARM = "tracker-cookie-cleanup";

async function cleanupTrackerStorage() {
  const data = await chrome.storage.local.get(["enabled", "cookieCleanupEnabled"]);
  if (data.enabled === false || data.cookieCleanupEnabled === false) return;

  const origins = [];
  for (const suffix of CNAME_VENDOR_SUFFIXES) {
    origins.push(`https://${suffix}`, `https://www.${suffix}`);
  }
  try {
    await chrome.browsingData.remove(
      { origins },
      { cookies: true, localStorage: true, indexedDB: true, cacheStorage: true }
    );
  } catch (e) {
    // unele origini pot fi respinse; ignoram silentios
  }
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === CLEANUP_ALARM) cleanupTrackerStorage();
});

// --- fingerprint guard: injectare dinamica, respectand allowlist-ul per site ---

chrome.webNavigation.onCommitted.addListener(async (details) => {
  try {
    const url = new URL(details.url);
    if (url.protocol !== "http:" && url.protocol !== "https:") return;

    const data = await chrome.storage.local.get([
      "enabled",
      "fingerprintProtectionEnabled",
      "fingerprintAllowlist"
    ]);
    if (data.enabled === false || data.fingerprintProtectionEnabled === false) return;

    const allowlist = data.fingerprintAllowlist || [];
    const hostRoot = registrableDomain(url.hostname);
    if (allowlist.includes(hostRoot)) return;

    await chrome.scripting.executeScript({
      target: { tabId: details.tabId, frameIds: [details.frameId] },
      files: ["fingerprint-guard.js"],
      world: "MAIN",
      injectImmediately: true
    });
  } catch (e) {
    // tab inchis intre timp, frame invalid, sau pagina interna (chrome://) - ignoram
  }
});

// --- mesaje din popup ---

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "TOGGLE_ENABLED") {
    chrome.declarativeNetRequest.updateEnabledRulesets(
      message.enabled
        ? { enableRulesetIds: [RULESET_ID, "easyprivacy_rules"] }
        : { disableRulesetIds: [RULESET_ID, "easyprivacy_rules"] }
    );
    chrome.storage.local.set({ enabled: message.enabled });
    sendResponse({ ok: true });
  }
  if (message.type === "TOGGLE_WEBRTC") {
    applyWebRTCProtection(message.enabled);
    chrome.storage.local.set({ webrtcProtectionEnabled: message.enabled });
    sendResponse({ ok: true });
  }
  if (message.type === "TOGGLE_COOKIE_CLEANUP") {
    chrome.storage.local.set({ cookieCleanupEnabled: message.enabled });
    sendResponse({ ok: true });
  }
  if (message.type === "TOGGLE_FINGERPRINT") {
    chrome.storage.local.set({ fingerprintProtectionEnabled: message.enabled });
    sendResponse({ ok: true });
  }
  if (message.type === "GET_SITE_STATUS") {
    (async () => {
      let hostRoot = null;
      try {
        hostRoot = registrableDomain(new URL(message.url).hostname);
      } catch (e) {}
      const data = await chrome.storage.local.get("fingerprintAllowlist");
      const allowlist = data.fingerprintAllowlist || [];
      sendResponse({ hostRoot, isAllowlisted: hostRoot ? allowlist.includes(hostRoot) : false });
    })();
    return true;
  }
  if (message.type === "TOGGLE_SITE_ALLOWLIST") {
    (async () => {
      const data = await chrome.storage.local.get("fingerprintAllowlist");
      const allowlist = data.fingerprintAllowlist || [];
      const idx = allowlist.indexOf(message.hostRoot);
      if (message.allowed && idx === -1) {
        allowlist.push(message.hostRoot);
      } else if (!message.allowed && idx !== -1) {
        allowlist.splice(idx, 1);
      }
      await chrome.storage.local.set({ fingerprintAllowlist: allowlist });
      sendResponse({ ok: true, allowlist });
    })();
    return true;
  }
  if (message.type === "GET_ACTIVITY_LOG") {
    (async () => {
      const activity = await loadActivityLog();
      const cookies = await loadCookieLog();
      sendResponse({
        activity: Array.from(activity.values()),
        cookies: Array.from(cookies.values())
      });
    })();
    return true;
  }
  if (message.type === "CLEAR_ACTIVITY_LOG") {
    (async () => {
      activityLogCache = new Map();
      cookieLogCache = new Map();
      await chrome.storage.local.set({ activityLog: {}, cookieLog: {} });
      sendResponse({ ok: true });
    })();
    return true;
  }
  if (message.type === "RESET_COUNT") {
    chrome.storage.local.set({ blockedCount: 0, cnameBlockedCount: 0 });
    chrome.action.setBadgeText({ text: "" });
    sendResponse({ ok: true });
  }
  return true;
});
