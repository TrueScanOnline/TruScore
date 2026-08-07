# Dynamic Signals Asset v0.2 — Founder UAT matrix (production Asset)

**Baseline tag:** `dynamic-signals-asset-v0.2-uat-20260808`  
**Production baseline commit:** `a574254071e68959177b21025d542ec6afc1ffac`  
**Governed UAT commit (tagged):** `a730bcb56df11a7736d5496776bce45b25760072`  
**Asset flag:** `EXPO_PUBLIC_DYNAMIC_SIGNALS_ASSET=1`  
**Skeleton:** retired — must not activate  
**Naming:** existing Signal UI only — no “Beyond the Label”

### EAS builds (submitted from tagged tip)

| Platform | Profile | Identifier | Logs |
|----------|---------|------------|------|
| iOS | `uat-dynamic-signals-ios` · BN **31** | `a89c79c8-a8cb-45bc-b3a7-3badd362ad6c` | https://expo.dev/accounts/crwmlw/projects/truescan-food-scanner/builds/a89c79c8-a8cb-45bc-b3a7-3badd362ad6c |
| Android | `uat-dynamic-signals-android` · versionCode **14** | `1578e986-2c00-4846-b9d9-62860ddb1a8e` | https://expo.dev/accounts/crwmlw/projects/truescan-food-scanner/builds/1578e986-2c00-4846-b9d9-62860ddb1a8e |

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

## Product-data vs Signals

If a barcode returns **no Rveel product / no TruScore**, record as **product-data coverage outcome**. Do not fail Dynamic Signals on that alone. Re-try with a pack that successfully resolves identity.
