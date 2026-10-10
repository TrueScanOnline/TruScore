# Rveel Wave 5 Master Implementation Plan

Governing execution framework for the Rveel consumer experience

Version 1.1 | 8 October 2026 | Design and implementation lead ChatGPT

This is the current Wave 5 execution guide, incorporating the founders' accepted operating principles and delivery adjustment. It supersedes Master Plan v1.0 and its procedural companion instructions. The current Architectural Doctrine and subsequent explicit founder decisions retain authority over governed behaviour. Publication of this plan does not imply that implementation, testing or independent review has already passed.

## 1 Mission and authority

Deliver a distinctive, credible and engaging Rveel experience efficiently. A shopper should quickly understand what Rveel found, what it means, what remains unknown and what they can do next. Body, Planet, Claims and Transparency must make sense individually and together. Contribution should feel useful and achievable; sharing should communicate something meaningful; returning should reward the consumer with dependable understanding.

Wave 5 starts with genuine creative freedom. Today's interface supplies evidence of the states and capabilities that must be represented, not a layout that must be preserved. Explore hierarchy, navigation, interaction and visual character. Protect the governing logic that establishes, resolves, scores, publishes and propagates truth.

This document is the source of truth for Wave 5 execution. It consolidates strategy, ownership, delivery sequence, Cursor instructions, review and acceptance. It is read together with Architectural Doctrine v0.3 and Scene Setting v0.2. Where substantive rules differ, later founder-approved Wave 3 and Wave 4 decisions and the current doctrine supersede the original August MVP specification. The August document is not reinstated by this plan.

The order of authority is explicit founder decisions and controlled doctrine amendments; locked architectural doctrine; the scene-setting mission within that boundary; this execution plan; the current scoped instruction; then design references. Record a founder amendment that changes locked doctrine with its clause, reason and effective SHA. Code observations, mockups and AI recommendations cannot silently amend policy.

Version 1.1 replaces the mandatory process implications of the v1.0 Cursor playbook, external review brief and acceptance register. Their useful technical scenarios may be reused as reference material. Their work-package checklists, review frequency, numerical design targets and documentation requirements no longer impose separate obligations. Do not run two competing operating frameworks.

The implementation team should use this master document plus one current work instruction and a concise consolidated progress and findings record. Expand documentation only when ambiguity, architectural risk or future stewardship warrants it. Required architectural evidence remains required; paperwork for its own sake does not.

## 2 Founder operating principles

Proportionate documentation. Document the decision, interface or risk that another person needs to understand. A short instruction, annotated design or existing test report may be sufficient. Do not require a new specification, matrix or report merely to complete a work-package label.

One-loop governance. The lead consolidates scope and findings; Cursor implements and reports; independent review addresses material governed or technical risk; founders decide genuine product, scope and release matters. Fix and verify within that loop. Routine GREEN changes do not circulate repeatedly between reviewers and founders.

Risk-based acceptance. P0 and P1 issues require resolution before acceptance of the affected release scope. P2 and P3 observations normally enter the deferred list unless a small, safe fix can be made without disrupting delivery. Severity reflects actual effect, not reviewer preference. A locked-invariant breach cannot be waived by calling it P2.

Creative freedom. Concept weights, component boundaries, usability thresholds, sample sizes and numbers of concepts remain adjustable planning tools unless founders expressly approve them as requirements. The design team can change these tools as evidence improves. There is no obligation to reproduce the supplied concepts or create exactly three alternatives.

Consumer-led validation. Ordinary consumers understanding and using the experience on real devices is the strongest experience evidence. Include Rated, NR, limited-evidence and contribution journeys. AI critique and automated tests support this work; they do not prove shopper comprehension, enjoyment or repeat value.

Controlled scope. Broad refactoring, optional analytics or experiment infrastructure, expanded documentation and speculative future features must not become prerequisites for a compelling MVP. Preserve the approved architecture, use current governed outputs and deliver useful increments. Certifications and Packaging and Recycling continue in parallel.

The guiding tradeoff is explicit: reduce avoidable process and implementation scope while preserving truth and usability. Never use efficiency to justify fabricated scores or optimistic admission claims. Equally, do not use a theoretical risk to demand an unrelated architecture programme or delay a safe presentation improvement.

## 3 Accepted baseline and access

The founders have accepted B0 as the Wave 5 starting baseline. That founder decision is closed. Cursor should record the full SHA in the doctrine's baseline and H-10 provenance fields without requesting the same approval again. This is an administrative update, not an amendment to locked rules.

| Item | Accepted record |
| --- | --- |
| Repository | TrueScanOnline/TruScore |
| Laptop checkout | C:\TrueScan-FoodScanner |
| Working branch | wave5/score-experience-20261008 |
| Frozen return branch | preserve/pre-wave5-9910276-20261008 |
| B0 full SHA | 99102768b61bd6e518bb889e3ab6f01dfc3e1268 |
| Original doctrine inspection SHA | f0b29211b00dfc33bc414d8d556c28f6e1523ef9 |

Earlier checks in this conversation independently verified the remote refs and the corrective commit. The comparison from the inspection SHA to B0 contained the reviewedUnitSupport import and its test. Cursor supplied local outputs identifying the checkout, working branch and clean state at B0. These are dated baseline facts, not a claim that today's branch head can never advance.

Cursor can inspect and modify the laptop checkout. The lead reads pushed GitHub commits and cannot directly inspect unpushed laptop changes. Each substantive code handoff therefore includes the exact pushed SHA. Cursor checks current local changes and remote refs before work, preserves unrelated edits, and reports any intervening commits rather than resetting to B0.

The lead's initial assessment was targeted static inspection of the score, Highlights, share and contribution paths. It did not execute the app or the complete regression suite. H-10 physical-device success was reported by the founders; its source corrective was verified. Further device evidence should identify the actual installed build. Do not turn a source test into a claim of end-to-end device acceptance.

Preserve B0 and the return branch. After the corrective package is accepted, record its full SHA as BC, the presentation comparison checkpoint. Keep the history of intended corrective differences from B0. Do not force-push, reset shared history or overwrite the preserve branch to make review easier.

## 4 Roles and the single delivery loop

| Role | Responsibility | Escalation boundary |
| --- | --- | --- |
| Founders | Product direction, scope, governed copy, RED changes and release | Decide genuine choices and controlled doctrine amendments |
| ChatGPT lead | Design direction, scoped Cursor instructions, consolidated findings and AMBER assessment | Escalate RED changes and founder-owned decisions |
| Cursor | Inspect, classify, implement, test and report from the laptop checkout | Surface new governed scope before coding it |
| External AI reviewer | Independently inspect material governed or technical risk | Report reproducible findings and evidence limitations |
| Human testers | Consumer comprehension and real-device behaviour | Report actual difficulty, confusion and failure |

Under the accepted role arrangement, the lead acts as the delegated architectural assessor for AMBER proposals within doctrine section 12. This does not delegate authority to change locked rules or approve RED scope. The lead can re-scope a proposal to GREEN, approve a bounded governed corrective where the doctrine permits delegated assessment, or escalate it to founders. The approved C-1 to C-4 package does not need fresh approval.

The normal loop is: the lead issues one consolidated instruction; Cursor classifies and implements; Cursor returns the SHA and proportionate evidence; the lead accepts the increment or consolidates actionable findings. Independent review enters the same loop when material risk warrants it. Founders receive only decisions that require their authority, not every technical observation.

GREEN work proceeds autonomously within the current scope. Classification and INV-IDs remain recorded as the doctrine requires, but this can be a concise commit or handoff entry. AMBER is assessed before the affected code change. RED is not implemented without explicit scoped founder approval. Unrelated GREEN work can continue while a separate issue is awaiting a decision.

Review the C-1 to C-4 package once as a bounded package, with separately attributable outcomes. Commission additional independent review for changes such as moving orchestration, changing governed adapters, replacing critical controls, or introducing a materially different contribution or Highlights route. Routine typography, spacing, pure component extraction and compliant layout changes do not automatically trigger external review.

Use ACCEPT, ACCEPT WITH DEFERRED ITEMS, REQUEST CHANGES or UNVERIFIED. Missing required evidence is UNVERIFIED for that claim; it is not a test pass and need not halt unrelated progress. Review remediation only where the change and affected dependencies warrant it. Do not re-audit unchanged accepted work by default.

## 5 Workstreams and decision points

WP-00 to WP-08 remain useful scope labels. G0 to G5 identify decisions or progress, not mandatory ceremonies, meetings or separate document packages. Consolidate related work and evidence when this reduces overhead without hiding a material change.

| Workstream | Execution arrangement | Decision or review |
| --- | --- | --- |
| WP-00 Baseline and controls | Cursor records accepted B0, active rules and existing protections | G0 is administrative; no repeat founder approval |
| WP-01 Correctives | Implement already-approved C-1 to C-4 | G1 one consolidated independent package review |
| WP-02 Concept exploration | Lead explores alternatives with representative states | Founder input on meaningful product direction |
| WP-03 Design definition | Define enough detail to implement the next increment | G2 records direction; no mandatory full design freeze |
| WP-04 Score experience | Deliver a working Score overview and pillars | G3 routine GREEN acceptance by lead |
| WP-05 Highlights | Connect L1 to L3 through permitted navigation | AMBER assessment for new surfaces; review by risk |
| WP-06 Contribution | Improve existing journey and accurate outcome feedback | AMBER or RED for governing changes; device evidence |
| WP-07 Sharing and return | Complete existing share and return paths | Review governed semantics where changed |
| WP-08 Integrated MVP | Resolve release blockers and validate the complete journey | G4 consolidated readiness; G5 founder release decision |

The corrective package and Score concept exploration begin in parallel now. Production presentation must consume the corrected behaviour. C-2 must land before new Highlights navigation. Work on Score presentation does not wait for a complete sharing redesign, a comprehensive token library or every downstream specification.

Founders select the main experience direction when there is a real choice to make. The team then iterates within that direction without asking for approval of every screen, component or design refinement. If later evidence requires a meaningful product change, present the choice and recommendation together.

G4 reuses accepted evidence and adds checks for the integrated candidate and actual changes. It is not an automatic second independent audit of every file. Any unresolved material risk receives targeted independent review. G5 remains the founder's release decision; a demonstration, merged commit or accepted increment is not store-release authorization.

## 6 Surface identity and communication

Use one shared vocabulary across the founder, lead and Cursor. A screen is a full navigation destination. A card is a region within a screen. An overlay is a modal or sheet over a screen. A view is a distinct presentation inside an overlay or screen. A state is a governed or interface condition of that same surface. A shared component is a reusable visual element. These distinctions prevent a request about the Score card from becoming an unintended redesign of the entire product screen.

The identifiers in the next two sections are stable internal discussion names, not consumer-facing labels, required route names or fixed layouts. Screens may be recomposed while retaining their identity. Do not confuse these new SCR, CARD and OVL identifiers with existing doctrine S-numbers such as S26 or S28. Cursor maps each relevant identifier to the actual file and component at the candidate SHA before editing.

Every design instruction and screenshot should identify the surface, entry path, selected pillar or contribution domain, state, platform and relevant theme/text setting. For example: SCR-RESULT / CARD-SCORE / entry Scan / Overall NR / Body Rated / Android / light / standard text. A second example is OVL-HIGHLIGHTS / VIEW-STORY / Planet finding / entry promoted L1 / iOS. These identify what the consumer is actually seeing without prescribing a new router.

Specify change scope as GLOBAL, COMPONENT or LOCAL. GLOBAL changes a semantic design role across the active app; COMPONENT changes the shared component and all its instances; LOCAL changes a documented, genuinely surface-specific layout. Do not interpret “make this button bigger” as either a global typography change or a one-off exception without resolving the intended scope.

If the screen, state, interaction, propagation scope or governing meaning is ambiguous, clarify it before implementing that affected item. The lead resolves technical naming and maps the request; the founder resolves uncertain product intent. Ask one concise question using the competing interpretations and a recommendation. Do not invent a decision, and do not hold unrelated clear GREEN work while waiting.

Use stable surface IDs in the single work record and annotate prototypes or screenshots outside the consumer UI. Keep the actual approved screen title and visible CTA wording alongside the ID when needed. If a surface is renamed, retain an alias so old instructions remain interpretable. Create only the small catalogue entry needed when a genuinely new surface appears; no separate navigation documentation project is required.

## 7 Screen catalogue

The following baseline screen mappings were verified in AppTabs.tsx and tabStackParamLists.ts at B0. They identify existing entry destinations; they do not claim that every screen's full content has been audited. The same Result component is mounted in several tab stacks. Its originating tab is context, not a separate product-page implementation.

| ID and shared name | What the shopper is viewing | Baseline route and source |
| --- | --- | --- |
| SCR-SCAN Scan home | The scanning entry screen | Scan / ScanHome; app/index.tsx |
| SCR-SEARCH Search | Product search entry and its current results | Search / SearchHome; app/search.tsx |
| SCR-HISTORY History | Previously scanned product entries | History / HistoryHome; app/history.tsx |
| SCR-FAVOURITES Favourites | Saved product entries | Favourites / FavouritesHome; app/favourites.tsx |
| SCR-SETTINGS Settings | The settings tab destination | Settings; app/profile.tsx |
| SCR-RESULT Product result | The product experience opened after scan or selection | Result with barcode; app/result/[barcode].tsx |

SCR-RESULT contains named regions rather than separate pages. CARD-SCORE is the Rveel overall and four-pillar summary. CARD-HIGHLIGHTS is the promoted L1 finding region. CARD-SIGNALS is the existing governed banner region. CARD-NUTRITION, CARD-INGREDIENTS, CARD-ORIGINS and CARD-PACKET identify the corresponding product information regions. The exact layout may change; these IDs identify purpose rather than current card borders.

For pillar subregions use CARD-SCORE / Body, Planet, Claims or Transparency. “Planet page” is ambiguous until the request identifies whether it means this summary region, the pillar exploration view or a deeper source explanation. CARD-PACKET means the unified Packet information region; it does not imply separate claim and certification entry journeys.

Unknown Product, Checking, NR, missing publication and technical failure are states within the relevant product journey, not automatically new routes. State labels must identify the affected overall or pillar level. A product can contain Rated and NR pillars together, so “the NR screen” alone is insufficient for a precise code instruction.

The Alerts tab exists behind an MVP runtime gate and is not an active redesign target by default. Do not activate it to complete this catalogue. Existing History, Favourites, Search and Settings receive shared visual-system consistency checks; this plan does not automatically authorize functional redesign of those screens.

## 8 Overlay and journey catalogue

These IDs distinguish views the shopper can encounter without assuming that every step is a separate page. The Highlights modal's pillar and detail request modes are verified at B0. Other view boundaries must be mapped to the current implementation before editing; a journey label is not evidence that a dedicated component or route already exists.

| ID and view | Consumer context | Source or implementation rule |
| --- | --- | --- |
| OVL-HIGHLIGHTS / VIEW-PILLAR | Findings for one selected pillar | ScoreHighlightsLookThroughModal; pillar request mode |
| OVL-HIGHLIGHTS / VIEW-STORY | L2 explanation for a selected finding | Same modal; detail request mode |
| VIEW-DEEPER L3 detail | Governed explanation or authoritative external source | Existing L3 host and governed destination; may be in-app or external |
| OVL-CONTRIBUTE / VIEW-ENTRY | Existing context-specific contribution entry | PacketContributionModal and current entry context/mode |
| OVL-CONTRIBUTE / VIEW-CAPTURE | Capture or enter evidence | Existing session and capture/manual-entry path |
| OVL-CONTRIBUTE / VIEW-REVIEW | Review proposed or entered information | Existing review semantics; no new admission path |
| OVL-CONTRIBUTE / VIEW-OUTCOME | Actual submission, partial, pending or saved outcome | Existing outcome state; not a promise of a dedicated success page |
| OVL-SHARE | In-app share controls and supported preview | ShareModal and current share components |
| SYS-SHARE | Native operating-system sharing UI | Platform-owned surface; app styling does not control it |

For contributions, always add the domain or entry context: ingredients, nutrition, origins or unified Packet information. Distinguish Add from Change or Remove. “Review screen” must identify which evidence the consumer is reviewing and whether it is a proposal, current proposition or locally entered draft.

Baseline Highlights behaviour allows a pillar tap to enter VIEW-PILLAR and a promoted story tap to enter VIEW-STORY directly. Back returns through actually visited views; Close returns to Result. Preserve existing behaviour until a classified design change is assessed. Do not force a pillar detour merely to fit a diagram, or create duplicate modal stacks to obtain a new visual treatment.

A camera permission dialog, native photo picker, native share sheet and external website are system or external surfaces. Keep entry and return coherent, but do not promise to propagate Rveel fonts or colours into UI the app does not own. Add a precise catalogue entry for any other affected overlay during implementation, with its parent screen and return destination.

## 9 Shared visual system and propagation

The founder's requirement is one coherent visual language across the active app, with central control of colour, typography, symbols, imagery treatment and component styling. A change to an approved shared role must reach all associated app-owned surfaces without manually patching each page. This is a production requirement, while exact palette and typography choices remain open to creative exploration.

Build on the existing theme in src/theme/index.ts and colors.ts. B0 already provides useTheme, light/dark colours, spacing, radius and shadows. It does not establish a complete central typography or icon system, and inspected Result and Share code still contains local visual values. Do not claim global propagation is already complete. Inventory relevant literals and consumers as part of normal implementation.

Use a small layered system: base design values; semantic roles; shared component variants; screen composition. Examples of roles are action.primary, text.body, surface.card and icon.contribute. Names are illustrative. A page consumes the role, not a copied hex code, font size, icon name or asset path. Shared buttons, text styles, cards, status treatments, input controls and sheets inherit these roles. Local geometry can vary for purpose; common visual meaning stays consistent.

| Shared family | Centrally managed choices | Propagation rule |
| --- | --- | --- |
| Colour and surface | Brand, action, text, background, borders and feedback | Same semantic role updates all active consumers |
| Typography | Font family, weight, size roles and line height | Text roles update with platform scaling and fallback |
| Symbols | Icon identity, style, stroke, size roles and labels | Same meaning uses the same icon treatment |
| Images and assets | Rveel artwork, logo variants, aspect ratios and placeholders | Shared asset references and image components update consistently |
| Components and motion | Padding, radius, elevation, interaction states and motion roles | Variants inherit defaults; justified overrides are explicit |

Keep brand accents, pillar identity and score/status meanings separate. A brand recolour must not reclassify a score or make NR look Rated. Central score styling consumes approved published semantics; it never chooses publication state or changes band thresholds. Existing legacy ecoScore colour entries are not permission to revive that feature. Governed copy, certification permission and third-party marks remain under their own rules.

Product photographs and evidence photos are data, not theme artwork: standardize their framing and placeholders without substituting or recolouring the evidence itself. Do not globally retint certification or third-party logos. Share exports use common brand and typography roles with deliberate export-size variants; already exported images do not change retrospectively when the theme changes.

Adopt the shared system incrementally with the first Score experience, then carry it through associated overlays, contribution, sharing, tabs and existing surrounding screens. Complete app-owned shared-role adoption or document deliberate exceptions before claiming app-wide consistency. This is bounded visual work, not permission to change navigation, state or data architecture. No dependency upgrade, theme editor or large new framework is required.

Validate propagation with a temporary alternate brand colour, body-text role and icon/asset substitution in a development build. Inspect the affected screen catalogue, restore the chosen theme and check both supported themes, larger text and share output. Audit relevant new hard-coded values. Approved global visual changes require checks across their consumers; they do not automatically require independent architectural review unless meaning or governed behaviour changes.

## 10 Early demonstration and complete journey

Deliver the first useful Score experience as soon as the relevant corrections are accepted and the main direction is sufficiently clear. The first demonstrable increment should run with real governed outputs, show product identity and the four consumer pillar names, explain score presence or absence, and retain working access to the rest of the current product experience.

| Increment | Demonstrable consumer value | Evidence needed at this point |
| --- | --- | --- |
| A Score overview | Understand Rated, NR, Checking and limited-evidence results | Correct output mapping, representative states and device walkthrough |
| B Explore | Open a finding, understand its pillar and reach further explanation | L1 to L3 correctness, non-Rated boundaries and return navigation |
| C Contribute | Supply eligible evidence and understand what actually happened | Existing admission path, accurate outcomes and critical recovery |
| D Share and return | Preview meaningful content, share through supported routes and resume use | Share semantics, cancel/return and complete journey check |

These increments are review milestones, not independent product releases. Existing functional contribution and share routes can remain available while their presentation is improved. A new overview should not disconnect the shopper from useful existing capabilities. Avoid creating a beautiful but isolated demo branch that requires a second implementation to become the MVP.

Concept prototypes may use clearly labelled fixtures. The working demonstration must be connected to the authorized Result outputs; it must not fabricate live assessments, percentages or successful contributions. Present examples with a low published score as well as an attractive high score. NR must be a designed experience, not an empty placeholder.

For each next increment, specify only what Cursor needs to build it safely: the intended shopper outcome, key states, interaction, governed inputs and material constraints. An annotated screen plus a short instruction can be enough. Expand detail around ambiguous semantics or risky asynchronous behaviour.

Final release requires the coherent scan, explore, contribute and share journey, truthful states and feedback, applicable architectural checks, real-device validation and no unresolved P0/P1 issues. Optional visual refinements, deferred P2/P3 observations, new analytics, future extraction and unfinished parallel capabilities are not automatic release prerequisites.

## 11 Creative direction and consumer validation

The founder's visual brief is light, bright, colourful, professional and fun without being juvenile. Pursue an airy premium character: clear typography, generous space, tactile controls and restrained moments of delight. Explore a fresh aqua or teal brand anchor with carefully placed warm and violet accents, rather than colouring every region. Use purposeful symbols and concise, human copy; avoid cartoonish trophies, visual clutter or a clinical wall of metrics.

### Founder visual selection — 10 October 2026

The founders have selected **A · Emerald Perspectives** (`C:\Users\leigh\Desktop\A_Emerald_Perspectives.png`) as the Wave 5 visual direction. It replaces the earlier concept boards as the design reference for SCR-RESULT and establishes the visual language for subsequent screens. This approval covers appearance. It does not close corrective-package acceptance, record BC, or mark the direction as implemented. Record implementation only after the corresponding app changes are made and verified.

The large sheets outside the phone frames are presentation-board decoration. Only the wallpaper and layers inside the phone are candidates for the app. Governed contracts and approved copy remain authoritative over the artwork. Emerald styling is held until a code-grounded visual specification is ready. The source inspected for that handoff is `f1899c39ab58608a8552ec2d3db58f6ac0b5cb0b` on `wave5/score-experience-20261008`. No Emerald styling was applied while preparing that source.

Start from the shopper's question: what did Rveel find and what does it mean? Explore distinct ways to make that answer clear. A score-led view, a finding-led view and a pillar-led view are useful possibilities, not a compulsory list. The lead decides how many alternatives are useful and avoids producing variants merely to satisfy a count.

Compare alternatives using the same representative governed product states. Include all-Rated, one pillar NR, Checking, Rated with an unresolved lane, Limited Confidence, sparse findings and long product names. Assess clarity, contribution effort, navigation, accessibility, Rveel character and share suitability. Weighting can support discussion, but no weighted score can authorize misleading information.

The v1.0 evaluation weights, five-second thresholds, sample sizes, motion durations and performance percentages are not mandatory approval conditions. Adjust or discard them when inappropriate. Record a numerical target only if it helps answer a real design or performance question. There is no fixed research sample required to pass G2.

Consumer validation remains essential. Use small iterative sessions with ordinary shoppers as early as practical, including people with lower technical confidence and relevant accessibility needs. Ask them to explain the result, distinguish NR from a poor score, find a legitimate contribution, review it and interpret the outcome. Observe hesitation, errors and assistance, not just stated visual preference.

AI and founder review can improve an early concept before people test it. They cannot replace real consumers on devices. Testing should be proportionate to the increment; there is no need to run the full journey against every typography adjustment. Repeated confusion or an unusable main action is a reason to fix the design even if an informal numerical target was met.

Use accessible text and touch targets, meaningful screen-reader labels, large-text layouts, supported themes and reduced-motion behaviour. Test VoiceOver and TalkBack on the affected primary journeys. Use applicable WCAG guidance and platform behaviour as implementation references rather than claiming conformance from a checklist. Profile performance when changes introduce latency, heavy assets, motion or observable regressions; optional benchmark infrastructure must not hold up an otherwise testable MVP.

## 12 Governing consumer states

The doctrine's consumption contract controls the consumer surface. Existence of a number does not mean Rated; absence of a field does not mean NR. Read the governed publication status, published values, assessment lanes and contribution opportunities. The UI must not recreate sufficiency, Confidence or score arithmetic.

| State | Required consumer treatment |
| --- | --- |
| Rated | Show the actual published value and permitted score treatment |
| NR | No numeric score, score colour or score label; explain the governed limitation |
| Checking | Neutral assessment-in-progress treatment; no implied Rated result |
| Rated with unresolved lane | Retain published score; explain remaining evidence and eligible action |
| Limited Confidence | Separate evidence-support meaning; never an independent reason to solicit |
| Missing or incomplete publication | Fail closed without internal fallback or fabricated status |
| Technical failure or no authority | Distinct unavailable treatment; do not relabel it as NR |

Any pillar NR keeps Overall NR under the existing publication rules. Never renormalise remaining pillars. A Rated pillar may show its own published value when Overall is NR. A genuine published zero remains zero. Assessed-neutral and unassessed states stay distinguishable. Partial resolution is represented by lanes, not a new partial publication status.

Highlights may show governed findings for non-Rated pillars where methodology permits. They must not reveal unpublished arithmetic or use score framing that implies Rated. Preserve the governed selection and tie-break rules. New Highlights surfaces and newly visible elements during Checking receive the doctrine's AMBER assessment.

Consumer labels remain Body, Planet, Claims and Transparency; internal Ethics and Open names do not replace them. Signals remain separate from Claims scoring and use the existing eligible banner output. A zero-Signals result may be correct, including when an asset expires; it is not permission to restore a retired feed.

The supplied screenshots are inspiration only. Do not carry forward invented data completeness percentages, ratings, automatic extraction claims, separate certification solicitation, disabled allergen features or unapproved certification artwork. The absence of a capability should shape the current design honestly rather than be concealed with simulated functionality.

## 13 Contribution reveal and sharing

Contribution starts from governed lanes and opportunities through existing actions. Present a helpful eligible next step in context and allow the shopper to keep browsing. Confidence, a low score, ledger movement and raw field absence must not independently decide that the consumer needs to contribute.

Preserve the existing capture, review, admission and reassessment path. The current default extraction producer abstains; a photograph is not proof of successful text extraction. Machine proposals remain proposals until the existing review and admission rules are satisfied. Enabling a working OCR or VLM provider is separate RED scope.

Maintain the meanings of Add, Yes, Change and Remove and use one consumer-natural Packet information journey for claims and certifications. An empty image or failed extraction is not evidence that a claim or certification is absent. Preserve deliberate packet-absence confirmation, unresolved marks, governed resolution and withdrawal semantics.

| Actual outcome | Required feedback |
| --- | --- |
| Saved locally or transport failed | Explain that submission has not completed and preserve retry |
| Pending or rejected | Describe the actual outcome without implying publication |
| Partially admitted | Distinguish partial from full success |
| Admitted and reassessed | Refresh through authoritative Result orchestration |
| Score becomes publishable | Reveal only the new published value |
| Score remains NR or unchanged | Acknowledge the contribution without inventing score movement |

Celebrate useful understanding rather than a higher rating. Do not promise that one contribution will unlock Overall. Do not hide an already published score behind a gesture or task. Optional motion may connect a real authoritative update to its result, but it must not delay access, infer a score or keep stale information visible. Reduced motion must retain the same meaning.

Preserve critical recovery paths: double taps, timeouts, offline save, back navigation, app restart, barcode changes, late responses, partial admission and superseded or withdrawn evidence. Improve presentation without introducing another writer or authority store. Changes to submission, handoff, transport, retry or trace are assessed before implementation.

Sharing uses published semantics and sufficient product and finding context. NR is distinct from failure on shares as well as in-app. Start with supported share paths; finding-specific formats are a separately assessed new Highlights surface. A share sheet closing is not proof of delivery. Verify preview, cancel, destination behaviour and return to the app. Existing history and favourites may support return value without new social or notification infrastructure.

## 14 Correctives and architecture boundaries

C-1 to C-4 are already founder-approved governed correctives. Implement them as one tightly bounded package or coherent commits reviewed together. Each corrective needs its own demonstrable outcome; no restyling, new navigation or unrelated refactoring belongs in that package.

| Corrective | Required outcome | Essential negative cases |
| --- | --- | --- |
| C-1 | Score-derived visuals and share framing use published state | NR and Checking remain neutral; NR differs from failure |
| C-2 | Highlights receive published scores for all four pillars | Direct entry cannot reveal internal NR or Checking values |
| C-3 | Consumer overall and pillar fallbacks are removed | Missing/incomplete publication fails closed; genuine zero survives |
| C-4 | Contextual prompts follow governed lanes/opportunities | Ledger or Confidence alone cannot create a need |

C-3 includes the pillar share breakdown as well as overall share resolution. Test affected consumers for missing nested entries, missing published values and incompatible status/value combinations. C-4 must not incidentally enable the dormant contribution-route flag. Do not hide all NR findings as a shortcut to fixing a numeric leak.

Keep Result's product loading, publication latch, admission subscription, authoritative reassessment and Signals orchestration in place unless a demonstrated design need justifies moving them. Pure presentation extraction can proceed as GREEN when it consumes the contract. Moving governing hooks or adapters is AMBER; file names such as utils or presentation do not make the behaviour ungoverned.

Consume doctrine section 5 outputs: publication and getTruScoreConsumerPresentation; governed Highlights selection; resultContributionActions and consumerSurface helpers; prevailing origins and packet projections; existing bannerAlerts; and shareScoreSemantics. Avoid internal scores, legacy Confidence, raw OFF fields with governed projections and local form state as product truth.

Do not revive dormant components or flip MVP runtime gates. Do not reuse the dormant features/product TruScore card. Unknown Product entry styling may change while its call path remains intact; the legacy manual-product scoring journey must not be expanded. New extraction, packaging contribution, alternative evidence sources, entity resolution and scoring changes remain separate governed scope.

Install doctrine section 2 verbatim in Cursor's active working rule and reference its file zones. Before replacing a source-text control test, identify the protected behaviour and prove its named replacement. Do not delete a test because a screen moved or the build became inconvenient.

## 15 Proportionate evidence and acceptance

Evidence should answer whether the change works, preserves governed truth and helps the consumer. Reuse existing tests, fixtures, logs and accepted reviews. A new report is unnecessary when a clear link and concise result suffice. This lighter process does not remove the regression suites or consumption guards required by doctrine sections 10 and 12.

For a pure presentation change, compare the governed-outcome oracle G against the accepted base using the same evidence, authority snapshot, market, settlement and controlled temporal context. Preserve scores, ledger, publication, Confidence, actions, prevailing evidence, identity, Signals, certification resolution and share semantics as specified by the doctrine. Canonicalize only semantically irrelevant ordering.

For C-1 to C-4, list approved output differences explicitly while preserving unaffected outcomes. Do not bulk-regenerate goldens. After acceptance, record BC and use it or the accepted parent for subsequent comparisons, retaining the cumulative explanation from B0. Pending certification and packaging suites are not reported as passed; activate them when the governed baselines are accepted.

Run the doctrine-required checks for the candidate and targeted tests for the actual change. Consume existing test commands after verifying the current manifest. Record real failures, skips and environment limitations. Compare alleged pre-existing failures at the base with the same environment. Screenshots validate visual treatment; they do not establish unchanged authority behaviour.

| Priority | Meaning for Wave 5 | Normal disposition |
| --- | --- | --- |
| P0 | Critical truth, data integrity or widespread core-use failure | Stop affected delivery and resolve |
| P1 | Material governed breach, misleading result or blocked primary journey | Resolve before affected acceptance or release |
| P2 | Bounded secondary defect with usable core flow | Record and defer; fix only if small and safe |
| P3 | Polish, minor consistency or optional improvement | Defer unless essentially cost-free and low risk |

Do not silently relabel the doctrine's existing hazard IDs or severities. Assess the actual candidate and its effect. A historic P2 hazard with an approved corrective still requires that corrective's required outcome; the deferral principle does not cancel C-1 to C-4 or authorize a current locked-invariant breach.

Independent findings identify the SHA, file or behaviour, affected invariant, reproduction, impact and smallest correction. Consolidate them into the current work record. If reviewers disagree, resolve the concrete evidence or governing interpretation rather than adding repeated reviews by default. External review never substitutes for required device evidence.

## 16 Parallel integration and release

Certifications and Packaging and Recycling do not hold the core Score redesign. Build around current governed outputs and existing interfaces. Do not freeze unfinished parallel code as the final design, and do not build speculative abstraction layers merely to anticipate unknown contracts.

When a parallel baseline is accepted, obtain its exact SHA, accepted assets and governing decision. Inspect the actual changes. Identify which visible meanings, actions, contracts and tests are affected. Integrate the bounded changes through a separate commit or clearly identified work item, update doctrine placeholders through the controlled amendment process, and run required and affected checks.

Revisit only affected design and acceptance evidence. Retain unaffected layouts and consumer findings. A new capability can receive focused design treatment without reopening the whole Score direction. A conflict in an orchestrator or governed adapter receives AMBER assessment; a simple compatible display addition does not require a new architecture project.

Until accepted capabilities exist, packaging presentation uses current Planet publication, Highlights and permitted L3 content only; no packaging contribution or material interpretation is invented in UI. Certification artwork waits for its accepted display-permission baseline. Packet information retains its current unified journey.

Before release, perform one consolidated readiness assessment. Confirm the complete scoped scan, explore, contribute and share journey; required doctrine protections; real-device consumer and technical checks; accurate governed copy; closure of P0/P1 issues; and a concise deferred P2/P3 list. Record app SHA, installed build, device and OS, backend environment and relevant compatibility. Do not assume that a laptop checkout identifies the binary installed on a phone.

Use accumulated acceptance evidence and test the integrated candidate where needed. Further independent review targets remaining material risk, not every accepted GREEN edit. Do not make optional telemetry, formal quantitative research, extra documentation or unfinished parallel work a release condition unless founders expressly decide otherwise.

Founders authorize release. Record the last accepted compatible build and the practical recovery mechanism actually available. Preserve commit and evidence history. Do not assume a Git checkout instantly rolls back installed apps or reverse admitted evidence as part of a visual rollback. The team can continue future improvement from observed consumer use after a responsible MVP release.

## 17 Cursor instruction and concise handoff

Use the following standing instruction with the current scoped task. It replaces the process instructions in the v1.0 playbook. The doctrine's own section 2 rule must also remain verbatim in Cursor's project context.

Work in C:\TrueScan-FoodScanner on wave5/score-experience-20261008. The founder-accepted B0 is 99102768b61bd6e518bb889e3ab6f01dfc3e1268. Preserve the return branch. Read applicable repository instructions and the current doctrine. Check local status and origin before changes; preserve unrelated work and report intervening commits rather than resetting them.

Classify the scoped change before coding and identify affected INV-IDs. Execute routine GREEN work autonomously. Surface AMBER to the lead for assessment before the affected edit. Implement RED only with explicit founder approval naming the change. C-1 to C-4 are already approved within their required outcomes; do not reopen their approval or add unrelated work.

Before the affected edit, resolve any ambiguous screen, view, state or propagation scope with the lead or founder as appropriate. Implement the smallest coherent increment that delivers the stated consumer outcome. Use the shared visual roles and component variants so associated surfaces change together; do not introduce an isolated theme on the new Score screen. Consume governed outputs and existing callbacks. Keep orchestration in place unless a reviewed requirement needs movement. Do not infer missing capabilities from screenshots, add broad infrastructure, change runtime gates or perform unrelated cleanup. When a dependency is discovered, state the smallest governed alternative and continue unaffected work.

Verify the changed behaviour and the required doctrine protections. Preserve source-text controls through named behavioural replacements if needed. Use real device evidence for critical native journeys and clearly label what was not run. Commit coherent changes, push fast-forward and return the exact candidate SHA. Do not deploy or publish without the corresponding release instruction.

Each handoff can be short. Include: the surface IDs, states and GLOBAL/COMPONENT/LOCAL scope; work and classification; base and candidate SHAs; changed files and why; tests actually run and results; a screenshot or recording where useful; remaining P0/P1 issues; deferred P2/P3 observations; and any genuine decision needed. For the corrective package, add one evidence line per C-ID. For device work, include the installed build and environment. Link detailed logs instead of duplicating them into a new document.

The lead returns one consolidated disposition and instruction. Independent review, when needed, attaches findings to that same candidate and record. Cursor fixes the relevant findings and supplies the new SHA and affected evidence. Reviewers recheck the correction and dependencies, then close it. Routine GREEN work does not wait for a founder to approve this report.

Immediate instruction: record the accepted baseline and active doctrine rule, implement the bounded C-1 to C-4 package, and prepare its single independent review. In parallel, the lead begins Score concept exploration with representative governed states. Prepare an early working Score increment as soon as corrected behaviour and a sufficiently clear design direction are available.

## 18 Document control and supporting sources

Version 1.1, issued 8 October 2026, incorporates the founders' operating principles and accepted delivery adjustment. It is the current guiding execution document. Its Word, PDF and Markdown editions carry the same operative text. The Markdown edition is convenient for Cursor; PDF is convenient for review; Word is editable. Keep the version and substantive text aligned when revising any edition.

Changes from v1.0 are the removal of automatic approval ceremonies; consolidated review by risk; explicit autonomy for routine GREEN work; delegated AMBER assessment within doctrine bounds; provisional creative tools; an early connected Score increment; P0/P1 resolution with normal P2/P3 deferral; bounded absorption of parallel baselines; a single concise instruction and findings loop; stable screen and overlay identifiers; and a centrally managed visual system with explicit propagation and clarification rules. Required architectural protections and current scoring, publication and contribution rules remain controlling.

The founders' baseline acceptance is recorded in section 3. Acceptance of this execution approach does not assert that C-1 to C-4 have landed, that the external reviewer has passed them, or that any app build has passed UAT. Those facts are recorded against their actual SHAs when they occur. No new repository mutation or device test was performed merely to publish this revision.

Controlling source: Rveel_Wave_5_Architectural_Doctrine_and_Protected_Invariants_v0_3.md. Particularly sections 2, 4 to 10 and 12 to 13. This document does not rewrite its locked policy. Supplied locally by the founders.

Consumer mission: Scene_Setting_Rveel_Score_Card_20261008_v0_2.docx. Four pillars, three-level Highlights, incomplete evidence, contextual contribution and sharing. Supplied locally by the founders.

Founder execution decisions: messages of 8 October 2026 setting proportionate documentation, one-loop governance, risk-based acceptance, creative freedom, consumer-led validation and controlled scope; baseline acceptance; and acceptance of the clarified lighter approach before requesting this replacement master plan; and the subsequent requirement for precise surface naming, easily modifiable app-wide visual consistency, clarification before ambiguous implementation, and a light, bright, colourful but mature creative direction.

Code reference: https://github.com/TrueScanOnline/TruScore/tree/99102768b61bd6e518bb889e3ab6f01dfc3e1268. Prior targeted inspection covered Result, TruScore, score presentation, share semantics, contextual contribution prompts, result contribution actions, extraction, rateability types, package scripts and the H-10 commit diff. Additional inspection for this revision covered AppTabs.tsx, tabStackParamLists.ts, theme/index.ts, theme/colors.ts, and the entry definitions of ScoreHighlightsLookThroughModal and ShareModal. Reinspect affected paths at each implementation candidate; old line numbers are not authority.

Experience references: W3C WCAG 2.2 at https://www.w3.org/TR/WCAG22/ and Nielsen Norman Group progressive disclosure guidance at https://www.nngroup.com/articles/progressive-disclosure/. Consulted during v1.0 preparation on 8 October 2026. They inform practice; project-specific numerical targets remain provisional. The supplied five screenshots remain visual inspiration only.

10 October 2026: section 11 records the founder selection of A · Emerald Perspectives as the visual direction. Appearance only; corrective-package acceptance remains open; the direction is not recorded as implemented.

Future revisions should change this master only when a material operating decision or scope boundary changes. Routine GREEN findings and fixes belong in the current work record. Keep a dated one-line explanation for each substantive amendment; do not create a new documentation workstream around every increment.
