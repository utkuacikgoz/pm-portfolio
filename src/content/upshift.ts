import type { CaseStudy } from "./types";

export const upshift: CaseStudy = {
  id: "upshift",
  title: "Upshift, Product Leadership and Retention",
  glance: [
    { value: "$5M+", label: "new enterprise contracts" },
    { value: "+18%", label: "revenue per customer" },
    { value: "50", label: "NPS, up from 32" },
  ],
  sentimentScores: [20, 35, 50, 75, 92],
  beats: [
    {
      id: "problem",
      body: [
        "Upshift served 50K+ businesses and 200K+ hourly workers across 20 states. Sales commitments, operational needs and engineering priorities were managed separately, making delivery expectations difficult to keep.",
        "I joined a $30M ARR marketplace without an established product function. Engineering faced frequent priority changes, while Sales and Operations needed a reliable way to influence the roadmap.",
        "Through 40+ interviews, we identified product inconsistency and broken integrations as reasons for enterprise customer losses. Five of eight enterprise customers had left within six months.",
      ],
      insight: "Retention gave Sales, Operations and Engineering a shared basis for prioritization.",
      stakeholders: [
        { name: "VP Sales", role: "Growth & Revenue", color: "#6E86D6" },
        { name: "CTO", role: "Technical Strategy", color: "#CB7BC7" },
        { name: "Operations Lead", role: "Worker & Client Ops", color: "#E0A45C" },
        { name: "Finance", role: "Unit Economics", color: "#E7684A" },
        { name: "Design", role: "User Experience", color: "#3FA46A" },
      ],
    },
    {
      id: "constraints",
      body: [
        "Teams worked across the US, the Philippines, Macedonia and Poland, with different working hours and approval practices. A shared planning process had to accommodate those differences.",
        "Engineering needed room to deliver, Sales needed responsiveness, and Customer Success needed reliability. Leadership also needed evidence that adding a product function would improve outcomes without adding unnecessary overhead.",
      ],
      decisions: [
        { label: "Slow Rollout (Safety)", speed: 30, risk: 15, isChosen: false, color: "#E7684A" },
        { label: "Aggressive Change (Risk)", speed: 90, risk: 80, isChosen: false, color: "#E0A45C" },
        { label: "Gradual Institutionalization (our choice)", speed: 70, risk: 35, isChosen: true, color: "#6E86D6" },
      ],
    },
    {
      id: "approach",
      body: [
        "I began with user research and a data audit. We then introduced product reviews every two weeks with Sales, Operations and Engineering, followed by a prioritization model tied to churn and unit economics.",
        "I hired and mentored a five-person product and design team. A structured assessment process helped reduce time to hire by 25% across more than 60 interviews.",
        "Our retention work included four AI features: churn prediction, shift recommendations, worker performance scoring and dynamic pricing. I led prioritization around the customer problems behind churn, giving the team a shared basis for deciding what to ship.",
      ],
      insight: "A small planning process was easier to adopt when its connection to customer problems was clear.",
      initiatives: [
        { label: "Product & Design Team Build", effort: 60, impact: 90, timeToValue: 60, color: "#6E86D6" },
        { label: "AI Retention Features", effort: 75, impact: 85, timeToValue: 45, color: "#CB7BC7" },
        { label: "Prioritization Framework", effort: 40, impact: 80, timeToValue: 15, color: "#E0A45C" },
        { label: "Cross-functional Rituals", effort: 35, impact: 75, timeToValue: 10, color: "#E7684A" },
      ],
    },
    {
      id: "results",
      body: [
        "Monthly churn fell from 8% to 4%. The business secured $5M+ in new enterprise contracts, and revenue per customer rose 18% during this work.",
        "Lead conversion increased from 8.2% to 9.2%, a one percentage point improvement. NPS rose from 32 to 50.",
        "The new product and design team gave the organization a dedicated owner for discovery, prioritization and delivery alignment. Product became a standing topic in leadership discussions.",
      ],
      metrics: [
        { label: "Monthly Churn", before: 8.0, after: 4.0, unit: "%", color: "#6E86D6" },
        { label: "Lead Conversion", before: 8.2, after: 9.2, unit: "%", color: "#CB7BC7" },
        { label: "NPS Score", before: 32, after: 50, unit: "pts", color: "#E7684A" },
      ],
    },
    {
      id: "learnings",
      body: [
        "A shared process works better when teams help design it. Giving regional team members ownership made planning more useful and easier to sustain.",
        "Customer evidence made the case for prioritization. Starting with lost customers and broken integrations gave the team a concrete problem to solve together.",
        "The strongest partnership was with the CTO: shared outcomes, explicit trade-offs and joint responsibility when a feature missed expectations. AI features benefited from that same product discipline.",
      ],
      insight: "Build the process around a shared customer problem, then refine it with the team.",
    },
  ],
};
