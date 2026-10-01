# Technical backlog — dormant Per 100 mL OFF dispatch

Recorded with the Wave 4A UAT staging loop. Not enabled.

The server nutrition schema still accepts `per_100ml`. That path sets `nutrition_data_per=100ml` and writes nutrient keys with the `_100g` suffix. Verify that field contract against Open Food Facts before any consumer Per 100 mL contribution is turned on.

The same `_100g` nutrient keys are what the approved Per 100 g dispatch sends. On 2026-10-01, staging accepted that dispatch and stored `nutrition_data_per=100g`, but the nutrient values were not on the product afterwards (`en:no-nutrition-data`). Confirm the write field names before changing either path.

The approved consumer Nutrition contribution remains Per 100 g only. This note does not enable or redesign Per 100 mL.
