import type { CaseStudy } from "./types";

export const apollo: CaseStudy = {
  id: "apollo",
  title: "Apollo, Healthcare Digital Transformation",
  sentimentScores: [15, 28, 45, 82, 95],
  beats: [
    {
      id: "problem",
      body: [
        "At Lean Scale, we worked with the healthcare arm of a Saudi conglomerate to connect hospital, pharmacy and inventory systems that operated independently.",
        "Doctors could not see pharmacy stock, pharmacists lacked admission data, and inventory teams had limited visibility into demand. Medication fulfillment took four to six hours, with staff coordinating stock checks by phone.",
        "Patient satisfaction was 2.3 out of 5. The product challenge was to improve the patient journey while helping three departments share information and responsibility.",
      ],
      insight: "The delays crossed departmental boundaries, so the solution had to connect their workflows.",
      stakeholders: [
        { name: "Hospital Management", role: "Clinical Leadership", color: "#6E86D6" },
        { name: "Pharmacy Directors", role: "Operations", color: "#CB7BC7" },
        { name: "IT Leadership", role: "Legacy System Owners", color: "#E0A45C" },
        { name: "Inventory Managers", role: "Supply Chain", color: "#E7684A" },
        { name: "Patient Services", role: "Customer Advocacy", color: "#3FA46A" },
      ],
    },
    {
      id: "constraints",
      body: [
        "We had four months to deliver and a responsibility to prepare the internal team to maintain the system after handover.",
        "The team had long-established workflows and limited experience with the proposed stack and delivery practices. Departmental approvals added dependencies that the release plan had to accommodate.",
      ],
      decisions: [
        { label: "Legacy + Gradual Updates", speed: 20, risk: 15, isChosen: false, color: "#E7684A" },
        { label: "Rip-and-Replace Modernization", speed: 92, risk: 85, isChosen: false, color: "#E0A45C" },
        { label: "Phased Modernization with Trust-Building", speed: 75, risk: 38, isChosen: true, color: "#6E86D6" },
      ],
    },
    {
      id: "approach",
      body: [
        "We mapped the workflows of nine user groups, including patients, doctors, pharmacists and inventory managers. Journey maps, service blueprints and architecture diagrams made dependencies visible to the client team.",
        "We explained technical choices through their operational trade-offs and ran workshops on automated tests, feature flags and incremental releases. The delivery process incorporated the client’s approval requirements.",
        "Within three weeks, we launched a pharmacy locator across the facilities. That early release helped staff see the value of connected information and gave us feedback for the broader rollout.",
      ],
      insight: "The pharmacy locator gave staff an early improvement they could use and assess.",
      initiatives: [
        { label: "User Research & Design", effort: 70, impact: 92, timeToValue: 25, color: "#6E86D6" },
        { label: "Microservices Architecture", effort: 85, impact: 88, timeToValue: 90, color: "#CB7BC7" },
        { label: "Real-time Inventory System", effort: 75, impact: 90, timeToValue: 60, color: "#E0A45C" },
        { label: "Change Management & Training", effort: 65, impact: 85, timeToValue: 40, color: "#E7684A" },
      ],
    },
    {
      id: "results",
      body: [
        "We delivered within the four-month window. Patient satisfaction reached 4.6 out of 5 in the first quarter, and medication fulfillment fell to under 45 minutes.",
        "Connected stock and demand information reduced stockouts by 60%. Fewer duplicate orders and emergency purchases generated more than $2M in annual savings.",
        "The platform recorded 50K+ interactions in its first month, with 89% of surveyed users reporting a better experience. Within six months, the internal team had shipped four additional features independently.",
      ],
      metrics: [
        { label: "Patient Satisfaction", before: 2.3, after: 4.6, unit: "/5", color: "#6E86D6" },
        { label: "Medication Fulfillment Time", before: 360, after: 45, unit: "mins", color: "#CB7BC7" },
        { label: "Stockout Reduction", before: 0, after: 60, unit: "%", color: "#E0A45C" },
        { label: "Annual Cost Savings", before: 0, after: 2, unit: "M$", color: "#E7684A" },
      ],
    },
    {
      id: "learnings",
      body: [
        "Technical delivery depended on organizational trust. Workshops and shared workflow maps helped the teams agree on how the new system should work.",
        "The pharmacy locator gave staff a concrete improvement to assess early. Their feedback helped guide the more complex integration work.",
        "Handover was part of the product outcome. The internal team’s ability to release its own features was evidence that the knowledge transfer had worked.",
      ],
      insight: "A successful handover leaves the client able to ship independently.",
    },
  ],
};
