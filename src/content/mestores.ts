export const mestores = {
  id: "mestores",
  title: "Mestores — 0→1 Digital Transformation",
  sentimentScores: [12, 30, 55, 78, 98], // Steeper growth arc for transformation
  beats: [
    {
      id: "chaos",
      body: [
        "Mestores operated across KSA, UAE, and Egypt with legacy systems powering hospital digitization, last-mile delivery, headless commerce, and gaming.",
        "Inventory, distribution, and customer experience ran on outdated manual processes with no central visibility.",
        "Teams were siloed across design, engineering, and operations with no unified execution framework."
      ],
      stakeholders: [
        { name: "CTO", role: "Technical Leadership", color: "#00FFFF" },
        { name: "Regional Operations Heads", role: "Local Execution", color: "#FFD700" },
        { name: "CFO", role: "Capital & ROI", color: "#FF6B35" },
        { name: "Product & Design", role: "User Experience", color: "#00FF00" },
        { name: "Business Development", role: "Partnerships", color: "#FF0080" }
      ]
    },
    {
      id: "constraints",
      body: [
        "Deeply ingrained habits resisted digital workflows—manual processes were seen as 'safer' than automation.",
        "Cultural resistance to change slowed adoption of new tools and systems.",
        "Extremely tight delivery timelines demanded parallel execution across multiple verticals simultaneously."
      ],
      decisions: [
        {
          label: "Sequential Rollout (Safe)",
          speed: 30,
          risk: 20,
          isChosen: false,
          color: "#FF6B35"
        },
        {
          label: "Big Bang Launch (Fast, Risky)",
          speed: 90,
          risk: 85,
          isChosen: false,
          color: "#FFD700"
        },
        {
          label: "Parallel Tracks + Daily Deployments (Our Choice)",
          speed: 85,
          risk: 40,
          isChosen: true,
          color: "#FF0080"
        }
      ]
    },
    {
      id: "decisions",
      body: [
        "Replaced large releases with continuous delivery, prioritizing learning over perfection through daily deployments.",
        "Advanced business and technical flows in parallel, avoiding sequential dependencies that would delay launch.",
        "Built NPS and retention frameworks that increased retention by 5% and generated $50K in additional revenue within 6 months."
      ],
      initiatives: [
        {
          label: "Inventory Platform",
          effort: 70,
          impact: 92,
          timeToValue: 35,
          color: "#FF0080"
       ,
      metrics: [
        { label: "Time to Launch", before: 120, after: 55, unit: "days", color: "#FF0080" },
        { label: "Feature Cycle Time", before: 14, after: 10, unit: "days", color: "#00FFFF" },
        { label: "Retention Increase", before: 62, after: 67, unit: "%", color: "#FFD700" },
        { label: "Revenue Generated", before: 0, after: 50, unit: "K$", color: "#FF6B35" }
      ] },
        {
          label: "Last-Mile Delivery System",
          effort: 65,
          impact: 88,
          timeToValue: 32,
          color: "#00FFFF"
        },
        {
          label: "Analytics Dashboard",
          effort: 45,
          impact: 80,
          timeToValue: 14,
          color: "#FFD700"
        },
        {
          label: "User Training Program",
          effort: 35,
          impact: 75,
          timeToValue: 7,
          color: "#FF6B35"
        }
      ]
    },
    {
      id: "deterministic",
      body: [
        "Shipped a new inventory and delivery platform in under two months with trained teams operational at launch.",
        "Established cross-functional execution systems that reduced feature cycle time by 30%.",
        "Defined go-to-market and growth strategies that scaled multi-vertical products to profitability within 12 months."
      ]
    },
    {
      id: "proof",
      body: [
        "Incremental delivery accelerates learning faster than big-bang releases.",
        "Teams can advance on multiple fronts simultaneously when dependencies are minimized.",
        "Cultural transformation happens through demonstrated wins, not mandates."
      ]
    }
  ]
};