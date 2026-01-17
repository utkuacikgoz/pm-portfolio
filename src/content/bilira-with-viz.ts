export const bilira = {
  id: "bilira",
  title: "BiLira — Technical Product Management",
  beats: [
    {
      id: "chaos",
      body: [
        "BiLira served 100K+ verified users trading across 100+ digital assets on 5+ blockchains.",
        "Every transaction required AML/KYC compliance under strict Turkish regulatory oversight.",
        "The platform processed 1000+ trades daily while managing institutional OTC flows and maintaining 99.9% uptime."
      ],
      stakeholders: [
        { name: "Head of Engineering", role: "Technical Leadership", color: "#00FFFF" },
        { name: "Chief Compliance Officer", role: "Regulatory", color: "#FFD700" },
        { name: "VP Operations", role: "Execution", color: "#FF6B35" },
        { name: "Head of Product", role: "Strategy", color: "#FF0080" },
        { name: "Enterprise Sales", role: "Revenue", color: "#00FF00" }
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
          label: "Manual Reviews Only",
          speed: 20,
          risk: 90,
          isChosen: false,
          color: "#FF6B35"
        },
        {
          label: "Full Automation (Expensive)",
          speed: 80,
          risk: 35,
          isChosen: false,
          color: "#FFD700"
        },
        {
          label: "Phased Automation (Our Path)",
          speed: 65,
          risk: 25,
          isChosen: true,
          color: "#FF0080"
        }
      ]
    },
    {
      id: "decisions",
      body: [
        "Built AML/KYC automation pipelines that reduced manual review time by 35% while increasing accuracy to 98%.",
        "Designed a modular OTC system that boosted execution throughput by 45% across multi-asset networks.",
        "Led a 20-person cross-functional team to ship a compliance automation suite processing 1000+ trades/day.",
        "Implemented risk scoring engine that reduced false positives by 42%, improving user experience."
      ],
      initiatives: [
        {
          label: "Manual Review Automation",
          effort: 45,
          impact: 92,
          timeToValue: 14,
          color: "#FF0080"
        },
        {
          label: "Risk Scoring Engine",
          effort: 65,
          impact: 85,
          timeToValue: 28,
          color: "#00FFFF"
        },
        {
          label: "Multi-Chain Integration",
          effort: 75,
          impact: 78,
          timeToValue: 35,
          color: "#FFD700"
        },
        {
          label: "Compliance Dashboard",
          effort: 40,
          impact: 70,
          timeToValue: 10,
          color: "#FF6B35"
        }
      ]
    },
    {
      id: "deterministic",
      body: [
        "Delivered Trade API as core infrastructure, enabling enterprise clients to execute trades programmatically with token-based auth.",
        "Maintained zero compliance violations across national and international regulatory audits.",
        "Scaled network integrations to support 100+ assets without degrading system performance.",
        "Grew enterprise customer base to 25+ institutional clients with $2M+ ARR."
      ],
      metrics: [
        { label: "Enterprise Customers", before: 4, after: 25, unit: "+", color: "#FF0080" },
        { label: "Annual Recurring Revenue", before: 200, after: 2000, unit: "K$", color: "#00FFFF" },
        { label: "Compliance Violations", before: 3, after: 0, unit: "", color: "#FFD700" },
        { label: "API Availability", before: 99.9, after: 99.99, unit: "%", color: "#FF6B35" }
      ]
    },
    {
      id: "proof",
      body: [
        "Technical debt becomes strategic leverage when addressed incrementally under pressure.",
        "Compliance automation at scale requires obsessive attention to edge cases and audit trails.",
        "Modular architecture enables parallel workstreams without coordination overhead.",
        "Product-led growth in fintech requires combining user experience with regulatory excellence."
      ]
    }
  ]
};
