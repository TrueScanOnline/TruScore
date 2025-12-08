# Change Log

# Date: 01/21/2025

## `metadata_contains.tsv`
### Minor Changes
- Added a new column, 'is_outlier', to indicate whether the concentration value is abnormal. The outliers are not used to calculate the displayed concentration value.

# Date: 07/15/2024

## `entities.tsv`
### Major Changes
- Switched primary identifier from PubChem CID to ChEBI ID, CDNO ID, and FDC Nutrient ID.
- Imported the entire ChEBI compound, CDNO nutrient, and FDC nutrient databases.
- Replaced PubChem CID synonyms by ChEBI synonyms.
- Added a new column, '_synonyms_display'.
- Removed orphans, i.e., entities without external identifiers.
### Minor Changes
- For 'external_ids' column, removed trailing '_id' or '_ids'.

## `triplets.tsv`
### Major Changes
- Moved 'r2' relationship, i.e., 'is_a', to `*_ontology.tsv` files.
- Triplet IDs are changed due to entities.tsv changes.
### Minor Changes
- None.

## `metadata_contains.tsv`
### Major Changes
- Added a new source "lit2kg:gpt-3.5-ft".
### Minor Changes
- None

## `food_groups.tsv`
### Major Changes
- None.
### Minor Changes
- Renamed the group column name to ontology database name.
- Changed value from string to list for consistency.

## `chemical_groups.tsv`
- None.
### Major Changes
- Renamed the group column name to ontology database name.
- Changed value from string to list for consistency.

## `food_ontology.tsv`
### Major Changes
- New file. Contains the food ontology.
### Minor Changes
- None

## `chemical_ontology.tsv`
### Major Changes
- New file. Contains the chemical ontology.
### Minor Changes
- None
