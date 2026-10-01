# Technical backlog — dormant Per 100 mL OFF dispatch

Recorded with the Wave 4A UAT staging loop. Not enabled.

The server nutrition schema still accepts `per_100ml`. That path sets `nutrition_data_per=100ml` and writes nutrient keys with the `_100g` suffix. Verify that field contract against Open Food Facts before any consumer Per 100 mL contribution is turned on.

The approved Per 100 g write now uses the documented `product_jqm2.pl` names: `nutriment_<id>` and `nutriment_<id>_unit`, with `nutrition_data_per=100g`. The dormant `per_100ml` path still sets `nutrition_data_per=100ml` and writes nutrient keys with the `_100g` suffix. Verify that field contract against Open Food Facts before any consumer Per 100 mL contribution is turned on.

The approved consumer Nutrition contribution remains Per 100 g only. This note does not enable or redesign Per 100 mL.
