/**
 * Founder-locked L3 consumer prose and binding helpers.
 * Authority: Rveel_Wave3_Score_Highlights_L3_Content_Closure_Addendum_20260905_v1_1
 * (supersedes v1.0 of 3 September 2026) with the Consolidated Controlling Specification
 * 20260905 v0.5 §3 consumer-language doctrine.
 *
 * Rules enforced here:
 *  - Dynamic values bind only from fired-adjustment IDs / governed metadata — never raw product
 *    fields — and fail closed (return null / omit) when a locked token cannot be supplied.
 *  - The app name never appears in consumer L3 prose; a speaker is "we" where one is needed.
 *  - `[here]` is a navigation anchor token. Route-bound fragments (contribution, S27 cross-link)
 *    are returned separately and only when the caller confirms the destination exists.
 */

import type { ScoreHighlightL3InAppTarget } from './targets';

export type L3Metadata = Record<string, string | number | boolean> | undefined;

export interface L3SourceLink {
  label: string;
  url: string;
}

export interface L3Section {
  heading?: string;
  body: string;
}

export interface L3ComponentRow {
  label: string;
  dispositionLabel: string;
}

/** Route-bound copy split around its navigation anchor so `[here]` never renders literally. */
export interface L3ActionFragment {
  textBefore: string;
  anchorLabel: string;
  textAfter: string;
}

export interface L3ResolvedContent {
  title: string;
  highlightLine?: string;
  intro?: string;
  sections: L3Section[];
  componentRows?: L3ComponentRow[];
  sources: L3SourceLink[];
  /** Present only when the governed destination for the fragment exists. */
  action?: L3ActionFragment;
}

export interface L3ResolveOptions {
  /** Governed User Contribution destination (Wave 4). Defaults to false. */
  userContributionRouteLive?: boolean;
  /** Governed S27 Body explainer destination. Defaults to false. */
  s27BodyExplainerRouteLive?: boolean;
}

const ANCHOR_LABEL = 'here';

const NUTRI_SOURCE: L3SourceLink = {
  label: 'Santé publique France — Nutri-Score',
  url: 'https://www.santepubliquefrance.fr/en/nutrition-and-physical-activity/nutri-score',
};

const NOVA_URL = 'https://world.openfoodfacts.org/nova';

const NOVA_FAO_SOURCE: L3SourceLink = {
  label: 'FAO — NOVA terminology',
  url: NOVA_URL,
};

const NOVA_OFF_SOURCE: L3SourceLink = {
  label: 'OFF — NOVA terminology',
  url: NOVA_URL,
};

const NOVA_WHO_SOURCE: L3SourceLink = {
  label: 'WHO — ultra-processed-food evidence context',
  url: 'https://www.who.int/news-room/articles-detail/call-for-experts-to-develop-a-who-guideline-on-consumption-of-ultra-processed-foods',
};

const NOVA_DEAKIN_SOURCE: L3SourceLink = {
  label: 'Deakin University — ultra-processed foods research',
  url: 'https://healthtransformation.deakin.edu.au/2025/09/diets-high-in-ultra-processed-foods-are-bad-for-us-so-why-are-we-eating-more-new-research-identifies-a-complex-web-of-contributing-factors/',
};

const GREEN_SCORE_SOURCE: L3SourceLink = {
  label: 'Open Food Facts — Green-Score methodology / consumer context',
  url: 'https://world.openfoodfacts.org/green-score#how_is_the_green_score_calculated',
};

const GREEN_SCORE_PRO_SOURCE: L3SourceLink = {
  label: 'Open Food Facts — Pro Platform User Guide',
  url: 'https://blog.openfoodfacts.org/en/EN-Pro-Platform-User-Guide.pdf',
};

const PACKAGING_ARL_SOURCE: L3SourceLink = {
  label: 'Australia and New Zealand — APCO / Australasian Recycling Label Guide',
  url: 'https://arl.org.au',
};

const PACKAGING_NZ_MFE_SOURCE: L3SourceLink = {
  label: 'New Zealand — MfE Recycle right at kerbside',
  url: 'https://environment.govt.nz/what-you-can-do/campaigns/recycle/',
};

const PACKAGING_NZ_FORUM_SOURCE: L3SourceLink = {
  label: 'New Zealand — The Packaging Forum Recycling Initiatives',
  url: 'https://home.recycling.kiwi.nz',
};

const FAIRTRADE_SOURCE: L3SourceLink = {
  label: 'Fairtrade International — How the label works',
  url: 'https://www.fairtrade.net/en/why-fairtrade/how-we-do-it/how-does-the-label-work.html',
};

const RAINFOREST_SOURCE: L3SourceLink = {
  label: 'Rainforest Alliance — What’s Behind the Seals',
  url: 'https://www.rainforest-alliance.org/what-does-rainforest-alliance-certified-mean/',
};

const RAINFOREST_UTZ_SOURCE: L3SourceLink = {
  label: 'Rainforest Alliance — legacy UTZ certification',
  url: 'https://www.rainforest-alliance.org/utz/',
};

const MSC_SOURCE: L3SourceLink = {
  label: 'Marine Stewardship Council — blue MSC label',
  url: 'https://www.msc.org/what-we-are-doing/our-approach/the-blue-msc-label-what-it-means-for-you',
};

const ASC_SOURCE: L3SourceLink = {
  label: 'Aquaculture Stewardship Council — assurance',
  url: 'https://asc-aqua.org/about-the-asc-sustainability-label/',
};

const ORGANIC_AU_SOURCE: L3SourceLink = {
  label: 'Australia — ACCC Organic claims',
  url: 'https://www.accc.gov.au/consumers/advertising-and-promotions/organic-claims',
};

const ORGANIC_NZ_SOURCE: L3SourceLink = {
  label: 'New Zealand — MPI organic product requirements',
  url: 'https://www.mpi.govt.nz/agriculture/organic-product-requirements-in-nz/growing-processing-and-selling-organic-products-in-new-zealand',
};

const KTC_SOURCE: L3SourceLink = {
  label: 'KnowTheChain / Business & Human Rights Resource Centre — Food & Beverage Benchmark',
  url: 'https://www.business-humanrights.org/en/from-us/knowthechain/food-and-beverage-benchmark/',
};

const BBFAW_METHODOLOGY_SOURCE: L3SourceLink = {
  label: 'BBFAW — Benchmark methodology',
  url: 'https://www.bbfaw.com/about-us/benchmark-methodology/',
};

const BBFAW_BENCHMARK_SOURCE: L3SourceLink = {
  label: 'BBFAW — Benchmark',
  url: 'https://www.bbfaw.com/benchmark/',
};

const OPEN_INGREDIENT_SOURCE: L3SourceLink = {
  label: 'FSANZ — Labelling of food additives',
  url: 'https://www.foodstandards.gov.au/consumer/labelling/Labelling-of-food-additives',
};

const NUTRI_GRADE_FROM_ID: Record<string, string> = {
  'body-v12-nutri-a': 'A',
  'body-v12-nutri-b': 'B',
  'body-v12-nutri-c': 'C',
  'body-v12-nutri-d': 'D',
  'body-v12-nutri-e': 'E',
};

/** Locked A–E grade labels, identical to the L1 titles carried by the Body registry. */
const NUTRI_L1_LABEL: Record<string, string> = {
  A: 'highest nutritional quality',
  B: 'favourable nutritional profile',
  C: 'nutritional middle ground',
  D: 'less favourable nutritional profile',
  E: 'lowest nutritional quality',
};

const NOVA_GROUP_FROM_ID: Record<string, number> = {
  'body-v12-nova-1-off': 1,
  'body-v12-nova-2': 2,
  'body-v12-nova-3': 3,
  'body-v12-nova-4': 4,
};

const NOVA_GROUP_TITLE: Record<number, string> = {
  1: 'Unprocessed or minimally processed',
  2: 'Processed culinary ingredients',
  3: 'Processed foods',
  4: 'Ultra-processed foods',
};

const GREEN_GRADE_FROM_ID: Record<string, string> = {
  'planet-v19-environmental-a': 'A',
  'planet-v19-environmental-b': 'B',
  'planet-v19-environmental-c': 'C',
  'planet-v19-environmental-d': 'D',
  'planet-v19-environmental-e': 'E',
};

/** Locked A–E impact labels, identical to the L1 titles carried by the Planet registry. */
const GREEN_L1_LABEL: Record<string, string> = {
  A: 'lower environmental impact',
  B: 'relatively low environmental impact',
  C: 'moderate environmental impact',
  D: 'higher environmental impact',
  E: 'very high environmental impact',
};

/** Locked packaging component disposition labels (Addendum v1.1, Planet packaging rows). */
const DISPOSITION_CONSUMER: Record<string, string> = {
  kerbside: 'Kerbside recycling',
  special_pathway: 'Special pathway / check locally',
  not_accepted: 'Not accepted in ordinary kerbside recycling',
  not_confirmed: 'Not confirmed',
};

const NUTRI_S27_ACTION: L3ActionFragment = {
  textBefore: 'For more information on why we prefer this methodology to the Health Star Rating, tap ',
  anchorLabel: ANCHOR_LABEL,
  textAfter: '.',
};

const OPEN_CONTRIBUTION_ACTION: L3ActionFragment = {
  textBefore:
    'Clearer, more specific ingredient information can make it easier to understand what is in a product. ' +
    'If you can see additional ingredient information on the packet, or a correction is needed, tap ',
  anchorLabel: ANCHOR_LABEL,
  textAfter: ' to contribute.',
};

function marketNoun(metadata: L3Metadata): string | null {
  const m = metadata?.market ?? metadata?.jurisdiction;
  if (m === 'AU') return 'Australia';
  if (m === 'NZ') return 'New Zealand';
  return null;
}

function splitPipe(value: unknown): string[] {
  if (typeof value !== 'string' || !value.trim()) return [];
  return value.split('|').map((s) => s.trim()).filter(Boolean);
}

function joinWithAnd(items: string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

function resolveNutri(
  storyKey: string,
  metadata: L3Metadata,
  options: L3ResolveOptions
): L3ResolvedContent | null {
  const grade =
    (typeof metadata?.nutriGrade === 'string' && metadata.nutriGrade.toUpperCase()) ||
    NUTRI_GRADE_FROM_ID[storyKey];
  if (!grade || !NUTRI_L1_LABEL[grade]) return null;
  return {
    title: 'How Nutri-Score works',
    highlightLine: `Nutri-Score ${grade} — ${NUTRI_L1_LABEL[grade]}`,
    sections: [
      {
        body:
          'Nutri-Score is a front-of-pack system that summarises overall nutritional quality per 100 g or 100 mL. ' +
          'It weighs less favourable components such as energy, sugars, saturated fat and salt against favourable ' +
          'components such as fibre, protein, fruit, vegetables and legumes. For beverages, the current algorithm also ' +
          'considers non-nutritive sweeteners. We use the reported A–E grade as one input to Body.',
      },
    ],
    sources: [NUTRI_SOURCE],
    // Wholly suppressed until the governed S27 Body explainer destination exists.
    ...(options.s27BodyExplainerRouteLive === true && { action: NUTRI_S27_ACTION }),
  };
}

function resolveNova(storyKey: string): L3ResolvedContent | null {
  const group = NOVA_GROUP_FROM_ID[storyKey];
  if (!group) return null;
  const sections: L3Section[] = [
    {
      body:
        'NOVA groups foods by the nature, extent and purpose of industrial processing. It is a processing ' +
        'classification, not a standalone measure of nutritional quality. We use the reported NOVA group as one input ' +
        'to Body.',
    },
    {
      heading: 'Group 1 — Unprocessed or minimally processed',
      body:
        'Foods that are unprocessed or only minimally changed, such as fresh or frozen produce, grains, legumes, eggs, plain dairy, meat and fish.',
    },
    {
      heading: 'Group 2 — Processed culinary ingredients',
      body:
        'Kitchen-building-block ingredients such as oils, butter, sugar and salt that are extracted or refined mainly to prepare other foods and are not typically consumed on their own.',
    },
    {
      heading: 'Group 3 — Processed foods',
      body:
        'Generally starts with a Group 1 food and adds Group 2 culinary ingredients such as salt, sugar, oil or vinegar, often to preserve the food or change its flavour or texture.',
    },
    {
      heading: 'Group 4 — Ultra-processed foods',
      body:
        'Industrial formulations that typically involve refined ingredients, additives or processing methods uncommon in home cooking.',
    },
  ];
  const sources: L3SourceLink[] = [group === 1 ? NOVA_FAO_SOURCE : NOVA_OFF_SOURCE];
  if (group === 4) {
    sections.push({
      heading: 'Group 4 health context',
      body:
        'WHO says diets high in ultra-processed foods are associated with higher risks of diet-related disease and ' +
        'other negative health outcomes. That evidence concerns dietary patterns; it does not show that this ' +
        'individual product causes a particular health outcome.',
    });
    sources.push(NOVA_WHO_SOURCE, NOVA_DEAKIN_SOURCE);
  }
  return {
    title: 'How NOVA classifies food processing',
    highlightLine: `This product: NOVA Group ${group} — ${NOVA_GROUP_TITLE[group]}`,
    sections,
    sources,
  };
}

function resolveGreenScore(storyKey: string, metadata: L3Metadata): L3ResolvedContent | null {
  const grade =
    (typeof metadata?.environmentalGrade === 'string' && metadata.environmentalGrade.toUpperCase()) ||
    GREEN_GRADE_FROM_ID[storyKey];
  if (!grade || !GREEN_L1_LABEL[grade]) return null;
  return {
    title: 'How Green-Score estimates environmental impact',
    highlightLine: `Green-Score ${grade} — ${GREEN_L1_LABEL[grade]}`,
    sections: [
      {
        body:
          'Green-Score is Open Food Facts’ environmental grade. It uses life-cycle data for a product category as its ' +
          'starting point and adjusts the estimate with product-specific information such as ingredients, origins, ' +
          'production information and packaging. We use the reported A–E grade as one input to Planet.',
      },
      {
        body:
          'Green-Score is an estimate of environmental impact, not a direct measurement of every environmental ' +
          'consequence of this individual product. Open Food Facts describes Green-Score as experimental and says its ' +
          'formula may change as it is refined. We do not infer which individual factors produced the grade.',
      },
    ],
    sources: [GREEN_SCORE_SOURCE, GREEN_SCORE_PRO_SOURCE],
  };
}

function resolvePackaging(storyKey: string, metadata: L3Metadata): L3ResolvedContent | null {
  const market = marketNoun(metadata);
  if (!market) return null;
  const isAll = storyKey === 'planet-v19-packaging-all-kerbside';
  const isSome = storyKey === 'planet-v19-packaging-some-kerbside';
  if (!isAll && !isSome) return null;

  const resultLine = isAll
    ? `All primary packaging components covered by the governed assessment qualify for ordinary kerbside recycling in ${market}.`
    : `At least one primary packaging component qualifies for ordinary kerbside recycling in ${market}, but the full primary packaging set is not confirmed as kerbside-recyclable.`;

  const labels = splitPipe(metadata?.packagingComponentLabels);
  const dispositions = splitPipe(metadata?.packagingComponentDispositions);
  const componentRows: L3ComponentRow[] = [];
  for (let i = 0; i < labels.length; i++) {
    const dKey = dispositions[i] || 'not_confirmed';
    componentRows.push({
      label: labels[i],
      dispositionLabel: DISPOSITION_CONSUMER[dKey] || DISPOSITION_CONSUMER.not_confirmed,
    });
  }

  const sources: L3SourceLink[] =
    market === 'New Zealand'
      ? [PACKAGING_ARL_SOURCE, PACKAGING_NZ_MFE_SOURCE, PACKAGING_NZ_FORUM_SOURCE]
      : [PACKAGING_ARL_SOURCE];

  return {
    title: 'How this packaging was assessed',
    highlightLine: `Assessment market: ${market}`,
    sections: [
      {
        body: `Recycling rules depend on where a product is disposed of. For this scan, we assessed the available structured data for the product’s primary consumer packaging against the active ${market} kerbside rules.`,
      },
      { body: resultLine },
    ],
    componentRows: componentRows.length > 0 ? componentRows : undefined,
    sources,
  };
}

function resolveEthicsCert(
  target: ScoreHighlightL3InAppTarget,
  metadata: L3Metadata
): L3ResolvedContent | null {
  if (target === 'ethics_fairtrade') {
    const sections: L3Section[] = [
      {
        body:
          'A Fairtrade certification mark appears on this packet. Fairtrade standards cover social, economic and environmental requirements.',
      },
      {
        body: 'This view explains the meaning of the mark without expanding its scope.',
      },
    ];
    if (typeof metadata?.certificationScope === 'string' && metadata.certificationScope.trim()) {
      sections.push({
        heading: 'Scope on this packet',
        body: String(metadata.certificationScope),
      });
    }
    return {
      title: 'What the Fairtrade mark means',
      sections,
      sources: [FAIRTRADE_SOURCE],
    };
  }

  if (target === 'ethics_rainforest') {
    const markKind =
      metadata?.rainforestMarkKind === 'utz'
        ? 'A legacy UTZ certification mark appears on this packet.'
        : metadata?.rainforestMarkKind === 'rainforest_alliance'
          ? 'A Rainforest Alliance certification mark appears on this packet.'
          : 'A Rainforest Alliance or legacy UTZ certification mark appears on this packet.';
    const sections: L3Section[] = [
      {
        body: `${markKind} The programme covers environmental and social farming requirements.`,
      },
    ];
    if (typeof metadata?.certificationScope === 'string' && metadata.certificationScope.trim()) {
      sections.push({
        heading: 'Scope on this packet',
        body: String(metadata.certificationScope),
      });
    }
    return {
      title: 'What Rainforest Alliance certification means',
      sections,
      sources: [RAINFOREST_SOURCE, RAINFOREST_UTZ_SOURCE],
    };
  }

  if (target === 'ethics_msc') {
    return {
      title: 'What the MSC blue label means',
      sections: [
        {
          body:
            'The MSC blue label appears on this packet. It identifies wild-caught seafood from fisheries independently assessed against MSC environmental-sustainability requirements, with chain-of-custody controls intended to maintain traceability through the certified supply chain.',
        },
        {
          body:
            'This explains the certification claim that contributed to Ethics; it does not create a broader product claim outside the scope of the MSC label.',
        },
      ],
      sources: [MSC_SOURCE],
    };
  }

  if (target === 'ethics_asc') {
    return {
      title: 'What the ASC label means',
      sections: [
        {
          body:
            'The ASC label appears on this packet. It identifies farmed seafood from a certified supply chain whose standards cover environmental stewardship, animal welfare and social requirements, with certification/traceability controls through the supply chain.',
        },
        {
          body:
            'This explains the certification claim that contributed to Ethics; it does not create a broader product claim outside the scope of the ASC label.',
        },
      ],
      sources: [ASC_SOURCE],
    };
  }

  if (target === 'ethics_organic') {
    const claimOnly = metadata?.organicEvidenceClass === 'claim_only';
    const sources = [ORGANIC_AU_SOURCE, ORGANIC_NZ_SOURCE];
    if (claimOnly) {
      return {
        title: 'What this organic claim means',
        sections: [
          {
            body:
              'An organic claim appears on this packet, but the available governed evidence does not establish a specific organic certification.',
          },
          {
            body:
              'The current Ethics rule recognises the packet claim, but this view must not present the product as certified unless a specific certification is actually established.',
          },
        ],
        sources,
      };
    }
    const sections: L3Section[] = [
      {
        body:
          'An organic certification mark appears on this packet, indicating certification against the named scheme’s organic standard.',
      },
    ];
    if (typeof metadata?.organicCertifier === 'string' && metadata.organicCertifier.trim()) {
      sections.push({
        heading: 'Certifier / scheme',
        body: String(metadata.organicCertifier),
      });
    }
    return {
      title: 'What this organic claim means',
      sections,
      sources,
    };
  }

  return null;
}

function resolveKtc(metadata: L3Metadata): L3ResolvedContent | null {
  const company = metadata?.benchmarkCompany;
  const year = metadata?.benchmarkYear;
  const score = metadata?.benchmarkScore;
  // Missing year/score/company fails closed.
  if (company == null || year == null || score == null) return null;
  return {
    title: 'How KnowTheChain assessed this company',
    highlightLine: `${company} — ${year} Food & Beverage Benchmark — ${score}/100`,
    sections: [
      {
        body:
          `KnowTheChain’s ${year} Food & Beverage Benchmark scored ${company} ${score}/100 for its efforts to prevent ` +
          'and address forced-labour risks in its supply chains. The benchmark assesses publicly available company ' +
          'information and gives benchmarked companies an opportunity to review the information identified and provide ' +
          'additional disclosure before the assessment is finalised.',
      },
      {
        body:
          'This is a company-level benchmark, not a product-specific finding that this individual product was made with or without forced labour.',
      },
    ],
    sources: [KTC_SOURCE],
  };
}

function resolveBbfaw(metadata: L3Metadata): L3ResolvedContent | null {
  const company = metadata?.benchmarkCompany;
  const year = metadata?.benchmarkYear;
  if (company == null || year == null) return null;
  const tier = metadata?.tier;
  const impact = metadata?.impactRating;

  // Fail closed: omit the counterpart rating from the prominent line rather than manufacture it.
  let highlightLine = `${company} — BBFAW ${year}`;
  if (tier != null) highlightLine += ` Tier ${tier}`;
  if (impact != null) highlightLine += ` — Impact Rating ${impact}`;

  let opening =
    'BBFAW describes its benchmark as a leading global measure of company performance on farm animal welfare. ' +
    `Its ${year} benchmark assessed ${company} alongside over 100 other food companies.`;
  if (tier != null) {
    opening += ` Tier ${tier} describes the company’s governance and management position.`;
  }
  if (impact != null) {
    opening += ` Impact Rating ${impact} describes the evidence of welfare outcomes reported or demonstrated in the benchmark.`;
  }

  return {
    title: 'How BBFAW assessed this company',
    highlightLine,
    sections: [
      { body: opening },
      {
        body:
          'Tier and Impact answer different questions and can move at different speeds, so we show both together. ' +
          'This is company-level benchmark context, not a claim about the welfare conditions behind this individual product.',
      },
    ],
    sources: [BBFAW_METHODOLOGY_SOURCE, BBFAW_BENCHMARK_SOURCE],
  };
}

function resolveIngredientWording(
  metadata: L3Metadata,
  options: L3ResolveOptions
): L3ResolvedContent | null {
  const presentationClass = metadata?.termPresentationClass;
  const terms = splitPipe(metadata?.matchedTerms);
  const decoded = splitPipe(metadata?.decodedAdditiveNames);
  const termClasses = splitPipe(metadata?.termPresentationClasses);

  const sections: L3Section[] = [
    {
      body:
        'Our scan looks at the ingredient wording available to us and checks for a small, governed set of terms that ' +
        'are broad or generic, or that need decoding to be immediately understandable to a shopper.',
    },
    {
      body:
        'Food-labelling rules allow some generic or class descriptions depending on the ingredient and context. This ' +
        'assessment is about clarity and specificity; it does not mean the wording is illegal, misleading, unsafe or ' +
        'deliberately concealing anything.',
    },
  ];

  const withAction = (built: L3Section[]): L3ResolvedContent => ({
    title: 'Ingredient wording explained',
    sections: built,
    sources: [OPEN_INGREDIENT_SOURCE],
    ...(options.userContributionRouteLive === true && { action: OPEN_CONTRIBUTION_ACTION }),
  });

  // Zero-flag clarity (+1) carries no presentation class or matched terms.
  if (!presentationClass && terms.length === 0) {
    sections.push({
      body:
        'In the ingredient list available to us, we did not find any of the broad, generic or code-dependent terms we ' +
        'check for. That does not mean every detail about the product is available from our sources.',
    });
    return withAction(sections);
  }

  if (!presentationClass || terms.length === 0) return null;

  const quoted = (t: string) => `“${t}”`;
  const codedLine = (term: string, plain: string | undefined) =>
    plain ? `${quoted(term)} — ${plain}` : quoted(term);

  if (presentationClass === 'broad_generic') {
    sections.push({
      heading: joinWithAnd(terms.map(quoted)),
      body:
        terms.length === 1
          ? 'In the wording available to us, the term identifies a category without fully showing the underlying ingredient or substance.'
          : terms.length === 2
            ? 'In the wording available to us, each identifies a category without fully showing the underlying ingredient or substance.'
            : 'In the wording available to us, those terms identify categories without fully showing the underlying ingredients or substances.',
    });
    return withAction(sections);
  }

  if (presentationClass === 'coded') {
    sections.push({
      heading: terms.map((t, i) => codedLine(t, decoded[i])).join('; '),
      body:
        terms.length === 1
          ? 'The code identifies the additive precisely, but a shopper needs to know or look up the number to see the additive’s name.'
          : 'The codes identify the additives precisely, but a shopper needs to know or look them up to see their names.',
    });
    return withAction(sections);
  }

  if (presentationClass === 'mixed') {
    // Mixed must retain each term's classification; fail closed without per-term classes.
    if (termClasses.length !== terms.length) return null;
    const broad: string[] = [];
    const coded: string[] = [];
    let decodedIdx = 0;
    for (let i = 0; i < terms.length; i++) {
      if (termClasses[i] === 'coded') {
        coded.push(codedLine(terms[i], decoded[decodedIdx++]));
      } else if (termClasses[i] === 'broad_generic') {
        broad.push(quoted(terms[i]));
      } else {
        return null;
      }
    }
    if (broad.length > 0) {
      sections.push({
        heading: 'Broad or generic terms',
        body: broad.join('; '),
      });
    }
    if (coded.length > 0) {
      sections.push({
        heading: 'Coded additive numbers',
        body: coded.join('; '),
      });
    }
    return withAction(sections);
  }

  return null;
}

/**
 * Resolve locked L3 content for an in-app target from the fired story key + metadata.
 * Returns null when required dynamic binding is missing (fail closed).
 */
export function resolveGovernedL3Content(
  target: ScoreHighlightL3InAppTarget,
  storyKey: string,
  metadata: L3Metadata,
  options: L3ResolveOptions = {}
): L3ResolvedContent | null {
  switch (target) {
    case 'nutri_score':
      return resolveNutri(storyKey, metadata, options);
    case 'nova':
      return resolveNova(storyKey);
    case 'green_score':
      return resolveGreenScore(storyKey, metadata);
    case 'packaging':
      return resolvePackaging(storyKey, metadata);
    case 'ethics_fairtrade':
    case 'ethics_rainforest':
    case 'ethics_msc':
    case 'ethics_asc':
    case 'ethics_organic':
      return resolveEthicsCert(target, metadata);
    case 'ethics_ktc':
      return resolveKtc(metadata);
    case 'ethics_bbfaw':
      return resolveBbfaw(metadata);
    case 'ingredient_wording': {
      if (storyKey === 'open-v15-ing-clarity-zero') {
        return resolveIngredientWording({}, options);
      }
      return resolveIngredientWording(metadata, options);
    }
    case 'additives':
    case 'product_origins':
      // Handled by dedicated hosts (AboutTheseAdditivesModal / Result CoM scroll).
      return null;
    default: {
      const _exhaustive: never = target;
      return _exhaustive;
    }
  }
}

/** Strings that must never appear in governed Green-Score / NOVA 4 L3 copy. */
export const L3_PROHIBITED_LEGACY_SNIPPETS = [
  '40%',
  '20%',
  'sustainable',
  'unsustainable',
  'Associated with health risks including obesity',
  'this individual product causes',
  'Eco-Score',
] as const;

/** The app name must never self-reference inside consumer L3 prose. */
export const L3_PROHIBITED_APP_NAME_TOKENS = ['Rveel', 'TrueScan'] as const;
