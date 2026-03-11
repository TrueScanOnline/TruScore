import json
from collections import Counter, defaultdict
from statistics import mean

with open('real_barcode_batch_results.json','r',encoding='utf-8') as f:
    data = json.load(f)

results = data.get('results', [])

total = len(results)
found = [r for r in results if r.get('product')]
not_found = [r for r in results if not r.get('product')]

primary_counts = Counter()
queried_counts = Counter()
all_source_counts = Counter()

nutri_source_counts = Counter()
ingred_source_counts = Counter()
additive_source_counts = Counter()
origin_source_counts = Counter()

errors_count = 0
error_messages = Counter()

ethics_adjusted = 0
has_certs = 0

scores = defaultdict(list)

for r in results:
    ds = r.get('dataSources') or {}
    primary = ds.get('primarySource')
    if primary:
        primary_counts[primary] += 1
    for db in ds.get('databasesQueried', []) or []:
        queried_counts[db] += 1
    for db in ds.get('allSources', []) or []:
        all_source_counts[db] += 1

    nutrition = (ds.get('nutrition') or {})
    for s in nutrition.get('sources', []) or []:
        nutri_source_counts[s] += 1

    ingredients = (ds.get('ingredients') or {})
    for s in ingredients.get('sources', []) or []:
        ingred_source_counts[s] += 1

    additives = (ds.get('allergensAdditives') or {})
    for s in additives.get('additivesSources', []) or []:
        additive_source_counts[s] += 1

    origin = (ds.get('countryOfOrigin') or {})
    for s in origin.get('sources', []) or []:
        origin_source_counts[s] += 1

    errs = r.get('errors') or []
    if errs:
        errors_count += 1
        for e in errs:
            msg = e.get('message') or 'unknown'
            error_messages[msg] += 1

    ts = r.get('truScore') or {}
    breakdown = ts.get('breakdown') or {}
    for k,v in breakdown.items():
        if isinstance(v, (int,float)):
            scores[k].append(v)

    # ethics adjusted: ethics score not equal to base 15 OR has certifications
    if 'Ethics' in breakdown and isinstance(breakdown['Ethics'], (int,float)):
        if breakdown['Ethics'] != 15:
            ethics_adjusted += 1
    prod = r.get('product') or {}
    if prod.get('hasCertifications'):
        has_certs += 1


def rate(n):
    return f"{n}/{total} ({(n/total*100):.1f}%)" if total else "0/0 (0%)"

report_lines = []
report_lines.append('# Real Barcode Batch Test Report')
report_lines.append('')
report_lines.append(f"**Generated:** {data.get('testRun',{}).get('timestamp')}")
report_lines.append(f"**Barcodes Tested:** {total}")
report_lines.append(f"**Products Found:** {len(found)}")
report_lines.append(f"**Not Found:** {len(not_found)}")
report_lines.append('')

report_lines.append('## Overall Success')
report_lines.append(f"- Product found rate: {rate(len(found))}")
report_lines.append(f"- Errors logged: {errors_count}")
report_lines.append('')

report_lines.append('## Primary Source Hit Rates')
report_lines.append('| Database | Primary Hits | Rate |')
report_lines.append('|---|---:|---:|')
for db, cnt in primary_counts.most_common():
    report_lines.append(f"| {db} | {cnt} | {cnt/total*100:.1f}% |")
report_lines.append('')

report_lines.append('## Databases Queried (Actual)')
report_lines.append('| Database | Queries | Rate |')
report_lines.append('|---|---:|---:|')
for db, cnt in queried_counts.most_common():
    report_lines.append(f"| {db} | {cnt} | {cnt/total*100:.1f}% |")
report_lines.append('')

report_lines.append('## Per-Pillar Data Availability (Proxy)')
report_lines.append('These are based on actual data source fields present in results.')

report_lines.append('### Body Pillar Data Sources')
report_lines.append('| Source | Nutrition | Ingredients | Additives |')
report_lines.append('|---|---:|---:|---:|')
all_sources = sorted(set(list(nutri_source_counts)+list(ingred_source_counts)+list(additive_source_counts)))
for s in all_sources:
    report_lines.append(f"| {s} | {nutri_source_counts.get(s,0)} | {ingred_source_counts.get(s,0)} | {additive_source_counts.get(s,0)} |")
report_lines.append('')

report_lines.append('### Open Pillar Data Sources')
report_lines.append('| Source | Ingredients | Origin |')
report_lines.append('|---|---:|---:|')
for s in sorted(set(list(ingred_source_counts)+list(origin_source_counts))):
    report_lines.append(f"| {s} | {ingred_source_counts.get(s,0)} | {origin_source_counts.get(s,0)} |")
report_lines.append('')

report_lines.append('### Ethics Pillar Signals')
report_lines.append(f"- Products with certifications: {has_certs}/{total} ({has_certs/total*100:.1f}%)")
report_lines.append(f"- Ethics score adjusted (!=15): {ethics_adjusted}/{total} ({ethics_adjusted/total*100:.1f}%)")
report_lines.append('')

report_lines.append('## Pillar Score Summary (Found Products Only)')
report_lines.append('| Pillar | Count | Avg | Min | Max |')
report_lines.append('|---|---:|---:|---:|---:|')
for pillar, vals in scores.items():
    if vals:
        report_lines.append(f"| {pillar} | {len(vals)} | {mean(vals):.1f} | {min(vals)} | {max(vals)} |")
report_lines.append('')

report_lines.append('## Errors Observed')
report_lines.append('| Error | Count |')
report_lines.append('|---|---:|')
for msg, cnt in error_messages.most_common():
    report_lines.append(f"| {msg} | {cnt} |")
report_lines.append('')

with open('REAL_BARCODE_BATCH_REPORT.md','w',encoding='utf-8') as f:
    f.write('\n'.join(report_lines))

print('Report written: REAL_BARCODE_BATCH_REPORT.md')
print(f"Products found: {len(found)}/{total}")

