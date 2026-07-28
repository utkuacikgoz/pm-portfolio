import type { CaseStudy } from "./types";

export const mestores: CaseStudy = {
  id: "mestores",
  title: "Mestores, E-Commerce Modernization",
  sentimentScores: [14, 32, 48, 76, 94],
  beats: [
    {
      id: "problem",
      body: [
        "Mestores was a five-year-old e-commerce platform doing $8M ARR across KSA, loyal customers, broken foundation. The codebase was a patchwork of legacy PHP, jQuery and in-house scripts nobody fully understood, kept alive by two contractors who'd written code they couldn't maintain plus one junior learning on the job. New features took 6+ weeks. Bug fixes were guesswork.",
        "The customer experience was quietly bleeding. No analytics at all. No abandoned-cart emails, so people just forgot. No push, so no reason to come back. Product pages were thin, reviews were entered by hand, and search literally couldn't find products. Conversion was stuck at 0.8% while competitors ran 2 to 3%.",
        "The real hole: roughly $500K a year lost to abandoned carts alone, with no visibility into why. 78% of customers bought once and never came back. Leadership did the math, we could double revenue by fixing the platform instead of buying more ads.",
      ],
      insight: "You can't optimize what you can't see. The first product decision was to stop flying blind.",
      stakeholders: [
        { name: "Legacy Engineering Team", role: "Maintenance & Blockers", color: "#FF0080" },
        { name: "Product/UX", role: "Customer Experience", color: "#00FFFF" },
        { name: "Marketing", role: "Acquisition Costs", color: "#FFD700" },
        { name: "Finance/CFO", role: "Unit Economics", color: "#FF6B35" },
        { name: "Customers", role: "User Frustration", color: "#00FF00" },
      ],
    },
    {
      id: "constraints",
      body: [
        "Engineering capacity was the hard limit: two contractors leaving at end of contract, one junior who couldn't lead a rewrite, and hiring from outside the region meant visas and relocation. A ground-up rewrite was off the table.",
        "The debt was deep, no tests, no CI/CD, no monitoring, no error tracking. Deploys were manual FTP uploads and hope. We couldn't build the sophisticated stuff (cart recovery, dynamic email, personalization) without infrastructure we didn't have, and 'infrastructure' sounded like overhead until I reframed it as 'we need this to ship anything at all.'",
        "Budget was tied to proof. Leadership wouldn't fund three senior engineers until we showed platform work drove revenue, a chicken-and-egg problem. So I went hunting for quick wins: low-effort, high-impact features that would show results in weeks, not months.",
      ],
      decisions: [
        { label: "Total Rewrite (Years, High Risk)", speed: 10, risk: 90, isChosen: false, color: "#FF6B35" },
        { label: "Gradual Fixes (Slow, Safe)", speed: 25, risk: 20, isChosen: false, color: "#FFD700" },
        { label: "Strategic Modernization (Infrastructure + Features)", speed: 70, risk: 40, isChosen: true, color: "#FF0080" },
      ],
    },
    {
      id: "approach",
      body: [
        "Phase 1 (weeks 1 to 4): visibility. I put in GA4, Sentry and custom event tracking without touching the core code, and wired abandoned-cart emails through a third-party service. Low engineering lift, immediate impact, within two weeks we could see the funnel and the cart flow was already making money.",
        "Phase 2 (weeks 5 to 8): the e-commerce basics. A redesigned product page (better images, reviews, ratings, recommendations), push notifications for order status and repeat prompts, a wishlist, and checkout cut from five steps to two, UX, not a rewrite. Conversion went 0.8% → 1.4%, repeat purchases 22% → 31%.",
        "Phase 3 (weeks 9 to 12): infrastructure. We moved off manual deploys to GitHub Actions, added a staging environment and automated tests on the checkout path, and brought in real-time inventory sync. Invisible to customers, but it's what let us iterate fast, and bugs dropped because we finally had safety nets.",
        "Phase 4 (weeks 13 to 16): growth. Dynamic email (cart and browse abandonment, win-back) off segmentation data, recommendations from browsing history, and loyalty features (points, tiers, exclusive deals), almost all of it through integrations and configuration rather than new code.",
      ],
      insight:
        "Ship a visible win first, then spend that credibility on the invisible work. Nobody funds CI/CD until they've seen the cart-recovery revenue.",
      initiatives: [
        { label: "Analytics & Tracking Foundation", effort: 20, impact: 90, timeToValue: 5, color: "#FF0080" },
        { label: "Abandoned Cart Recovery", effort: 15, impact: 85, timeToValue: 8, color: "#00FFFF" },
        { label: "E-Commerce Best Practices (Checkout, Reviews, Recommendations)", effort: 50, impact: 88, timeToValue: 20, color: "#FFD700" },
        { label: "CI/CD & Infrastructure", effort: 60, impact: 80, timeToValue: 30, color: "#FF6B35" },
      ],
    },
    {
      id: "results",
      body: [
        "Cart recovery alone brought back roughly $500K of first-year lost sales through email and push. Lifetime value rose 140% as repeat customers started spending 2 to 3× more, and the unit economics flipped, from $80 CAC at 22% repeat to $50 CAC at 48% repeat.",
        "The platform became maintainable. With CI/CD and error tracking, engineers shipped instead of firefighting; the junior took ownership of features instead of being blocked; deploys went from 'manual FTP' to 'git push'; bug reports fell 60%. The team went from demoralized to confident.",
        "And customers felt it. NPS jumped 32 → 68. Faster checkout, working search, personalized recommendations, real order updates, the platform felt modern instead of broken, and returning customers named 'better experience' as the reason they came back.",
      ],
      metrics: [
        { label: "Conversion Rate", before: 0.8, after: 2.1, unit: "%", color: "#FF0080" },
        { label: "Repeat Purchase Rate", before: 22, after: 48, unit: "%", color: "#00FFFF" },
        { label: "Abandoned Cart Recovery", before: 0, after: 500, unit: "K$/yr", color: "#FFD700" },
        { label: "Customer Lifetime Value", before: 120, after: 280, unit: "$", color: "#FF6B35" },
      ],
    },
    {
      id: "learnings",
      body: [
        "Analytics first, everything else second. We didn't fix anything until we could see what was broken, GA4 showed the drop-offs, Sentry surfaced hidden bugs, event data showed what actually mattered. Most teams skip this and optimize blind.",
        "E-commerce is a solved problem; the value is execution, not invention. Cart recovery, recommendations, push, segmentation, these are commodities now. We wired up Clevertap, Firebase and Data Studio instead of building, and shipped far faster for it.",
        "Quick wins buy you the right to do the foundational work. Without the cart-recovery ROI in week two, we'd never have gotten budget for CI/CD and monitoring. Visible impact first, foundation second.",
        "Legacy code usually isn't the enemy. Our PHP wasn't fundamentally bad, we just couldn't see, deploy safely, or debug. Fix visibility first and code quality tends to follow.",
      ],
      insight: "The right metric doesn't just measure behaviour, it changes it.",
    },
  ],
};
