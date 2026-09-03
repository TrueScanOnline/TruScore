/**
 * Founder-locked L3 consumer prose and binding helpers.
 * Authority: Rveel_Wave3_Score_Highlights_L3_Content_Closure_Addendum_20260903_v1_0.
 * Dynamic values bind only from fired-adjustment IDs / metadata — never raw product fields.
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

export interface L3ResolvedContent {
  title: string;
  highlightLine?: string;
  intro?: string;
  sections: L3Section[];
  componentRows?: L3ComponentRow[];
  sources: L3SourceLink[];
}

const NUTRI_SOURCE: L3SourceLink = {
  label: 'Santé publique France — Nutri-Score',
  url: 'https://www.santepubliquefrance.fr/en/nutrition-and-physical-activity/nutri-score',
};

const NOVA_FAO_SOURCE: L3SourceLink = {
  label: 'FAO — NOVA classification',
  url: 'https://www.fao.org/3/ca5644en/ca5644en.pdf',
};

const NOVA_WHO_SOURCE: L3SourceLink = {
  label: 'WHO — ultra-processed foods health context',
  url: 'https://www.who.int/news-room/articles-detail/call-for-experts-to-develop-a-who-guideline-on-consumption-of-ultra-processed-foods',
};

const GREEN_SCORE_SOURCE: L3SourceLink = {
  label: 'Open Food Facts — Green-Score methodology',
  url: 'https://blog.openfoodfacts.org/en/EN-Pro-Platform-User-Guide.pdf',
};

const GREEN_SCORE_NAMING_SOURCE: L3SourceLink = {
  label: 'Open Food Facts — Eco-Score → Green-Score naming',
  url: 'https://openfoodfacts.github.io/documentation/docs/Product-Opener/api/ref-api-and-product-schema-change-log/',
};

const PACKAGING_AU_SOURCE: L3SourceLink = {
  label: 'APCO / Australasian Recycling Label',
  url: 'https://apco.org.au/faqs?category=Australasian+Recycling+Label+Program',
};

const PACKAGING_NZ_SOURCE: L3SourceLink = {
  label: 'New Zealand Ministry for the Environment — kerbside recycling',
  url: 'https://environment.govt.nz/what-you-can-do/recycle/',
};

const FAIRTRADE_SOURCE: L3SourceLink = {
  label: 'Fairtrade International',
  url: 'https://www.fairtrade.net/en/why-fairtrade/how-we-do-it/how-does-the-label-work.html',
};

const RAINFOREST_SOURCE: L3SourceLink = {
  label: 'Rainforest Alliance',
  url: 'https://www.rainforest-alliance.org/insights/the-rainforest-alliance-seal/',
};

const MSC_SOURCE: L3SourceLink = {
  label: 'Marine Stewardship Council',
  url: 'https://www.msc.org/what-we-are-doing/our-approach/what-does-the-blue-msc-label-mean',
};

const ASC_SOURCE: L3SourceLink = {
  label: 'Aquaculture Stewardship Council',
  url: 'https://asc-aqua.org/consumers/',
};

const ORGANIC_AU_SOURCE: L3SourceLink = {
  label: 'ACCC — organic claims guidance',
  url: 'https://www.accc.gov.au/',
};

const ORGANIC_NZ_SOURCE: L3SourceLink = {
  label: 'MPI — food labels guidance',
  url: 'https://www.mpi.govt.nz/food-safety-home/how-read-food-labels',
};

const KTC_SOURCE: L3SourceLink = {
  label: 'KnowTheChain / Business & Human Rights Resource Centre',
  url: 'https://www.business-humanrights.org/en/from-us/knowthechain/food-and-beverage-benchmark/',
};

const BBFAW_SOURCE: L3SourceLink = {
  label: 'Business Benchmark on Farm Animal Welfare (BBFAW)',
  url: 'https://www.bbfaw.com/food-companies/',
};

const OPEN_INGREDIENT_SOURCE: L3SourceLink = {
  label: 'FSANZ — labelling of food additives',
  url: 'https://www.foodstandards.gov.au/consumer/labelling/Labelling-of-food-additives',
};

const NUTRI_GRADE_FROM_ID: Record<string, string> = {
  'body-v12-nutri-a': 'A',
  'body-v12-nutri-b': 'B',
  'body-v12-nutri-c': 'C',
  'body-v12-nutri-d': 'D',
  'body-v12-nutri-e': 'E',
};

const NUTRI_L1_LABEL: Record<string, string> = {
  A: 'highest nutritional quality',
  B: 'good nutritional quality',
  C: 'moderate nutritional quality',
  D: 'lower nutritional quality',
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

const GREEN_L1_LABEL: Record<string, string> = {
  A: 'lower environmental impact',
  B: 'relatively low environmental impact',
  C: 'mid-range environmental impact',
  D: 'higher environmental impact',
  E: 'highest environmental impact',
};

const DISPOSITION_CONSUMER: Record<string, string> = {
  kerbside: 'Kerbside recycling — component is confirmed for ordinary kerbside recycling in the active market.',
  special_pathway:
    'Special pathway / check locally — component may require drop-off, return-to-store, deposit-return or another non-kerbside pathway.',
  not_accepted:
    'Not accepted in ordinary kerbside recycling — governed evidence supports that conclusion for the active market.',
  not_confirmed: 'Not confirmed — evidence is absent, ambiguous, conflicting or unsupported.',
};

function marketAdjective(metadata: L3Metadata): string | null {
  const m = metadata?.market;
  if (m === 'AU') return 'Australian';
  if (m === 'NZ') return 'New Zealand';
  const j = metadata?.jurisdiction;
  if (j === 'AU') return 'Australian';
  if (j === 'NZ') return 'New Zealand';
  return null;
}

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

function resolveNutri(storyKey: string, metadata: L3Metadata): L3ResolvedContent | null {
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
          'Nutri-Score is a front-of-pack system that summarises overall nutritional quality per 100 g or 100 mL. It weighs less favourable components such as energy, sugars, saturated fat and salt against favourable components such as fibre, protein, fruit, vegetables and legumes. For beverages, the current algorithm also considers non-nutritive sweeteners. Rveel uses the reported A–E grade as one input to Body.',
      },
      {
        body:
          'This view explains the overall grade. It does not claim that any single nutrient caused this product’s grade, and Rveel does not reconstruct Nutri-Score’s underlying component calculation here.',
      },
    ],
    sources: [NUTRI_SOURCE],
  };
}

function resolveNova(storyKey: string): L3ResolvedContent | null {
  const group = NOVA_GROUP_FROM_ID[storyKey];
  if (!group) return null;
  const sections: L3Section[] = [
    {
      body:
        'NOVA groups foods by the nature, extent and purpose of industrial processing. It is a processing classification, not a standalone measure of nutritional quality. Rveel uses the reported NOVA group as one input to Body.',
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
  const sources: L3SourceLink[] = [NOVA_FAO_SOURCE];
  if (group === 4) {
    sections.push({
      heading: 'Diet-pattern health context',
      body:
        'WHO says a growing body of evidence links diets high in ultra-processed foods with higher risks of diet-related disease and other negative health outcomes.',
    });
    sections.push({
      body:
        'That evidence is about dietary patterns. It does not show that this individual product causes a particular health outcome.',
    });
    sources.push(NOVA_WHO_SOURCE);
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
          'Green-Score is Open Food Facts’ environmental grade, formerly called Eco-Score. It uses life-cycle data for a product category as its starting point and adjusts the estimate with product-specific information such as ingredients, origins, production information and packaging. Rveel uses the reported A–E grade as one input to Planet.',
      },
      {
        body:
          'Green-Score is an estimate of environmental impact, not a direct measurement of every environmental consequence of this individual product. Rveel does not infer which individual factor caused the grade unless the exact governed component calculation is available and intentionally shown.',
      },
    ],
    sources: [GREEN_SCORE_SOURCE, GREEN_SCORE_NAMING_SOURCE],
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

  const sources =
    metadata?.jurisdiction === 'NZ' ? [PACKAGING_NZ_SOURCE] : [PACKAGING_AU_SOURCE];

  return {
    title: 'How this packaging was assessed',
    highlightLine: `Assessment market: ${market}`,
    sections: [
      {
        body: `Recycling rules depend on where a product is disposed of. For this scan, Rveel assessed the available structured evidence for the product’s primary consumer packaging against the active ${market} kerbside rules.`,
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
        body:
          'This view explains the meaning of the mark without expanding its scope.',
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
      sources: [RAINFOREST_SOURCE],
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
    const market = marketNoun(metadata);
    const sources = market === 'New Zealand' ? [ORGANIC_NZ_SOURCE] : [ORGANIC_AU_SOURCE];
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
              'Rveel recognises the packet claim under the current Ethics rule, but this view must not present the product as certified unless a specific certification is actually established.',
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
  if (company == null || year == null || score == null) return null;
  return {
    title: 'How KnowTheChain assessed this company',
    highlightLine: `${company} — ${year} Food & Beverage Benchmark — ${score}/100`,
    sections: [
      {
        body: `KnowTheChain’s ${year} Food & Beverage Benchmark scored ${company} ${score}/100 for its efforts to prevent and address forced-labour risks in its supply chains.`,
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
  const sections: L3Section[] = [
    {
      body: `BBFAW’s ${year} benchmark assessed ${company} on farm animal welfare.`,
    },
  ];
  if (tier != null) {
    sections.push({
      body: `Tier ${tier} describes the company’s governance and management position.`,
    });
  }
  if (impact != null) {
    sections.push({
      body: `Impact Rating ${impact} describes the evidence of welfare outcomes reported or demonstrated in the benchmark.`,
    });
  }
  sections.push({
    body:
      'They are different measures: governance and demonstrated impact can move at different speeds, so Rveel shows them together rather than treating one as a substitute for the other.',
  });
  sections.push({
    body:
      'This is company-level benchmark context, not a claim about the welfare conditions behind this individual product.',
  });
  return {
    title: 'How BBFAW assessed this company',
    highlightLine: `${company} — BBFAW ${year}`,
    sections,
    sources: [BBFAW_SOURCE],
  };
}

function resolveIngredientWording(metadata: L3Metadata): L3ResolvedContent | null {
  const presentationClass = metadata?.termPresentationClass;
  const terms = splitPipe(metadata?.matchedTerms);
  const decoded = splitPipe(metadata?.decodedAdditiveNames);
  const termClasses = splitPipe(metadata?.termPresentationClasses);
  const marketAdj = marketAdjective(metadata);

  const sections: L3Section[] = [
    {
      body:
        'Rveel looks at the ingredient wording that is actually shown and checks for a small governed set of terms that are broad or generic, or that need decoding to be immediately understandable to a shopper.',
    },
    {
      body:
        'This is about clarity and specificity. It does not mean the wording is illegal, misleading, unsafe or deliberately concealing anything.',
    },
  ];

  // Zero-flag clarity (+1) has no presentation class / matched terms.
  if (!presentationClass && terms.length === 0) {
    sections.push({
      body:
        'In the ingredient list Rveel could assess, we did not find any of the broad, generic or code-dependent terms Rveel checks for. That does not mean every detail about the product is disclosed.',
    });
    return {
      title: 'Ingredient wording explained',
      sections,
      sources: [OPEN_INGREDIENT_SOURCE],
    };
  }

  if (!presentationClass || terms.length === 0) return null;

  let decodedIdx = 0;
  for (let i = 0; i < terms.length; i++) {
    const term = terms[i];
    const cls =
      (termClasses[i] as 'broad_generic' | 'coded' | undefined) ||
      (presentationClass === 'mixed' ? null : (presentationClass as 'broad_generic' | 'coded'));

    if (cls === 'coded') {
      const plain = decoded[decodedIdx++];
      sections.push({
        heading: plain ? `${term} — ${plain}` : term,
        body: plain
          ? `“${term}” is a permitted, standardised way to identify ${plain}. The code identifies the additive precisely, but a shopper needs to know or look it up to see the additive’s actual name.`
          : `“${term}” is a permitted, standardised additive code. The code identifies the additive precisely, but a shopper needs to know or look it up to see the additive’s actual name.`,
      });
    } else if (cls === 'broad_generic') {
      if (!marketAdj) return null;
      sections.push({
        heading: term,
        body: `${marketAdj} food-labelling rules allow this kind of broad description without naming the specific substance or substances, so the term identifies a category without fully showing what makes it up.`,
      });
    } else {
      // Mixed without per-term classes — fail closed rather than invent classification.
      return null;
    }
  }

  return {
    title: 'Ingredient wording explained',
    sections,
    sources: [OPEN_INGREDIENT_SOURCE],
  };
}

/**
 * Resolve locked L3 content for an in-app target from the fired story key + metadata.
 * Returns null when required dynamic binding is missing (fail closed).
 */
export function resolveGovernedL3Content(
  target: ScoreHighlightL3InAppTarget,
  storyKey: string,
  metadata: L3Metadata
): L3ResolvedContent | null {
  switch (target) {
    case 'nutri_score':
      return resolveNutri(storyKey, metadata);
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
        return resolveIngredientWording({});
      }
      return resolveIngredientWording(metadata);
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
] as const;
