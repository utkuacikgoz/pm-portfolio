// Every time and every position the reel uses, as data. Retime the reel by
// editing TIMELINE; move a layout fact by editing LAYOUT. The handoff contracts
// in spec section 4 hold because both sides of every cut read the same
// constant from here rather than recomputing it per shot.
//
// Times are absolute seconds unless the key says `U` (product-relative,
// u = t - P_k). Pairs are [start, end].

type Span = readonly [number, number];

export const TIMELINE = {
  duration: 15,
  rest: 14.5,
  skip: 12.63,

  // Shot 1: stamp, datum, name
  stamps: [0, 0.125, 0.25, 0.375] as const, // forest, coral, blue, mauve
  stampDur: 0.25,
  datumGrow: [0, 0.4] as Span,
  nameUtku: [0.15, 0.55] as Span,
  nameAcik: [0.275, 0.675] as Span,
  nameTrack: [0.275, 0.875] as Span,

  // Shot 2: identity docks, title slices in
  logoDock: [1.5, 1.8] as Span,
  nameDockStart: 1.5,
  nameDockStagger: 0.01,
  nameDockDur: 0.3,
  bandsLine1: [1.85, 1.89, 1.93] as const,
  bandsLine2: [1.75, 1.79, 1.83] as const,
  bandDur: 0.4,

  // Shot 4: title docks, proof counters
  titleDock1: [3.0, 3.35] as Span,
  titleDock2: [3.04, 3.39] as Span,
  counterRise: [3.25, 3.3, 3.35] as const,
  counterRiseDur: 0.3,
  counterLand: [3.75, 3.875, 4.0] as const,
  counterSuffixDelay: 0.05,
  counterSuffixDur: 0.25,
  landDur: 0.18,
  tickDur: 0.12,
  labelDur: 0.3,
  counterExit: [4.4, 4.44, 4.48] as const,

  // Shared motion primitive durations
  rollOut: 0.18,
  sink: 0.16,

  // Shots 5 to 9: products, P_k = productStart + productPitch * k
  productStart: 4.5,
  productPitch: 1.5,
  exitU: [1.4, 1.4, 1.4, 1.4, 1.75] as const,
  knifeU: [-0.3, 0] as Span,
  nameInU: [0, 0.32] as Span,
  figureInU: [0.04, 0.36] as Span,
  chartInU: [0.04, 0.36] as Span,
  categoryInU: [0.06, 0.34] as Span,
  phraseInU: [0.1, 0.38] as Span,
  figureOutDelay: 0.04,
  chartOutDelay: 0.02,
  fileDur: 0.38,

  // Ledger
  ledgerIn: 4.5,
  ledgerStagger: 0.04,
  ledgerInDur: 0.35,

  // Per-product chart choreography (u)
  biliraScanU: [0.25, 0.5] as Span,
  biliraCutU: [0.5, 0.5 + 1 / 60] as Span, // exactly one 60 fps frame
  biliraSliceU: [0.5, 0.68] as Span,
  mestoresGrowU: [0.5, 0.85] as Span,
  apolloBlock1U: [0.25, 0.5] as Span,
  apolloBlock2U: [0.5, 0.75] as Span,
  la3ebT2U: [0.5, 0.62] as Span,
  la3ebT3U: [0.53, 0.65] as Span,
  la3ebGrowU: [0.65, 0.69, 0.73] as const,
  la3ebGrowDur: 0.12,
  upshiftFoldU: [0.5, 1.0] as Span,

  // Shot 10: ledger complete, identity returns
  ledgerFold: [12.77, 12.74, 12.71, 12.68, 12.65] as const, // row 0..4
  ledgerFoldDur: 0.2,
  logoHome: [12.75, 13.25] as Span,
  eyebrowHome: [12.77, 13.27] as Span,
  h1Home1: [12.79, 13.29] as Span,
  h1Home2: [12.81, 13.31] as Span,
  datumContract: [12.75, 13.25] as Span,

  // Shot 11: proof lands, datum hands off
  datumDrop: [13.35, 13.75] as Span,
  chipLaunch: 13.45,
  chipStagger: 0.0625,
  chipDur: 0.3,
  chipTickDur: 0.05,
  proof11Roll: [14.05, 14.35] as Span,
  proof11From: 13.75,
  proof100: [13.75, 14.4] as Span,
  proof8: [13.8, 14.4] as Span,
  proofSuffix: [14.3, 14.45] as Span,
  handoffNarrow: [13.75, 14.05] as Span,
  handoffConsume: [14.1, 14.4] as Span,
} as const;

export const DATUM_Y = 541;

export const LAYOUT = {
  datumY: DATUM_Y,
  datumH: 2,
  measureX0: 320,
  measureX1: 1600,

  // Masks (section 2.2)
  aboveY0: 240,
  aboveY1: 567,
  chartX0: 820,
  chartX1: 1100,
  chartY0: 240,
  belowY0: 543,
  belowY1: 700,
  rowMaskPad: 7,

  // Logo slots (top left and size, virtual px)
  logoHero: { x: 932, y: 265.1, size: 56 },
  logoMast: { x: 320, y: 188, size: 36 },

  // Shot 1 name
  nameX: 320,
  nameRise: 200,
  nameTrackExtra: 50.4,

  // Masthead
  mastEyebrowX: 372,
  mastEyebrowBaseline: 201,
  mastEyebrowTracking: 6,
  mastTitleX: 372,
  mastTitleBaseline: 225,

  // Title (shot 2)
  titleX: 320,
  title1Baseline: 384,
  title2Baseline: 541,
  title1Bands: [270, 308, 346, 392] as const,
  title2Bands: [427, 465, 503, 580] as const,
  bandOffset: 240,

  // Counters (shot 4)
  counterX: [320, 752, 1292] as const,
  counterLabelBaseline: 581,
  riseD: 200,
  dropD: 100,
  rollOutD: 340,
  sinkD: 100,

  // Product stage
  productNameX: 320,
  figureRight: 1600,
  figureSmallGap: 8,
  categoryBaseline: 587,
  phraseBaseline: 633,
  knifeW: 200,
  knifeY: 540,
  knifeH: 4,
  knifeX0: 120,
  knifeTravel: 1480,

  // Ledger
  ledgerBaseline0: 716,
  ledgerPitch: 32,
  ledgerChipX: 320,
  ledgerChip: 12,
  ledgerNameX: 348,
  ledgerPhraseGap: 14,
  ledgerRise: 24,
  ledgerStroke: 1.5,
  ledgerChipTop: 14, // chip spans baseline - 14 .. baseline - 2
  chipFlightEnd: 6, // chip size on impact

  // The resolve: the DOM hero, measured (section 5)
  heroEyebrowCenter: 960.05,
  heroEyebrowBaseline: 360.1,
  heroEyebrowTracking: 5,
  h1Center: 960,
  h1Baseline1: 455.1,
  h1Baseline2: 541.2,
  heroLineCenter: 960,
  heroLineBaselines: [604.3, 640.6] as const,
  proofBaseline: 711.9,
  proofX: [652.5, 874, 1118.5] as const,
  proofTracking: 0.5,
  proofLabelX: [704, 971.5, 1161.5] as const,
  proofDotX: [847, 1091.5] as const,
  proofDotBaseline: 708.1,
  proofSuffixClipY: 716.9,
  proofSuffixRise: 28,

  // Shot 11 datum hand-off
  dropY: 730,
  ctaLineY: 756,
  ctaX0: 831,
  ctaX1: 1089,
  ctaCenterX: 960,
  chipArcLift: -120,
} as const;

/** Chart geometry (virtual px). Every chart stands on the datum inside M_CHART. */
export const CHART = {
  top: 261,
  height: 280,
  bilira: { x0: 880, x1: 1040, cutY: 359, scanX0: 868, scanX1: 1052, sliceLift: 160, scanH: 2, cutH: 4 },
  mestores: { beforeX0: 848, beforeX1: 952, afterX0: 968, afterX1: 1072, fromValue: 0.8, toValue: 2.1 },
  apollo: { x0: 892, size: 136, gap: 8 },
  la3eb: { cols: [844, 924, 1004] as const, size: 72, bottomY: 469, topY: 389, grow: 80 },
  upshift: { x0: 880, x1: 1040, hinge: 401 },
} as const;

export const productStart = (k: number): number => TIMELINE.productStart + TIMELINE.productPitch * k;
export const ledgerBaseline = (i: number): number => LAYOUT.ledgerBaseline0 + LAYOUT.ledgerPitch * i;
