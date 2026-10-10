import type { CaseStudy } from "./types";

export const mestores: CaseStudy = {
  id: "mestores",
  title: "Mestores, E-Commerce Modernization",
  glance: [
    { value: "48%", label: "repeat purchases, up from 22%" },
    { value: "$280", label: "customer lifetime value, up from $120" },
    { value: "$500K", label: "sales recovered from abandoned carts" },
  ],
  sentimentScores: [14, 32, 48, 76, 94],
  beats: [
    {
      id: "problem",
      body: [
        "Mestores was an established ecommerce business in Saudi Arabia with a five-year-old platform. Its PHP and jQuery codebase had limited documentation, and new features took more than six weeks to deliver.",
        "Conversion was 0.8%, and only 22% of customers returned to buy again. Search, product pages and checkout needed improvement, but the team had no analytics to show where customers were dropping out.",
        "I focused the work on understanding the funnel and improving the existing platform. That gave us a way to demonstrate commercial value before committing to larger infrastructure changes.",
      ],
      insight: "Funnel tracking showed where to focus the first improvements.",
      stakeholders: [
        { name: "Engineering Team", role: "Platform Maintenance", color: "#6E86D6" },
        { name: "Product/UX", role: "Customer Experience", color: "#CB7BC7" },
        { name: "Marketing", role: "Acquisition Costs", color: "#E0A45C" },
        { name: "Finance/CFO", role: "Unit Economics", color: "#E7684A" },
        { name: "Customers", role: "User Frustration", color: "#3FA46A" },
      ],
    },
    {
      id: "constraints",
      body: [
        "Two contractors were approaching the end of their contracts, and the remaining junior engineer needed support. A full rewrite would have exceeded the team’s capacity.",
        "The platform had no automated tests, deployment pipeline, monitoring or error tracking. Leadership needed evidence of revenue impact before funding more engineering capacity.",
      ],
      decisions: [
        { label: "Total Rewrite (Years, High Risk)", speed: 10, risk: 90, isChosen: false, color: "#E7684A" },
        { label: "Gradual Fixes (Slow, Safe)", speed: 25, risk: 20, isChosen: false, color: "#E0A45C" },
        { label: "Strategic Modernization (Infrastructure + Features)", speed: 70, risk: 40, isChosen: true, color: "#6E86D6" },
      ],
    },
    {
      id: "approach",
      body: [
        "Weeks 1 to 4: establish visibility. I introduced GA4, Sentry and event tracking, then connected abandoned-cart emails through a third-party service. Within two weeks, we could see the funnel and measure recovered sales.",
        "Weeks 5 to 8: improve the buying journey. We redesigned product pages, added reviews and a wishlist, introduced order notifications, and reduced checkout from five steps to two. Conversion reached 1.4%, and repeat purchases reached 31%.",
        "Weeks 9 to 12: make delivery safer. We introduced GitHub Actions, a staging environment, checkout tests and inventory synchronization.",
        "Weeks 13 to 16: build on the foundation. Segmented emails, recommendations and loyalty features used integrations and configuration to limit custom development.",
      ],
      insight: "Early cart-recovery results helped make the case for safer delivery infrastructure.",
      initiatives: [
        { label: "Analytics & Tracking Foundation", effort: 20, impact: 90, timeToValue: 5, color: "#6E86D6" },
        { label: "Abandoned Cart Recovery", effort: 15, impact: 85, timeToValue: 8, color: "#CB7BC7" },
        { label: "E-Commerce Best Practices (Checkout, Reviews, Recommendations)", effort: 50, impact: 88, timeToValue: 20, color: "#E0A45C" },
        { label: "CI/CD & Infrastructure", effort: 60, impact: 80, timeToValue: 30, color: "#E7684A" },
      ],
    },
    {
      id: "results",
      body: [
        "Conversion increased from 0.8% to 2.1%, and repeat purchases rose from 22% to 48%. Cart recovery brought back approximately $500K in sales during the first year.",
        "Customer lifetime value increased from $120 to $280. Acquisition cost fell from $80 to $50, and NPS rose from 32 to 68.",
        "Bug reports fell 60%. Automated deployment and error tracking gave engineers a more reliable way to release changes, and the junior engineer took ownership of features.",
      ],
      metrics: [
        { label: "Conversion Rate", before: 0.8, after: 2.1, unit: "%", color: "#6E86D6" },
        { label: "Repeat Purchase Rate", before: 22, after: 48, unit: "%", color: "#CB7BC7" },
        { label: "Abandoned Cart Recovery", before: 0, after: 500, unit: "K$/yr", color: "#E0A45C" },
        { label: "Customer Lifetime Value", before: 120, after: 280, unit: "$", color: "#E7684A" },
      ],
    },
    {
      id: "learnings",
      body: [
        "Instrumentation made prioritization practical. Funnel events showed where customers left, while error tracking exposed failures that customer feedback alone could not explain.",
        "A visible commercial result helped secure support for infrastructure work. Cart recovery demonstrated value before we invested in deployment and testing.",
        "The existing stack could support meaningful improvements. Integrations and safer delivery let us improve the customer experience without waiting for a replacement platform.",
      ],
      insight: "Track the customer journey before committing to a platform rewrite.",
    },
  ],
};
