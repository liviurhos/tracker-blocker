let activityData = [];
let cookieData = [];
let activitySort = { key: "count", dir: -1 };
let cookieSort = { key: "count", dir: -1 };

const CATEGORY_LABELS = {
  request: "cerere retea",
  cname: "cname deghizat",
  cookie: "cookie"
};

function formatDate(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString("ro-RO") + " " + d.toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" });
}

function applyFilter(rows, query, fields) {
  if (!query) return rows;
  const q = query.toLowerCase();
  return rows.filter((r) => fields.some((f) => String(r[f]).toLowerCase().includes(q)));
}

function sortRows(rows, sort) {
  const copy = rows.slice();
  copy.sort((a, b) => {
    const av = a[sort.key];
    const bv = b[sort.key];
    if (av < bv) return -1 * sort.dir;
    if (av > bv) return 1 * sort.dir;
    return 0;
  });
  return copy;
}

function renderActivity() {
  const query = document.getElementById("filterInput").value.trim();
  const filtered = applyFilter(activityData, query, ["pageSite", "trackerDomain"]);
  const sorted = sortRows(filtered, activitySort);
  const body = document.getElementById("activityBody");
  const empty = document.getElementById("activityEmpty");
  body.innerHTML = "";

  if (sorted.length === 0) {
    empty.style.display = "block";
  } else {
    empty.style.display = "none";
    for (const row of sorted) {
      const tr = document.createElement("tr");

      const tdSite = document.createElement("td");
      tdSite.textContent = row.pageSite;

      const tdTracker = document.createElement("td");
      tdTracker.textContent = row.trackerDomain;

      const tdCat = document.createElement("td");
      const catSpan = document.createElement("span");
      catSpan.className = `cat cat-${row.category}`;
      catSpan.textContent = CATEGORY_LABELS[row.category] || row.category;
      tdCat.appendChild(catSpan);

      const tdCount = document.createElement("td");
      tdCount.className = "count-badge";
      tdCount.textContent = row.count;

      const tdDate = document.createElement("td");
      tdDate.textContent = formatDate(row.lastSeen);

      tr.append(tdSite, tdTracker, tdCat, tdCount, tdDate);
      body.appendChild(tr);
    }
  }
}

function renderCookies() {
  const query = document.getElementById("filterInput").value.trim();
  const filtered = applyFilter(cookieData, query, ["domain", "name"]);
  const sorted = sortRows(filtered, cookieSort);
  const body = document.getElementById("cookieBody");
  const empty = document.getElementById("cookieEmpty");
  body.innerHTML = "";

  if (sorted.length === 0) {
    empty.style.display = "block";
  } else {
    empty.style.display = "none";
    for (const row of sorted) {
      const tr = document.createElement("tr");

      const tdDomain = document.createElement("td");
      tdDomain.textContent = row.domain;

      const tdName = document.createElement("td");
      tdName.textContent = row.name;

      const tdCount = document.createElement("td");
      tdCount.className = "count-badge";
      tdCount.textContent = row.count;

      const tdDate = document.createElement("td");
      tdDate.textContent = formatDate(row.lastSeen);

      tr.append(tdDomain, tdName, tdCount, tdDate);
      body.appendChild(tr);
    }
  }
}

function renderStats() {
  const sites = new Set(activityData.map((r) => r.pageSite));
  const trackers = new Set([
    ...activityData.map((r) => r.trackerDomain),
    ...cookieData.map((r) => r.domain)
  ]);
  const totalEvents = activityData.reduce((sum, r) => sum + r.count, 0);
  const totalCookies = cookieData.reduce((sum, r) => sum + r.count, 0);

  document.getElementById("statSites").textContent = sites.size;
  document.getElementById("statTrackers").textContent = trackers.size;
  document.getElementById("statEvents").textContent = totalEvents;
  document.getElementById("statCookies").textContent = totalCookies;
}

function renderAll() {
  renderStats();
  renderActivity();
  renderCookies();
}

async function load() {
  const response = await chrome.runtime.sendMessage({ type: "GET_ACTIVITY_LOG" });
  activityData = (response && response.activity) || [];
  cookieData = (response && response.cookies) || [];
  renderAll();
}

document.getElementById("filterInput").addEventListener("input", renderAll);

document.getElementById("refreshBtn").addEventListener("click", load);

document.getElementById("clearBtn").addEventListener("click", async () => {
  if (!confirm("Stergi tot jurnalul de activitate? Actiunea nu poate fi anulata.")) return;
  await chrome.runtime.sendMessage({ type: "CLEAR_ACTIVITY_LOG" });
  await load();
});

document.getElementById("exportBtn").addEventListener("click", () => {
  const payload = {
    exportedAt: new Date().toISOString(),
    activity: activityData,
    cookies: cookieData
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `tracker-blocker-log-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

document.querySelectorAll("#activityTable th[data-sort]").forEach((th) => {
  th.addEventListener("click", () => {
    const key = th.dataset.sort;
    if (activitySort.key === key) {
      activitySort.dir *= -1;
    } else {
      activitySort = { key, dir: -1 };
    }
    renderActivity();
  });
});

document.querySelectorAll("#cookieTable th[data-sort]").forEach((th) => {
  th.addEventListener("click", () => {
    const key = th.dataset.sort;
    if (cookieSort.key === key) {
      cookieSort.dir *= -1;
    } else {
      cookieSort = { key, dir: -1 };
    }
    renderCookies();
  });
});

load();
