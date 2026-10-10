import type { CaseStudy } from "./types";

export const bilira: CaseStudy = {
  id: "bilira",
  title: "BiLira, Technical Product Management",
  glance: [
    { value: "40%", label: "fewer false positives" },
    { value: "+45%", label: "OTC throughput" },
    { value: "99.9%", label: "uptime on 50M+ API calls a month" },
  ],
  sentimentScores: [15, 28, 45, 60, 82, 95], // Problem, Constraints, Approach, Stablecoin & DeFi, Results, Learnings
  beats: [
    {
      id: "problem",
      body: [
        "BiLira served more than 100,000 users across 150+ digital assets and five blockchains. A five-person compliance team handled manual reviews, creating a bottleneck as trading activity grew.",
        "I owned product strategy for compliance and OTC workflows, working with a 25-person engineering team. The trading desk needed faster execution, while the CTO and compliance officer needed confidence that automation would preserve risk controls.",
        "The challenge was to increase capacity without treating compliance quality as a trade-off for speed.",
      ],
    },
    {
      id: "constraints",
      body: [
        "Changing regulatory requirements meant the workflow needed to be adaptable and auditable. The compliance team was already at capacity.",
        "False positives delayed legitimate customers, while missed risks had serious consequences. We needed to distinguish decisions that could be automated from those that required a reviewer.",
      ],
      insight: "Risk controls shaped the workflow from the start.",
    },
    {
      id: "approach",
      body: [
        "We built a hybrid screening pipeline using Chainalysis for onchain risk and Notabene for travel-rule data. Automated screening handled clear-cut cases and routed ambiguous ones to human reviewers.",
        "I brought the CTO and compliance officer into weekly failure-scenario reviews so they could agree on the workflow and its controls. We kept the engine modular to support changing requirements.",
        "Alongside compliance, I led product work on OTC execution and a Trade API serving more than 50 enterprise clients. The team moved from quarterly releases to releases every two weeks.",
      ],
      insight: "Automate clear decisions and preserve human review for ambiguous cases.",
    },
    {
      id: "defi",
      label: "Stablecoin & DeFi",
      body: [
        "I was Senior PM for TRYB, BiLira's Turkish Lira stablecoin, and I owned its onchain surface: mint and redeem infrastructure, exchange integrations, DeFi vault partnerships, and institutional onboarding. TRYB stayed fully backed by reserves and redeemable one to one, live for mint and redeem across six chains: Ethereum, Avalanche, Solana, Polygon, BNB Smart Chain and Base.",
        "On the DeFi side I opened up liquidity and distribution: DEX liquidity on Curve, institutional liquidity with B2C2, curated yield vaults with Piku Finance and Morini Capital, and onboarding work with Circle (Arc live, StableFX in discussion). Onchain supply sat around $10M with roughly $2M to $3M in monthly onchain volume.",
        "The vaults were the point. Morini curated delta neutral strategies on Turkish Lira exposure: USD/TRY arbitrage, a BIST basis trade, and a leveraged TRY carry trade, running native strategy APYs of 8.71%, 19.30% and 45.31%. Combined TRY vault TVL reached $21.85M ($3.51M, $5.24M and $13.10M across the three) inside a $30.02M Piku platform. It held because the guardrails were real: Fireblocks MPC custody under regulated HSM procedures, independent reserve verification at a 100.14% collateral ratio checked every 15 minutes, and zkTLS NAV proofs via vlayer for vault transparency.",
      ],
      insight: "Distribution and usable integrations were central to the stablecoin’s product value.",
    },
    {
      id: "results",
      body: [
        "Manual review time fell approximately 35%, and false positives fell 40%. Detection accuracy was 99.7%, with zero regulatory breaches reported during the period.",
        "OTC latency fell from 500ms to 275ms, and throughput increased 45%. The system handled more than 500 institutional trades a week across 15+ pairs.",
        "The Trade API supported 50M+ monthly calls with 99.9% uptime. A release cycle of two weeks helped the team respond to changing requirements more quickly.",
      ],
      metrics: [
        { label: "OTC Latency", before: 500, after: 275, unit: "ms", color: "#6E86D6" },
        { label: "Release Cadence", before: 90, after: 14, unit: " days", color: "#CB7BC7" },
        { label: "Manual Review Time", before: 100, after: 65, unit: "", color: "#E7684A" },
      ],
    },
    {
      id: "learnings",
      body: [
        "Failure-scenario reviews helped engineering and compliance make decisions together. The hybrid workflow reflected both groups’ requirements.",
        "Automation was most useful where decisions were clear. Keeping reviewers responsible for ambiguous cases allowed the team to focus its attention where it mattered.",
        "Modularity gave us a practical way to respond to rule changes without redesigning the entire workflow.",
      ],
      insight: "Build regulatory change into the product architecture.",
    },
  ],
};
