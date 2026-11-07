/**
 * W5-UI-12 — contrasting orange for the in-button agreement count.
 * Pure colour helper (no React Native UI imports) for tests and presentation.
 */
export function agreementCountOrange(darkMode: boolean, selected: boolean): string {
  if (selected) {
    // Filled emerald / mint button — keep the count readable on the fill.
    return darkMode ? '#9A3412' : '#FFE0B2';
  }
  return darkMode ? '#FFB14A' : '#E07000';
}
