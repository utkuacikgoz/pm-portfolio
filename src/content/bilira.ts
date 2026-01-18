export const bilira = {
  id: "bilira",
  title: "BiLira — Technical Product Management",
  sentimentScores: [15, 28, 45, 82, 95], // Problem → Constraints → Approach → Results → Learnings
  beats: [
    {
      id: "chaos",
      body: [
        "BiLira served 100K+ verified users trading across 100+ digital assets on 5+ blockchains.",
        "Every transaction required AML/KYC compliance under strict Turkish regulatory oversight.",
        "The platform processed 1000+ trades daily while managing institutional OTC flows and maintaining 99.9% uptime."
      ],
      stakeholders: [
        { name: "Compliance Officer", role: "Regulatory Oversight", color: "#FF0080" },
        { name: "CTO", role: "Infrastructure", color: "#00FFFF" },
        { name: "Trading Desk Lead", role: "OTC Operations", color: "#FFD700" },
        { name: "Product Lead", role: "Feature Prioritization", color: "#FF6B35" },
        { name: "DevOps Lead", role: "System Reliability", color: "#00FF00" }
      ]
    },
    {
      id: "constraints",
      body: [
        "Regulatory requirements shifted with minimal notice, requiring immediate system adaptation.",
        "Manual compliance reviews created bottlenecks, slowing trade execution and increasing operational risk.",
        "Cross-blockchain infrastructure demanded synchronized releases across engineering, legal, and operations teams."
      ],
      decisions: [
        {
          label: "Manual Review (Safe)",
          speed: 20,
          risk: 30,
          isChosen: false,
          color: "#FF6B35"
        },
        {
          label: "Automated Compliance (Risky)",
          speed: 85,
          risk: 75,
          isChosen: false,
          color: "#FFD700"
        },
        {
          label: "Hybrid Pipeline (Our Choice)",
          speed: 80,
          risk: 25,
          isChosen: true,
          color: "#FF0080"
        }
      ]
    },
    {
      id: "decisions",
      body: [
        "Built AML/KYC automation pipelines that reduced manual review time by 35% while increasing accuracy.",
        "Designed a modular OTC system that boosted execution throughput by 45% across multi-asset networks.",
        "Led a 20-person cross-functional team to ship a compliance automation suite processing 1000+ trades/day."
      ],
      initiatives: [
        {
          label: "AML/KYC Pipeline",
          effort: 75,
          impact: 88,
          timeToValue: 45,
          color: "#FF0080"
       ,
      metrics: [
        { label: "Manual Review Time", before: 180, after: 117, unit: "min", color: "#FF0080" },
        { label: "OTC Throughput", before: 100, after: 145, unit: "trades/hr", color: "#00FFFF" },
        { label: "Compliance Score", before: 92, after: 99, unit: "%", color: "#FFD700" },
        { label: "Trade Execution", before: 45, after: 12, unit: "sec", color: "#FF6B35" }
      ] },
        {
          label: "OTC System Redesign",
          effort: 80,
          impact: 92,
          timeToValue: 50,
          color: "#00FFFF"
        },
        {
          label: "Trade API Infrastructure",
          effort: 70,
          impact: 85,
          timeToValue: 35,
          color: "#FFD700"
        },
        {
          label: "Compliance Dashboard",
          effort: 50,
          impact: 75,
          timeToValue: 20,
          color: "#FF6B35"
        }
      ]
    },
    {
      id: "deterministic",
      body: [
        "Delivered Trade API as core infrastructure, enabling enterprise clients to execute trades programmatically with token-based auth.",
        "Maintained zero compliance violations across national and international regulatory audits.",
        "Scaled network integrations to support 100+ assets without degrading system performance."
      ]
    },
    {
      id: "proof",
      body: [
        "Technical debt becomes strategic leverage when addressed incrementally under pressure.",
        "Compliance automation at scale requires obsessive attention to edge cases and audit trails.",
        "Modular architecture enables parallel workstreams without coordination overhead."
      ]
    }
  ]
};