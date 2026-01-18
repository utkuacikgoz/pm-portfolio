export const mestores = {
  id: "mestores",
  title: "Mestores — 0→1 Digital Transformation",
  sentimentScores: [12, 30, 55, 78, 98], // Steeper growth arc for transformation
  beats: [
    {
      id: "chaos",
      body: [
        "Mestores was a $12M ARR operation across KSA, UAE, and Egypt, operating four separate business units: hospital digitization (PACS systems), last-mile delivery, headless commerce, and gaming infrastructure. But every unit was running on legacy manual systems with zero integration. Inventory was tracked in Excel; distribution happened via phone calls; customer experience was chaos.",
        "The core problem: we were growing despite our systems, not because of them. We had 8-hour turnarounds for customer requests; hospitals had patient data stuck in silos; the delivery business couldn't track packages in real-time. Growth came from market expansion, not operational excellence. The CFO said, 'We're leaking 22% margin just from operational inefficiency. If we don't fix this, competitors will eat us alive at higher volumes.'",
        "The turning point: we landed a $3M government contract (Saudi healthcare modernization). But the contract included a clause: 'System must achieve 95% uptime and real-time data visibility.' Our legacy systems couldn't deliver. We had 16 weeks to build a platform that tied together four business units or lose the largest deal in company history. This was the catalyst: we finally had permission to completely rebuild."
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
        "16-week deadline for a platform that had never been built. We literally had no time for lengthy planning. But releasing broken code would lose the $3M contract + damage our credibility. This was the worst constraint: we had to move fast AND maintain zero errors.",
        "Cultural resistance was brutal. Hospital staff didn't trust digital workflows—they'd been doing things manually for 20 years. Delivery drivers thought GPS tracking meant management was spying on them (completely reasonable in some markets). Getting buy-in from users while rebuilding systems was nearly impossible. One regional director said, 'I trust our old processes more than your new software.'",
        "Technical complexity: Four business units had different workflows, data models, and compliance requirements. Hospital data was PHI (protected health info); delivery had geo-tracking regulations; gaming had different KYC rules in each country. We couldn't build a monolithic system; it had to be modular yet integrated. And we had to do it in 16 weeks while maintaining uptime for $12M in existing operations."
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
        "We chose 'Parallel Tracks + Daily Deployments': Instead of building one integrated system sequentially (which would take 6 months), we split into 4 parallel teams (hospital, delivery, commerce, gaming), each shipping working code daily. By day 16, every unit had basic functionality; by week 5, we had integrated enough to test the government contract workflows; by week 14, we had 95% of the government requirements live.",
        "I personally led this transformation by establishing 'Product Trust': Every unit leader knew the deadline and the stakes. Instead of top-down requirements, I facilitated weekly 'War Room' sessions where each team demonstrated working software, showed what was blocking them, and got unblocked immediately. The CTO said, 'This is the first time I've seen real prioritization—we're removing blockers instead of adding requirements.'",
        "Deployed daily. We used feature flags to ship code that wasn't visible to users yet. This was radical for Mestores (they had done monthly releases). Daily deployment forced engineers to think in small increments, reduced risk of mega-failures, and gave us real usage data constantly. When hospital staff said, 'Patient lookup is slow,' we could optimize it that afternoon and deploy that night. By week 10, usage data from real users was feeding product decisions."
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
        "Delivered the government contract on schedule (day 112 of 112). This was 8-figure revenue + validation that Mestores could execute at enterprise scale. We became the reference case for 'digital transformation in the Middle East' and attracted $8M in follow-on contracts within 6 months.",
        "Revenue impact: Operational efficiency improved 28% across all four units. The $12M existing business now ran at 22% margin → 35% margin (13-point improvement = $1.56M additional annual profit). The $3M government contract had 45% margins (vs. 22% legacy business margins), so within 2 years, 45% of revenue was high-margin modern operations.",
        "User adoption: Hospital staff went from 'I don't trust digital' to 'I can't live without it.' We achieved 87% active monthly usage (after 16 weeks, which is exceptional for enterprise software). Delivery drivers went from resistance to advocacy—real-time tracking actually reduced customer complaints by 45% (no more 'where's my package?' calls).",
        "Team transformation: This crisis hire became Mestores' operating system. The 4 unit leaders who were siloed now had a shared rhythm: daily product demos, weekly war rooms, shared metrics dashboard. The CTO and I established a 'Ship-Learn-Adjust' culture that persisted long after the government contract launched. In year 2, we shipped features 2x faster using the same daily deployment model."
      ]
    },
    {
      id: "proof",
      body: [
        "Crisis as Catalyst: When existential stakes are clear (lose the contract or transform), teams align faster than any process can force. The 16-week deadline did more for organizational alignment than 16 months of planning would have.",
        "Parallel Execution at Scale: We proved you can advance 4 separate business units on different technology stacks simultaneously if you have clear weekly synchronization points and ruthless dependency management. One delayed decision blocks everyone; clear decisions unblock parallel work.",
        "User Involvement in Crisis: Because we deployed daily and showed hospital staff working software every week, they became problem-solvers instead of resistors. 'This field should be optional' became 'Let me test this overnight and report back.' We turned users from obstacles into partners.",
        "Scalability Insight: Operational margins improved because we automated the right things (inventory tracking, delivery logistics) and kept humans in charge of the right things (patient care decisions, customer exceptions). The AI/data infrastructure made operations faster; the product discipline made operations smarter. This combination unlocked profitability at scale."
      ]
    }
  ]
};