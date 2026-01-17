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
        { name: "VP Sales", role: "Growth & Revenue", color: "#FF0080" },
        { name: "CTO", role: "Technical Strategy", color: "#00FFFF" },
        { name: "Operations Lead", role: "Worker & Client Ops", color: "#FFD700" },
        { name: "Finance", role: "Unit Economics", color: "#FF6B35" },
        { name: "Design", role: "User Experience", color: "#00FF00" }
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
          label: "Slow Rollout (Safety)",
          speed: 30,
          risk: 15,
          isChosen: false,
          color: "#FF6B35"
        },
        {
          label: "Aggressive Change (Risk)",
          speed: 90,
          risk: 80,
          isChosen: false,
          color: "#FFD700"
        },
        {
          label: "Gradual Institutionalization (Our Choice)",
          speed: 70,
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
          label: "Product & Design Team Build",
          effort: 60,
          impact: 90,
          timeToValue: 60,
          color: "#FF0080"
        },
        {
          label: "AI Retention Features",
          effort: 75,
          impact: 85,
          timeToValue: 45,
          color: "#00FFFF"
        },
        {
          label: "Prioritization Framework",
          effort: 40,
          impact: 80,
          timeToValue: 15,
          color: "#FFD700"
        },
        {
          label: "Cross-functional Rituals",
          effort: 35,
          impact: 75,
          timeToValue: 10,
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
        { label: "Lead Conversion", before: 8.2, after: 9.2, unit: "%", color: "#00FFFF" },
        { label: "Churn Rate", before: 4.5, after: 4.2, unit: "%", color: "#FFD700" },
        { label: "NPS Score", before: 32, after: 50, unit: "pts", color: "#FF6B35" }
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