import json
import re
import sys

MAX_RULES_PER_FILE = 20000
START_ID = 10000

def parse_line(line):
    """Intoarce (domain, options) pentru linii de forma ||domain^ sau ||domain^$opts, altfel None."""
    line = line.strip()
    if not line or line.startswith("!") or line.startswith("["):
        return None
    # doar forma simpla ||domain^ sau ||domain^$third-party etc - ignoram
    # regex complex, cosmetic filters (##), exceptii (@@), si optiuni pe care DNR nu le poate exprima simplu
    if line.startswith("@@"):
        return None
    if "##" in line or "#@#" in line or "#?#" in line:
        return None
    m = re.match(r"^\|\|([a-zA-Z0-9.\-]+)\^(\$(.*))?$", line)
    if not m:
        return None
    domain = m.group(1)
    opts_raw = m.group(3) or ""
    opts = [o for o in opts_raw.split(",") if o]
    # ignoram regulile cu domain= (specifice unui site anume, prea granular pentru DNR static simplu)
    if any(o.startswith("domain=") for o in opts):
        return None
    third_party_only = "third-party" in opts
    return domain, third_party_only

def to_dnr_rule(rule_id, domain, third_party_only):
    condition = {
        "urlFilter": f"||{domain}^",
        "resourceTypes": ["main_frame", "sub_frame", "image", "ping", "xmlhttprequest", "script", "media", "font", "websocket", "other"]
    }
    if third_party_only:
        condition["domainType"] = "thirdParty"
    return {
        "id": rule_id,
        "priority": 1,
        "action": {"type": "block"},
        "condition": condition
    }

def main():
    files = sys.argv[1:-1]
    out_path = sys.argv[-1]
    seen_domains = set()
    rules = []
    rule_id = START_ID
    skipped = 0
    for path in files:
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            for line in f:
                parsed = parse_line(line)
                if not parsed:
                    skipped += 1
                    continue
                domain, third_party_only = parsed
                if domain in seen_domains:
                    continue
                seen_domains.add(domain)
                rules.append(to_dnr_rule(rule_id, domain, third_party_only))
                rule_id += 1
                if len(rules) >= MAX_RULES_PER_FILE:
                    break

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(rules, f, indent=2)

    print(f"Reguli generate: {len(rules)}")
    print(f"Linii ignorate (comentarii, exceptii, filtre complexe): {skipped}")

if __name__ == "__main__":
    main()
