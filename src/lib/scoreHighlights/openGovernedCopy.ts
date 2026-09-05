/**
 * Founder-locked Open ingredient-clarity / origins L1/L2 variants.
 * Authority: Rveel_Wave3_Open_Score_Highlights_Founder_Locked_Commentary_L3_ID_Contract_20260905_v0_2
 * and the Consolidated Controlling Specification 20260905 v0.5 §5 (Open).
 *
 * Variants are selected from score-neutral metadata on the fired adjustment — never from raw
 * product fields — and fail closed when the governed metadata cannot supply the locked tokens.
 */

import type { OpenV15AdjustmentId } from '../truscoreEngine/pillars/openPillarV15Registry';

type Metadata = Record<string, string | number | boolean> | undefined;

export interface ResolvedOpenCopy {
  l1: string;
  l2: string;
}

function splitPipeList(value: string | undefined): string[] {
  if (!value) return [];
  return value.split('|').map((s) => s.trim()).filter(Boolean);
}

function formatTermsList(terms: string[]): string {
  if (terms.length === 0) return '';
  if (terms.length === 1) return terms[0];
  if (terms.length === 2) return `${terms[0]} and ${terms[1]}`;
  return `${terms.slice(0, -1).join(', ')} and ${terms[terms.length - 1]}`;
}

function resolveOpenIngredientClarityCopy(
  adjustmentId: OpenV15AdjustmentId,
  metadata: Metadata
): ResolvedOpenCopy | null {
  if (adjustmentId === 'open-v15-ing-clarity-zero') {
    return {
      l1: 'Ingredient wording is clear where assessed',
      l2:
        'In the ingredient list we could assess, we did not find any of the broad, generic or code-dependent terms we check ' +
        'for. That does not mean every detail about the product is disclosed.',
    };
  }

  const presentationClass = metadata?.termPresentationClass;
  if (typeof presentationClass !== 'string') return null;

  const terms = splitPipeList(
    typeof metadata?.matchedTerms === 'string' ? metadata.matchedTerms : undefined
  );
  const decodedNames = splitPipeList(
    typeof metadata?.decodedAdditiveNames === 'string' ? metadata.decodedAdditiveNames : undefined
  );

  if (adjustmentId === 'open-v15-ing-clarity-one') {
    if (presentationClass === 'broad_generic') {
      if (!terms[0]) return null;
      return {
        l1: 'One ingredient term is vague',
        l2:
          `The ingredient list says “${terms[0]}”. This is a broad description, and in the wording we could assess it does ` +
          `not identify the specific ingredient or substance represented by ${terms[0]}.`,
      };
    }
    if (presentationClass === 'coded') {
      const plainName = decodedNames[0];
      if (!terms[0] || !plainName) return null;
      return {
        l1: 'One ingredient needs decoding',
        l2:
          `“${terms[0]}” is a standard food-additive number for ${plainName}. The code identifies the additive precisely, ` +
          'but a shopper needs to know or look up the number to see the additive’s name.',
      };
    }
    return null;
  }

  if (adjustmentId === 'open-v15-ing-clarity-two') {
    if (presentationClass === 'broad_generic') {
      if (!terms[0] || !terms[1]) return null;
      return {
        l1: 'Two ingredient terms are vague',
        l2:
          `The ingredient list uses two broad descriptions: “${terms[0]}” and “${terms[1]}”. In the wording we could ` +
          'assess, they do not identify the specific ingredients or substances represented by those categories.',
      };
    }
    if (presentationClass === 'coded') {
      return {
        l1: 'Two ingredients need decoding',
        l2:
          'Two additives are listed mainly by number. The codes identify them precisely, but a shopper needs to know or ' +
          'look them up to see their names.',
      };
    }
    if (presentationClass === 'mixed') {
      return {
        l1: 'Some ingredient wording needs explanation',
        l2:
          'This ingredient list combines a broad description with a coded additive number. Tap through to see what each ' +
          'term means.',
      };
    }
    return null;
  }

  if (adjustmentId === 'open-v15-ing-clarity-three-plus') {
    if (presentationClass === 'broad_generic') {
      const termsPhrase = formatTermsList(terms);
      if (!termsPhrase) return null;
      return {
        l1: 'Several ingredient terms are vague',
        l2:
          `Several broad ingredient descriptions appear in this list, including ${termsPhrase}. In the wording we could ` +
          'assess, they leave parts of the ingredient make-up unspecified.',
      };
    }
    if (presentationClass === 'coded') {
      return {
        l1: 'Several ingredients need decoding',
        l2:
          'Several additives are listed mainly by number. The codes identify them precisely, but a shopper needs to know ' +
          'or look them up to see their names.',
      };
    }
    if (presentationClass === 'mixed') {
      return {
        l1: 'Several ingredient terms need explanation',
        l2:
          'This ingredient list uses several broad descriptions and coded additive numbers. Tap through to see what each ' +
          'term means.',
      };
    }
    return null;
  }

  return null;
}

function resolveOpenOriginsCopy(
  adjustmentId: OpenV15AdjustmentId,
  _metadata: Metadata
): ResolvedOpenCopy | null {
  if (adjustmentId === 'open-v15-origins-evidently-complete') {
    return {
      l1: 'Ingredient origins appear fully accounted for',
      l2: 'The available origin information appears to account for the relevant ingredient sourcing, with no material remainder left unexplained.',
    };
  }

  if (adjustmentId === 'open-v15-origins-packet-gap') {
    return {
      l1: 'No clear origin statement found',
      l2: 'This packet was checked and no clear ingredient-origin information was found, leaving the product’s origins unclear.',
    };
  }

  // Percentage bands and qualified-partial resolve from registry templates + fired metadata tokens.
  return null;
}

export function resolveOpenGovernedCopy(
  adjustmentId: string,
  metadata: Metadata
): ResolvedOpenCopy | null {
  const id = adjustmentId as OpenV15AdjustmentId;
  if (id.startsWith('open-v15-ing-clarity-')) {
    return resolveOpenIngredientClarityCopy(id, metadata);
  }
  if (id.startsWith('open-v15-origins-')) {
    return resolveOpenOriginsCopy(id, metadata);
  }
  return null;
}
