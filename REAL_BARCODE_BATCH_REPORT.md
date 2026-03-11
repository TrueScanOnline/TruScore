# Real Barcode Batch Test Report

**Generated:** 2026-01-30T21:46:05.966Z
**Barcodes Tested:** 60
**Products Found:** 24
**Not Found:** 36

## Overall Success
- Product found rate: 24/60 (40.0%)
- Errors logged: 60

## Primary Source Hit Rates
| Database | Primary Hits | Rate |
|---|---:|---:|
| openfoodfacts | 23 | 38.3% |
| user_contributed | 1 | 1.7% |

## Databases Queried (Actual)
| Database | Queries | Rate |
|---|---:|---:|
| openfoodfacts | 23 | 38.3% |
| user_contributed | 1 | 1.7% |

## Per-Pillar Data Availability (Proxy)
These are based on actual data source fields present in results.

### Body Pillar Data Sources
| Source | Nutrition | Ingredients | Additives |
|---|---:|---:|---:|
| openfoodfacts | 22 | 17 | 10 |
| user_contributed | 1 | 1 | 1 |

### Open Pillar Data Sources
| Source | Ingredients | Origin |
|---|---:|---:|
| openfoodfacts | 17 | 7 |
| user_contributed | 1 | 1 |

### Ethics Pillar Signals
- Products with certifications: 15/60 (25.0%)
- Ethics score adjusted (!=15): 7/60 (11.7%)

## Pillar Score Summary (Found Products Only)
| Pillar | Count | Avg | Min | Max |
|---|---:|---:|---:|---:|
| Body | 24 | 12.1 | 2 | 25 |
| Planet | 24 | 14.3 | 3 | 23 |
| Ethics | 24 | 12.3 | 0 | 21 |
| Open | 24 | 13.1 | 0 | 25 |

## Errors Observed
| Error | Count |
|---|---:|
| Product not found | 36 |
| Cannot read properties of undefined (reading 'score') | 24 |

## Attempted Queries vs Contributions (Actual)
These are from QUERY_STRATEGY logs (attempted) vs actual data contributions in results.

| Database | Attempted | Primary Hits | Any Contribution |
|---|---:|---:|---:|
| Open Food Facts | 60 | 23 | 23 |
| Open Beauty Facts | 60 | 0 | 0 |
| Open Pet Food Facts | 60 | 0 | 0 |
| Open Products Facts | 60 | 0 | 0 |
| SQLite | 60 | 0 | 0 |
| Cache | 60 | 0 | 0 |
| GS1 | 60 | 0 | 0 |
| Spoonacular | 60 | 0 | 0 |
| Barcode Lookup | 60 | 0 | 0 |
| USDA | 60 | 0 | 0 |
| Health Canada | 60 | 0 | 0 |
| UK FSA | 60 | 0 | 0 |
| EFSA | 60 | 0 | 0 |
| FSANZ | 60 | 0 | 0 |

## Cost vs Contribution Ranking (This Batch)
Sorted by attempted queries with zero contribution.

- Open Beauty Facts: attempted 60, contribution 0
- Open Pet Food Facts: attempted 60, contribution 0
- Open Products Facts: attempted 60, contribution 0
- SQLite: attempted 60, contribution 0
- Cache: attempted 60, contribution 0
- GS1: attempted 60, contribution 0
- Spoonacular: attempted 60, contribution 0
- Barcode Lookup: attempted 60, contribution 0
- USDA: attempted 60, contribution 0
- Health Canada: attempted 60, contribution 0
- UK FSA: attempted 60, contribution 0
- EFSA: attempted 60, contribution 0
- FSANZ: attempted 60, contribution 0