"""Automated copy QA over every modified STANDARD entry."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(r"C:\TrueScan-FoodScanner")
OV = ROOT / "docs/development/w5-ad01/overhaul-20261109"
cat = json.loads((ROOT / "src/s25/assets/catalogue_315.json").read_text(encoding="utf-8"))
chg = json.loads((OV / "CHANGED_FIELD_REGISTER.json").read_text(encoding="utf-8"))
reg = json.loads((OV / "REVIEW_REGISTER_309.json").read_text(encoding="utf-8"))
by = {e["additive_id"]: e for e in cat}
modified = sorted({c["additive_id"] for c in chg["changes"]})

flags = []
for aid in modified:
    e = by[aid]
    tile = (e.get("tile_summary") or "").strip()
    exp = (e.get("expanded_summary") or "").strip()
    if not tile:
        flags.append({"id": aid, "flag": "empty_tile"})
    if tile and exp and tile.rstrip(".") == exp.rstrip("."):
        flags.append({"id": aid, "flag": "tile_equals_expanded"})
    if len(tile) > 280:
        flags.append({"id": aid, "flag": "tile_very_long", "n": len(tile)})
    if len(exp) > 700:
        flags.append({"id": aid, "flag": "expanded_very_long", "n": len(exp)})
    low = f"{tile} {exp}".lower()
    if re.search(r"\b(toxic|poison|carcinogen|cancer risk)\b", low):
        flags.append({"id": aid, "flag": "alarmist_health_language"})
    if "this product" in low or "this scanned" in low:
        flags.append({"id": aid, "flag": "product_specific_implication"})
    if e.get("source_preparation_profile") == "VARIABLE":
        if re.search(r"\b(from soy|from egg|from animal fat)\b", low) and "alone" not in low and "does not" not in low:
            # soft flag — only when absolute claim without fail-closed hedge
            if "will not tell" not in low and "does not identify" not in low and "does not reveal" not in low:
                flags.append({"id": aid, "flag": "variable_absolute_origin_risk"})

out = {
    "modified_ids": len(modified),
    "flag_count": len(flags),
    "flags": flags,
    "source_review_required_ids": [
        e["additive_id"] for e in reg["entries"] if e.get("status") == "SOURCE REVIEW REQUIRED"
    ],
}
(OV / "COPY_QUALITY_FLAGS.json").write_text(json.dumps(out, indent=2), encoding="utf-8")
print(json.dumps({"modified_ids": out["modified_ids"], "flag_count": out["flag_count"], "by_flag": {}}, indent=2))
from collections import Counter

print(Counter(f["flag"] for f in flags))
print("SOURCE_REVIEW", out["source_review_required_ids"])
