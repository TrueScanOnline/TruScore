# W5-AD-02 — Final discovery ranking review (CORRECTED)

**STATUS: STOP FOR FOUNDER / CHATGPT REVIEW**
**READ-ONLY DOCUMENTATION CORRECTION. NO RUNTIME IMPLEMENTATION.**

Successor to the 10 Nov 2026 ranking review after bounded reconciliation.
Historical provenance retained conceptually as the accepted-in-principle 24/18/23/24 structure; this file corrects documented discrepancies (notably E308) and records reachability findings.

## Baseline

| Item | Value |
|---|---|
| Branch | `experiment/w5-ad02-discovery-order-20261109` |
| W5-AD-01 checkpoint | `453e7ba2d678e8ddbd1e20061a642d814952fe1d` |
| Catalogue | `v0.12-W5AD01-editorial` |
| Runtime AD-02 map | unchanged pilot 9 IDs (not modified by this reconciliation) |

## Classification (unchanged structure)

| Bucket | Count | Notes |
|---|---:|---|
| PROMOTE_CORE (editorial) | 24 | Includes 2 inactive nocode IDs |
| EFFECTIVE_CORE (runtime proposal) | **22** | Editorial CORE minus unreachable nocodes |
| PROMOTE_EXTENDED | 18 | Not added to map under CORE-only option |
| HOLD | 23 | Includes demoted VARIABLE pilot IDs |
| EXCLUDE | 24 | Family redundancy |

## Corrected E308 assessment

| Field | Corrected value |
|---|---|
| Additive | `e308` / γ-Tocopherol |
| Identity | Synthetic gamma-tocopherol |
| Profile | **CHEMICAL_SYNTHESIS** |
| Contrast | Distinct from `e307b` mixed tocopherols concentrate (**PLANT_EXTRACT**) |
| Decision | PROMOTE_EXTENDED (not CORE) |
| Do not say | PLANT_EXTRACT; product-specific feedstock from the number alone |

Outdated `PLANT_EXTRACT` / unresolved-source wording remains in historical Stage-5 READ-ONLY JSON provenance files and must not be re-used for implementation.

## Effective CORE sequence (22)

| Seq | ID | Discovery | Profile |
|---:|---|---|---|
| 1 | `e120` | Insect-derived red colour (cochineal / carmine) | ANIMAL_DERIVED |
| 2 | `e905b` | Petroleum-refined petrolatum / petroleum jelly (profile PETROLEUM_REFINED) | PETROLEUM_REFINED |
| 3 | `e904` | Lac-insect resin (shellac) | ANIMAL_DERIVED |
| 4 | `e901` | Honeybee wax (beeswax) | ANIMAL_DERIVED |
| 5 | `e542` | Animal bone phosphate | ANIMAL_DERIVED |
| 6 | `e1105` | Egg-white lysozyme enzyme | BIOLOGICAL_ENZYME |
| 7 | `e1101` | Named plant proteases — papain (papaya), bromelain (pineapple), ficin (fig latex); other protease preparations may be microbial | BIOLOGICAL_ENZYME |
| 8 | `e957` | Katemfe-fruit sweet protein (thaumatin) | PLANT_EXTRACT |
| 9 | `e476` | Castor-oil building blocks in chocolate emulsifier (PGPR) | MODIFIED_NATURAL |
| 10 | `e445` | Pine wood-rosin esters | MODIFIED_NATURAL |
| 11 | `e1522` | Wood-pulping lignin by-product (calcium lignosulphonate) | MODIFIED_NATURAL |
| 12 | `e355` | Manufactured food acid via chemical oxidation of petrochemical-derived intermediates (CHEMICAL_SYNTHESIS — not PETROLEUM_REFINED) | CHEMICAL_SYNTHESIS |
| 13 | `e943a` | Butane food propellant purified from natural-gas and petroleum-refining streams (FOOD_GAS) | FOOD_GAS |
| 14 | `e944` | Propane food propellant purified from natural-gas and petroleum-refining streams (FOOD_GAS) | FOOD_GAS |
| 15 | `e955` | Table sugar chemically transformed into sucralose | CHEMICAL_SYNTHESIS |
| 16 | `e123` | Synthetic “Amaranth” colour — not extracted from the amaranth plant | CHEMICAL_SYNTHESIS |
| 17 | `e141` | Plant chlorophyll with copper swapped for magnesium | MODIFIED_NATURAL |
| 18 | `e415` | Bacterial fermentation “gum” (xanthan) | FERMENTATION |
| 19 | `e150c` | Industrial caramel colour is not kitchen caramel | CONTROLLED_PROCESS |
| 20 | `e330` | Citric acid commonly fermented from sugar, not citrus juice | FERMENTATION |
| 21 | `e334` | Tartaric acid often recovered from wine-making streams | PLANT_EXTRACT |
| 22 | `e300` | Vitamin C commonly made from glucose, not fruit extract | FERMENTATION |

## Inactive CORE candidates (recommendation retained)

| ID | Status | Evidence summary |
|---|---|---|
| `s8-nocode-002` | INACTIVE_CORE_CANDIDATE | No schedule8 code; `code_detection_enabled=false`; bare name does not detect; name+declared-class context can detect/render; no normal tag path |
| `s8-nocode-004` | INACTIVE_CORE_CANDIDATE | Same pattern |

## Full 89-candidate corrected snapshot

| # | ID | Band | Profile | Decision | Runtime status | Best verified discovery |
|---:|---|---|---|---|---|---|
| 1 | `e1101` | T1 | BIOLOGICAL_ENZYME | PROMOTE_CORE | EFFECTIVE_CORE | Named plant proteases — papain (papaya), bromelain (pineapple), ficin (fig latex); other protease preparations may be microbial |
| 2 | `e1105` | T1 | BIOLOGICAL_ENZYME | PROMOTE_CORE | EFFECTIVE_CORE | Egg-white lysozyme enzyme |
| 3 | `e120` | T1 | ANIMAL_DERIVED | PROMOTE_CORE | EFFECTIVE_CORE | Insect-derived red colour (cochineal / carmine) |
| 4 | `e1522` | T1 | MODIFIED_NATURAL | PROMOTE_CORE | EFFECTIVE_CORE | Wood-pulping lignin by-product (calcium lignosulphonate) |
| 5 | `e355` | T1 | CHEMICAL_SYNTHESIS | PROMOTE_CORE | EFFECTIVE_CORE | Manufactured food acid via chemical oxidation of petrochemical-derived intermediates (CHEMICAL_SYNTHESIS — not PETROLEUM_REFINED) |
| 6 | `e445` | T1 | MODIFIED_NATURAL | PROMOTE_CORE | EFFECTIVE_CORE | Pine wood-rosin esters |
| 7 | `e460` | T1 | MODIFIED_NATURAL | PROMOTE_EXTENDED | EXTENDED_OPTIONAL | Microcrystalline and powdered cellulose are purified forms of cellulose, the structural fibre that makes up plant cell walls. |
| 8 | `e476` | T1 | MODIFIED_NATURAL | PROMOTE_CORE | EFFECTIVE_CORE | Castor-oil building blocks in chocolate emulsifier (PGPR) |
| 9 | `e542` | T1 | ANIMAL_DERIVED | PROMOTE_CORE | EFFECTIVE_CORE | Animal bone phosphate |
| 10 | `e901` | T1 | ANIMAL_DERIVED | PROMOTE_CORE | EFFECTIVE_CORE | Honeybee wax (beeswax) |
| 11 | `e904` | T1 | ANIMAL_DERIVED | PROMOTE_CORE | EFFECTIVE_CORE | Lac-insect resin (shellac) |
| 12 | `e905b` | T1 | PETROLEUM_REFINED | PROMOTE_CORE | EFFECTIVE_CORE | Petroleum-refined petrolatum / petroleum jelly (profile PETROLEUM_REFINED) |
| 13 | `e943a` | T1 | FOOD_GAS | PROMOTE_CORE | EFFECTIVE_CORE | Butane food propellant purified from natural-gas and petroleum-refining streams (FOOD_GAS) |
| 14 | `e944` | T1 | FOOD_GAS | PROMOTE_CORE | EFFECTIVE_CORE | Propane food propellant purified from natural-gas and petroleum-refining streams (FOOD_GAS) |
| 15 | `e957` | T1 | PLANT_EXTRACT | PROMOTE_CORE | EFFECTIVE_CORE | Katemfe-fruit sweet protein (thaumatin) |
| 16 | `s8-nocode-002` | T1 | MODIFIED_NATURAL | PROMOTE_CORE | INACTIVE_CORE_CANDIDATE | Mushroom (Agaricus bisporus) chitosan rather than crustacean chitosan |
| 17 | `s8-nocode-004` | T1 | FERMENTATION | PROMOTE_CORE | INACTIVE_CORE_CANDIDATE | Sweet osmanthus ear glycolipids from jelly-mushroom fermentation |
| 18 | `e101` | T2 | FERMENTATION | PROMOTE_EXTENDED | EXTENDED_OPTIONAL | Riboflavin is vitamin B2 — a water-soluble vitamin that can also be used as a yellow food colour. |
| 19 | `e1100` | T2 | BIOLOGICAL_ENZYME | PROMOTE_EXTENDED | EXTENDED_OPTIONAL | Alpha-amylase is an enzyme that breaks starch into smaller sugars and dextrins. |
| 20 | `e123` | T2 | CHEMICAL_SYNTHESIS | PROMOTE_CORE | EFFECTIVE_CORE | Synthetic “Amaranth” colour — not extracted from the amaranth plant |
| 21 | `e132` | T2 | CHEMICAL_SYNTHESIS | PROMOTE_EXTENDED | EXTENDED_OPTIONAL | Indigotine, also called indigo carmine, is a manufactured blue food colour related in structure to indigo dye, but it is not the traditional plant-extracted dye. |
| 22 | `e1400` | T2 | MODIFIED_NATURAL | EXCLUDE | EXCLUDE | Dextrin / roasted starch is ordinary food starch changed by dry heat, which breaks and rearranges some of its long chains. |
| 23 | `e1401` | T2 | MODIFIED_NATURAL | EXCLUDE | EXCLUDE | Acid-treated starch is starch whose long chains have been partially broken down by acid treatment. |
| 24 | `e1404` | T2 | MODIFIED_NATURAL | EXCLUDE | EXCLUDE | Ordinary food starch deliberately oxidised so processing behaviour changes (family exemplar only — EXCLUDE from promotion). |
| 25 | `e1405` | T2 | MODIFIED_NATURAL | EXCLUDE | EXCLUDE | Enzyme-treated starches are ordinary food starches whose molecular size or branching has been changed using starch-active enzymes. |
| 26 | `e141` | T2 | MODIFIED_NATURAL | PROMOTE_CORE | EFFECTIVE_CORE | Plant chlorophyll with copper swapped for magnesium |
| 27 | `e1410` | T2 | MODIFIED_NATURAL | EXCLUDE | EXCLUDE | Monostarch phosphate is ordinary food starch with phosphate groups attached to its starch chains. |
| 28 | `e1412` | T2 | MODIFIED_NATURAL | EXCLUDE | EXCLUDE | Distarch phosphate is starch chains cross-linked to one another with phosphate bridges. |
| 29 | `e1414` | T2 | MODIFIED_NATURAL | EXCLUDE | EXCLUDE | Acetylated distarch phosphate is food starch chemically modified in two ways, cross-linked with phosphate and given acetyl groups, so it holds up better in heating, freezing and storage. |
| 30 | `e1420` | T2 | MODIFIED_NATURAL | EXCLUDE | EXCLUDE | Starch acetate is food starch deliberately modified with small acetyl groups so it holds up better when heated, frozen or stored. |
| 31 | `e1422` | T2 | MODIFIED_NATURAL | EXCLUDE | EXCLUDE | Acetylated distarch adipate is food starch that has been cross-linked and acetylated so it holds up better to heat, freezing and storage. |
| 32 | `e1440` | T2 | MODIFIED_NATURAL | EXCLUDE | EXCLUDE | Hydroxypropyl starch is ordinary food starch with hydroxypropyl groups attached to its starch chains. |
| 33 | `e1442` | T2 | MODIFIED_NATURAL | EXCLUDE | EXCLUDE | Hydroxypropyl distarch phosphate is starch that has been cross-linked with phosphate bridges and given hydroxypropyl groups — small chemical add-ons. |
| 34 | `e1451` | T2 | MODIFIED_NATURAL | EXCLUDE | EXCLUDE | Acetylated oxidised starch is food starch chemically modified by oxidation and by adding acetyl groups, so it behaves more reliably in food processing. |
| 35 | `e150a` | T2 | CONTROLLED_PROCESS | EXCLUDE | EXCLUDE | Caramel I is a brown colouring made by controlled heat treatment of sugars or other food-grade carbohydrates, which is different from kitchen caramel. |
| 36 | `e150b` | T2 | CONTROLLED_PROCESS | EXCLUDE | EXCLUDE | Caramel II is a brown colouring made by controlled heat treatment of sugars or other food-grade carbohydrates. |
| 37 | `e150c` | T2 | CONTROLLED_PROCESS | PROMOTE_CORE | EFFECTIVE_CORE | Industrial caramel colour is not kitchen caramel |
| 38 | `e150d` | T2 | CONTROLLED_PROCESS | EXCLUDE | EXCLUDE | Caramel IV is a brown colour made by heating sugars with ammonium and sulphite compounds. |
| 39 | `e160a` | T2 | VARIABLE | HOLD | HOLD | Carotenes are yellow-orange pigments, like those in carrots, that food colours can take from plants or algae or make as defined compounds. |
| 40 | `e160d` | T2 | VARIABLE | HOLD | HOLD | Lycopene is the red pigment best known from tomatoes — but the additive can be made by more than one route, so tomato is not guaranteed. |
| 41 | `e160f` | T2 | CHEMICAL_SYNTHESIS | HOLD | HOLD | A yellow-orange carotenoid-type colour related to naturally occurring carotenoids, but the food-grade version is made by chemical synthesis. |
| 42 | `e161f` | T2 | VARIABLE | HOLD | HOLD | Rhodoxanthin is a carotenoid-family pigment associated with red colouring. |
| 43 | `e200` | T2 | CHEMICAL_SYNTHESIS | HOLD | HOLD | Sorbic acid was first identified in rowan berries — but the sorbic acid used in food is generally made by chemical synthesis. |
| 44 | `e210` | T2 | CHEMICAL_SYNTHESIS | HOLD | HOLD | Benzoic acid occurs naturally in small amounts in some fruits, but food-grade benzoic acid is generally made by chemical synthesis. |
| 45 | `e234` | T2 | FERMENTATION | PROMOTE_EXTENDED | EXTENDED_OPTIONAL | Nisin is a small protein-like preservative produced by fermentation with Lactococcus lactis, a bacterium associated with dairy. |
| 46 | `e260` | T2 | VARIABLE | HOLD | HOLD | Acetic acid is the acid responsible for vinegar's characteristic sourness and sharp smell. |
| 47 | `e280` | T2 | VARIABLE | HOLD | HOLD | Propionic acid is a short-chain organic acid that also occurs naturally in some fermented foods. |
| 48 | `e296` | T2 | CHEMICAL_SYNTHESIS | HOLD | HOLD | Malic acid gives apples much of their tartness, but food-grade malic acid is commonly made by chemical synthesis from maleic or fumaric acid. |
| 49 | `e300` | T2 | FERMENTATION | PROMOTE_CORE | EFFECTIVE_CORE | Vitamin C commonly made from glucose, not fruit extract |
| 50 | `e303` | T2 | FERMENTATION | EXCLUDE | EXCLUDE | Potassium ascorbate is the potassium salt of ascorbic acid — vitamin C. |
| 51 | `e304` | T2 | CHEMICAL_SYNTHESIS | PROMOTE_EXTENDED | EXTENDED_OPTIONAL | Ascorbyl palmitate is a fat-soluble derivative of vitamin C made by linking ascorbic acid to palmitic acid. |
| 52 | `e307` | T2 | VARIABLE | HOLD | HOLD | Alpha-tocopherol is a form of vitamin E, used as a fat-soluble antioxidant. |
| 53 | `e307b` | T2 | PLANT_EXTRACT | PROMOTE_EXTENDED | EXTENDED_OPTIONAL | Mixed tocopherols concentrate commonly recovered from vegetable-oil refining streams (PLANT_EXTRACT) |
| 54 | `e307c` | T2 | CHEMICAL_SYNTHESIS | PROMOTE_EXTENDED | EXTENDED_OPTIONAL | Synthetic dl-alpha-tocopherol versus single natural stereochemical form |
| 55 | `e308` | T2 | CHEMICAL_SYNTHESIS | PROMOTE_EXTENDED | EXTENDED_OPTIONAL | Synthetic gamma-tocopherol (CHEMICAL_SYNTHESIS), distinct from mixed tocopherols concentrate (E307b / PLANT_EXTRACT); additive number does not establish a supplier’s specific starting material |
| 56 | `e322` | T2 | VARIABLE | HOLD | HOLD | Lecithin helps oil and water mix — but the number 322 alone will not tell you whether it came from soy, sunflower or egg. |
| 57 | `e330` | T2 | FERMENTATION | PROMOTE_CORE | EFFECTIVE_CORE | Citric acid commonly fermented from sugar, not citrus juice |
| 58 | `e331` | T2 | FERMENTATION | EXCLUDE | EXCLUDE | Sodium citrate / sodium dihydrogen citrate is a sodium salt of citric acid. |
| 59 | `e332` | T2 | FERMENTATION | EXCLUDE | EXCLUDE | Potassium citrate is a potassium salt of citric acid, the acid associated with citrus fruit. |
| 60 | `e334` | T2 | PLANT_EXTRACT | PROMOTE_CORE | EFFECTIVE_CORE | Tartaric acid often recovered from wine-making streams |
| 61 | `e337` | T2 | CONTROLLED_PROCESS | EXCLUDE | EXCLUDE | Potassium sodium tartrate is a potassium and sodium salt of tartaric acid, the fruit acid closely associated with grapes and wine. |
| 62 | `e353` | T2 | MODIFIED_NATURAL | PROMOTE_EXTENDED | EXTENDED_OPTIONAL | Metatartaric acid is tartaric acid — the grape fruit acid — heated until its molecules link up, used mainly to help stop tartrate crystals forming in wine. |
| 63 | `e354` | T2 | CONTROLLED_PROCESS | EXCLUDE | EXCLUDE | Calcium tartrate is a calcium salt of tartaric acid, the fruit acid closely associated with grapes and wine. |
| 64 | `e363` | T2 | VARIABLE | HOLD | HOLD | Succinic acid occurs naturally in living cells; food-grade material can be made chemically or by fermentation. |
| 65 | `e405` | T2 | MODIFIED_NATURAL | PROMOTE_EXTENDED | EXTENDED_OPTIONAL | Propylene glycol alginate is a chemically modified form of seaweed-derived alginic acid. |
| 66 | `e415` | T2 | FERMENTATION | PROMOTE_CORE | EFFECTIVE_CORE | Bacterial fermentation “gum” (xanthan) |
| 67 | `e418` | T2 | FERMENTATION | PROMOTE_EXTENDED | EXTENDED_OPTIONAL | Gellan gum is a gel-forming carbohydrate produced by bacterial fermentation. |
| 68 | `e420` | T2 | MODIFIED_NATURAL | PROMOTE_EXTENDED | EXTENDED_OPTIONAL | Sorbitol is a sugar alcohol that tastes sweet but behaves differently from ordinary sugar. |
| 69 | `e421` | T2 | VARIABLE | HOLD | HOLD | Mannitol is a sugar alcohol found naturally in some mushrooms and seaweeds, but commercial mannitol can also be made by hydrogenating sugars or by fermentation. |
| 70 | `e422` | T2 | VARIABLE | HOLD | HOLD | Glycerol helps hold moisture and carry flavour — and the number 422 alone will not tell you whether it came from plant oil, animal fat or a synthetic route. |
| 71 | `e461` | T2 | MODIFIED_NATURAL | EXCLUDE | EXCLUDE | Methyl cellulose is a chemically modified form of plant cellulose. |
| 72 | `e463` | T2 | MODIFIED_NATURAL | EXCLUDE | EXCLUDE | Hydroxypropyl cellulose is a chemically modified form of plant cellulose. |
| 73 | `e464` | T2 | MODIFIED_NATURAL | EXCLUDE | EXCLUDE | Hydroxypropyl methylcellulose is a chemically modified form of plant cellulose. |
| 74 | `e465` | T2 | MODIFIED_NATURAL | EXCLUDE | EXCLUDE | Methyl ethyl cellulose is a chemically modified form of plant cellulose. |
| 75 | `e466` | T2 | MODIFIED_NATURAL | PROMOTE_EXTENDED | EXTENDED_OPTIONAL | Sodium carboxymethylcellulose is a chemically modified form of plant cellulose. |
| 76 | `e471` | T2 | VARIABLE | HOLD | HOLD | E471 helps fat and water mix in foods. But its fatty acids may come from plants or animals — and the number alone won't tell you which. |
| 77 | `e529` | T2 | MINERAL_INORGANIC | HOLD | HOLD | Calcium oxide is quicklime, made by heating limestone. |
| 78 | `e570` | T2 | VARIABLE | HOLD | HOLD | Stearic acid and related food fatty acids are the same kind of building blocks found in ordinary fats and oils, and the additive number alone does not show whether they came from plant or animal sources. |
| 79 | `e579` | T2 | FERMENTATION | HOLD | HOLD | Ferrous gluconate is the iron salt of gluconic acid, an acid made by oxidising glucose. |
| 80 | `e621` | T2 | FERMENTATION | PROMOTE_EXTENDED | EXTENDED_OPTIONAL | MSG (monosodium glutamate) is the sodium salt of glutamic acid, the amino acid behind umami taste, commonly made by fermenting sugars or starch-derived sugars. |
| 81 | `e636` | T2 | CHEMICAL_SYNTHESIS | HOLD | HOLD | Maltol is a sweet-smelling flavour-enhancing compound with caramel-like and toasted notes. |
| 82 | `e640` | T2 | VARIABLE | HOLD | HOLD | Glycine is the smallest amino acid and is a normal building block of proteins in foods and the human body. |
| 83 | `e953` | T2 | MODIFIED_NATURAL | HOLD | HOLD | Isomalt is a sugar alcohol mixture made from sucrose. |
| 84 | `e955` | T2 | CHEMICAL_SYNTHESIS | PROMOTE_CORE | EFFECTIVE_CORE | Table sugar chemically transformed into sucralose |
| 85 | `e960` | T2 | VARIABLE | PROMOTE_EXTENDED | EXTENDED_OPTIONAL | Steviol glycosides are intensely sweet compounds based on steviol, best known from the leaves of the stevia plant. |
| 86 | `e965` | T2 | MODIFIED_NATURAL | HOLD | HOLD | Maltitol and maltitol syrup are sugar-alcohol sweeteners produced from starch-derived maltose or glucose syrups. |
| 87 | `e966` | T2 | MODIFIED_NATURAL | PROMOTE_EXTENDED | EXTENDED_OPTIONAL | Lactitol is a sugar alcohol made from lactose, the natural sugar in milk. |
| 88 | `e967` | T2 | VARIABLE | HOLD | HOLD | Xylitol is a sugar alcohol known for the cooling effect it gives sugar-free gum — and it can be made from plant fibre such as wood or corn cobs, or by fermentation. |
| 89 | `e968` | T2 | FERMENTATION | PROMOTE_EXTENDED | EXTENDED_OPTIONAL | Erythritol is a four-carbon sugar alcohol that occurs naturally in small amounts in fruits and fermented foods. |

## Sensitive-source reconciliations

1. **E905b** — Schedule 8/16 identity “Petrolatum or petroleum jelly” / “Petrolatum (petroleum jelly)”. v0.12 profile `PETROLEUM_REFINED` matches substance class. Claim is manufacturing-class origin, not a pack-specific refinery.
2. **E355** — Schedule 8 “Adipic acid”. v0.12 profile remains `CHEMICAL_SYNTHESIS` with petrochemical-derived intermediates in SP/tile. Must not be labelled `PETROLEUM_REFINED`.
3. **E943a / E944** — Schedule 8/16 butane & propane (pressurised food containers). v0.12 `FOOD_GAS` + SP copy: purified from natural-gas and petroleum-refining streams. Stream-class claim only.
4. **E1101** — Schedule 8 “Proteases (papain, bromelain, ficin)”. Identity of the named plant proteases is verified; SP copy also notes other protease preparations may be microbial. Fail-closed on which preparation a pack used.

## Stage 2C intro / sort (authorised behaviour — unchanged)

- Intro note constant: “Some notable discoveries appear first. This order is not a safety ranking.”
- `shouldShowDiscoveryOrderIntro`: true only when `items.length >= 2` **and** at least one item has a discovery sequence (including colour-group min-member rule).
- It does **not** require proving the order differed from baseline occurrence; presence of a ranked ID among 2+ cards is sufficient.
- Unranked relative occurrence order preserved; BODY6 separate; colour-group handling unchanged; no scoring impact.

**STOP — see `W5_AD02_FINAL_IMPLEMENTATION_ACCEPTANCE.md`.**