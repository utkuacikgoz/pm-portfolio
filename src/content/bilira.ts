export const bilira = {
  id: "bilira",
  title: "BiLira — Technical Product Management",
  sentimentScores: [15, 28, 45, 82, 95], // Problem → Constraints → Approach → Results → Learnings
  beats: [
    {
      id: "chaos",
      body: [
        "BiLira had scaled to 100K+ verified users and was processing 1000+ daily trades across 100+ digital assets on 5+ blockchains—but compliance was becoming a growth killer. Every transaction required manual AML/KYC review under Turkey's strict regulatory oversight, creating a severe bottleneck: compliance reviews were taking 4-6 hours, directly blocking users from executing time-sensitive trades.",
        "The core problem: our team was excellent at building crypto infrastructure, but we were applying traditional compliance workflows to a 24/7 trading environment. We had a 20-person engineering team, 5 compliance officers working around the clock, and a CTO who was stretched managing infrastructure while firefighting compliance exceptions. Trading desk leads were literally requesting faster manual reviews, which created risk.",
        "The turning point came when we lost a $2M institutional OTC trade because our manual review process took 3 hours—and the counterparty went to a competitor. That week, we realized we had to choose: scale compliance through automation or hit a hard ceiling at ~1500 trades/day. The regulatory environment was tightening (Turkish fintech regs were shifting rapidly), so waiting wasn't an option."
      ],
      stakeholders: [
        { name: "Compliance Officer", role: "Regulatory Oversight", color: "#FF0080" },
        { name: "CTO", role: "Infrastructure", color: "#00FFFF" },
        { name: "Trading Desk Lead", role: "OTC Operations", color: "#FFD700" },
        { name: "Product Lead", role: "Feature Prioritization", color: "#FF6B35" },
        { name: "DevOps Lead", role: "System Reliability", color: "#00FF00" }
      ]
    },
    {
      id: "constraints",
      body: [
        "We faced three brutal constraints: (1) Turkish regulators changed AML/KYC requirements with 48-72 hours notice, (2) any compliance error could trigger platform suspension (existential risk), and (3) our compliance team was burning out—working 70-hour weeks to manually review trades. We literally had officers sleeping at the office.",
        "Technically, automating compliance seemed risky. False negatives could miss money laundering; false positives would frustrate legitimate traders. Our CTO was skeptical: 'If we automate and miss one bad actor, regulators will shut us down.' The compliance officer said, 'We can't trust AI with AML—we'll be liable.' Sales pushed back: 'Our customers are going to Coinbase if we keep rejecting legitimate trades in 4 hours.'",
        "The strategic dilemma: build a hybrid system (slower but safer) or invest heavily in AI-driven automation (faster but riskier)? We needed 35% faster execution to retain institutional clients, but we couldn't sacrifice regulatory trust. Every decision carried 8-figure consequences."
      ],
      decisions: [
        {
          label: "Manual Review (Safe)",
          speed: 20,
          risk: 30,
          isChosen: false,
          color: "#FF6B35"
        },
        {
          label: "Automated Compliance (Risky)",
          speed: 85,
          risk: 75,
          isChosen: false,
          color: "#FFD700"
        },
        {
          label: "Hybrid Pipeline (Our Choice)",
          speed: 80,
          risk: 25,
          isChosen: true,
          color: "#FF0080"
        }
      ]
    },
    {
      id: "decisions",
      body: [
        "We chose the 'Hybrid Pipeline' approach: automated first-pass AML/KYC screening (flagging 90% of compliant transactions instantly), with human review reserved for edge cases and high-risk patterns. Machine learning handled routine cases while compliance officers focused on strategic exceptions. We reduced manual review time from 4.2 hours → 28 minutes (93% faster) while increasing detection accuracy by 18%.",
        "I personally led the 20-person cross-functional team: 10 engineers, 3 compliance experts, 2 designers, and 5 operations staff. First leadership challenge—the CTO and Compliance Officer had fundamentally different risk models. I ran weekly 'decision sessions' where we simulated failure scenarios, tested edge cases, and built shared confidence. By week 6, they were co-champions of the hybrid approach instead of skeptics.",
        "Shipped a modular compliance engine in 12 weeks that processed 1000+ trades/day while maintaining 99.97% regulatory accuracy (exceeding Turkish requirements). Results: +$8M in institutional OTC volume within 90 days, zero regulatory violations, and trade execution throughput increased 45%. Our compliance team went from 70-hour weeks to sustainable 50-hour weeks."
      ],
      initiatives: [
        {
          label: "AML/KYC Pipeline",
          effort: 75,
          impact: 88,
          timeToValue: 45,
          color: "#FF0080"
       ,
      metrics: [
        { label: "Manual Review Time", before: 180, after: 117, unit: "min", color: "#FF0080" },
        { label: "OTC Throughput", before: 100, after: 145, unit: "trades/hr", color: "#00FFFF" },
        { label: "Compliance Score", before: 92, after: 99, unit: "%", color: "#FFD700" },
        { label: "Trade Execution", before: 45, after: 12, unit: "sec", color: "#FF6B35" }
      ] },
        {
          label: "OTC System Redesign",
          effort: 80,
          impact: 92,
          timeToValue: 50,
          color: "#00FFFF"
        },
        {
          label: "Trade API Infrastructure",
          effort: 70,
          impact: 85,
          timeToValue: 35,
          color: "#FFD700"
        },
        {
          label: "Compliance Dashboard",
          effort: 50,
          impact: 75,
          timeToValue: 20,
          color: "#FF6B35"
        }
      ]
    },
    {
      id: "deterministic",
      body: [
        "Compliance review time: 4.2 hours → 28 minutes (93% reduction). This unlocked institutional trading—competitors took 6-12 hours. Within 90 days, 15 major institutional traders migrated to BiLira specifically because of our speed.",
        "Revenue impact: Institutional OTC volume grew from $500K/day → $2.2M/day (+340% growth). Annual trading volume added $18M in new revenue. With 12 bps take rate, the compliance automation project generated $216K additional annual revenue. ROI: ~8x within 6 months.",
        "Regulatory moat: Maintained zero violations while regulators audited us twice. We became a reference case for Turkish regulators—they cited our hybrid approach in fintech guidance. Regulators' trust was harder for competitors to replicate than our technical throughput.",
        "Team impact: Reduced burnout (70-hr → 50-hr weeks), hired 2 new team members for growth, and the CTO became an advocate for data-driven risk modeling. Scaled from 1,000 to 5,000 trades/day without adding compliance headcount."
      ]
    },
    {
      id: "proof",
      body: [
        "Turning Point Insight: When two experts (CTO & Compliance Officer) fundamentally disagree on approach, it usually means both are partly right. We didn't hire another opinion; we co-designed a solution that incorporated their legitimate concerns. The hybrid model worked because it was built on shared problem-solving, not compromise.",
        "Strategic Principle: In regulated fintech, automation accelerates business, but regulation-friendly automation builds moats. Competitors could copy our throughput, but regulators' trust in our governance was harder to replicate. By the time competitors caught up technically, we had 18 months of regulatory goodwill and reference cases.",
        "Leadership Lesson: Compliance teams are often seen as 'cost centers' preventing growth. We reframed them as 'growth enablers'—their expertise unlocked $18M in institutional volume. This shifted the entire org's view: compliance became strategic, not administrative. In the next hiring round, we promoted the Lead Compliance Officer to VP of Risk & Growth.",
        "Product Principle: Ship modular, not monolithic. We built the compliance engine as a pluggable system because we knew Turkish regulations would evolve. When regulations changed (twice in 18 months), we updated one module in 2 days vs. the 3-4 weeks a monolithic system would've required. Modularity literally saved us from being out-of-compliance during transitions."
      ]
    }
  ]
};