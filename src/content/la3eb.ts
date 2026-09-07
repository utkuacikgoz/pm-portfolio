import type { CaseStudy } from "./types";

export const la3eb: CaseStudy = {
  id: "la3eb",
  title: "La3eb, Gaming Super-App",
  sentimentScores: [10, 20, 35, 75, 95],
  beats: [
    {
      id: "problem",
      body: [
        "La3eb was a new gaming and commerce app in Saudi Arabia preparing for the PS5 launch. Daily active users were around 3,000, and 15-day retention was below 8%.",
        "The app emphasized transactions, but players had few reasons to return between purchases. Gaming conversations were happening in existing communities outside the app.",
        "I focused on whether a social experience could give players a reason to return and create a stronger path to commerce.",
      ],
      insight: "Players needed a reason to return between purchases.",
      stakeholders: [
        { name: "Gaming Community", role: "Users & Evangelists", color: "#6E86D6" },
        { name: "Leadership/Business", role: "Revenue & Strategy", color: "#CB7BC7" },
        { name: "Engineering Team", role: "Product Execution", color: "#E0A45C" },
        { name: "Marketing", role: "User Acquisition", color: "#E7684A" },
        { name: "Finance", role: "Budget & Metrics", color: "#3FA46A" },
      ],
    },
    {
      id: "constraints",
      body: [
        "We had ten weeks before the PS5 launch and a small delivery team: two engineers, one designer and me.",
        "Beyond downloads and daily active users, measurement was limited. We needed to establish research and analytics while shipping, and show leadership how engagement related to commercial outcomes.",
      ],
      decisions: [
        { label: "Research Before Delivery (6 months)", speed: 20, risk: 30, isChosen: false, color: "#E7684A" },
        { label: "Full Replatform (High Risk)", speed: 50, risk: 80, isChosen: false, color: "#E0A45C" },
        { label: "Rapid Iteration (Weekly Releases)", speed: 95, risk: 35, isChosen: true, color: "#6E86D6" },
      ],
    },
    {
      id: "approach",
      body: [
        "In the first week, I introduced Firebase event tracking and in-app NPS surveys, and interviewed more than 20 engaged players.",
        "Players wanted to share clips, discuss games and find people to play with. I invited 50 power users into a feedback group where they could review mockups and try early releases.",
        "We shipped weekly: a community feed, chat for finding squadmates, and a dedicated PS5 lobby. Subsequent releases used behavioral data and player feedback to improve the experience.",
      ],
      insight: "The feedback group connected weekly releases to specific player needs.",
      initiatives: [
        { label: "Community Feed & Content", effort: 40, impact: 90, timeToValue: 10, color: "#6E86D6" },
        { label: "In-App Chat & Squad Finding", effort: 50, impact: 92, timeToValue: 15, color: "#CB7BC7" },
        { label: "PS5 Launch Lobby", effort: 35, impact: 88, timeToValue: 20, color: "#E0A45C" },
        { label: "Analytics & User Insights", effort: 30, impact: 85, timeToValue: 5, color: "#E7684A" },
      ],
    },
    {
      id: "results",
      body: [
        "Daily active users grew from 3,000 to 18,000 in ten weeks. At launch, 15-day retention reached 34%, and more than 12,000 users were participating in the PS5 lobby.",
        "Feed participants were four times as likely to purchase as passive browsers, and chat users converted at six times the rate of non-chat users. These comparisons showed an association between participation and purchases; they did not isolate the effect of each feature.",
        "NPS increased from 22 to 58. The launch activity included more than 2,000 buyer connections and a virtual event with over 5,000 attendees.",
      ],
      metrics: [
        { label: "Daily Active Users", before: 3, after: 18, unit: "k", color: "#6E86D6" },
        { label: "15-Day Retention", before: 8, after: 34, unit: "%", color: "#CB7BC7" },
        { label: "NPS Score", before: 22, after: 58, unit: "pts", color: "#E0A45C" },
        { label: "Chat User Conversion", before: 1, after: 6, unit: "x lift", color: "#E7684A" },
      ],
    },
    {
      id: "learnings",
      body: [
        "Interviews explained the engagement gap more clearly than download counts. Players needed reasons to participate between purchases.",
        "The 50-person feedback group gave us a fast way to test ideas and spot problems in weekly releases.",
        "Engagement and commerce needed to be measured together. The observed conversion differences helped shape further work, while leaving room to test which interactions actually caused a change.",
      ],
      insight: "Measure participation and purchases together, then test the relationship.",
    },
  ],
};
