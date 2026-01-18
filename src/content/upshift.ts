export const upshift = {
  id: "upshift",
  title: "Upshift — Builder PM",
  sentimentScores: [20, 35, 50, 75, 92], // Different arc for this case
  beats: [
    {
      id: "chaos",
      body: [
        "Upshift had achieved product-market fit as a two-sided marketplace connecting 50K+ businesses with 200K+ hourly workers across Australia and Southeast Asia. But the company was being torn apart by three different visions: Sales wanted to go aggressive on enterprise contracts; Operations was drowning in compliance and logistics; Engineering shipped features without PM input and often broke things that Sales had promised customers.",
        "The core problem: zero product discipline. We had $8M ARR but no product roadmap, no prioritization framework, and no PM department (the CEO did product in Slack messages at midnight). Engineering was burned out from switching contexts constantly, Sales was frustrated because features got delayed indefinitely, and Operations was managing customer chaos. One enterprise deal fell apart because Engineering shipped a core feature that broke the custom integration Operations had promised.",
        "The turning point: we conducted 40+ user interviews and discovered we were losing enterprise customers (5 of 8 in a 6-month period) specifically because of product inconsistency and broken integrations. Our churn was 8% monthly—double the SaaS benchmark. We realized we had a $4-5M annual revenue problem hiding behind product dysfunction. That was the wake-up call: we needed actual product leadership to unlock the next $20M in growth."
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
        "The company was highly distributed (Australia HQ, teams in Philippines, Vietnam, Indonesia) with different cultural approaches to decision-making. The Australian leadership team was direct/data-driven; Southeast Asian teams were consensus-oriented. Forcing a single product discipline felt like imposing 'Western' methodology on diverse teams.",
        "Engineering had built a culture of independence (which was great for shipping speed, terrible for consistency). When I proposed structured prioritization, the CTO resisted: 'We'll lose our agility if we have to wait for product decisions.' Sales wanted daily feature requests; Finance wanted data-driven ROI. Everyone had legitimate constraints, but they were pulling in different directions.",
        "The behavioral challenge: leadership was skeptical of product management. The CEO had built the first $8M without a PM—he wasn't convinced a 'process person' would add value vs. slow things down. He said, 'Won't a PM department become a blocker?' I had to prove product discipline would accelerate growth, not constrain it."
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
        "I personally hired and mentored a 5-person product & design team (conducted 60+ interviews, reduced time-to-hire by 25% through structured assessment). More importantly, I made the team distributed—put a product manager in each region (Australia, Philippines, Vietnam) so they could build local context and buy-in. The distributed product team made the process feel less like 'headquarters mandate' and more like 'local autonomy with alignment.'",
        "Shipped 4 AI-driven retention features (churn prediction, intelligent shift recommendations, worker performance scoring, dynamic pricing). Results: lead conversion improved 12%, churn dropped from 8% → 4% monthly (8-figure annual revenue impact). By shipping features driven by churn data instead of ad-hoc requests, we proved that product discipline accelerated revenue growth. The CTO said, 'I was wrong—structure actually makes us faster because Engineering isn't context-switching.'"
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
        "Lead conversion: 8.2% → 9.2% (+12% improvement). Seems small, but at $8M ARR scale, every percentage point = $80K additional annual revenue. The 4 AI retention features generated $320K additional revenue within 12 months (ROI on product team: ~18x in year 1).",
        "Team scaling: Hired 5 product/design staff, distributed across 3 regions. More importantly, Engineering went from 70% context-switching to 20% (measured via project tracking). This freed up 10 engineer-months per quarter for new product work vs. fire-fighting. That's equivalent to hiring 2 additional engineers without the cost.",
        "Organizational: Converted leadership from skeptical to advocate. The CEO went from 'PM is overhead' to making Product a board agenda item. The CTO published an internal blog post: 'Structured Product Management Increased Our Velocity.' This mindset shift was critical for the next phase of scaling."
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
        "Strategic Pivot: Distributed product teams solved the 'Western process imposed on Asia' problem. By putting a PM in each region with autonomy, we got alignment without cultural friction. This became a competitive advantage—we understood local markets faster than competitors.",
        "Change Management Lesson: Never start with process; always start with data and user problems. I didn't say, 'We need a prioritization framework'—I said, '40% of our losses are due to product inconsistency.' The framework came later, once everyone agreed on the problem.",
        "Leadership Development: The CTO and I built a deep partnership. Instead of me imposing product decisions on Engineering, we co-owned outcomes. When churn dropped 4%, he celebrated it as much as I did. When a feature didn't work, we learned together instead of blaming each other.",
        "Scalability Insight: AI retention features worked because we had product discipline to analyze churn patterns rigorously. Under the old ad-hoc system, we would've shipped random feature requests and never understood why churn was actually dropping. Data-driven product culture made innovation repeatable."
      ]
    }
  ]
};