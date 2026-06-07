export const upshift = {
  id: "upshift",
  title: "Upshift — Builder PM",
  sentimentScores: [20, 35, 50, 75, 92], // Different arc for this case
  beats: [
    {
      id: "chaos",
      body: [
        "Upshift had achieved product-market fit as a two-sided marketplace connecting 50K+ businesses with 200K+ hourly workers across 20 states in US. But the company was being torn apart by three different visions: Sales wanted to go aggressive on enterprise contracts; Operations was drowning in growth; Engineering shipped features without PM input and often broke things that Sales had promised customers.",
        "The core problem: zero product discipline. We had $35M ARR but no product roadmap, no prioritization framework, and no PM department. Engineering was burned out from switching contexts constantly, Sales was frustrated because features got delayed indefinitely, and Operations was managing customer chaos.",
        "The turning point: we conducted 40+ user interviews and discovered we were losing enterprise customers (5 of 8 in a 6-month period) specifically because of product inconsistency and broken integrations."
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
        "The company was highly distributed (US HQ, teams in Philippines, Macedonia, Poland) with different cultural approaches to decision-making. The US leadership team was direct/data-driven; Southeast Asian teams were consensus-oriented. Forcing a single product discipline felt like imposing 'Western' methodology on diverse teams.",
        "Engineering had built a culture of independence (which was great for shipping speed, terrible for consistency). When I proposed structured prioritization, the CTO was resistant at the beginning. Sales wanted daily feature requests; Customer Success wanted features that would make their lives easier and clients happier. Everyone had legitimate constraints, but they were pulling in different directions.",
        "The behavioral challenge: leadership was skeptical of product management.They never worked with PMs before and saw them as overhead. They were not very tech-savy either, so explaining the value of product discipline without jargon was critical."
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
        "Instead of imposing a rigid framework, I chose 'Gradual Institutionalization': start lightweight, prove value, build consensus across distributed teams. Week 1: user research + data audit (zero politicking). Week 2: introduce bi-weekly 'Product Review' sessions with Sales, Ops, and Engineering together (transparency over process). Week 3: build a simple OKR + prioritization model showing why certain features would impact churn and unit economics.",
        "I personally hired and mentored a 5-person product & design team (conducted 60+ interviews, reduced time-to-hire by 25% through structured assessment). More importantly,'",
        "Shipped 4 AI-driven retention features (churn prediction, intelligent shift recommendations, worker performance scoring, dynamic pricing). Results: lead conversion improved 12%, churn dropped from 8% → 4% monthly (8-figure annual revenue impact). By shipping features driven by churn data instead of ad-hoc requests, we proved that product discipline accelerated revenue growth.'"
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
        "Churn reduction: 8% → 4% monthly. This unlocked $5M+ in new enterprise contracts (customers stay longer = higher CLV). Revenue per customer increased 18% because we could afford to invest in customer success instead of acquisition.",
        "Lead conversion: 8.2% → 9.2% (+12% improvement). Seems small, but at $30M ARR scale, every percentage point = $80K additional annual revenue. The 4 AI retention features generated $320K additional revenue within 12 months (ROI on product team: ~18x in year 1).",
        "Team scaling: Hired 5 product/design staff, distributed across 4 regions. More importantly, Engineering went from 70% context-switching to 20% (measured via project tracking). This freed up 10 engineer-months per quarter for new product work vs. fire-fighting. That's equivalent to hiring 2 additional engineers without the cost.",
        "Organizational: Converted leadership from skeptical to advocate. The CEO went from 'PM is overhead' to making Product a board agenda item. This mindset shift was critical for the next phase of scaling."
      ],
      metrics: [
        { label: "Monthly Churn", before: 8.0, after: 4.0, unit: "%", color: "#FF0080" },
        { label: "Lead Conversion", before: 8.2, after: 9.2, unit: "%", color: "#00FFFF" },
        { label: "Engineering Efficiency", before: 70, after: 80, unit: "% allocated", color: "#FFD700" },
        { label: "NPS Score", before: 32, after: 50, unit: "pts", color: "#FF6B35" }
      ]
    },
    {
      id: "proof",
      body: [
        "Distributed product teams solved the 'Western process imposed on Asia' problem. Putting a PM in each region, with real autonomy, got us alignment without the cultural friction. It turned into an edge: we read local markets faster than competitors did.",
        "Never start with process; start with data and the user problem. I didn't say 'we need a prioritization framework.' I said '40% of our losses come from product inconsistency.' The framework came later, once everyone already agreed on the problem.",
        "The CTO and I built a real partnership. Instead of me imposing product decisions on engineering, we co-owned the outcomes. When churn dropped 4% he celebrated it as much as I did, and when a feature missed we worked it out together instead of pointing fingers.",
        "The AI retention work paid off because we had the discipline to analyze churn patterns properly. Under the old ad-hoc system we'd have shipped random feature requests and never known why churn actually moved. The data-driven culture is what made the wins repeatable."
      ]
    }
  ]
};