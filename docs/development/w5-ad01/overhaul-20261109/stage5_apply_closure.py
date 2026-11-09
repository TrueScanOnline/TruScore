"""
W5-AD-01 Stage 5 — bounded editorial + source-quality closure.

- Reviews 24 tile==expanded duplicates (KEEP/IMPROVE expanded only)
- Applies supported SRR editorial corrections only (no evidence/profile mutation)
- Builds v0.11 successor from governed v0.10 (v0.10 hash preserved)
- Regenerates read-only AD-02 recommendation corrections
- Does NOT alter DISCOVERY_DISPLAY_SEQUENCE runtime map
"""
from __future__ import annotations

import hashlib
import json
import shutil
from copy import deepcopy
from datetime import datetime, timezone
from pathlib import Path

import openpyxl

ROOT = Path(r"C:\TrueScan-FoodScanner")
OV = ROOT / "docs/development/w5-ad01/overhaul-20261109"
STAGE5 = OV / "stage5-20261109"
STAGE5.mkdir(parents=True, exist_ok=True)

V10 = ROOT / (
    "docs/development/w5-ad01/"
    "Rveel_S25_Broader_Additive_Catalogue_MVP_Implementation_Asset_W5AD01_editorial_v0_10.xlsx"
)
V10_SHA = "5a8e8fb5be0b4a70832fa8e0d6c46bc42e281ddba3ab29bc06b5c1e8e9dc25b6"
V11 = ROOT / (
    "docs/development/w5-ad01/"
    "Rveel_S25_Broader_Additive_Catalogue_MVP_Implementation_Asset_W5AD01_editorial_v0_11.xlsx"
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


def sentence(text: str) -> str:
    t = (text or "").strip()
    if not t:
        return ""
    if t[-1] not in ".!?":
        t += "."
    return t


def join_unique(parts: list[str]) -> str:
    out: list[str] = []
    seen = set()
    for p in parts:
        s = sentence(p)
        if not s:
            continue
        key = s.lower()
        if key in seen:
            continue
        # skip if already covered by an earlier longer/shorter sentence stem
        if any(key in prev or prev in key for prev in seen):
            # still allow if meaningfully longer addition
            if not any(key.startswith(prev.rstrip(".")) or prev.startswith(key.rstrip(".")) for prev in seen):
                pass
            else:
                continue
        seen.add(key)
        out.append(s)
    return " ".join(out)


# ---------------------------------------------------------------------------
# 1) Duplicate expanded decisions (24)
# ---------------------------------------------------------------------------

DUP_IMPROVE: dict[str, str] = {
    "e133": (
        "Brilliant Blue FCF is a synthetic blue colour used for bright, stable blue shades and for colour blending. "
        "It is manufactured by chemical synthesis and purified to a defined mixture of colouring substances, and is often blended with other colours."
    ),
    "e143": (
        "Fast Green FCF is a synthetic green food colour made to deliver a strong, consistent green shade. "
        "It is manufactured by chemical synthesis and purified to food-additive specifications for adding or restoring green colour."
    ),
    "e172": (
        "Mineral-like iron oxide pigments that range from yellow and red to black depending on the oxide form. "
        "These inorganic iron-oxygen compounds are produced from purified mineral material or by controlled manufacture of defined iron oxides."
    ),
    "e307b": (
        "Mixed tocopherols concentrate is a vitamin-E-rich antioxidant mixture containing several naturally occurring tocopherols, commonly recovered from vegetable-oil processing streams. "
        "It typically contains a mixture of alpha-, beta-, gamma- and delta-tocopherols and is used to slow oxidation in fats and oils."
    ),
    "e335": (
        "Sodium tartrate is a sodium salt of tartaric acid, the fruit acid closely associated with grapes and wine. "
        "It is produced by neutralising purified tartaric acid or recovering and refining tartrate salts from food-processing streams, and is used for acidity control, buffering, stabilisation or raising-agent chemistry depending on the salt."
    ),
    "e336": (
        "Potassium tartrate / potassium acid tartrate is a potassium salt of tartaric acid, the fruit acid closely associated with grapes and wine. "
        "It is produced by neutralising purified tartaric acid or recovering and refining tartrate salts from food-processing streams, and is used for acidity control, buffering, stabilisation or raising-agent chemistry depending on the salt."
    ),
    "e337": (
        "Potassium sodium tartrate is a potassium and sodium salt of tartaric acid, the fruit acid closely associated with grapes and wine. "
        "It is produced by neutralising purified tartaric acid or recovering and refining tartrate salts from food-processing streams, and is used for acidity control, buffering, stabilisation or raising-agent chemistry depending on the salt."
    ),
    "e350": (
        "Sodium malate / sodium hydrogen malate is a sodium salt of malic acid, the tart fruit acid associated with apples and many other fruits. "
        "It is made by neutralising purified malic acid with a sodium-containing base and is used mainly for acidity control, buffering or mineral delivery depending on the salt."
    ),
    "e351": (
        "Potassium malate is a potassium salt of malic acid, the tart fruit acid associated with apples and many other fruits. "
        "It is made by neutralising purified malic acid with a potassium-containing base and is used mainly for acidity control, buffering or mineral delivery depending on the salt."
    ),
    "e352": (
        "Calcium malate is a calcium salt of malic acid, the tart fruit acid associated with apples and many other fruits. "
        "It is made by neutralising purified malic acid with a calcium-containing base and is used mainly for acidity control, buffering or mineral delivery depending on the salt."
    ),
    "e354": (
        "Calcium tartrate is a calcium salt of tartaric acid, the fruit acid closely associated with grapes and wine. "
        "It is produced by neutralising purified tartaric acid or recovering and refining tartrate salts from food-processing streams, and is used for acidity control, buffering, stabilisation or raising-agent chemistry depending on the salt."
    ),
    "e401": (
        "Sodium alginate is the sodium salt of alginic acid, part of a family of gel-forming carbohydrates obtained from brown seaweed. "
        "Alginate is a structural polysaccharide in brown algae; after extraction and purification it is used to thicken, stabilise or form gels depending on the form and food."
    ),
    "e402": (
        "Potassium alginate is the potassium salt of alginic acid, part of a family of gel-forming carbohydrates obtained from brown seaweed. "
        "Alginate is a structural polysaccharide in brown algae; after extraction and purification it is used to thicken, stabilise or form gels depending on the form and food."
    ),
    "e404": (
        "Calcium alginate is the calcium salt of alginic acid, part of a family of gel-forming carbohydrates obtained from brown seaweed. "
        "Alginate is a structural polysaccharide in brown algae; after extraction and purification it is used to thicken, stabilise or form gels depending on the form and food."
    ),
    "e409": (
        "Arabinogalactan, also called larch gum, is a highly branched soluble plant carbohydrate obtained mainly from larch wood. "
        "It is extracted with water then purified, concentrated and dried, and used for stabilising, bulking or fibre-like technological functions depending on the product."
    ),
    "e444": (
        "Sucrose acetate isobutyrate (SAIB) is a dense, oil-soluble sucrose ester used mainly to keep flavour oils evenly suspended in drinks. "
        "It is manufactured by esterifying sucrose with acetic and isobutyric acid derivatives; its density helps stop citrus and other flavour oils floating to the top of a drink."
    ),
    "e507": (
        "Hydrochloric acid is a strong inorganic acid also present in gastric acid. "
        "Food-grade material is manufactured by dissolving highly purified hydrogen chloride gas in water and is used mainly to adjust acidity or pH during food processing."
    ),
    "e510": (
        "Ammonium chloride is an inorganic ammonium salt with a distinctly salty, slightly sharp taste. "
        "It is produced industrially from ammonia and hydrochloric acid or recovered from related chemical processes, and is used for acidity control, dough/yeast processing or characteristic flavour in some foods."
    ),
    "e518": (
        "Magnesium sulphate is the mineral salt also known as Epsom salt. "
        "It is obtained from mineral/brine sources or manufactured and crystallised to food-grade purity, and is used as a mineral salt, firming/coagulating aid or processing ingredient."
    ),
    "e519": (
        "Cupric sulphate is a copper sulphate salt. "
        "It is manufactured from copper-containing raw materials and sulphuric acid, then highly purified, and is used only in specific technological applications where copper chemistry is required."
    ),
    "e551": (
        "Amorphous silicon dioxide is a finely divided form of silica. "
        "It is produced from purified silica/silicate starting materials by precipitation, gel formation or thermal processes, and is used mainly as an anticaking agent and carrier because its porous particles absorb moisture and keep powders free-flowing."
    ),
    "e941": (
        "Nitrogen is an inert gas that makes up about 78% of Earth's atmosphere. "
        "It is separated and purified from air, then compressed or liquefied, and is used to displace oxygen, protect food from oxidation, create packaging atmospheres or provide pressure."
    ),
    "e942": (
        "Nitrous oxide is a gas composed of nitrogen and oxygen, best known in food for pressurising and aerating whipped cream. "
        "It is produced industrially from controlled decomposition of ammonium nitrate and highly purified; it dissolves well in fat, which makes it useful for creating stable whipped-cream foams as well as acting as a propellant."
    ),
    # e962 handled in SRR block (also a duplicate) — listed here as IMPROVE via SRR text
}

# ---------------------------------------------------------------------------
# 2) SRR dispositions + optional editorial patches
# ---------------------------------------------------------------------------

SRR_PATCHES: dict[str, dict] = {
    # Synthetic gamma-tocopherol per FSANZ Schedule 15 — editorial only; profile change needs approval
    "e308": {
        "tile_summary": (
            "Synthetic gamma-tocopherol is a manufactured form of one of the tocopherols in the vitamin E family."
        ),
        "expanded_summary": (
            "Synthetic gamma-tocopherol is a manufactured form of one of the tocopherols in the vitamin E family. "
            "In the Australia New Zealand Food Standards Code it is listed as synthetic gamma-tocopherol (308), distinct from mixed tocopherols concentrate (307b). "
            "It is fat-soluble and is used as an antioxidant in fat-containing foods."
        ),
        "fact_1_label": "Listing",
        "fact_1_copy": "FSANZ Schedule 15 lists 308 as synthetic gamma-tocopherol, separate from mixed tocopherols concentrate (307b).",
        "fact_2_label": "Food role",
        "fact_2_copy": "Used as an antioxidant in fat-containing foods.",
        "fact_3_label": "Decode note",
        "fact_3_copy": "The additive number alone does not mean the ingredient was extracted as a mixed natural tocopherol concentrate.",
    },
    "e221": {
        "expanded_summary": (
            "Sodium sulphite is a sulphite salt used to preserve foods and control browning. "
            "In food it can release sulphur dioxide-related preserving species. "
            "In Australia and New Zealand, added sulphites at 10 mg/kg or more must be declared, which helps people who need to avoid sulphites."
        ),
        "fact_3_label": "Label cue",
        "fact_3_copy": "Added sulphites at 10 mg/kg or more must be declared on packaged foods in Australia and New Zealand.",
    },
    "e225": {
        "expanded_summary": (
            "Potassium sulphite is a potassium salt in the sulphite preservative family, chemically related to sulphur dioxide and other sulphites. "
            "It is used for preservation and as an antioxidant. "
            "In Australia and New Zealand, added sulphites at 10 mg/kg or more must be declared, which helps people who need to avoid sulphites."
        ),
        "fact_3_label": "Label cue",
        "fact_3_copy": "Added sulphites at 10 mg/kg or more must be declared on packaged foods in Australia and New Zealand.",
    },
    "e381": {
        "expanded_summary": (
            "Ferric ammonium citrate is an iron-containing citrate complex rather than a single simple salt. "
            "It combines iron with citrate and ammonium in a water-compatible form. "
            "JECFA describes functional uses as a nutrient/dietary supplement and, for the green salt, as an anticaking agent for sodium chloride."
        ),
        "fact_2_label": "Food role",
        "fact_2_copy": "Used as an iron nutrient/dietary supplement and, in some forms, as an anticaking agent for salt.",
    },
    "e946": {
        "fact_1_label": "Food role",
        "fact_1_copy": "Used as a specialised propellant or aerating agent in foamed or sprayed food applications.",
        "expanded_summary": (
            "Octafluorocyclobutane is a manufactured gas whose molecules contain only carbon and fluorine. "
            "Its name describes a ring of four carbon atoms (cyclobutane) with eight fluorine atoms attached. "
            "Authoritative food-additive specifications describe it as a propellant and aerating agent for foamed or sprayed foods."
        ),
    },
    "e962": {
        "expanded_summary": (
            "Aspartame-acesulphame salt is a crystalline compound containing the two sweeteners aspartame and acesulphame in a fixed salt-like combination. "
            "It provides a blended sweetness profile without adding the two sweeteners separately. "
            "Because it contains aspartame-derived material, foods that contain it require a phenylalanine advisory statement under the Australia New Zealand Food Standards Code."
        ),
        "fact_3_label": "Label cue",
        "fact_3_copy": "Foods that contain aspartame-acesulphame salt require an advisory statement that the food contains phenylalanine.",
    },
}


def build_srr_register(cat_by: dict) -> list[dict]:
    """Full SRR review records with sources and dispositions."""
    records = []

    def base(aid: str, **kw):
        e = cat_by[aid]
        rec = {
            "additive_id": aid,
            "name": e.get("consumer_display_name") or e.get("entry_title"),
            "unresolved_question": kw["question"],
            "sources": kw.get("sources", []),
            "verified_facts": kw.get("verified_facts", []),
            "unsupported_possibilities": kw.get("unsupported_possibilities", []),
            "modified_in_stage5": aid in SRR_PATCHES,
            "fields_changed": sorted(SRR_PATCHES.get(aid, {}).keys()),
            "unsupported_claim_introduced": False,
            "recommendation": kw["recommendation"],
            "classification": kw.get("classification", "A_EXISTING_LIMITATION_CARRIED_FORWARD"),
            "notes": kw.get("notes", ""),
            "before": {
                "tile_summary": e.get("tile_summary"),
                "expanded_summary": e.get("expanded_summary"),
                "fact_1_copy": e.get("fact_1_copy"),
                "fact_2_copy": e.get("fact_2_copy"),
                "fact_3_copy": e.get("fact_3_copy"),
                "source_preparation_profile": e.get("source_preparation_profile"),
            },
        }
        return rec

    records.append(
        base(
            "e153",
            question='Does Schedule 8 title "Carbon blacks or Vegetable carbon" allow non-vegetable industrial carbon black, conflicting with plant-origin tile copy?',
            sources=[
                {
                    "id": "FSANZ_S8",
                    "what": 'Official Schedule 8 name is "Carbon blacks or Vegetable carbon" (153).',
                    "url": "https://www.legislation.gov.au/F2015L00478",
                },
                {
                    "id": "JECFA_153",
                    "what": 'JECFA additive is "Vegetable Carbon"; synonyms include "Vegetable black" and "Carbon black (vegetable sources)"; produced by carbonising vegetable material.',
                    "url": "https://apps.who.int/food-additives-contaminants-jecfa-database/Home/Chemical/2323",
                },
                {
                    "id": "FSANZ_consumer_colour",
                    "what": "FSANZ consumer materials refer to vegetable carbon (carbon black), INS 153, as the colour assessed/discussed.",
                    "url": "https://www.foodstandards.gov.au/consumer/additives/colours-food-additives",
                },
            ],
            verified_facts=[
                "AU Schedule 8 naming includes the synonym pair Carbon blacks / Vegetable carbon for code 153.",
                "JECFA identity for INS 153 is vegetable carbon from vegetable sources, not furnace carbon black generally.",
            ],
            unsupported_possibilities=[
                "Treating Schedule 8 'Carbon blacks' as authorising petroleum/furnace carbon black unrelated to vegetable carbonisation.",
            ],
            recommendation="RESOLVED",
            classification="C_PURELY_EDITORIAL_OR_NAMING_CLARIFIED",
            notes="Existing tile/expanded correctly describe vegetable carbon. No copy change. Evidence fields untouched.",
        )
    )
    records.append(
        base(
            "e221",
            question="Can a sulphite-sensitivity / declaration cue be added with substance-family authority?",
            sources=[
                {
                    "id": "FSANZ_S9",
                    "what": "Schedule 9 requires declaration of added sulphites at 10 mg/kg or more.",
                    "url": "https://www.legislation.gov.au/F2015L00479",
                },
                {
                    "id": "FSANZ_sulphites",
                    "what": "FSANZ states some sulphite-sensitive people may react; labelling at ≥10 mg/kg helps avoidance.",
                    "url": "https://www.foodstandards.gov.au/consumer/additives/sulphite",
                },
            ],
            verified_facts=[
                "221 is a sulphite salt in the preservative family.",
                "AU/NZ mandatory sulphite declaration threshold is 10 mg/kg added sulphites.",
            ],
            unsupported_possibilities=["Product-specific sensitivity diagnosis or prevalence claims."],
            recommendation="RESOLVED",
            classification="B_SUPPORTED_EDITORIAL_CORRECTION",
            notes="Added restrained label cue only; no medical overclaim.",
        )
    )
    records.append(
        base(
            "e225",
            question="Can a sulphite-sensitivity / declaration cue be added with substance-family authority?",
            sources=[
                {
                    "id": "FSANZ_S9",
                    "what": "Schedule 9 requires declaration of added sulphites at 10 mg/kg or more.",
                    "url": "https://www.legislation.gov.au/F2015L00479",
                },
                {
                    "id": "FSANZ_sulphites",
                    "what": "FSANZ sulphite consumer page supports sensitivity/avoidance framing tied to labelling.",
                    "url": "https://www.foodstandards.gov.au/consumer/additives/sulphite",
                },
            ],
            verified_facts=[
                "225 is a sulphite salt.",
                "AU/NZ mandatory sulphite declaration threshold is 10 mg/kg added sulphites.",
            ],
            unsupported_possibilities=["Product-specific sensitivity diagnosis."],
            recommendation="RESOLVED",
            classification="B_SUPPORTED_EDITORIAL_CORRECTION",
        )
    )
    records.append(
        base(
            "e308",
            question="Is 308 natural/plant-extracted gamma-tocopherol or synthetic gamma-tocopherol under FSANZ/JECFA?",
            sources=[
                {
                    "id": "FSANZ_S15",
                    "what": "Schedule 15 lists 308 as Synthetic gamma-tocopherol (distinct from 307b Tocopherols concentrate, mixed).",
                    "url": "https://www.legislation.gov.au/Details/F2021C00607",
                },
                {
                    "id": "JECFA_307b",
                    "what": "JECFA mixed tocopherol concentrate is INS 307b (not 308).",
                    "url": "https://apps.who.int/food-additives-contaminants-jecfa-database/Home/Chemical/4871",
                },
            ],
            verified_facts=[
                "FSANZ Schedule 15 identity for 308 is synthetic gamma-tocopherol.",
                "307b is the mixed concentrate from vegetable-oil streams.",
            ],
            unsupported_possibilities=[
                "Leaving PLANT_EXTRACT profile unchanged as if it were authoritative identity (profile is now inconsistent with corrected editorial copy).",
            ],
            recommendation="RESOLVED",
            classification="B_SUPPORTED_EDITORIAL_CORRECTION",
            notes=(
                "Editorial fields corrected to synthetic listing. "
                "FOUNDER APPROVAL REQUIRED before changing source_preparation_profile from PLANT_EXTRACT "
                "to CHEMICAL_SYNTHESIS (governed source field)."
            ),
        )
    )
    records.append(
        base(
            "e357",
            question="May commercial potassium adipate be described as petrochemical-derived?",
            sources=[
                {
                    "id": "CATALOGUE_E355",
                    "what": "Sibling entry e355 (adipic acid) already states petrochemical-derived intermediates in governed source_preparation_copy.",
                    "url": "internal:catalogue_315.json#e355",
                }
            ],
            verified_facts=[
                "Potassium adipate is a salt of adipic acid.",
                "e355 already carries a petrochemical manufacturing statement for adipic acid.",
            ],
            unsupported_possibilities=[
                "Asserting petrochemical origin on e357 without a substance-specific source_preparation statement on this entry.",
            ],
            recommendation="RETAIN FAIL-CLOSED",
            classification="A_EXISTING_LIMITATION_CARRIED_FORWARD",
            notes="Do not invent petro claim on e357. Optional founder decision: align e357 SP with e355 parent-acid manufacturing note.",
        )
    )
    records.append(
        base(
            "e381",
            question="What concrete food function does ferric ammonium citrate have?",
            sources=[
                {
                    "id": "JECFA_381",
                    "what": "Functional uses: nutrient/dietary supplement (brown salt); nutrient/dietary supplement and anticaking agent for sodium chloride (green salt).",
                    "url": "https://www.fao.org/fileadmin/user_upload/jecfa_additives/docs/Monograph1/Additive-189.pdf",
                }
            ],
            verified_facts=["JECFA functional uses include nutrient/dietary supplement and anticaking for salt."],
            unsupported_possibilities=["Claiming a single exclusive modern AU food use without Schedule 15 context."],
            recommendation="RESOLVED",
            classification="B_SUPPORTED_EDITORIAL_CORRECTION",
        )
    )
    records.append(
        base(
            "e432",
            question="Can fatty-acid feedstock be pinned to plant vs animal for Polysorbate 20?",
            sources=[
                {
                    "id": "JECFA_432",
                    "what": "Definition uses edible commercial lauric acid; does not pin botanical vs animal origin.",
                    "url": "https://www.fao.org/fileadmin/user_upload/jecfa_additives/docs/Monograph1/Additive-320.pdf",
                },
                {
                    "id": "USP_polysorbate20",
                    "what": "USP notes fatty acids may be of vegetable, animal, or synthetic origin.",
                    "url": "https://doi.usp.org/USPNF/USPNF_M66800_04_01.html",
                },
            ],
            verified_facts=[
                "Origin is indeterminate from the additive code/specification alone.",
                "Existing fact_2 hedge (plant or animal) is consistent with primary specs.",
            ],
            unsupported_possibilities=["Declaring vegan/plant-only or animal-only from the E-number."],
            recommendation="RESOLVED",
            classification="A_EXISTING_LIMITATION_CARRIED_FORWARD",
            notes="Keep fail-closed hedge. No wording change required.",
        )
    )
    records.append(
        base(
            "e472e",
            question="Can plant vs animal fatty-acid sources for DATEM-type 472e be asserted product-specifically?",
            sources=[
                {
                    "id": "ENTRY_SP",
                    "what": "Existing source_preparation_copy already states fatty-acid sources can be plant or animal.",
                    "url": "internal:catalogue_315.json#e472e",
                }
            ],
            verified_facts=["Variable fatty-acid feedstock is already disclosed in governed SP copy."],
            unsupported_possibilities=["Product-specific animal/plant determination from code alone."],
            recommendation="RESOLVED",
            classification="A_EXISTING_LIMITATION_CARRIED_FORWARD",
            notes="Retain existing fail-closed disclosure. No change.",
        )
    )
    records.append(
        base(
            "e627",
            question="Which organisms/tissues supply commercial guanylate starting material?",
            sources=[
                {
                    "id": "ENTRY_SP",
                    "what": "SP states microbial fermentation or enzymatic processing of biological nucleotide material — organism not named.",
                    "url": "internal:catalogue_315.json#e627",
                }
            ],
            verified_facts=["Commercial production commonly involves fermentation/enzymatic routes."],
            unsupported_possibilities=["Naming specific organisms or dietary tissues without a substance-specific primary source in-packet."],
            recommendation="RETAIN FAIL-CLOSED",
            classification="A_EXISTING_LIMITATION_CARRIED_FORWARD",
        )
    )
    records.append(
        base(
            "e631",
            question="Which organisms/tissues supply commercial inosinate starting material?",
            sources=[
                {
                    "id": "ENTRY_SP",
                    "what": "SP states microbial fermentation or enzymatic processing of biological nucleotide material — organism not named.",
                    "url": "internal:catalogue_315.json#e631",
                }
            ],
            verified_facts=["Commercial production commonly involves fermentation/enzymatic routes."],
            unsupported_possibilities=["Naming meat/fish tissues or specific microbes without in-packet primary support."],
            recommendation="RETAIN FAIL-CLOSED",
            classification="A_EXISTING_LIMITATION_CARRIED_FORWARD",
        )
    )
    records.append(
        base(
            "e920",
            question="Can historical animal/hair routes or modern fermentation be asserted as the product route?",
            sources=[
                {
                    "id": "ENTRY_SP",
                    "what": "VARIABLE profile; SP describes modern fermentation/controlled routes and fact_3 already fail-closed.",
                    "url": "internal:catalogue_315.json#e920",
                }
            ],
            verified_facts=["Additive number does not disclose manufacturing source."],
            unsupported_possibilities=["Asserting hair/feather or exclusively fermented origin for a scanned product."],
            recommendation="RETAIN FAIL-CLOSED",
            classification="A_EXISTING_LIMITATION_CARRIED_FORWARD",
        )
    )
    records.append(
        base(
            "e943b",
            question="Can petroleum or natural-gas origin of isobutane be asserted beyond hydrocarbon processing?",
            sources=[
                {
                    "id": "ENTRY_SP",
                    "what": "SP: separated or manufactured from hydrocarbon processing streams and purified.",
                    "url": "internal:catalogue_315.json#e943b",
                }
            ],
            verified_facts=["Isobutane is a hydrocarbon food gas/propellant."],
            unsupported_possibilities=["Petroleum-specific origin claim without a substance-specific primary citation in-packet."],
            recommendation="RETAIN FAIL-CLOSED",
            classification="A_EXISTING_LIMITATION_CARRIED_FORWARD",
        )
    )
    records.append(
        base(
            "e946",
            question="Is propellant/packaging-gas use supported for octafluorocyclobutane?",
            sources=[
                {
                    "id": "US_21CFR_173.360",
                    "what": "FDA permits octafluorocyclobutane as propellant and aerating agent in foamed or sprayed food products.",
                    "url": "https://www.law.cornell.edu/cfr/text/21/173.360",
                },
                {
                    "id": "FSANZ_S8",
                    "what": "Schedule 8 lists Octafluorocyclobutane (946).",
                    "url": "https://www.legislation.gov.au/F2015L00478",
                },
            ],
            verified_facts=["Propellant/aerating use is supported by 21 CFR 173.360."],
            unsupported_possibilities=["Broad 'packaging gas' claim as if interchangeable with nitrogen-style MAP without AU-specific packaging-gas authority in-packet."],
            recommendation="RESOLVED",
            classification="B_SUPPORTED_EDITORIAL_CORRECTION",
            notes="Corrected fact_1/expanded to propellant or aerating agent; removed unsupported packaging-gas framing.",
        )
    )
    records.append(
        base(
            "e962",
            question="Can phenylalanine/PKU relevance be stated for aspartame-acesulphame salt?",
            sources=[
                {
                    "id": "FSANZ_S9_item4",
                    "what": "Mandatory advisory statement for foods containing aspartame or aspartame-acesulphame salt: the food contains phenylalanine.",
                    "url": "https://www.legislation.gov.au/F2015L00479",
                }
            ],
            verified_facts=[
                "962 contains aspartame-derived material.",
                "AU/NZ Code requires phenylalanine advisory for foods containing aspartame-acesulphame salt.",
            ],
            unsupported_possibilities=["Clinical PKU advice beyond the mandated advisory statement."],
            recommendation="RESOLVED",
            classification="B_SUPPORTED_EDITORIAL_CORRECTION",
        )
    )
    return records


def build_dup_register(cat_by: dict) -> list[dict]:
    dups = sorted(DUP_IMPROVE) + (["e962"] if "e962" not in DUP_IMPROVE else [])
    # ensure all 24
    all_dups = [
        "e133",
        "e143",
        "e172",
        "e307b",
        "e335",
        "e336",
        "e337",
        "e350",
        "e351",
        "e352",
        "e354",
        "e401",
        "e402",
        "e404",
        "e409",
        "e444",
        "e507",
        "e510",
        "e518",
        "e519",
        "e551",
        "e941",
        "e942",
        "e962",
    ]
    out = []
    for aid in all_dups:
        e = cat_by[aid]
        tile = (e.get("tile_summary") or "").strip()
        exp = (e.get("expanded_summary") or "").strip()
        assert tile == exp, f"{aid} not duplicate at baseline"
        if aid == "e962":
            new_exp = SRR_PATCHES["e962"]["expanded_summary"]
            decision = "IMPROVE"
            reason = "SRR-supported phenylalanine advisory + non-duplicate expanded from existing facts."
        else:
            new_exp = DUP_IMPROVE[aid]
            decision = "IMPROVE"
            reason = "Expanded using existing source_preparation_copy and/or fact fields already on the entry."
        out.append(
            {
                "additive_id": aid,
                "name": e.get("consumer_display_name"),
                "decision": decision,
                "reason": reason,
                "before_tile": tile,
                "before_expanded": exp,
                "after_tile": tile,
                "after_expanded": new_exp,
                "sources_used": [
                    x
                    for x in [
                        "source_preparation_copy" if e.get("source_preparation_copy") else None,
                        "fact_1_copy" if e.get("fact_1_copy") else None,
                        "fact_2_copy" if e.get("fact_2_copy") else None,
                        "fact_3_copy" if e.get("fact_3_copy") else None,
                    ]
                    if x
                ],
            }
        )
    return out


def apply_workbook(patches: dict[str, dict]) -> str:
    if sha256(V10) != V10_SHA:
        raise SystemExit(f"Refuse: v0.10 SHA mismatch {sha256(V10)}")
    if V11.exists():
        V11.unlink()
    shutil.copy2(V10, V11)
    wb = openpyxl.load_workbook(V11)
    ws = wb["Catalogue_315"]
    headers = [c.value for c in next(ws.iter_rows(min_row=1, max_row=1))]
    col = {h: i + 1 for i, h in enumerate(headers) if h}
    id_col = col["additive_id"]
    applied = 0
    for row in range(2, ws.max_row + 1):
        aid = ws.cell(row, id_col).value
        if aid not in patches:
            continue
        for field, value in patches[aid].items():
            if field not in EDITORIAL_FIELDS:
                raise SystemExit(f"Non-editorial field blocked: {aid}.{field}")
            ws.cell(row, col[field]).value = value
        applied += 1
    wb.save(V11)
    return sha256(V11), applied


def correct_ad02(cat_ids: set[str], srr_open: set[str]) -> dict:
    src = json.loads((OV / "W5_AD02_discovery_ordering_recommendation_READONLY.json").read_text(encoding="utf-8"))
    fav = json.loads((OV / "stage5_favourites_verified.json").read_text(encoding="utf-8"))
    verified_fav = fav["verified_rendered_additive_ids"]

    # Reconcile proposed IDs
    full = []
    removed = []
    for row in src["proposed_full_ranked_list"]:
        aid = row["additive_id"]
        if aid not in cat_ids:
            removed.append({"additive_id": aid, "reason": "not_in_catalogue_315"})
            continue
        row = deepcopy(row)
        row["verified_in_catalogue_315"] = True
        row["discovery_confidence"] = (
            "DEPENDENT_ON_UNRESOLVED_SOURCE_QUESTION"
            if aid in srr_open
            else "VERIFIED_CANDIDATE"
        )
        full.append(row)

    t1t2 = {}
    for aid, seq in src["proposed_t1_t2_sequence"].items():
        if aid in cat_ids:
            t1t2[aid] = seq
        else:
            removed.append({"additive_id": aid, "reason": "t1t2_not_in_catalogue_315"})

    # Regenerated Favourites example from verified barcode + rendered IDs only
    # Proposed modal order = current runtime discovery order among verified detections, then remainder occurrence-style
    runtime_seq = src["current_runtime_sequence"]
    fav_proposed = sorted(
        verified_fav,
        key=lambda a: (runtime_seq.get(a, 10_000), verified_fav.index(a)),
    )

    out = {
        "note": (
            "READ-ONLY Stage 5 corrected recommendation. "
            "Do not implement without founder approval. "
            "Current DISCOVERY_DISPLAY_SEQUENCE unchanged."
        ),
        "stage5_corrections": {
            "removed_unsupported_catalogue_ids": removed,
            "favourites_barcode": fav["barcode"],
            "favourites_product": fav["product"],
            "favourites_evidence": "docs/uat/w5-ad01-stage4c-batch-a-final-20261109/favpack_modal*.xml",
            "removed_illustrative_undetected_ids": sorted(
                set(src.get("cadbury_favourites_proposed_modal_order", [])) - set(verified_fav)
            ),
            "srr_dependent_candidate_ids": sorted(srr_open),
        },
        "current_runtime_sequence": src["current_runtime_sequence"],
        "proposed_t1_t2_sequence": t1t2,
        "proposed_full_ranked_list": full,
        "cadbury_favourites_verified_detections": verified_fav,
        "cadbury_favourites_proposed_modal_order": fav_proposed,
        "policy": src.get("policy"),
        "runtime_ranking_implemented": False,
    }
    path = STAGE5 / "W5_AD02_discovery_ordering_recommendation_READONLY_STAGE5.json"
    path.write_text(json.dumps(out, indent=2, ensure_ascii=False), encoding="utf-8")
    # Also replace the overhaul pointer file with corrected Stage 5 version (read-only artefact)
    (OV / "W5_AD02_discovery_ordering_recommendation_READONLY.json").write_text(
        json.dumps(out, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    return out


def main():
    cat = json.loads((ROOT / "src/s25/assets/catalogue_315.json").read_text(encoding="utf-8"))
    cat_by = {e["additive_id"]: e for e in cat}

    dup_reg = build_dup_register(cat_by)
    srr_reg = build_srr_register(cat_by)

    # Compose patches: dup expanded + SRR patches (SRR wins on overlap for e962)
    patches: dict[str, dict] = {}
    for d in dup_reg:
        aid = d["additive_id"]
        patches[aid] = {"expanded_summary": d["after_expanded"]}
    for aid, fields in SRR_PATCHES.items():
        patches.setdefault(aid, {}).update(fields)

    # Capture after texts into registers
    for d in dup_reg:
        if d["additive_id"] in patches and "expanded_summary" in patches[d["additive_id"]]:
            d["after_expanded"] = patches[d["additive_id"]]["expanded_summary"]
    for r in srr_reg:
        aid = r["additive_id"]
        after = deepcopy(r["before"])
        for k, v in patches.get(aid, {}).items():
            after[k] = v
        r["after"] = after

    v11_sha, applied = apply_workbook(patches)

    # SRR still open for AD-02 dependency marking = RETAIN FAIL-CLOSED + FOUNDER DECISION items
    # Also mark e308 profile issue as dependent even though editorial RESOLVED
    srr_open = {
        r["additive_id"]
        for r in srr_reg
        if r["recommendation"] in ("RETAIN FAIL-CLOSED", "FOUNDER DECISION")
        or "FOUNDER APPROVAL REQUIRED" in (r.get("notes") or "")
    }

    ad02 = correct_ad02({e["additive_id"] for e in cat}, srr_open)

    summary = {
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "baseline": "v0.10-W5AD01-editorial",
        "baseline_workbook_sha256": V10_SHA,
        "successor": "v0.11-W5AD01-editorial",
        "successor_workbook_path": str(V11),
        "successor_workbook_sha256": v11_sha,
        "ids_patched": sorted(patches),
        "ids_patched_count": applied,
        "dup24": {
            "count": len(dup_reg),
            "improve": sum(1 for d in dup_reg if d["decision"] == "IMPROVE"),
            "keep": sum(1 for d in dup_reg if d["decision"] == "KEEP"),
        },
        "srr14": {
            "RESOLVED": sum(1 for r in srr_reg if r["recommendation"] == "RESOLVED"),
            "RETAIN FAIL-CLOSED": sum(1 for r in srr_reg if r["recommendation"] == "RETAIN FAIL-CLOSED"),
            "FOUNDER DECISION": sum(1 for r in srr_reg if r["recommendation"] == "FOUNDER DECISION"),
            "modified_ids": sorted(SRR_PATCHES),
        },
        "founder_approvals_required_before_implementation": [
            {
                "additive_id": "e308",
                "field": "source_preparation_profile",
                "from": "PLANT_EXTRACT",
                "to": "CHEMICAL_SYNTHESIS",
                "reason": "FSANZ Schedule 15 lists 308 as Synthetic gamma-tocopherol; editorial copy corrected but governed profile not changed.",
            }
        ],
        "ad02_removed": ad02["stage5_corrections"]["removed_unsupported_catalogue_ids"],
        "favourites_verified_ids": ad02["cadbury_favourites_verified_detections"],
        "runtime_discovery_map_altered": False,
    }

    (STAGE5 / "DUP24_DECISIONS.json").write_text(json.dumps(dup_reg, indent=2, ensure_ascii=False), encoding="utf-8")
    (STAGE5 / "SRR14_DISPOSITIONS.json").write_text(json.dumps(srr_reg, indent=2, ensure_ascii=False), encoding="utf-8")
    (STAGE5 / "STAGE5_PATCHES.json").write_text(json.dumps(patches, indent=2, ensure_ascii=False), encoding="utf-8")
    (STAGE5 / "STAGE5_SUMMARY.json").write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
