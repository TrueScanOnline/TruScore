"""Extract verified Favourites additive IDs from UAT XML dumps."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(r"C:\TrueScan-FoodScanner")
fav_dir = ROOT / "docs/uat/w5-ad01-stage4c-batch-a-final-20261109"
cat = json.loads((ROOT / "src/s25/assets/catalogue_315.json").read_text(encoding="utf-8"))
by_title = {}
for e in cat:
    title = (e.get("entry_title") or "").strip()
    by_title[title.lower()] = e["additive_id"]
    # also bare name + code
    name = (e.get("consumer_display_name") or "").strip()
    code = (e.get("schedule8_code") or "").strip()
    if name and code:
        by_title[f"{name} ({code})".lower()] = e["additive_id"]

code_in_parens = re.compile(r"\(([^)]+)\)\s*$")
ordered = []
seen = set()
# modal dumps first (opened tiles)
for p in sorted(fav_dir.glob("favpack_modal*.xml"), key=lambda x: int(re.search(r"modal(\d+)", x.name).group(1))):
    t = p.read_text(encoding="utf-8", errors="ignore")
    texts = re.findall(r'text="([^"]{2,200})"', t)
    # Prefer the entry title line containing parentheses code
    candidates = []
    for x in texts:
        if code_in_parens.search(x) and len(x) < 120:
            candidates.append(x)
    # Heuristic: first long title-like candidate is the opened additive
    for x in candidates:
        xl = x.lower()
        aid = by_title.get(xl)
        if not aid:
            m = code_in_parens.search(x)
            code = m.group(1).strip().lower()
            # map code to additive_id
            for e in cat:
                if str(e.get("schedule8_code") or "").lower() == code:
                    aid = e["additive_id"]
                    break
                if e["additive_id"].lower() == f"e{code}".lower() or e["additive_id"].lower() == code:
                    aid = e["additive_id"]
                    break
        if aid and aid not in seen:
            # Only accept if this looks like the modal hero (appears early / with expanded-ish second line)
            seen.add(aid)
            ordered.append({"source_file": p.name, "text": x, "additive_id": aid})
            break

# Also scan list screens for all titles
list_ids = []
list_seen = set()
for p in sorted(fav_dir.glob("favpack_s*.xml"), key=lambda x: int(re.search(r"s(\d+)", x.name).group(1))):
    t = p.read_text(encoding="utf-8", errors="ignore")
    texts = re.findall(r'text="([^"]{2,200})"', t)
    for x in texts:
        m = code_in_parens.search(x)
        if not m or len(x) > 120:
            continue
        code = m.group(1).strip().lower()
        aid = None
        for e in cat:
            if str(e.get("schedule8_code") or "").lower() == code:
                aid = e["additive_id"]
                break
        if aid and aid not in list_seen:
            list_seen.add(aid)
            list_ids.append({"source_file": p.name, "text": x, "additive_id": aid})

out = {
    "barcode": "9300617308324",
    "product": "Cadbury Favourites",
    "modal_opened_order": ordered,
    "list_detected_order": list_ids,
    "verified_additive_ids_in_render_order": [x["additive_id"] for x in list_ids],
}
path = ROOT / "docs/development/w5-ad01/overhaul-20261109/stage5_favourites_verified.json"
path.write_text(json.dumps(out, indent=2), encoding="utf-8")
print(json.dumps(out, indent=2))
