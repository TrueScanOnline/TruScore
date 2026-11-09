"""Build Stage 5 source-to-runtime diff + consolidated founder review markdown."""
from __future__ import annotations

import hashlib
import json
import subprocess
import zipfile
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(r"C:\TrueScan-FoodScanner")
OV = ROOT / "docs/development/w5-ad01/overhaul-20261109"
STAGE5 = OV / "stage5-20261109"
DESKTOP = Path(r"C:\Users\leigh\Desktop")

EDITORIAL = {
    "tile_summary",
    "expanded_summary",
    "fact_1_label",
    "fact_1_copy",
    "fact_2_label",
    "fact_2_copy",
    "fact_3_label",
    "fact_3_copy",
}


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def ingest(xlsx: Path, version: str, out: Path):
    out.mkdir(parents=True, exist_ok=True)
    subprocess.check_call(
        [
            "node",
            str(ROOT / "scripts/generate-s25-asset-runtime.js"),
            "--xlsx",
            str(xlsx),
            "--asset-version",
            version,
            "--out-dir",
            str(out),
        ],
        cwd=ROOT,
    )
    return json.loads((out / "catalogue_315.json").read_text(encoding="utf-8"))


def main():
    summary = json.loads((STAGE5 / "STAGE5_SUMMARY.json").read_text(encoding="utf-8"))
    dups = json.loads((STAGE5 / "DUP24_DECISIONS.json").read_text(encoding="utf-8"))
    srr = json.loads((STAGE5 / "SRR14_DISPOSITIONS.json").read_text(encoding="utf-8"))
    patches = json.loads((STAGE5 / "STAGE5_PATCHES.json").read_text(encoding="utf-8"))
    fav = json.loads((OV / "stage5_favourites_verified.json").read_text(encoding="utf-8"))
    ad02 = json.loads(
        (OV / "W5_AD02_discovery_ordering_recommendation_READONLY.json").read_text(encoding="utf-8")
    )

    import tempfile

    with tempfile.TemporaryDirectory() as td:
        tdp = Path(td)
        v10 = ingest(
            ROOT
            / "docs/development/w5-ad01/Rveel_S25_Broader_Additive_Catalogue_MVP_Implementation_Asset_W5AD01_editorial_v0_10.xlsx",
            "v0.10-W5AD01-editorial",
            tdp / "v10",
        )
    runtime = json.loads((ROOT / "src/s25/assets/catalogue_315.json").read_text(encoding="utf-8"))
    by10 = {e["additive_id"]: e for e in v10}
    changes = []
    for e in runtime:
        aid = e["additive_id"]
        prev = by10[aid]
        fields = {}
        for k in EDITORIAL:
            if (prev.get(k) or "") != (e.get(k) or ""):
                fields[k] = {"before": prev.get(k), "after": e.get(k)}
        # invariant checks
        for locked in (
            "evidence_copy",
            "evidence_enabled",
            "evidence_source_1_url",
            "evidence_source_2_url",
            "source_preparation_profile",
            "source_preparation_copy",
            "code_detection_enabled",
            "name_detection_enabled",
            "body6_existing",
        ):
            assert prev.get(locked) == e.get(locked), f"locked {aid}.{locked}"
        if fields:
            changes.append({"additive_id": aid, "fields": fields})

    diff = {
        "from": "v0.10-W5AD01-editorial",
        "to": "v0.11-W5AD01-editorial",
        "changed_ids": len(changes),
        "field_mutations": sum(len(c["fields"]) for c in changes),
        "changes": changes,
    }
    (STAGE5 / "SOURCE_TO_RUNTIME_DIFF_V10_TO_V11.json").write_text(
        json.dumps(diff, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    branch = subprocess.check_output(["git", "rev-parse", "--abbrev-ref", "HEAD"], cwd=ROOT, text=True).strip()
    head = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()
    tags = {}
    for t in [
        "w5-ad01-pre-catalogue-overhaul-20261109",
        "w5-ad01-pre-stage4c-batch-a-20261109",
        "w5-ad01-pre-additives-20261108",
        "w5-ad02-pre-discovery-20261109",
    ]:
        try:
            tags[t] = subprocess.check_output(["git", "rev-list", "-n", "1", t], cwd=ROOT, text=True).strip()
        except subprocess.CalledProcessError:
            tags[t] = None

    hashes = {
        "v0_7": {
            "path": r"C:\Users\leigh\Desktop\Waves\Rveel_S25_Broader_Additive_Catalogue_MVP_Implementation_Asset_20260913_v0_7 1.xlsx",
            "sha256": None,
        },
        "v0_8": sha256(
            ROOT
            / "docs/development/w5-ad01/Rveel_S25_Broader_Additive_Catalogue_MVP_Implementation_Asset_W5AD01_editorial_v0_8.xlsx"
        ),
        "v0_9": sha256(
            ROOT
            / "docs/development/w5-ad01/Rveel_S25_Broader_Additive_Catalogue_MVP_Implementation_Asset_W5AD01_editorial_v0_9.xlsx"
        ),
        "v0_10": sha256(
            ROOT
            / "docs/development/w5-ad01/Rveel_S25_Broader_Additive_Catalogue_MVP_Implementation_Asset_W5AD01_editorial_v0_10.xlsx"
        ),
        "v0_11": sha256(
            ROOT
            / "docs/development/w5-ad01/Rveel_S25_Broader_Additive_Catalogue_MVP_Implementation_Asset_W5AD01_editorial_v0_11.xlsx"
        ),
        "catalogue_315_json": sha256(ROOT / "src/s25/assets/catalogue_315.json"),
        "ingestion_manifest_json": sha256(ROOT / "src/s25/assets/ingestion_manifest.json"),
    }
    v7p = Path(hashes["v0_7"]["path"])
    if v7p.exists():
        hashes["v0_7"]["sha256"] = sha256(v7p)

    (STAGE5 / "HASHES.json").write_text(json.dumps(hashes, indent=2), encoding="utf-8")

    # Founder markdown
    lines = []
    lines.append("# W5-AD-01 Stage 5 — Consolidated Editorial & Source-Quality Closure")
    lines.append("")
    lines.append("**STATUS: STOP FOR FOUNDER / CHATGPT ACCEPTANCE**")
    lines.append("")
    lines.append("No commit, push, merge, EAS, OTA or release.")
    lines.append("")
    lines.append("## Git identity")
    lines.append(f"- Branch: `{branch}`")
    lines.append(f"- HEAD: `{head}`")
    lines.append("- Recovery tags:")
    for k, v in tags.items():
        lines.append(f"  - `{k}` → `{v}`")
    lines.append("- Working tree: Stage 5 uncommitted on top of uncommitted v0.10 overhaul; Batch A never separately committed.")
    lines.append("")
    lines.append("## Baseline / successor")
    lines.append(f"- Experimental baseline: **v0.10** `{hashes['v0_10']}` (unchanged)")
    lines.append(f"- Successor applied: **v0.11** `{hashes['v0_11']}`")
    lines.append(f"- Runtime catalogue SHA-256: `{hashes['catalogue_315_json']}`")
    lines.append(f"- Ingestion manifest: `v0.11-W5AD01-editorial` / `{hashes['ingestion_manifest_json']}`")
    lines.append("")
    lines.append("## Task 1 — 24 duplicated descriptions")
    lines.append(f"- Decisions: **{summary['dup24']['improve']} IMPROVE / {summary['dup24']['keep']} KEEP**")
    lines.append("- Tile left unchanged; expanded only, using existing SP/facts (no new unsupported discoveries).")
    lines.append("- Remaining STANDARD tile==expanded duplicates after Stage 5: **0**")
    lines.append("")
    lines.append("| ID | Decision |")
    lines.append("|---|---|")
    for d in dups:
        lines.append(f"| `{d['additive_id']}` | {d['decision']} |")
    lines.append("")
    lines.append("Full before/after: `DUP24_DECISIONS.json`.")
    lines.append("")
    lines.append("## Task 2 — 14 SOURCE REVIEW REQUIRED")
    lines.append(
        f"- Dispositions: **{summary['srr14']['RESOLVED']} RESOLVED**, "
        f"**{summary['srr14']['RETAIN FAIL-CLOSED']} RETAIN FAIL-CLOSED**, "
        f"**{summary['srr14']['FOUNDER DECISION']} FOUNDER DECISION**"
    )
    lines.append(f"- Editorial fields modified: {', '.join('`'+x+'`' for x in summary['srr14']['modified_ids'])}")
    lines.append("")
    lines.append("| ID | Recommendation | Modified |")
    lines.append("|---|---|---|")
    for r in srr:
        lines.append(
            f"| `{r['additive_id']}` | {r['recommendation']} | {'yes' if r['modified_in_stage5'] else 'no'} |"
        )
    lines.append("")
    lines.append("### Special attention")
    for aid in ["e153", "e308", "e432", "e472e", "e946"]:
        r = next(x for x in srr if x["additive_id"] == aid)
        lines.append(f"#### `{aid}` — {r['recommendation']}")
        lines.append(f"- Question: {r['unresolved_question']}")
        for s in r["sources"]:
            lines.append(f"- Source `{s['id']}`: {s['what']} ({s.get('url','')})")
        lines.append(f"- Notes: {r.get('notes') or '—'}")
        lines.append("")
    lines.append("### Founder approval required (not implemented)")
    for item in summary["founder_approvals_required_before_implementation"]:
        lines.append(
            f"- `{item['additive_id']}.{item['field']}`: `{item['from']}` → `{item['to']}` — {item['reason']}"
        )
    lines.append("")
    lines.append("## Task 3 — AD-02 read-only recommendation correction")
    lines.append("- Runtime `DISCOVERY_DISPLAY_SEQUENCE` **unchanged**.")
    lines.append(
        f"- Removed illustrative / unverified Favourites IDs: "
        f"{', '.join('`'+x+'`' for x in ad02['stage5_corrections']['removed_illustrative_undetected_ids'])}"
    )
    lines.append(
        f"- Verified Favourites barcode `{fav['barcode']}` rendered IDs: "
        f"{', '.join('`'+x+'`' for x in fav['verified_rendered_additive_ids'])}"
    )
    lines.append(
        f"- Proposed Favourites modal order (runtime map ∩ verified detections): "
        f"{', '.join('`'+x+'`' for x in ad02['cadbury_favourites_proposed_modal_order'])}"
    )
    lines.append(
        f"- Discovery candidates dependent on unresolved source questions: "
        f"{', '.join('`'+x+'`' for x in ad02['stage5_corrections']['srr_dependent_candidate_ids']) or 'none'}"
    )
    lines.append("")
    lines.append("## Task 4 — Protected invariants")
    lines.append("- BODY6 identical vs v0.10")
    lines.append("- Evidence authority fields identical vs v0.10")
    lines.append("- source_preparation_profile / source_preparation_copy identical vs v0.10")
    lines.append("- Detection fields untouched")
    lines.append("- W5-AD-02 runtime map untouched")
    lines.append("- Ingestion behaviour unchanged except allowlisting `v0.11-W5AD01-editorial`")
    lines.append("")
    lines.append("## Validation")
    lines.append("- See `TEST_RESULTS.json` (filled by packaging step)")
    lines.append(f"- Source-to-runtime diff: `{diff['changed_ids']}` IDs / `{diff['field_mutations']}` field mutations")
    lines.append("")
    lines.append("## Release-readiness recommendation")
    lines.append(
        "**NOT release-ready.** Accept Stage 5 editorial closure only after founder/ChatGPT review. "
        "Still required before any release path: commit authorisation, e308 profile approval decision, "
        "and separate AD-02 ranking implementation approval. Dual-UAT visual check on v0.11 not yet claimed in this package."
    )
    lines.append("")
    lines.append(f"_Generated {datetime.now(timezone.utc).isoformat()}_")

    md = "\n".join(lines) + "\n"
    (STAGE5 / "W5_AD01_STAGE5_FOUNDER_REVIEW.md").write_text(md, encoding="utf-8")
    (DESKTOP / "W5_AD01_STAGE5_FOUNDER_REVIEW.md").write_text(md, encoding="utf-8")
    print("diff_ids", diff["changed_ids"], "mutations", diff["field_mutations"])
    print("wrote founder review")


if __name__ == "__main__":
    main()
