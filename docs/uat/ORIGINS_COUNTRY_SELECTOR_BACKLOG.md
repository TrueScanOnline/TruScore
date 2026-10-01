# Governed Origins country selector

The Origins contribution journey uses the existing manual product-entry `CountryPicker` (`src/components/CountryPicker.tsx`).

Each country on an origin statement is one selector: dropdown list plus type-to-search over the full global country set. The submitted value is the canonical country name already recognised by the Origins evidence model (`originCountry` / `originCountries`). The reviewed packet wording stays in its own field and is not rewritten when a country is selected.

Multi-country evidence uses one selector per country, including an additional blank selector, and still serialises into the existing comma-joined place field.
