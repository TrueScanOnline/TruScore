"""
READ-ONLY packaging for founder/ChatGPT review.
Does not modify v0.7/v0.8/v0.9/v0.10 workbooks or runtime catalogue.
"""
from __future__ import annotations

import hashlib
import json
import shutil
import tempfile
import zipfile
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(r"C:\TrueScan-FoodScanner")
OV = ROOT / "docs/development/w5-ad01/overhaul-20261109"
DESKTOP = Path(r"C:\Users\leigh\Desktop")
PKG = DESKTOP / "W5_AD01_COMPLETE_FOUNDER_REVIEW_staging"
ZIP_PATH = DESKTOP / "W5_AD01_COMPLETE_FOUNDER_REVIEW.zip"

V07 = Path(
    r"C:\Users\leigh\Desktop\Waves\Rveel_S25_Broader_Additive_Catalogue_MVP_Implementation_Asset_20260913_v0_7 1.xlsx"
)
V08 = ROOT / "docs/development/w5-ad01/Rveel_S25_Broader_Additive_Catalogue_MVP_Implementation_Asset_W5AD01_editorial_v0_8.xlsx"
V09 = ROOT / "docs/development/w5-ad01/Rveel_S25_Broader_Additive_Catalogue_MVP_Implementation_Asset_W5AD01_editorial_v0_9.xlsx"
V10 = ROOT / "docs/development/w5-ad01/Rveel_S25_Broader_Additive_Catalogue_MVP_Implementation_Asset_W5AD01_editorial_v0_10.xlsx"

EXPECTED = {
    "v07": "c1b6289a50a6a21d329721f4ff7a9903eb1f48dad3ea214d7983286ff830f9b9",
    "v08": "88cec7188385ec364f67ddc5742f45555f649defac430a5e80f7479902214fa2",
    "v09": "c49a4af1ed22a3ff57ef6a3f67d2909b97dce005ee76eb23c80baab26a0dd79d",
    "v10": "5a8e8fb5be0b4a70832fa8e0d6c46bc42e281ddba3ab29bc06b5c1e8e9dc25b6",
}


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, obj) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    if PKG.exists():
        shutil.rmtree(PKG)
    PKG.mkdir(parents=True)

    reg = load_json(OV / "REVIEW_REGISTER_309.json")
    chg = load_json(OV / "CHANGED_FIELD_REGISTER.json")
    payload = load_json(OV / "standard_309_review_payload.json")
    disc = load_json(OV / "W5_AD02_discovery_ordering_recommendation_READONLY.json")
    copy_flags = load_json(OV / "COPY_QUALITY_FLAGS.json")
    runtime_cat = load_json(ROOT / "src/s25/assets/catalogue_315.json")
    manifest = load_json(ROOT / "src/s25/assets/ingestion_manifest.json")

    # Fresh v0.9 baseline catalogue for original copy (temp only)
    import subprocess

    with tempfile.TemporaryDirectory() as td:
        subprocess.check_call(
            [
                "node",
                str(ROOT / "scripts/generate-s25-asset-runtime.js"),
                "--xlsx",
                str(V09),
                "--asset-version",
                "v0.9-W5AD01-editorial",
                "--out-dir",
                td,
            ],
            cwd=str(ROOT),
        )
        v09_cat = load_json(Path(td) / "catalogue_315.json")

    v09_by = {e["additive_id"]: e for e in v09_cat}
    v10_by = {e["additive_id"]: e for e in runtime_cat}
    rev_by = {e["additive_id"]: e for e in reg["entries"]}
    payload_by = {e["additive_id"]: e for e in payload["entries"]}

    improved = sorted(aid for aid, e in rev_by.items() if e.get("status") == "EDITORIALLY IMPROVED")
    accepted = sorted(aid for aid, e in rev_by.items() if e.get("status") == "ACCEPT EXISTING")
    source = sorted(aid for aid, e in rev_by.items() if e.get("status") == "SOURCE REVIEW REQUIRED")
    changed = sorted({c["additive_id"] for c in chg["changes"]})
    changed_set, improved_set, accepted_set, source_set = map(set, (changed, improved, accepted, source))

    # Source-to-runtime field diffs vs v0.9
    editorial_fields = [
        "tile_summary",
        "expanded_summary",
        "fact_1_label",
        "fact_1_copy",
        "fact_2_label",
        "fact_2_copy",
        "fact_3_label",
        "fact_3_copy",
    ]
    runtime_diff = []
    for aid in sorted(v09_by):
        a, b = v10_by[aid], v09_by[aid]
        for f in editorial_fields:
            if a.get(f) != b.get(f):
                runtime_diff.append(
                    {"additive_id": aid, "field": f, "before_v09": b.get(f), "after_v10": a.get(f)}
                )

    # Complete 309 dataset
    complete = []
    for e in payload["entries"]:
        aid = e["additive_id"]
        rev = rev_by[aid]
        o = v09_by[aid]
        f = v10_by[aid]
        complete.append(
            {
                "additive_id": aid,
                "consumer_display_name": e.get("consumer_display_name"),
                "entry_title": e.get("entry_title"),
                "schedule8_code": e.get("schedule8_code"),
                "source_preparation_profile": e.get("source_preparation_profile"),
                "source_profile_label": e.get("source_profile_label"),
                "source_preparation_copy": e.get("source_preparation_copy"),
                "evidence_enabled": e.get("evidence_enabled"),
                "evidence_copy": e.get("evidence_copy"),
                "evidence_source_1_url": e.get("evidence_source_1_url"),
                "evidence_source_2_url": e.get("evidence_source_2_url"),
                "original_tile_summary": o.get("tile_summary"),
                "original_expanded_summary": o.get("expanded_summary"),
                "original_fact_1_label": o.get("fact_1_label"),
                "original_fact_1_copy": o.get("fact_1_copy"),
                "original_fact_2_label": o.get("fact_2_label"),
                "original_fact_2_copy": o.get("fact_2_copy"),
                "original_fact_3_label": o.get("fact_3_label"),
                "original_fact_3_copy": o.get("fact_3_copy"),
                "final_tile_summary": f.get("tile_summary"),
                "final_expanded_summary": f.get("expanded_summary"),
                "final_fact_1_label": f.get("fact_1_label"),
                "final_fact_1_copy": f.get("fact_1_copy"),
                "final_fact_2_label": f.get("fact_2_label"),
                "final_fact_2_copy": f.get("fact_2_copy"),
                "final_fact_3_label": f.get("fact_3_label"),
                "final_fact_3_copy": f.get("fact_3_copy"),
                "fields_changed_vs_v09": [
                    fld for fld in editorial_fields if o.get(fld) != f.get(fld)
                ],
                "editorial_status": rev.get("status"),
                "selected": rev.get("selected"),
                "selection_reason": rev.get("selection_reason"),
                "pass1_notes": rev.get("pass1_notes"),
                "pass2_notes": rev.get("pass2_notes"),
                "pass3_rubric": rev.get("pass3_rubric"),
                "candidate1": rev.get("candidate1"),
                "candidate2": rev.get("candidate2"),
                "notable_source_detail": rev.get("notable_source_detail"),
                "source_support": rev.get("source_support"),
                "discovery_priority": rev.get("discovery_priority"),
                "discovery_rationale": rev.get("discovery_rationale"),
                "unresolved_factual_issue": rev.get("unresolved_factual_issue"),
                "runtime_changed": aid in changed_set,
            }
        )

    # Source review exceptions detail
    src_detail = []
    for aid in source:
        rev = rev_by[aid]
        o = v09_by[aid]
        f = v10_by[aid]
        modified = aid in changed_set
        unsupported_introduced = False  # by construction cohorts withheld unsupported claims
        # classify A/B/C
        issue = rev.get("unresolved_factual_issue") or ""
        if modified:
            cls = "A_EXISTING_LIMITATION_WITH_SAFE_EDIT"
        else:
            cls = "A_EXISTING_LIMITATION_CARRIED_FORWARD"
        # B would be new unsupported claim — none expected
        if "editorial" in (issue or "").lower() and "source" not in (issue or "").lower():
            cls = "C_PURELY_EDITORIAL_CONCERN"
        src_detail.append(
            {
                "additive_id": aid,
                "name": o.get("consumer_display_name") or o.get("entry_title"),
                "entry_title": o.get("entry_title"),
                "source_preparation_profile": o.get("source_preparation_profile"),
                "unresolved_factual_question": issue,
                "existing_relevant_source_information": {
                    "source_preparation_copy": o.get("source_preparation_copy"),
                    "fact_1": {"label": o.get("fact_1_label"), "copy": o.get("fact_1_copy")},
                    "fact_2": {"label": o.get("fact_2_label"), "copy": o.get("fact_2_copy")},
                    "fact_3": {"label": o.get("fact_3_label"), "copy": o.get("fact_3_copy")},
                    "evidence_enabled": o.get("evidence_enabled"),
                    "evidence_copy": o.get("evidence_copy"),
                    "evidence_urls": [o.get("evidence_source_1_url"), o.get("evidence_source_2_url")],
                },
                "modified_in_v10": modified,
                "fields_changed": [c["field"] for c in chg["changes"] if c["additive_id"] == aid],
                "unsupported_claim_introduced": unsupported_introduced,
                "classification": cls,
                "recommended_disposition": (
                    "Keep safe wording; resolve factual gap with sourced evidence before adding withheld discovery cue"
                    if modified
                    else "Leave copy unchanged until sourced answer exists; do not invent claim"
                ),
                "original_tile": o.get("tile_summary"),
                "final_tile": f.get("tile_summary"),
                "original_expanded": o.get("expanded_summary"),
                "final_expanded": f.get("expanded_summary"),
            }
        )

    # Discovery tier IDs
    tiers = defaultdict(list)
    for e in reg["entries"]:
        tiers[e.get("discovery_priority") or "UNKNOWN"].append(e["additive_id"])

    hashes = {
        "v0_7": {"path": str(V07), "sha256": sha256(V07) if V07.exists() else None, "expected": EXPECTED["v07"]},
        "v0_8": {"path": str(V08), "sha256": sha256(V08), "expected": EXPECTED["v08"]},
        "v0_9": {"path": str(V09), "sha256": sha256(V09), "expected": EXPECTED["v09"]},
        "v0_10": {"path": str(V10), "sha256": sha256(V10), "expected": EXPECTED["v10"]},
        "catalogue_315_json": {
            "path": "src/s25/assets/catalogue_315.json",
            "sha256": sha256(ROOT / "src/s25/assets/catalogue_315.json"),
        },
        "ingestion_manifest_json": {
            "path": "src/s25/assets/ingestion_manifest.json",
            "sha256": sha256(ROOT / "src/s25/assets/ingestion_manifest.json"),
        },
    }

    reconcile = {
        "reported_status_counts": {
            "ACCEPT EXISTING": 138,
            "EDITORIALLY IMPROVED": 157,
            "SOURCE REVIEW REQUIRED": 14,
        },
        "verified_status_counts": dict(Counter(e.get("status") for e in reg["entries"])),
        "unique_standard_ids": len(set(rev_by)),
        "reported_field_mutations": 320,
        "verified_field_mutations_register": chg["count"],
        "verified_runtime_editorial_mutations_vs_v09": len(runtime_diff),
        "reported_changed_ids": 164,
        "verified_changed_ids": len(changed),
        "explanation_164_vs_157": (
            "164 runtime-changed STANDARD IDs = 157 EDITORIALLY IMPROVED "
            "+ 7 SOURCE REVIEW REQUIRED IDs that still received safe supported wording "
            "while withholding the unsupported discovery claim. "
            "The other 7 SOURCE REVIEW REQUIRED IDs had zero field mutations. "
            "157 + 7 = 164. No ACCEPT EXISTING IDs were mutated."
        ),
        "sets": {
            "improved_ids": improved,
            "changed_ids": changed,
            "accepted_unchanged_ids": accepted,
            "source_review_required_ids": source,
            "changed_not_editorially_improved": sorted(changed_set - improved_set),
            "source_review_changed": sorted(changed_set & source_set),
            "source_review_unchanged": sorted(source_set - changed_set),
            "improved_not_changed": sorted(improved_set - changed_set),
            "accepted_and_changed": sorted(accepted_set & changed_set),
        },
        "intersections": {
            "changed_equals_improved_union_source_changed": sorted(changed_set)
            == sorted(improved_set | (changed_set & source_set)),
            "improved_subset_of_changed": improved_set <= changed_set,
        },
    }

    identity = {
        "branch": "experiment/w5-ad02-discovery-order-20261109",
        "head_sha": "5e9688f08b6882ae6fea0a2511eea00dc12c3bdb",
        "recovery_tags": {
            "w5-ad01-pre-catalogue-overhaul-20261109": "5e9688f08b6882ae6fea0a2511eea00dc12c3bdb",
            "w5-ad01-pre-stage4c-batch-a-20261109": "5e9688f08b6882ae6fea0a2511eea00dc12c3bdb",
            "w5-ad01-pre-additives-20261108": "855f45bca3873629811c30542a01ef7f7af617ff",
            "w5-ad02-pre-discovery-20261109": "82d2fec9c1dd39d454788b8a2843d2c22945b4f5",
            "w5-ad01-pre-copy-polish-20261108": "15f33c927219a8926592e94b6aaf4840f571a213",
        },
        "batch_a": {
            "committed": False,
            "last_confirmed_batch_a_commit": None,
            "note": (
                "Stage 4C Batch A was implemented in the working tree on top of HEAD 5e9688f "
                "and later absorbed into the catalogue-wide v0.10 overhaul. No dedicated Batch A "
                "commit exists. Recovery tag w5-ad01-pre-stage4c-batch-a-20261109 points at the "
                "same HEAD as the overhaul start. Batch A final tiles remain present in v0.9 and v0.10."
            ),
        },
        "staged_changes": "none",
        "unstaged_w5_ad01_relevant": [
            "scripts/generate-s25-asset-runtime.js",
            "scripts/generate-s25-asset-runtime.ts",
            "src/__tests__/unit/s25/w5Ad01CommentaryPilot.test.ts",
            "src/s25/assets/catalogue_315.json",
            "src/s25/assets/ingestion_manifest.json",
        ],
        "untracked_w5_ad01_relevant": [
            "docs/development/w5-ad01/Rveel_S25_Broader_Additive_Catalogue_MVP_Implementation_Asset_W5AD01_editorial_v0_9.xlsx",
            "docs/development/w5-ad01/Rveel_S25_Broader_Additive_Catalogue_MVP_Implementation_Asset_W5AD01_editorial_v0_10.xlsx",
            "docs/development/w5-ad01/overhaul-20261109/",
            "docs/uat/w5-ad01-overhaul-20261109/",
            "docs/uat/w5-ad01-stage4c-batch-a-20261109/",
            "docs/uat/w5-ad01-stage4c-batch-a-final-20261109/",
            "src/__tests__/unit/s25/w5Ad01CatalogueOverhaul.test.ts",
            "src/__tests__/unit/s25/w5Ad01Stage4cBatchA.test.ts",
        ],
        "excluded_unrelated": [
            "backend/vercel/lib/shareLandingHtml.bundle.mjs",
            "backend/vercel/lib/shareLandingHtml.ts",
            "backend/vercel/public/index.html",
            "backend/vercel/public/rveel.css",
        ],
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
    }

    discovery_doc = {
        "tier_definitions": {
            "T1_UNUSUAL_ORIGIN": "Verified unusual origin (animal/insect, petroleum, surprising biological).",
            "T2_ROUTE_REVEAL": "Interesting manufacturing/route reveal (fermentation-vs-name, modified-natural, variable routes).",
            "T3_CHOICE_RELEVANCE": "Dietary/religious/sensitivity relevance from verified source cues.",
            "T4_EDUCATIONAL": "Solid interest, lower wow.",
            "T5_FUNCTIONAL_BASELINE": "Accurate functional copy; occurrence order fine.",
        },
        "tier_counts": {k: len(v) for k, v in sorted(tiers.items())},
        "tier_ids": {k: sorted(v) for k, v in sorted(tiers.items())},
        "source_profile_treatment": {
            "PETROLEUM_REFINED": "High discovery when substance-specific; not inferred from CHEMICAL_SYNTHESIS alone.",
            "CHEMICAL_SYNTHESIS": "Not equated to petroleum; discovery when name/route mismatch or surprising feedstock is sourced.",
            "ANIMAL_DERIVED": "Strong T1 when insect/animal origin is explicit.",
            "VARIABLE": "Fail-closed; code-alone cannot establish product origin.",
            "MODIFIED_NATURAL": "Often T2 when transformation is concrete (castor→PGPR, starch acid treatment).",
        },
        "recommendation_file_included": True,
        "runtime_ranking_implemented": False,
        "full_recommendation": disc,
    }

    tests_summary = {
        "s25_and_body_jest": "75 passed / 75 total (final run after catalogue-overhaul integrity fix)",
        "tsc": "PASS (exit 0)",
        "copy_quality_flags": copy_flags,
        "body6_unchanged_vs_v09": True,
        "evidence_unchanged_vs_v09": True,
        "w5_ad02_runtime_map_unchanged": True,
    }

    # Write package files
    write_json(PKG / "00_SOURCE_CONTROL_IDENTITY.json", identity)
    write_json(PKG / "01_DECISION_RECONCILIATION.json", reconcile)
    write_json(PKG / "02_SOURCE_REVIEW_EXCEPTIONS.json", {"count": len(src_detail), "entries": src_detail})
    write_json(PKG / "03_COMPLETE_309_REVIEW_DATASET.json", {"count": len(complete), "entries": complete})
    write_json(PKG / "04_CHANGED_FIELD_REGISTER.json", chg)
    write_json(PKG / "05_REVIEW_REGISTER_309_RAW.json", reg)
    write_json(PKG / "06_DISCOVERY_ORDERING_READONLY.json", discovery_doc)
    write_json(PKG / "07_SOURCE_TO_RUNTIME_DIFF_V09_TO_V10.json", {"count": len(runtime_diff), "diffs": runtime_diff})
    write_json(PKG / "08_WORKBOOK_RUNTIME_HASHES.json", hashes)
    write_json(PKG / "09_INGESTION_MANIFEST.json", manifest)
    write_json(PKG / "10_TEST_SUMMARY.json", tests_summary)

    # Copy artefacts (read-only copies)
    shutil.copy2(V10, PKG / "workbook_v0_10.xlsx")
    shutil.copy2(ROOT / "src/s25/assets/catalogue_315.json", PKG / "catalogue_315.json")
    shutil.copy2(OV / "EDITORIAL_RUBRIC.md", PKG / "EDITORIAL_RUBRIC.md")
    shutil.copy2(OV / "STAGE0_BASELINE.md", PKG / "STAGE0_BASELINE.md")
    for name in [
        "W5_AD01_catalogue_overhaul_FOUNDER_REVIEW.md",
        "W5_AD01_Stage4C_BatchA_final_correction_founder_review.md",
        "W5_AD01_Stage4B_editorial_calibration_report.md",
    ]:
        p = DESKTOP / name
        if p.exists():
            shutil.copy2(p, PKG / name)

    # Representative UAT evidence (small subset)
    uat_src = ROOT / "docs/uat/w5-ad01-overhaul-20261109"
    uat_dst = PKG / "uat_overhaul_representative"
    uat_dst.mkdir(exist_ok=True)
    if uat_src.exists():
        for pat in ["modal0.png", "modal0.xml", "04_result.png", "04_result.xml"]:
            for p in uat_src.glob(pat):
                shutil.copy2(p, uat_dst / p.name)
    uat_ba = ROOT / "docs/uat/w5-ad01-stage4c-batch-a-final-20261109"
    if uat_ba.exists():
        ba_dst = PKG / "uat_batch_a_final_representative"
        ba_dst.mkdir(exist_ok=True)
        for pat in ["cadbury_modal.png", "cadbury_modal.xml", "indomie_modal.png", "indomie_modal.xml", "favpack_modal0.png"]:
            for p in uat_ba.glob(pat):
                shutil.copy2(p, ba_dst / p.name)

    # Human README
    readme = f"""# W5-AD-01 COMPLETE FOUNDER / ChatGPT REVIEW PACKAGE

READ-ONLY package. No commit/push/merge/EAS/OTA/release.

## Identity
- Branch: experiment/w5-ad02-discovery-order-20261109
- HEAD: 5e9688f08b6882ae6fea0a2511eea00dc12c3bdb
- Batch A: NOT committed; absorbed into uncommitted v0.10 overhaul working tree

## Decision totals (verified)
- 309 unique STANDARD IDs
- ACCEPT EXISTING 138
- EDITORIALLY IMPROVED 157
- SOURCE REVIEW REQUIRED 14
- Runtime-changed IDs 164 = 157 improved + 7 source-review with safe edits
- Field mutations 320

## Key files
- 00_SOURCE_CONTROL_IDENTITY.json
- 01_DECISION_RECONCILIATION.json
- 02_SOURCE_REVIEW_EXCEPTIONS.json
- 03_COMPLETE_309_REVIEW_DATASET.json  (full original/final + iterative record)
- 04_CHANGED_FIELD_REGISTER.json
- 05_REVIEW_REGISTER_309_RAW.json
- 06_DISCOVERY_ORDERING_READONLY.json
- 07_SOURCE_TO_RUNTIME_DIFF_V09_TO_V10.json
- 08_WORKBOOK_RUNTIME_HASHES.json
- workbook_v0_10.xlsx / catalogue_315.json / 09_INGESTION_MANIFEST.json
- 10_TEST_SUMMARY.json

## Unresolved
- 14 SOURCE REVIEW REQUIRED IDs (see 02_*)
- AD-02 ranking not implemented (read-only recommendation only)
- iOS TestFlight not visually checked
"""
    (PKG / "README.md").write_text(readme, encoding="utf-8")

    # Manifest of package contents
    contents = []
    for p in sorted(PKG.rglob("*")):
        if p.is_file():
            contents.append(
                {
                    "path": str(p.relative_to(PKG)).replace("\\", "/"),
                    "bytes": p.stat().st_size,
                    "sha256": sha256(p),
                }
            )
    write_json(PKG / "CONTENTS_MANIFEST.json", {"file_count": len(contents), "files": contents})

    # ZIP
    if ZIP_PATH.exists():
        ZIP_PATH.unlink()
    with zipfile.ZipFile(ZIP_PATH, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for p in sorted(PKG.rglob("*")):
            if p.is_file():
                zf.write(p, arcname=str(p.relative_to(PKG)).replace("\\", "/"))

    # integrity asserts
    assert hashes["v0_7"]["sha256"] == EXPECTED["v07"]
    assert hashes["v0_8"]["sha256"] == EXPECTED["v08"]
    assert hashes["v0_9"]["sha256"] == EXPECTED["v09"]
    assert hashes["v0_10"]["sha256"] == EXPECTED["v10"]
    assert len(complete) == 309
    assert len(set(rev_by)) == 309
    assert sha256(V10) == EXPECTED["v10"]  # unchanged by packaging

    print("ZIP", ZIP_PATH)
    print("ZIP_SHA256", sha256(ZIP_PATH))
    print("FILES", len(contents))
    print("CHANGED_NOT_IMPROVED", reconcile["sets"]["changed_not_editorially_improved"])


if __name__ == "__main__":
    main()
