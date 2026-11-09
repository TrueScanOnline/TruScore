"""Stage 5 probes: AD-02 ID reconciliation + Favourites UAT extraction."""
from __future__ import annotations

import json
import re
from collections import OrderedDict
from pathlib import Path

ROOT = Path(r"C:\TrueScan-FoodScanner")
OV = ROOT / "docs/development/w5-ad01/overhaul-20261109"
cat = json.loads((ROOT / "src/s25/assets/catalogue_315.json").read_text(encoding="utf-8"))
ids = {e["additive_id"] for e in cat}
rec = json.loads((OV / "W5_AD02_discovery_ordering_recommendation_READONLY.json").read_text(encoding="utf-8"))

prop = set(rec["proposed_t1_t2_sequence"])
prop |= {x["additive_id"] for x in rec["proposed_full_ranked_list"]}
prop |= set(rec.get("cadbury_favourites_proposed_modal_order", []))
missing = sorted(prop - ids)
print("proposed_unique", len(prop))
print("missing_from_catalogue", missing)
print("full_ranked", len(rec["proposed_full_ranked_list"]))
print("t1t2", len(rec["proposed_t1_t2_sequence"]))
fav = rec["cadbury_favourites_proposed_modal_order"]
print("fav_missing", [x for x in fav if x not in ids])

# How many STANDARD ids are in full ranked?
std = {
    e["additive_id"]
    for e in cat
    if not (e.get("body6_existing") in (True, "TRUE", "true", 1, "Yes", "YES"))
}
ranked = [x["additive_id"] for x in rec["proposed_full_ranked_list"]]
print("ranked_count", len(ranked), "unique", len(set(ranked)))
print("std_not_ranked", sorted(std - set(ranked))[:40], "n=", len(std - set(ranked)))
print("ranked_not_in_cat", sorted(set(ranked) - ids))

fav_dir = ROOT / "docs/uat/w5-ad01-stage4c-batch-a-final-20261109"
aid_re = re.compile(r"\b(e\d{3}[a-z]?|e\d{4}|s8-nocode-\d{3}|e999\((?:i|ii)\))\b", re.I)

# Prefer modal dumps for ordered additive titles if present
order: list[str] = []
seen = set()
for p in sorted(fav_dir.glob("favpack_modal*.xml")):
    t = p.read_text(encoding="utf-8", errors="ignore")
    texts = re.findall(r'text="([^"]{2,160})"', t)
    # Keep human-visible additive-ish lines
    for x in texts:
        xl = x.lower()
        if any(
            k in xl
            for k in (
                "colour",
                "emulsifier",
                "lecithin",
                "caramel",
                "cochineal",
                "carmine",
                "pectin",
                "gelatin",
                "gelatine",
                "sulphite",
                "sulfite",
                "citric",
                "sodium carbonate",
                "glucono",
                "starch",
                "anthocyanin",
                "paprika",
                "glycerol",
                "poly",
                "sorbitan",
            )
        ):
            if x not in seen and len(x) < 80:
                seen.add(x)
                order.append(x)

print("fav_modal_texts")
for x in order:
    print(" -", x)

# Also scrape result screen
result = fav_dir / "43_result.xml"
if result.exists():
    t = result.read_text(encoding="utf-8", errors="ignore")
    texts = re.findall(r'text="([^"]{2,160})"', t)
    print("result_texts_additiveish")
    for x in texts:
        xl = x.lower()
        if "additive" in xl or re.search(r"\be?\d{3}", xl) or any(
            k in xl for k in ("colour", "emulsifier", "lecithin", "caramel", "pectin", "gelatin")
        ):
            print(" -", x)

# Capture any literal additive_ids in xml
found_ids = OrderedDict()
for p in sorted(fav_dir.glob("favpack*.xml")) + [result] if result.exists() else sorted(fav_dir.glob("favpack*.xml")):
    if not p or not p.exists():
        continue
    for m in aid_re.finditer(p.read_text(encoding="utf-8", errors="ignore")):
        found_ids.setdefault(m.group(1).lower(), []).append(p.name)
print("literal_ids_in_fav_xml", list(found_ids.keys()))

# Batch-A founder review may list detections
for md in [
    ROOT / "docs/uat/w5-ad01-stage4c-batch-a-final-20261109",
    OV,
]:
    pass

# Search desktop founder reviews / uat notes
for p in Path(r"C:\Users\leigh\Desktop").glob("*BatchA*"):
    print("desktop", p.name)
