# Dynamic Signals Asset v0.2 — Founder UAT matrix (production Asset)

**Content baseline tag:** `dynamic-signals-asset-v0.2-uat-20260808`  
**Content commit:** `a730bcb56df11a7736d5496776bce45b25760072`  
**Result-isolation correction tag:** `dynamic-signals-asset-v0.2-uat-20260808-result-isolation`  
**Asset flag:** `EXPO_PUBLIC_DYNAMIC_SIGNALS_ASSET=1`  
**Skeleton:** retired — must not activate  
**Naming:** existing Signal UI only — no “Beyond the Label”

### Hold — do not publish to testers

| Platform | Profile | Identifier | Status |
|----------|---------|------------|--------|
| iOS | `uat-dynamic-signals-ios` · BN **31** | `a89c79c8-a8cb-45bc-b3a7-3badd362ad6c` | **HOLD** (errored — Node `fs` in Bundle JS) |
| Android | `uat-dynamic-signals-android` · VC **13** | `1578e986-2c00-4846-b9d9-62860ddb1a8e` | **HOLD** (errored — Node `fs` in Bundle JS) |
| Any build from `f00d3e1` (embed-only, pre-isolation) | — | — | **HOLD** — superseded by result-isolation correction |

### Replacement EAS builds (result-isolation corrected tip)

| Platform | Profile | Identifier | Logs |
|----------|---------|------------|------|
| iOS | `uat-dynamic-signals-ios` · BN **33** | `c4ddec30-3be6-4c8a-b097-ca8486884cd7` | https://expo.dev/accounts/crwmlw/projects/truescan-food-scanner/builds/c4ddec30-3be6-4c8a-b097-ca8486884cd7 |
| Android | `uat-dynamic-signals-android` · versionCode **15** | `1af94081-25f8-47f7-bc11-1c12d6ace096` | https://expo.dev/accounts/crwmlw/projects/truescan-food-scanner/builds/1af94081-25f8-47f7-bc11-1c12d6ace096 |

**Binary tip:** `934cf1c101dec08c20c12128c38f5b742f726f96` (`dynamic-signals-asset-v0.2-uat-20260808-result-isolation`)  
**Do not release** until both builds finish green and founder approval.
### Result-isolation contract (required)

1. Product data / TruScore ready → render primary result immediately (`product_result_ready`)
2. Evaluate Dynamic Signals independently afterward (`signals_ready` · `attached` | `empty` | `failed`)
3. Signals failure must not prevent or disturb the primary result
4. Ordinary loading/render transitions must not re-parse the Asset embed or re-evaluate Signals for the same key
5. On-device Asset data is embedded (no Node `fs`)

## Publishable Signals under test (4)

| Signal ID | Class | Market | Target | What to verify |
|-----------|-------|--------|--------|----------------|
| SIG-SR-AU-003 | Safety & Regulatory | AU | Coles entity `P0002` | Appears for Coles own-label; **not** for third-party brands merely stocked at Coles |
| SIG-IN-GL-001 | In the News | AU+NZ | Cadbury `B0067` brand_descendants | Cadbury / Dairy Milk positive; source + qualification + Mondelez response |
| SIG-IN-GL-002 | In the News | AU+NZ | Dairy Milk / KitKat / Mars / Magnum / Hershey’s | Brand-risk context; company responses; **no** packet-trace claim |
| SIG-IN-NZ-005 | In the News | NZ | Talley's `P0158` entity_descendants | NZ market only; company-context qualification |

Held Signals (12) must **not** appear publicly.

## Practical scan cases

| Case | Product suggestion | Retail GTIN (if known) | Market | Expected Signals | Notes |
|------|--------------------|------------------------|--------|------------------|-------|
| NZ — Talley’s company context | Any **Talley's** branded retail pack that Rveel resolves to brand B0655 / parent P0158 | Use pack barcode on shelf | **NZ** | `SIG-IN-NZ-005` | If fetch returns no product/TruScore → **product-data coverage**, not Signals failure |
| AU — Coles own-label | Coles Brand / Coles Simply / other Coles private-label SKU resolved to parent **P0002** | Prefer pack with known Coles own-label barcode from prior UAT stock | **AU** | `SIG-SR-AU-003` | Third-party brand sold at Coles must **not** fire this Signal |
| AU — Cadbury descendant | Cadbury Dairy Milk Milk Chocolate 180 g | `9300617064879` | **AU** | `SIG-IN-GL-001` and usually `SIG-IN-GL-002` (Dairy Milk target) | Confirm brand resolves Cadbury / Dairy Milk; check source links + qualifications |
| AU — Cadbury umbrella | Cadbury chocolate block that resolves to **B0067** without Dairy Milk child | Pack on shelf | **AU** | `SIG-IN-GL-001` (Cadbury-wide); `SIG-IN-GL-002` only if a listed brand target matches | Descendant inheritance via `brand_child_of_brand` for Dairy Milk under Cadbury-wide |
| AU — Ritz negative | RITZ Original crackers 227 g | `9310034002415` | **AU** | **None** of the Cadbury/chocolate Signals | Same Mondelēz parent must **not** fire Cadbury Signals |
| AU — KitKat positive (GL-002) | KitKat Chunky / KitKat bar that resolves to **B0060** | Prefer retail KitKat GTIN that OFF returns Nestlé/KitKat | **AU** | `SIG-IN-GL-002` | Brand-risk context only |
| Negative / no Signal | Unrelated brand with no Asset target (e.g. Jalna yoghurt if chain is Jalna-only) | `9310354982466` (if product fetch succeeds) | AU | **No** Dynamic Signals cards | Confirms fail-closed outside governed targets |

## Presentation checks (every positive Signal)

- Source attribution / evidence URL present and opens the approved source
- Scope qualification visible (company/brand context; no over-claim)
- Subject response shown where status is `captured_from_source`
- No “Beyond the Label” or other unapproved umbrella label
- TruScore / Body / Planet / Ethics / Open unchanged by Signal presence
- Primary product/TruScore appears **before** Signals cards when Signals are slow or fail

## Product-data vs Signals

If a barcode returns **no Rveel product / no TruScore**, record as **product-data coverage outcome**. Do not fail Dynamic Signals on that alone. Re-try with a pack that successfully resolves identity.
