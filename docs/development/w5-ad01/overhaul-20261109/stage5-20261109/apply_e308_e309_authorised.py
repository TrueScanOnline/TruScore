"""Apply founder-authorised E308/E309 governed source corrections → v0.12."""
from __future__ import annotations

import hashlib
import json
import shutil
from pathlib import Path

import openpyxl

ROOT = Path(r"C:\TrueScan-FoodScanner")
STAGE = ROOT / "docs/development/w5-ad01/overhaul-20261109/stage5-20261109"
V11 = ROOT / (
    "docs/development/w5-ad01/"
    "Rveel_S25_Broader_Additive_Catalogue_MVP_Implementation_Asset_W5AD01_editorial_v0_11.xlsx"
)
V11_SHA = "e155d47e71078a62d0866d1fe5819dac937bcd5877dbc0e4fc67cae10afa9eb5"
V12 = ROOT / (
    "docs/development/w5-ad01/"
    "Rveel_S25_Broader_Additive_Catalogue_MVP_Implementation_Asset_W5AD01_editorial_v0_12.xlsx"
)

# Founder-authorised ChatGPT revised SP wording
E308_SP = (
    "The Australia New Zealand Food Standards Code lists additive 308 as synthetic "
    "gamma-tocopherol, distinct from mixed tocopherols concentrate (307b). The additive "
    "number does not establish a particular supplier's starting materials or exact "
    "manufacturing process."
)
E309_SP = (
    "The Australia New Zealand Food Standards Code lists additive 309 as synthetic "
    "delta-tocopherol, distinct from mixed tocopherols concentrate (307b). The additive "
    "number does not establish a particular supplier's starting materials or exact "
    "manufacturing process."
)

# E309 consumer editorial from PROPOSED_E308_E309_E472E_CORRECTIONS.json
E309_EDITORIAL = {
    "tile_summary": "Synthetic delta-tocopherol is a manufactured form of one of the tocopherols in the vitamin E family.",
    "expanded_summary": (
        "Synthetic delta-tocopherol is a manufactured form of one of the tocopherols in the vitamin E family. "
        "In the Australia New Zealand Food Standards Code it is listed as synthetic delta-tocopherol (309), "
        "distinct from mixed tocopherols concentrate (307b). It is fat-soluble and is used as an antioxidant "
        "in fat-containing foods."
    ),
    "fact_1_label": "Listing",
    "fact_1_copy": (
        "FSANZ Schedule 15 lists 309 as synthetic delta-tocopherol, separate from mixed tocopherols concentrate (307b)."
    ),
    "fact_3_label": "Decode note",
    "fact_3_copy": (
        "The additive number alone does not mean the ingredient was extracted as a mixed natural tocopherol concentrate."
    ),
}

AUTHORISED = {
    "e308": {
        "source_preparation_profile": "CHEMICAL_SYNTHESIS",
        "source_preparation_copy": E308_SP,
    },
    "e309": {
        "source_preparation_profile": "CHEMICAL_SYNTHESIS",
        "source_preparation_copy": E309_SP,
        **E309_EDITORIAL,
    },
}


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> None:
    if sha256(V11) != V11_SHA:
        raise SystemExit(f"Refuse: v0.11 SHA mismatch {sha256(V11)}")
    if V12.exists():
        V12.unlink()
    shutil.copy2(V11, V12)
    wb = openpyxl.load_workbook(V12)
    ws = wb["Catalogue_315"]
    headers = [c.value for c in next(ws.iter_rows(min_row=1, max_row=1))]
    col = {h: i + 1 for i, h in enumerate(headers) if h}
    id_col = col["additive_id"]

    allowed_fields = set()
    for fields in AUTHORISED.values():
        allowed_fields |= set(fields)

    applied = {}
    for row in range(2, ws.max_row + 1):
        aid = ws.cell(row, id_col).value
        if aid not in AUTHORISED:
            continue
        before = {}
        after = {}
        for field, value in AUTHORISED[aid].items():
            if field not in col:
                raise SystemExit(f"Missing column {field}")
            before[field] = ws.cell(row, col[field]).value
            ws.cell(row, col[field]).value = value
            after[field] = value
        applied[aid] = {"before": before, "after": after}

    if set(applied) != {"e308", "e309"}:
        raise SystemExit(f"Unexpected applied set: {sorted(applied)}")

    wb.save(V12)
    out = {
        "baseline": "v0.11-W5AD01-editorial",
        "baseline_sha256": V11_SHA,
        "successor": "v0.12-W5AD01-editorial",
        "successor_path": str(V12),
        "successor_sha256": sha256(V12),
        "authorised_ids": ["e308", "e309"],
        "e472e_changed": False,
        "applied": applied,
        "allowed_fields": sorted(allowed_fields),
    }
    (STAGE / "E308_E309_AUTHORISED_APPLY.json").write_text(
        json.dumps(out, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print(json.dumps({k: out[k] for k in out if k != "applied"}, indent=2))
    print("fields_e308", sorted(AUTHORISED["e308"]))
    print("fields_e309", sorted(AUTHORISED["e309"]))


if __name__ == "__main__":
    main()
