export const mestores = {
  id: "mestores",
  title: "Mestores — E-Commerce Modernization",
  sentimentScores: [14, 32, 48, 76, 94],
  beats: [
    {
      id: "problem",
      body: [
        "Mestores was a 5-year-old e-commerce platform doing $8M ARR across KSA with a loyal customer base but a fundamentally broken technical foundation. The codebase was a patchwork of legacy PHP, jQuery, and proprietary scripts that no one fully understood. The engineering team was two contractors who had written code they couldn't maintain, plus one junior developer learning on the job. New features took 6+ weeks to ship. Bug fixes were guesswork.",
        "The customer experience was suffering silently. There was zero analytics tracking. No email notifications meant customers forgot about abandoned carts. No push notifications meant no way to drive repeat purchases. The product pages lacked compelling imagery, customer reviews were manually entered, and search was broken (literally couldn't find products). Conversion rate was stuck at 0.8% while competitors were hitting 2-3%.",
        "The real crisis: we were losing $500K annually from abandoned carts alone (customers who added items but never checked out). We had no visibility into why. Retention was abysmal, one-time purchase rate was 78%, meaning customers bought once and never returned.Leadership realized: we could double revenue by fixing the platform instead of spending more on ads."
      ],
      stakeholders: [
        { name: "Legacy Engineering Team", role: "Maintenance & Blockers", color: "#FF0080" },
        { name: "Product/UX", role: "Customer Experience", color: "#00FFFF" },
        { name: "Marketing", role: "Acquisition Costs", color: "#FFD700" },
        { name: "Finance/CFO", role: "Unit Economics", color: "#FF6B35" },
        { name: "Customers", role: "User Frustration", color: "#00FF00" }
      ]
    },
    {
      id: "constraints",
      body: [
        "The engineering constraint was acute: we had two contractors who were leaving (end of contract), and one junior who couldn't lead a rewrite.Hiring from outside the region meant visa sponsorship and relocation. We needed to modernize without having senior engineering capacity. This ruled out a complete ground-up rewrite.",
        "The technical debt was massive. The codebase had no tests, no CI/CD pipeline, no monitoring, no error tracking. Deploying a change required manual FTP uploads and prayers. We couldn't implement sophisticated features (abandoned cart recovery, dynamic email, personalization) without infrastructure we didn't have. Building the infrastructure felt like overhead until I framed it as 'we need this to ship features at all.'",
        "Budget was constrained. Leadership wanted ROI before investing heavily in engineering. They wouldn't approve hiring three senior engineers until we proved the platform improvements would drive revenue. This created a chicken-and-egg problem: we needed engineering capacity to prove the hypothesis, but couldn't get budget without proof. I had to identify quick wins: low-effort, high-impact features that would show results in weeks, not months."
      ],
      decisions: [
        {
          label: "Total Rewrite (Years, High Risk)",
          speed: 10,
          risk: 90,
          isChosen: false,
          color: "#FF6B35"
        },
        {
          label: "Gradual Fixes (Slow, Safe)",
          speed: 25,
          risk: 20,
          isChosen: false,
          color: "#FFD700"
        },
        {
          label: "Strategic Modernization (Infrastructure + Features)",
          speed: 70,
          risk: 40,
          isChosen: true,
          color: "#FF0080"
        }
      ]
    },
    {
      id: "approach",
      body: [
        "Phase 1 (Weeks 1-4): Quick Wins & Analytics. I implemented Google Analytics 4, Sentry error tracking, and custom event tracking without touching the core codebase. I also added email notifications for abandoned carts using a third-party service (Clevertap) This was low engineering lift but enormous user impact. Within two weeks, we had visibility into conversion funnel, and the abandoned cart flow generated revenue (immediate ROI).",
        "Phase 2 (Weeks 5-8): E-Commerce Essentials. Built a modern product page redesign (better images, customer reviews, ratings, recommendations). Implemented push notifications for order status and repeat purchase prompts via Firebase. Added wishlist feature (low-effort, high retention impact). Converted the checkout from 5 steps to 2 steps through UX refinement, not code rewrite. Results: conversion rate jumped from 0.8% to 1.4%, repeat purchase rate from 22% to 31%.",
        "Phase 3 (Weeks 9-12): Infrastructure Investment. Migrated from manual deployment to GitHub Actions CI/CD. Implemented a staging environment. Set up automated tests for critical checkout flows. Added real-time inventory sync. This infrastructure work was invisible to customers but unlocked faster iteration. Bugs decreased because we now had safety nets and visibility.",
        "Phase 4 (Weeks 13-16): Personalization & Growth. Built dynamic email campaigns (cart abandonment, browse abandonment, win-back sequences) using customer segmentation data. Implemented product recommendations based on browsing history. Added loyalty features (points, tiers, exclusive deals). All built with minimal code through API integrations and configuration."
      ],
      initiatives: [
        {
          label: "Analytics & Tracking Foundation",
          effort: 20,
          impact: 90,
          timeToValue: 5,
          color: "#FF0080"
        },
        {
          label: "Abandoned Cart Recovery",
          effort: 15,
          impact: 85,
          timeToValue: 8,
          color: "#00FFFF"
        },
        {
          label: "E-Commerce Best Practices (Checkout, Reviews, Recommendations)",
          effort: 50,
          impact: 88,
          timeToValue: 20,
          color: "#FFD700"
        },
        {
          label: "CI/CD & Infrastructure",
          effort: 60,
          impact: 80,
          timeToValue: 30,
          color: "#FF6B35"
        }
      ]
    },
    {
      id: "results",
      body: [
        "Abandoned cart recovery alone recovered $500K in first-year lost sales through email and push notifications. Customer lifetime value increased 140% because repeat customers now spend 2-3x more. This changed the unit economics: instead of $80 CAC with 22% repeat, we now had $50 CAC with 48% repeat.",
        "The platform became maintainable. With CI/CD and error tracking, engineers shipped features instead of fighting fires. The junior developer took ownership of features instead of being blocked. We reduced deployment time from 'manual FTP' to 'git push.' Bug reports dropped 60% because we had visibility and automated tests. The team went from demoralized to confident.",
        "Customer satisfaction increased measurably. NPS jumped from 32 to 68. Users appreciated the faster checkout, better search, personalized recommendations, and notification updates on orders. The platform felt modern and professional instead of broken. Repeat customers specifically mentioned 'better experience' as reason for returning."
      ],
      metrics: [
        { label: "Conversion Rate", before: 0.8, after: 2.1, unit: "%", color: "#FF0080" },
        { label: "Repeat Purchase Rate", before: 22, after: 48, unit: "%", color: "#00FFFF" },
        { label: "Abandoned Cart Recovery", before: 0, after: 500, unit: "K$/yr", color: "#FFD700" },
        { label: "Customer Lifetime Value", before: 120, after: 280, unit: "$", color: "#FF6B35" }
      ]
    },
    {
      id: "learnings",
      body: [
        "Analytics foundation unlocks everything. We didn't fix anything until we understood what was broken. Google Analytics revealed funnel drop-offs, Sentry surfaced hidden bugs, event tracking showed which features mattered. This data guided every decision. Most teams skip analytics and optimize blindly.",
        "E-commerce is a solved problem. We didn't invent anything. Abandoned cart recovery, product recommendations, push notifications, email segmentation.These are commoditized. The value isn't innovation, it's execution. We leveraged third-party tools (Clevertap, Firebase, Data Studio) instead of building. This was 10x faster than DIY.",
        "Quick wins build trust for infrastructure work. Without the abandoned cart recovery showing $80K ROI in two weeks, we never would have gotten budget to invest in CI/CD and monitoring. Leadership funded infrastructure only after seeing user-facing impact from analytics. Start with visible wins, then invest in foundation.",
        "Legacy code isn't the enemy. Our PHP codebase wasn't fundamentally bad. The problem was we couldn't see what was happening (no analytics), couldn't deploy safely (no tests), and couldn't debug (no error tracking). Fix visibility first, then code quality follows.",
        "The right metrics change behavior. When we started measuring conversion rate per traffic source, we fired expensive channels. When we measured repeat rate, we shifted from acquisition to retention. When we measured LTV vs CAC, unit economics became clear. PMs should obsess over metrics that directly inform business decisions."
      ]
    }
  ]
};
