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
      metrics: [
        { label: "Active Users", before: 50000, after: 100000, unit: "K", color: "#FF0080" },
        { label: "Daily Trades", before: 400, after: 1000, unit: "+", color: "#00FFFF" },
        { label: "Uptime", before: 99, after: 99.9, unit: "%", color: "#FFD700" },
        { label: "Assets", before: 40, after: 100, unit: "+", color: "#FF6B35" }
      ]
    },
    {
      id: "constraints",
      body: [
        "Regulatory requirements shifted with minimal notice, requiring immediate system adaptation.",
        "Manual compliance reviews created bottlenecks, slowing trade execution and increasing operational risk.",
        "Cross-blockchain infrastructure demanded synchronized releases across engineering, legal, and operations teams."
      ],
      metrics: [
        { label: "Review Time", before: 360, after: 240, unit: "min", color: "#FF0080" },
        { label: "Error Rate", before: 12, after: 2, unit: "%", color: "#00FFFF" },
        { label: "Risk Score", before: 85, after: 20, unit: "pts", color: "#FFD700" }
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
      metrics: [
        { label: "Manual Review Reduction", before: 360, after: 234, unit: "min", color: "#FF0080" },
        { label: "Accuracy", before: 76, after: 98, unit: "%", color: "#00FFFF" },
        { label: "Throughput", before: 690, after: 1000, unit: "TPS", color: "#FFD700" },
        { label: "False Positives", before: 72, after: 42, unit: "%↓", color: "#FF6B35" }
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
