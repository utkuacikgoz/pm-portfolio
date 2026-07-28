import type { CaseStudy } from "./types";

export const upshift: CaseStudy = {
  id: "upshift",
  title: "Upshift, Builder PM",
  sentimentScores: [20, 35, 50, 75, 92],
  beats: [
    {
      id: "problem",
      body: [
        "Upshift had hit product-market fit as a two-sided marketplace, 50K+ businesses, 200K+ hourly workers, 20 states. But three visions were pulling it apart: Sales wanted to chase enterprise, Operations was drowning in growth, and Engineering shipped without PM input and kept breaking things Sales had already promised customers.",
        "Underneath it was a simple gap: zero product discipline. $35M ARR, no roadmap, no prioritization, no PM function at all. Engineering was burned out from constant context-switching, Sales was furious about indefinite delays, and Ops was firefighting customer chaos.",
        "The number that ended the debate: in 40+ interviews we found we'd lost five of eight enterprise customers in six months, specifically over product inconsistency and broken integrations.",
      ],
      insight:
        "A company can have product-market fit and still be quietly losing its best customers, because nobody owns the product.",
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
        "The company was spread across the US, the Philippines, Macedonia and Poland, with genuinely different decision-making cultures, US leadership direct and data-driven, the Asian teams consensus-first. A single product discipline risked looking like Western process imposed on everyone else.",
        "Engineering had a culture of independence, great for speed, terrible for consistency, and the CTO pushed back on structured prioritization at first. Sales wanted daily feature requests; Customer Success wanted whatever made clients happier. Every constraint was legitimate; they just pointed in different directions.",
        "And the behavioural one: leadership was skeptical of product management. They'd never worked with PMs, saw them as overhead, and weren't especially technical, so I had to explain the value of product discipline with zero jargon.",
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
        "Instead of imposing a framework, I went with gradual institutionalization: start light, prove value, build consensus across the distributed teams. Week one was user research and a data audit, no politics. Week two, bi-weekly Product Reviews with Sales, Ops and Engineering in the same room, transparency over process. Week three, a simple OKR and prioritization model that tied specific features to churn and unit economics.",
        "I hired and mentored a five-person product and design team, 60+ interviews, time-to-hire down 25% through a structured assessment. Then we let the data pick the work instead of the loudest voice in the room.",
        "We shipped four AI-driven retention features: churn prediction, smart shift recommendations, worker performance scoring and dynamic pricing. Lead conversion rose 12% and monthly churn dropped from 8% to 4%, an eight-figure annual swing. Shipping off churn data instead of ad-hoc requests is what proved product discipline accelerates revenue rather than slowing it.",
      ],
      insight:
        "You don't win skeptics with a framework. You win them by tying one feature to one number they already care about.",
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
        "Churn went 8% → 4% monthly, which unlocked $5M+ in new enterprise contracts, customers who stay are worth more, and pushed revenue per customer up 18% because we could spend on success instead of acquisition.",
        "Lead conversion went 8.2% → 9.2%. Small on paper, but at $30M ARR every point is ~$80K a year, and the four retention features added $320K inside twelve months, roughly an 18× return on the product team in year one.",
        "On the team side: five product and design hires across four regions, and Engineering went from 70% context-switching to 20% (tracked in the project data). That freed about ten engineer-months a quarter for real product work, two engineers' worth of capacity without the headcount.",
        "And the mindset shifted. The CEO went from 'PM is overhead' to putting Product on the board agenda. That change mattered more than any single metric for the next phase of scaling.",
      ],
      metrics: [
        { label: "Monthly Churn", before: 8.0, after: 4.0, unit: "%", color: "#6E86D6" },
        { label: "Lead Conversion", before: 8.2, after: 9.2, unit: "%", color: "#CB7BC7" },
        { label: "Engineering Efficiency", before: 70, after: 80, unit: "% allocated", color: "#E0A45C" },
        { label: "NPS Score", before: 32, after: 50, unit: "pts", color: "#E7684A" },
      ],
    },
    {
      id: "learnings",
      body: [
        "Distributed product teams solved the 'Western process imposed on Asia' problem. Putting a PM in each region, with real autonomy, got us alignment without the cultural friction. It turned into an edge: we read local markets faster than competitors did.",
        "Never start with process; start with data and the user problem. I didn't say 'we need a prioritization framework.' I said '40% of our losses come from product inconsistency.' The framework came later, once everyone already agreed on the problem.",
        "The CTO and I built a real partnership. Instead of me imposing product decisions on engineering, we co-owned the outcomes. When churn dropped 4% he celebrated it as much as I did, and when a feature missed we worked it out together instead of pointing fingers.",
        "The AI retention work paid off because we had the discipline to analyze churn patterns properly. Under the old ad-hoc system we'd have shipped random feature requests and never known why churn actually moved. The data-driven culture is what made the wins repeatable.",
      ],
      insight:
        "Process for its own sake gets rejected. Process visibly attached to a shared problem gets adopted.",
    },
  ],
};
