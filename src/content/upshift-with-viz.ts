export const upshift = {
  id: "upshift",
  title: "Upshift — Builder PM",
  beats: [
    {
      id: "chaos",
      body: [
        "Upshift reached product-market fit as a two-sided marketplace connecting businesses with hourly workers.",
        "The product evolved rapidly without dedicated PM leadership, creating fragmented decision-making across sales, ops, and engineering.",
        "As the company scaled, cross-cultural collaboration challenges and leadership skepticism toward product discipline became operational friction."
      ],
      stakeholders: [
        { name: "Head of Engineering", role: "Technical Execution", color: "#00FFFF" },
        { name: "VP Sales", role: "Customer Voice", color: "#FFD700" },
        { name: "COO", role: "Operations", color: "#FF6B35" },
        { name: "Design Lead", role: "Experience", color: "#00FF00" },
        { name: "Finance/Analytics", role: "Data-Driven", color: "#FF0080" }
      ]
    },
    {
      id: "constraints",
      body: [
        "Engineering optimized for delivery speed over product clarity, resulting in inconsistent user experiences.",
        "Sales and operations teams worked in silos, creating misalignment on customer priorities.",
        "No formal product process existed—prioritization happened ad-hoc in Slack and meetings."
      ],
      decisions: [
        {
          label: "Centralized Product Org",
          speed: 70,
          risk: 45,
          isChosen: false,
          color: "#FF6B35"
        },
        {
          label: "No Process (Status Quo)",
          speed: 95,
          risk: 80,
          isChosen: false,
          color: "#FFD700"
        },
        {
          label: "Federated PM + Light Process (Our Choice)",
          speed: 75,
          risk: 35,
          isChosen: true,
          color: "#FF0080"
        }
      ]
    },
    {
      id: "decisions",
      body: [
        "Built hiring pipelines and led a 5-person product & design team, conducting 60+ interviews and cutting time-to-hire by 25%.",
        "Introduced prioritization frameworks and product rituals gradually, favoring visibility and alignment over speed.",
        "Launched 4 AI-driven retention features that improved lead conversion by 12% and reduced churn by 7%."
      ],
      initiatives: [
        {
          label: "Retention Features (AI)",
          effort: 55,
          impact: 88,
          timeToValue: 21,
          color: "#FF0080"
        },
        {
          label: "Product & Design Hiring",
          effort: 40,
          impact: 95,
          timeToValue: 60,
          color: "#00FFFF"
        },
        {
          label: "Prioritization Framework",
          effort: 25,
          impact: 85,
          timeToValue: 7,
          color: "#FFD700"
        },
        {
          label: "CRM Integration",
          effort: 65,
          impact: 72,
          timeToValue: 30,
          color: "#FF6B35"
        }
      ]
    },
    {
      id: "deterministic",
      body: [
        "Drove 26% increase in operational efficiency across marketplace, CRM, and analytics initiatives.",
        "Implemented growth and retention loops that boosted NPS by 18 points in key accounts.",
        "Established Revenue Operations analytics with KPI dashboards, automated CRM workflows, and data-driven experimentation."
      ],
      metrics: [
        { label: "Operational Efficiency", before: 100, after: 126, unit: "%", color: "#FF0080" },
        { label: "Net Promoter Score", before: 32, after: 50, unit: "pts", color: "#00FFFF" },
        { label: "Lead Conversion", before: 8, after: 9, unit: "%", color: "#FFD700" },
        { label: "Customer Churn", before: 7, after: 0, unit: "%↓", color: "#FF6B35" }
      ]
    },
    {
      id: "proof",
      body: [
        "User-focused development rebuilds trust faster than process evangelism.",
        "Cultural change requires demonstrating value before demanding buy-in.",
        "Product discipline scales when tied directly to measurable business outcomes."
      ]
    }
  ]
};
