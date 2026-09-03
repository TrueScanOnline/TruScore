/**
 * Open Pillar v15 — score-neutral commentary metadata for origins adjustments.
 * Does not change scoring observations or arithmetic.
 */

import type { Product } from '../../../types/product';
import {
  getStructuredOffOriginTags,
  type OpenOriginsV15Assessment,
} from './openPillarOriginsV15';
import { tokenizeIngredientsText } from './openPillarHiddenTerms';
import type { OpenV15AdjustmentId } from './openPillarV15Registry';

export type OpenCommentaryMetadata = Record<string, string | number | boolean>;

function titleCaseCountry(country: string): string {
  return country
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function ingredientTokensForOriginsGate(ingredientsText: string): string[] {
  const tokens = tokenizeIngredientsText(ingredientsText);
  if (tokens.length > 0) return tokens;
  const trimmed = ingredientsText.trim();
  return trimmed ? [trimmed] : [];
}

export function buildOpenOriginsCommentaryMetadata(
  product: Product,
  ingredientsText: string,
  assessment: OpenOriginsV15Assessment
): OpenCommentaryMetadata | undefined {
  const id = assessment.id as OpenV15AdjustmentId;
  const meta: OpenCommentaryMetadata = {
    originDisclosureState: id,
  };

  const structuredCountries = getStructuredOffOriginTags(product);
  const sourceStatement =
    (typeof product.origins === 'string' && product.origins.trim()) ||
    structuredCountries[0] ||
    '';
  if (sourceStatement) meta.sourceStatement = sourceStatement;

  if (id === 'open-v15-origins-evidently-complete') {
    const tokens = ingredientTokensForOriginsGate(ingredientsText);
    if (tokens.length === 1 && structuredCountries.length === 1) {
      meta.singleIngredient = true;
      meta.ingredient = tokens[0];
      meta.country = titleCaseCountry(structuredCountries[0]);
    }
  }

  return meta;
}

export function buildOpenClarityCommentaryMetadata(
  hiddenTermAssessment: {
    termPresentationClass: 'broad_generic' | 'coded' | 'mixed';
    matchedTerms: string;
    decodedAdditiveNames: string;
  },
  market?: 'AU' | 'NZ'
): OpenCommentaryMetadata {
  return {
    termPresentationClass: hiddenTermAssessment.termPresentationClass,
    matchedTerms: hiddenTermAssessment.matchedTerms,
    ...(hiddenTermAssessment.decodedAdditiveNames && {
      decodedAdditiveNames: hiddenTermAssessment.decodedAdditiveNames,
    }),
    ...(market && { market }),
  };
}
