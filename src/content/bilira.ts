import type { CaseStudy } from "./types";

export const bilira: CaseStudy = {
  id: "bilira",
  title: "BiLira, Technical Product Management",
  sentimentScores: [15, 28, 45, 82, 95], // Problem → Constraints → Approach → Results → Learnings
  beats: [
    {
      id: "problem",
      body: [
        "I joined BiLira as the exchange scaled past 100,000 users and 150+ digital assets across five blockchains, doing 1,000+ trades a day. Compliance was the thing holding growth back. Every trade needed a manual AML/KYC check under Turkish and international rules, and a five-person team was reviewing them by hand. That queue was the bottleneck.",
        "I owned compliance and OTC strategy and led a 25-person engineering team. The trading desk wanted faster execution; compliance couldn't go faster without cutting corners; the CTO didn't want to automate anything that could put our license at risk. Three groups, three different definitions of 'good enough.'",
        "Doing nothing wasn't neutral. Institutional clients won't sit through a multi-hour review, so we were turning away OTC flow we should have captured. Either we automated compliance, or we capped the business at whatever five reviewers could clear by hand.",
      ],
    },
    {
      id: "constraints",
      body: [
        "Three things boxed in the design. Regulators (FATF, MiCA, and local) could change requirements with little notice. A compliance miss could cost us the license outright. And the compliance team was already at capacity, so 'hire more reviewers' wasn't an answer.",
        "Automation cut both ways. Too aggressive and we'd flag legitimate traders into churn; too loose and we'd miss something a regulator wouldn't forgive. The CTO's line was fair: automate and miss one bad actor, and we're done. So 'fully automated' was off the table from the start.",
        "I needed roughly 45% more execution throughput to keep institutional clients, without spending the regulators' trust to get it. Every option carried eight-figure consequences, so we decided on evidence, not opinion.",
      ],
      insight:
        "In a regulated market, the constraint is the product. Design for the regulator first and speed becomes something you're allowed to keep.",
    },
    {
      id: "approach",
      body: [
        "We built a hybrid pipeline. Automated screening handled the clear-cut 90%, wired to Chainalysis for on-chain risk and Notabene for travel-rule data, and routed only the ambiguous cases to human reviewers. Manual review time dropped about 35% and false positives fell 40%, while detection accuracy held at 99.7%.",
        "I led the 25-person team through it. The CTO and compliance officer started in different risk worlds, so I ran weekly sessions where we walked failure scenarios together until both owned the design instead of tolerating it. We built the engine modular on purpose, knowing the rules would move.",
        "In parallel I redefined the OTC system, 500+ institutional trades a week, latency down from 500ms to 275ms, throughput up 45% across 15+ pairs, and shipped a Trade API doing 50M+ calls a month for 50+ enterprise clients at 99.9% uptime. We also moved releases from quarterly to bi-weekly without a single regulatory breach.",
      ],
      insight:
        "Automate the 90% that's obvious; spend your humans on the 10% that's ambiguous. The machine buys the time, the people catch what the machine can't.",
    },
    {
      id: "results",
      body: [
        "Manual review time fell ~35% and false positives 40%, with detection accuracy at 99.7% and zero regulatory breaches across the period. Compliance stopped being the thing that capped growth.",
        "On the trading side: OTC latency went 500ms → 275ms, throughput rose 45%, and we ran 500+ institutional trades a week across 15+ pairs. The Trade API held 99.9% uptime on 50M+ monthly calls for 50+ enterprise clients.",
        "Releases went quarterly → bi-weekly. We could absorb a rule change in days instead of a quarter, which, in this market, is most of the advantage.",
      ],
      metrics: [
        { label: "OTC Latency", before: 500, after: 275, unit: "ms", color: "#FF0080" },
        { label: "Release Cadence", before: 90, after: 14, unit: " days", color: "#00FFFF" },
        { label: "Detection Accuracy", before: 95, after: 99.7, unit: "%", color: "#FFD700" },
        { label: "Manual Review Time", before: 100, after: 65, unit: "", color: "#FF6B35" },
      ],
    },
    {
      id: "learnings",
      body: [
        "When two experts (the CTO and the compliance officer) fundamentally disagree, it usually means both are partly right. I didn't go find a third opinion; we co-designed a solution that absorbed both sets of concerns. The hybrid model held because it was built on shared problem-solving, not compromise.",
        "In regulated fintech, automation accelerates the business, but regulation-friendly automation builds the moat. Competitors could copy our throughput; they couldn't copy the regulators' trust in how we governed it.",
        "Compliance gets treated as a cost center that slows growth down. Framed as a growth enabler, it's the opposite: it's what let us take on institutional flow the competition couldn't touch.",
        "Ship modular, not monolithic. Because the engine was pluggable, when the rules moved we updated one module in days instead of the weeks a monolith would have cost us.",
      ],
      insight: "Compliance isn't a cost center. Framed right, it's a moat a competitor can't copy.",
    },
  ],
};
