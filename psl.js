// implementeaza algoritmul standard Public Suffix List:
// https://github.com/publicsuffix/list/wiki/Format#formal-algorithm

let EXACT_RULES = null;
let WILDCARD_RULES = null;
let EXCEPTION_RULES = null;

function buildRuleSets() {
  if (EXACT_RULES) return;
  EXACT_RULES = new Set();
  WILDCARD_RULES = new Set();
  EXCEPTION_RULES = new Set();

  for (const rule of self.PSL_RULES || []) {
    if (rule.startsWith("!")) {
      EXCEPTION_RULES.add(rule.slice(1));
    } else if (rule.startsWith("*.")) {
      WILDCARD_RULES.add(rule.slice(2));
    } else {
      EXACT_RULES.add(rule);
    }
  }
}

// gaseste cea mai lunga regula care se potriveste cu sirul de etichete date
function findMatchingSuffix(labels) {
  buildRuleSets();
  let publicSuffixLabels = [labels[labels.length - 1]];

  for (let i = labels.length - 1; i >= 0; i--) {
    const candidate = labels.slice(i).join(".");

    if (EXCEPTION_RULES.has(candidate)) {
      // exceptia elimina eticheta cea mai din stanga a regulii
      return labels.slice(i + 1);
    }
    if (EXACT_RULES.has(candidate)) {
      publicSuffixLabels = labels.slice(i);
    }
    if (i > 0) {
      const wildcardCandidate = labels.slice(i).join(".");
      if (WILDCARD_RULES.has(wildcardCandidate)) {
        publicSuffixLabels = labels.slice(Math.max(i - 1, 0));
      }
    }
  }
  return publicSuffixLabels;
}

// intoarce domeniul inregistrabil (eTLD+1), ex. "sub.example.co.uk" -> "example.co.uk"
function registrableDomain(hostname) {
  if (!hostname) return hostname;
  const labels = hostname.toLowerCase().split(".").filter(Boolean);
  if (labels.length <= 1) return hostname;

  const publicSuffix = findMatchingSuffix(labels);
  const suffixLen = publicSuffix.length;

  if (suffixLen >= labels.length) {
    // hostname-ul e chiar sufixul public (caz rar), nu se poate reduce mai mult
    return labels.join(".");
  }
  return labels.slice(labels.length - suffixLen - 1).join(".");
}

self.registrableDomain = registrableDomain;
