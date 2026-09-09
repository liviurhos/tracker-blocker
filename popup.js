const toggle = document.getElementById("toggle");
const toggleMaster = document.getElementById("toggleMaster");
const countEl = document.getElementById("count");
const cnameCountEl = document.getElementById("cnameCount");
const resetBtn = document.getElementById("reset");
const toggleFingerprint = document.getElementById("toggleFingerprint");
const toggleWebrtc = document.getElementById("toggleWebrtc");
const toggleCleanup = document.getElementById("toggleCleanup");
const siteName = document.getElementById("siteName");
const toggleSiteException = document.getElementById("toggleSiteException");

let currentHostRoot = null;

async function getActiveTabUrl() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab ? tab.url : null;
  } catch (e) {
    return null;
  }
}

async function refresh() {
  const data = await chrome.storage.local.get([
    "enabled",
    "blockedCount",
    "cnameBlockedCount",
    "fingerprintProtectionEnabled",
    "webrtcProtectionEnabled",
    "cookieCleanupEnabled"
  ]);
  toggle.checked = data.enabled !== false;
  countEl.textContent = data.blockedCount || 0;
  cnameCountEl.textContent = data.cnameBlockedCount || 0;
  toggleFingerprint.checked = data.fingerprintProtectionEnabled !== false;
  toggleWebrtc.checked = data.webrtcProtectionEnabled !== false;
  toggleCleanup.checked = data.cookieCleanupEnabled !== false;
  toggleMaster.checked =
    toggle.checked && toggleFingerprint.checked && toggleWebrtc.checked && toggleCleanup.checked;

  const url = await getActiveTabUrl();
  if (url && (url.startsWith("http://") || url.startsWith("https://"))) {
    const status = await chrome.runtime.sendMessage({ type: "GET_SITE_STATUS", url });
    if (status && status.hostRoot) {
      currentHostRoot = status.hostRoot;
      siteName.textContent = status.hostRoot;
      toggleSiteException.checked = status.isAllowlisted;
      toggleSiteException.disabled = false;
      return;
    }
  }
  currentHostRoot = null;
  siteName.textContent = "(pagina fara site aplicabil)";
  toggleSiteException.checked = false;
  toggleSiteException.disabled = true;
}

toggleMaster.addEventListener("change", () => {
  const on = toggleMaster.checked;
  toggle.checked = on;
  toggleFingerprint.checked = on;
  toggleWebrtc.checked = on;
  toggleCleanup.checked = on;

  chrome.runtime.sendMessage({ type: "TOGGLE_ENABLED", enabled: on });
  chrome.runtime.sendMessage({ type: "TOGGLE_FINGERPRINT", enabled: on });
  chrome.runtime.sendMessage({ type: "TOGGLE_WEBRTC", enabled: on });
  chrome.runtime.sendMessage({ type: "TOGGLE_COOKIE_CLEANUP", enabled: on });
});

toggle.addEventListener("change", () => {
  chrome.runtime.sendMessage({ type: "TOGGLE_ENABLED", enabled: toggle.checked });
  toggleMaster.checked =
    toggle.checked && toggleFingerprint.checked && toggleWebrtc.checked && toggleCleanup.checked;
});

toggleFingerprint.addEventListener("change", () => {
  chrome.runtime.sendMessage({ type: "TOGGLE_FINGERPRINT", enabled: toggleFingerprint.checked });
  toggleMaster.checked =
    toggle.checked && toggleFingerprint.checked && toggleWebrtc.checked && toggleCleanup.checked;
});

toggleWebrtc.addEventListener("change", () => {
  chrome.runtime.sendMessage({ type: "TOGGLE_WEBRTC", enabled: toggleWebrtc.checked });
  toggleMaster.checked =
    toggle.checked && toggleFingerprint.checked && toggleWebrtc.checked && toggleCleanup.checked;
});

toggleCleanup.addEventListener("change", () => {
  chrome.runtime.sendMessage({ type: "TOGGLE_COOKIE_CLEANUP", enabled: toggleCleanup.checked });
  toggleMaster.checked =
    toggle.checked && toggleFingerprint.checked && toggleWebrtc.checked && toggleCleanup.checked;
});

toggleSiteException.addEventListener("change", () => {
  if (!currentHostRoot) return;
  chrome.runtime.sendMessage({
    type: "TOGGLE_SITE_ALLOWLIST",
    hostRoot: currentHostRoot,
    allowed: toggleSiteException.checked
  });
});

resetBtn.addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "RESET_COUNT" }, refresh);
});

document.getElementById("openLog").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

refresh();
