"""
Reconcile cohort result JSONs → unified register → optional v0.10 workbook apply.
Does not modify v0.7 / v0.8 / discovery ordering code.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import shutil
from collections import Counter
from pathlib import Path

import openpyxl

ROOT = Path(r"C:\TrueScan-FoodScanner")
OV = ROOT / "docs/development/w5-ad01/overhaul-20261109"
V09 = ROOT / (
    "docs/development/w5-ad01/"
    "Rveel_S25_Broader_Additive_Catalogue_MVP_Implementation_Asset_W5AD01_editorial_v0_9.xlsx"
)
V09_SHA = "c49a4af1ed22a3ff57ef6a3f67d2909b97dce005ee76eb23c80baab26a0dd79d"
V10 = ROOT / (
    "docs/development/w5-ad01/"
    "Rveel_S25_Broader_Additive_Catalogue_MVP_Implementation_Asset_W5AD01_editorial_v0_10.xlsx"
)

EDITORIAL_FIELDS = [
    "tile_summary",
    "expanded_summary",
    "fact_1_label",
    "fact_1_copy",
    "fact_2_label",
    "fact_2_copy",
    "fact_3_label",
    "fact_3_copy",
]


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load_payload():
    return json.loads((OV / "standard_309_review_payload.json").read_text(encoding="utf-8"))


def reconcile() -> dict:
    entries = []
    missing = []
    for i in range(1, 7):
        p = OV / f"cohort_{i}_results.json"
        if not p.exists():
            missing.append(i)
            continue
        data = json.loads(p.read_text(encoding="utf-8"))
        entries.extend(data.get("entries") or [])
    by_id = {}
    for e in entries:
        aid = e.get("additive_id")
        if aid:
            by_id[aid] = e
    payload = load_payload()
    expected = [e["additive_id"] for e in payload["entries"]]
    absent = [aid for aid in expected if aid not in by_id]
    register = {
        "programme": "W5-AD-01 catalogue-wide three-pass overhaul + source-aware discovery addendum",
        "baseline_asset_version": "v0.9-W5AD01-editorial",
        "cohorts_missing": missing,
        "expected_count": 309,
        "received_count": len(by_id),
        "absent_ids": absent,
        "status_counts": dict(Counter(e.get("status", "UNKNOWN") for e in by_id.values())),
        "discovery_counts": dict(
            Counter(e.get("discovery_priority", "UNKNOWN") for e in by_id.values())
        ),
        "entries": [by_id[aid] for aid in expected if aid in by_id],
    }
    out = OV / "REVIEW_REGISTER_309.json"
    out.write_text(json.dumps(register, ensure_ascii=False, indent=2), encoding="utf-8")
    print("wrote", out)
    print("status", register["status_counts"])
    print("discovery", register["discovery_counts"])
    print("missing_cohorts", missing, "absent_ids", len(absent))
    return register


def apply_workbook(register: dict) -> None:
    if register["cohorts_missing"] or register["absent_ids"]:
        raise SystemExit("Refuse apply: incomplete register")
    if sha256(V09) != V09_SHA:
        raise SystemExit(f"v0.9 SHA mismatch: {sha256(V09)}")
    if V10.exists():
        V10.unlink()
    shutil.copy2(V09, V10)
    wb = openpyxl.load_workbook(V10)
    ws = wb["Catalogue_315"]
    headers = [c.value for c in next(ws.iter_rows(min_row=1, max_row=1))]
    col = {h: i + 1 for i, h in enumerate(headers) if h}
    id_col = col["additive_id"]
    originals = {e["additive_id"]: e for e in load_payload()["entries"]}
    changed = []
    for row in range(2, ws.max_row + 1):
        aid = ws.cell(row=row, column=id_col).value
        # BODY6 and non-reviewed rows untouched
        rev = next((e for e in register["entries"] if e["additive_id"] == aid), None)
        if not rev:
            continue
        # Apply EDITORIALLY IMPROVED, and also safe supported wording on
        # SOURCE REVIEW REQUIRED rows (status remains in the register).
        if rev.get("status") not in ("EDITORIALLY IMPROVED", "SOURCE REVIEW REQUIRED"):
            continue
        final = rev.get("final") or {}
        orig = originals[aid]
        for field in EDITORIAL_FIELDS:
            if field not in final or final[field] is None:
                continue
            new_v = final[field]
            old_v = orig.get(field, "")
            if new_v != old_v:
                ws.cell(row=row, column=col[field]).value = new_v
                changed.append(
                    {
                        "additive_id": aid,
                        "field": field,
                        "before": old_v,
                        "after": new_v,
                        "status": rev.get("status"),
                    }
                )
    wb.save(V10)
    (OV / "CHANGED_FIELD_REGISTER.json").write_text(
        json.dumps({"count": len(changed), "changes": changed}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print("wrote", V10, "sha", sha256(V10), "field_changes", len(changed))


def discovery_recommendation(register: dict) -> None:
    """Read-only W5-AD-02 ranking recommendation — does not edit runtime."""
    tier_rank = {
        "T1_UNUSUAL_ORIGIN": 1,
        "T2_ROUTE_REVEAL": 2,
        "T3_CHOICE_RELEVANCE": 3,
        "T4_EDUCATIONAL": 4,
        "T5_FUNCTIONAL_BASELINE": 5,
    }
    ranked = []
    for e in register["entries"]:
        pri = e.get("discovery_priority") or "T5_FUNCTIONAL_BASELINE"
        if pri == "T5_FUNCTIONAL_BASELINE":
            continue
        ranked.append(
            {
                "additive_id": e["additive_id"],
                "discovery_priority": pri,
                "proposed_sequence_band": tier_rank.get(pri, 5),
                "rationale": e.get("discovery_rationale"),
                "source_preparation_profile": e.get("source_preparation_profile"),
                "notable_source_detail": e.get("notable_source_detail"),
            }
        )
    ranked.sort(key=lambda x: (x["proposed_sequence_band"], x["additive_id"]))
    # Propose explicit sequence for T1+T2 only (mirrors current AD-02 pattern)
    seq = {}
    n = 1
    for e in ranked:
        if e["proposed_sequence_band"] <= 2:
            seq[e["additive_id"]] = n
            n += 1
    # Cadbury Favourites illustrative order using proposed seq then occurrence fallback
    favourites_ids = [
        "e120",
        "e150c",
        "e160c",
        "e163",
        "e223",
        "e322",
        "e330",
        "e331",
        "e422",
        "e428",
        "e440",
        "e471",
        "e476",
        "e500",
        "e575",
        "e1401",
    ]
    decorated = []
    for i, aid in enumerate(favourites_ids):
        decorated.append((seq.get(aid), i, aid))
    decorated.sort(key=lambda t: (t[0] is None, t[0] if t[0] is not None else 999, t[1]))
    out = {
        "note": "READ-ONLY recommendation. Do not implement without founder approval. Current DISCOVERY_DISPLAY_SEQUENCE unchanged.",
        "current_runtime_sequence": {
            "e120": 1,
            "e471": 2,
            "e476": 3,
            "e150c": 4,
            "e330": 5,
            "e322": 6,
            "e422": 7,
            "e575": 8,
            "e223": 9,
        },
        "proposed_t1_t2_sequence": seq,
        "proposed_full_ranked_list": ranked,
        "cadbury_favourites_proposed_modal_order": [aid for _, _, aid in decorated],
        "policy": {
            "criteria": [
                "verified unusual origin",
                "consumer-choice relevance",
                "interesting manufacturing transformation",
                "unexpected food application",
                "general educational value",
            ],
            "excluded_criteria": [
                "Body Score deductions",
                "toxicity assumptions",
                "regulatory severity",
                "product risk scores",
                "unsupported product-specific conclusions",
            ],
            "preserve": [
                "merge outputs",
                "detection",
                "colour-group behaviour",
                "focus/accessibility",
                "BODY6/scoring",
                "Result/Open navigation",
                "product additive counts",
                "deterministic fallback to occurrence order",
            ],
        },
    }
    p = OV / "W5_AD02_discovery_ordering_recommendation_READONLY.json"
    p.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print("wrote", p, "proposed_t1_t2", len(seq))


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--reconcile", action="store_true")
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--discovery-rec", action="store_true")
    args = ap.parse_args()
    register = None
    if args.reconcile or args.apply or args.discovery_rec:
        register = reconcile() if args.reconcile or not (OV / "REVIEW_REGISTER_309.json").exists() else json.loads(
            (OV / "REVIEW_REGISTER_309.json").read_text(encoding="utf-8")
        )
        if args.reconcile:
            pass
        if args.discovery_rec:
            discovery_recommendation(register)
        if args.apply:
            apply_workbook(register)


if __name__ == "__main__":
    main()
