import type { CaseStudy } from "./types";

export const la3eb: CaseStudy = {
  id: "la3eb",
  title: "La3eb — Gaming Super-App",
  sentimentScores: [10, 20, 35, 75, 95],
  beats: [
    {
      id: "problem",
      body: [
        "La3eb was a brand-new gaming super-app in Saudi Arabia with huge upside and almost no engagement. Leadership wanted to build the biggest gaming and e-commerce community in KSA, timed to the PS5 launch. The bet was simple: own the gamers before PS5 dropped and you own a generation. But the app fell flat — no social layer, no reason to come back.",
        "There were two sides to the product: engagement (community, content, social) and transactions (commerce, game sales, in-app purchases). Leadership poured everything into transactions and starved engagement. That was backwards — with no community there's no one to transact with. The funnel was broken at the very top.",
        "The reality was blunt: 15-day retention under 8%, DAU stuck at 3,000 despite heavy marketing, zero organic virality. KSA gamers were alive on Discord, WhatsApp groups and Twitter — just not on La3eb. We had a distribution problem dressed up as a revenue problem, and the PS5 window was closing.",
      ],
      insight:
        "If no one opens the app, there's no one to sell to. Engagement isn't the opposite of revenue — it's the top of the funnel.",
      stakeholders: [
        { name: "Gaming Community", role: "Users & Evangelists", color: "#FF0080" },
        { name: "Leadership/Business", role: "Revenue & Strategy", color: "#00FFFF" },
        { name: "Engineering Team", role: "Product Execution", color: "#FFD700" },
        { name: "Marketing", role: "User Acquisition", color: "#FF6B35" },
        { name: "Finance", role: "Budget & Metrics", color: "#00FF00" },
      ],
    },
    {
      id: "constraints",
      body: [
        "We had a hard, immovable deadline — the PS5 launch — and about 10 weeks to turn a transactional shell into a living community. Miss the window and we miss the cultural moment; competitors would take the community and lock us out.",
        "And we had no way to see anything. No analytics beyond downloads and DAU, no NPS, no interviews, no funnel, no session data. We were making calls on leadership intuition and competitor copying instead of real behaviour, so we had to build the data foundation while shipping — the plane and the runway at once.",
        "Leadership kept pulling everything back to revenue: 'how does this drive transactions?' Convincing them to spend 10 weeks on engagement meant proving engagement was the unlock for revenue, not a detour from it — with a team of three (two engineers, one designer, me) against a transaction side with five times the headcount.",
      ],
      decisions: [
        { label: "Perfect Planning (6 months)", speed: 20, risk: 30, isChosen: false, color: "#FF6B35" },
        { label: "Full Replatform (High Risk)", speed: 50, risk: 80, isChosen: false, color: "#FFD700" },
        { label: "Rapid Iteration (Weekly Releases)", speed: 95, risk: 35, isChosen: true, color: "#FF0080" },
      ],
    },
    {
      id: "approach",
      body: [
        "We started with users, not features. In week one I stood up event tracking (Firebase), put NPS surveys inside the app, and ran 20+ interviews with our most engaged players myself. Some data beats no data, and power users tell you things analytics never will.",
        "The research was clarifying: gamers didn't want another store, they wanted connection — to talk strategy, share clips, find squadmates, argue about reviews, show off their collections. Commerce was table stakes; the social layer was what would make them open the app daily.",
        "So I made a bet: turn our most engaged players into co-creators. I pulled 50 power users into a private WhatsApp group, shared mockups, asked for feedback, and gave them features before everyone else. They felt ownership, and they became evangelists.",
        "Then we shipped weekly. A community feed (clips, reviews, screenshots), then in-app chat for squad-finding, then a dedicated PS5 lobby, then NPS and session analytics, then a fortnight refining what the data and the group told us. Every feature built a loop: likes, comments, follows, groups, notifications.",
      ],
      insight:
        "Your 50 most engaged users out-research any dashboard — if you treat them like partners instead of survey rows.",
      initiatives: [
        { label: "Community Feed & Content", effort: 40, impact: 90, timeToValue: 10, color: "#FF0080" },
        { label: "In-App Chat & Squad Finding", effort: 50, impact: 92, timeToValue: 15, color: "#00FFFF" },
        { label: "PS5 Launch Lobby", effort: 35, impact: 88, timeToValue: 20, color: "#FFD700" },
        { label: "Analytics & User Insights", effort: 30, impact: 85, timeToValue: 5, color: "#FF6B35" },
      ],
    },
    {
      id: "results",
      body: [
        "La3eb became the place to be for the PS5 launch in KSA. By launch day DAU had gone from 3,000 to 18,000 (6×) and 15-day retention from 8% to 34% (4×). The PS5 lobby was the most active part of the app — 12,000+ users posting, chatting, coordinating buys, finding sellers, sharing unboxings, forming launch-night squads.",
        "Engagement opened the transaction funnel exactly as we'd hoped. Feed participants were 4× more likely to buy than passive browsers; chat users converted at 6× the rate of non-chat users. The flywheel wasn't a theory anymore — the data showed it.",
        "NPS climbed from 22 to 58. People called it 'the only gaming app that feels like a real community' and 'better than Discord for KSA gamers.' Word of mouth became our main growth channel, because the app finally had things worth sharing.",
        "The launch itself was a moment for La3eb: 2,000+ buyer connections, a virtual launch party with 5,000+ attendees, the hub for PS5 talk in the region. Competitors had better stock and pricing; we had the community, and community is stickier than a transaction.",
      ],
      metrics: [
        { label: "Daily Active Users", before: 3, after: 18, unit: "k", color: "#FF0080" },
        { label: "15-Day Retention", before: 8, after: 34, unit: "%", color: "#00FFFF" },
        { label: "NPS Score", before: 22, after: 58, unit: "pts", color: "#FFD700" },
        { label: "Chat User Conversion", before: 1, after: 6, unit: "x lift", color: "#FF6B35" },
      ],
    },
    {
      id: "learnings",
      body: [
        "Engagement unlocks revenue, but revenue teams rarely fund it. Leadership's transaction focus was rational and short-sighted at once. The fix wasn't a better argument, it was data — once chat users converted at 6×, the debate ended.",
        "Power users are the best product partners you'll find. The 50-person group was our fastest, highest-signal feedback loop, and their evangelism moved more growth than any campaign.",
        "Under a real deadline, shipping weekly beats planning perfectly. Some of it was rough — the early chat UI was clunky — but people forgive rough when they can see you listening and improving every week.",
        "Community compounds in a way transactions don't. One sale is one sale; one engaged player pulls in five more. That's the whole reason the engagement side was worth the fight.",
      ],
      insight: "Transactions add up. Community multiplies. Fund the thing that compounds.",
    },
  ],
};
