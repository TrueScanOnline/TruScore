"""More robust Favourites ID extraction from all UAT XML dumps."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(r"C:\TrueScan-FoodScanner")
fav_dir = ROOT / "docs/uat/w5-ad01-stage4c-batch-a-final-20261109"
cat = json.loads((ROOT / "src/s25/assets/catalogue_315.json").read_text(encoding="utf-8"))
code_to_id = {}
for e in cat:
    code = str(e.get("schedule8_code") or "").strip().lower()
    if code:
        code_to_id[code] = e["additive_id"]

paren = re.compile(r"\(([0-9]{3}[a-z]?|[0-9]{4}|999\((?:i|ii)\))\)", re.I)
found = []
seen = set()
files = sorted(fav_dir.glob("favpack*.xml")) + sorted(fav_dir.glob("43_result.xml"))
for p in files:
    t = p.read_text(encoding="utf-8", errors="ignore")
    texts = re.findall(r'text="([^"]{2,200})"', t)
    for x in texts:
        m = paren.search(x)
        if not m:
            continue
        code = m.group(1).lower()
        aid = code_to_id.get(code)
        if not aid:
            continue
        key = (aid, x)
        if aid in seen:
            continue
        # Prefer lines that look like entry titles (contain the name and code)
        if len(x) < 8 or len(x) > 140:
            continue
        seen.add(aid)
        found.append({"additive_id": aid, "text": x, "first_seen_in": p.name})

# Preserve scroll/modal encounter order approximately by file order already used
out = {
    "barcode": "9300617308324",
    "product": "Cadbury Favourites",
    "verified_rendered_additive_ids": [x["additive_id"] for x in found],
    "details": found,
}
(Path(ROOT / "docs/development/w5-ad01/overhaul-20261109/stage5_favourites_verified.json")).write_text(
    json.dumps(out, indent=2), encoding="utf-8"
)
print(json.dumps(out, indent=2))
