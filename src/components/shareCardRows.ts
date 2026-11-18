/**
 * Visual rows for the captured share card.
 * These repeat marks already on the Result card: pillar logos, nutrient level labels,
 * and the country flag. They do not choose or rescore anything.
 */

import { assessGovernedNutrientsFromProduct } from '../nutrition';
import type { GovernedNutrientLevel } from '../nutrition';
import { productOriginsCardPresentation, projectOriginConsumerLines } from '../origins/productOriginsCard';
import { resultEmeraldPillar, type ResultPillarKey } from '../theme/resultPresentation';
import type { Product } from '../types/product';
import { countryFlagEmoji } from '../utils/countryFlagEmoji';
import { getNutrientValue100g, resolveKcalPer100g } from '../utils/nutritionPer100g';
import { getNutritionShareBurnData } from '../utils/nutritionShareCopy';
import { displayCertificationName } from '../certifications/resolveCertification';
import { PACKET_ABSENCE_PRODUCT_STATE } from '../contribution/resultContributionActions';
import {
  PACKET_CLAIMS_EMPTY_STATE,
  packetClaimsRecognisedMarks,
  packetLineWithdrawn,
} from './packetClaimsCardCopy';
import { PRODUCT_ORIGINS_EMPTY_STATE, productOriginsCardShowsEmptyState } from './productOriginsCardCopy';
import { ordinaryLinesBesideRecognisedCertifications } from '../certifications/resolveCertification';

export type ShareNutrientLevelLabel = 'Low' | 'Mid' | 'High';

export type ShareCardRow =
  | { kind: 'text'; text: string }
  | { kind: 'pillar'; glyph: 'human' | 'leaf' | 'book-open-page-variant' | 'eye'; color: string; text: string }
  | { kind: 'nutrient'; text: string; level?: ShareNutrientLevelLabel; levelColor?: string }
  | { kind: 'origin'; statement: string; country: string; support: string[]; packWording: string };

export function nutritionLevelLabel(level: Exclude<GovernedNutrientLevel, 'unavailable'>): ShareNutrientLevelLabel {
  if (level === 'low') return 'Low';
  if (level === 'moderate') return 'Mid';
  return 'High';
}

export function nutritionLevelColor(
  level: Exclude<GovernedNutrientLevel, 'unavailable'>,
  darkMode: boolean
): string {
  if (level === 'low') return darkMode ? '#2EBEA0' : '#16a085';
  if (level === 'moderate') return darkMode ? '#ffd93d' : '#b8860b';
  return '#ff6b6b';
}

function stated(value: number | undefined, unit: string): string | null {
  if (value == null || Number.isNaN(value)) return null;
  if (unit === 'kcal' || unit === 'mg') return `${Math.round(value)} ${unit}`;
  const rounded = Math.round(value * 10) / 10;
  return `${rounded} ${unit}`;
}

function ratedLevel(
  level: GovernedNutrientLevel | undefined,
  darkMode: boolean
): { level: ShareNutrientLevelLabel; levelColor: string } | undefined {
  if (!level || level === 'unavailable') return undefined;
  return { level: nutritionLevelLabel(level), levelColor: nutritionLevelColor(level, darkMode) };
}

/** Nutrition lines in the same order as the Nutrition card, with a level only where that card shows one. */
export function nutritionShareRows(product: Product, darkMode: boolean): ShareCardRow[] {
  const assessment = assessGovernedNutrientsFromProduct(product);
  const nutriments = product.nutriments;
  const rows: ShareCardRow[] = [
    { kind: 'text', text: assessment.per100Basis === '100ml' ? 'Per 100 mL' : 'Per 100 g' },
  ];
  const plain: Array<[string, string | null]> = [
    ['Energy', stated(resolveKcalPer100g(nutriments) ?? undefined, 'kcal')],
    ['Fat', stated(getNutrientValue100g(nutriments, 'fat'), 'g')],
  ];
  for (const [label, value] of plain) {
    if (value) rows.push({ kind: 'nutrient', text: `${label} ${value}` });
  }
  const saturated = stated(getNutrientValue100g(nutriments, 'saturated-fat'), 'g');
  if (saturated) {
    rows.push({
      kind: 'nutrient',
      text: `Saturated fat ${saturated}`,
      ...ratedLevel(assessment.nutrients.saturatedFat.level, darkMode),
    });
  }
  const carbohydrates = stated(getNutrientValue100g(nutriments, 'carbohydrates'), 'g');
  if (carbohydrates) rows.push({ kind: 'nutrient', text: `Carbohydrates ${carbohydrates}` });
  const sugars = stated(getNutrientValue100g(nutriments, 'sugars'), 'g');
  if (sugars) {
    rows.push({
      kind: 'nutrient',
      text: `Sugars ${sugars}`,
      ...ratedLevel(assessment.nutrients.totalSugars.level, darkMode),
    });
  }
  const fiber = stated(getNutrientValue100g(nutriments, 'fiber'), 'g');
  if (fiber) rows.push({ kind: 'nutrient', text: `Fiber ${fiber}` });
  const proteins = stated(getNutrientValue100g(nutriments, 'proteins'), 'g');
  if (proteins) rows.push({ kind: 'nutrient', text: `Proteins ${proteins}` });
  const sodiumText = stated(assessment.nutrients.sodium.rawPer100, 'mg');
  if (sodiumText) {
    rows.push({
      kind: 'nutrient',
      text: `Sodium ${sodiumText}`,
      ...ratedLevel(assessment.nutrients.sodium.level, darkMode),
    });
  }
  if (product.serving_size?.trim()) rows.push({ kind: 'text', text: `Serving size ${product.serving_size.trim()}` });
  const burn = getNutritionShareBurnData(nutriments).burn;
  if (burn) {
    rows.push({
      kind: 'text',
      text: `About ${burn.walking} min walking, ${burn.running} min jogging, ${burn.cycling} min cycling`,
    });
  }
  return rows.length > 1 ? rows : [{ kind: 'text', text: 'Nutrition for this product is not listed.' }];
}

export function nutritionShareText(product: Product): string {
  return nutritionShareRows(product, false)
    .map((row) => {
      if (row.kind === 'nutrient' && row.level) return `${row.text} · ${row.level}`;
      if (row.kind === 'nutrient' || row.kind === 'text') return row.text;
      return '';
    })
    .filter((line) => line.length > 0)
    .join('\n');
}

/** Origin rows in product-card order, including the flag lockup when that card shows one. */
export function originShareRows(product: Product, country?: string): ShareCardRow[] {
  const presentation = productOriginsCardPresentation(product);
  const lines = projectOriginConsumerLines(presentation.facts);
  if (productOriginsCardShowsEmptyState({ offCountry: presentation.offCountry, consumerLineCount: lines.length })) {
    return [{ kind: 'text', text: PRODUCT_ORIGINS_EMPTY_STATE }];
  }
  const rows: ShareCardRow[] = [];
  if (presentation.offCountry) {
    rows.push({ kind: 'origin', statement: '', country: presentation.offCountry, support: [], packWording: '' });
  }
  for (const line of lines) {
    rows.push({
      kind: 'origin',
      statement: line.statement,
      country: line.country,
      support: line.supporting,
      packWording: line.packWording,
    });
  }
  if (rows.length === 0 && country?.trim()) {
    rows.push({ kind: 'origin', statement: '', country: country.trim(), support: [], packWording: '' });
  }
  return rows.length > 0 ? rows : [{ kind: 'text', text: PRODUCT_ORIGINS_EMPTY_STATE }];
}

export function originShareText(product: Product, country?: string): string {
  return originShareRows(product, country)
    .map((row) => {
      if (row.kind === 'text') return row.text;
      if (row.kind !== 'origin') return '';
      const flag = countryFlagEmoji(row.country);
      const place = `${flag} ${row.country}`.trim();
      const head = row.statement ? `${row.statement}\n${place}` : place;
      const pack = row.packWording ? `"${row.packWording}"` : '';
      return [head, ...row.support, pack].filter((line) => line.length > 0).join('\n');
    })
    .filter((line) => line.length > 0)
    .join('\n');
}

/**
 * Packet Claims share rows — same governed projection as the Result card.
 * Does not invent claims, certifications, or absence.
 */
export function packetClaimsShareRows(product: Product): ShareCardRow[] {
  const withdrawnSubjectKeys = product.rveelWithdrawnPacketSubjectKeys;
  const recognisedCertificationNames = (product.certifications || []).map((cert) =>
    displayCertificationName(cert)
  );
  const visibleClaims = (product.rveelGovernedPacketClaims || [])
    .filter(
      (claim) =>
        !packetLineWithdrawn('claim', claim.exactWording, withdrawnSubjectKeys) &&
        ordinaryLinesBesideRecognisedCertifications([claim.exactWording], recognisedCertificationNames)
          .length > 0
    )
    .map((claim) => claim.exactWording.trim())
    .filter((text) => text.length > 0);
  const visibleCertifications = ordinaryLinesBesideRecognisedCertifications(
    product.rveelGovernedCertifications || [],
    recognisedCertificationNames
  ).filter((name) => !packetLineWithdrawn('certification', name, withdrawnSubjectKeys));
  const recognisedMarks = packetClaimsRecognisedMarks({
    marks: product.certifications || [],
    labelHierarchy: product.labels_hierarchy,
    governedCertificationNames: visibleCertifications,
    withdrawnSubjectKeys,
  }).map((cert) => displayCertificationName(cert));

  const lines = [...new Set([...recognisedMarks, ...visibleCertifications, ...visibleClaims])];
  if (product.rveelPacketAbsenceEstablished === true) {
    return [{ kind: 'text', text: PACKET_ABSENCE_PRODUCT_STATE }];
  }
  if (lines.length === 0) {
    return [{ kind: 'text', text: PACKET_CLAIMS_EMPTY_STATE }];
  }
  return lines.map((text) => ({ kind: 'text' as const, text }));
}

export function packetClaimsShareText(product: Product): string {
  return packetClaimsShareRows(product)
    .map((row) => (row.kind === 'text' ? row.text : ''))
    .filter((line) => line.length > 0)
    .join('\n');
}

export function highlightShareRows(
  entries: Array<{ pillar: ResultPillarKey; text: string }>,
  darkMode: boolean
): ShareCardRow[] {
  const rows: ShareCardRow[] = [];
  for (const entry of entries) {
    const text = entry.text.trim();
    if (!text) continue;
    const role = resultEmeraldPillar(entry.pillar, darkMode);
    rows.push({ kind: 'pillar', glyph: role.glyph, color: role.icon, text });
  }
  return rows;
}
