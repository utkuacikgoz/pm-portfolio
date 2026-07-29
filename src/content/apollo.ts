import type { CaseStudy } from "./types";

export const apollo: CaseStudy = {
  id: "apollo",
  title: "Apollo, Healthcare Digital Transformation",
  sentimentScores: [15, 28, 45, 82, 95],
  beats: [
    {
      id: "problem",
      body: [
        "We partnered with one of Saudi Arabia's largest conglomerates to modernize the engineering behind their healthcare arm. The stack was legacy and had stopped evolving years earlier, three services (hospital management, pharmacy, inventory) running in complete isolation from each other.",
        "None of it was built around the patient. You couldn't find a nearby pharmacy, scan a prescription, or pull records across facilities. Doctors couldn't see pharmacy stock, pharmacists couldn't see admissions, and inventory managers worked blind to real demand. The gap wasn't just inefficient, it was hurting care.",
        "The numbers showed it. Medication took 4 to 6 hours because every inventory check was a phone call between departments, and patient satisfaction sat at 2.3/5. Leadership knew they were bleeding share to competitors who'd digitized years earlier. This was never just a software problem.",
      ],
      insight:
        "Three departments that don't share data aren't slow because of bad software, they're slow because no one designed them to work as one.",
      stakeholders: [
        { name: "Hospital Management", role: "Clinical Leadership", color: "#4F57B0" },
        { name: "Pharmacy Directors", role: "Operations", color: "#98487F" },
        { name: "IT Leadership", role: "Legacy System Owners", color: "#8A6118" },
        { name: "Inventory Managers", role: "Supply Chain", color: "#AC4A2D" },
        { name: "Patient Services", role: "Customer Advocacy", color: "#1F7A5E" },
      ],
    },
    {
      id: "constraints",
      body: [
        "The clock was the first constraint: a fixed four-month window, with contract penalties and regional reputation on the line if we slipped. And we weren't only shipping software, we were on the hook to train the internal team to own it after we left.",
        "The team was the harder constraint. They were skeptical of new tools, unfamiliar with Agile, CI/CD and user-centered design, and protective of workflows they'd run for 10 to 15 years. React, microservices and cloud felt like a threat, not an upgrade.",
        "And the real work wasn't technical, it was getting three departments that had operated independently for decades to act as one system, inside a hierarchy where every decision needed three layers of sign-off while we ran lean and iterative.",
        "Language and culture sat on top of all of it. The miscommunications were about authority and trust, not vocabulary. We had to prove we were there to enable them, not replace them.",
      ],
      decisions: [
        { label: "Legacy + Gradual Updates", speed: 20, risk: 15, isChosen: false, color: "#AC4A2D" },
        { label: "Rip-and-Replace Modernization", speed: 92, risk: 85, isChosen: false, color: "#8A6118" },
        { label: "Phased Modernization with Trust-Building", speed: 75, risk: 38, isChosen: true, color: "#4F57B0" },
      ],
    },
    {
      id: "approach",
      body: [
        "We started with clarity, not code. Before writing anything we mapped every journey, patients, doctors, nurses, pharmacists, inventory managers, admins, and found nine distinct personas, each with its own workflow and pain. We made the thinking physical: journey maps, service blueprints, architecture diagrams, all up on boards in their office.",
        "Making our reasoning visible did two things: it showed we weren't outsiders imposing answers, and it showed we understood their operation better than anyone. Every technical call, microservices over a monolith, React over Angular, cloud-native, came with trade-offs, not authority.",
        "When the team pushed back on the stack, we didn't argue. We ran workshops showing how automated testing, feature flags and incremental releases lower risk, and skepticism turned to curiosity. We also bent our process to their culture instead of forcing ceremonies on them, hybrid rituals that respected their approval chain but kept us iterating.",
        "Most of all, we shipped a real win fast. Within three weeks we put a patient-facing pharmacy locator live across every facility. Pharmacists loved it, hospital staff started asking what else we could do, and that one feature turned skeptics into advocates.",
      ],
      insight:
        "A win you can ship in three weeks buys more trust than a six-month roadmap you can only promise.",
      initiatives: [
        { label: "User Research & Design", effort: 70, impact: 92, timeToValue: 25, color: "#4F57B0" },
        { label: "Microservices Architecture", effort: 85, impact: 88, timeToValue: 90, color: "#98487F" },
        { label: "Real-time Inventory System", effort: 75, impact: 90, timeToValue: 60, color: "#8A6118" },
        { label: "Change Management & Training", effort: 65, impact: 85, timeToValue: 40, color: "#AC4A2D" },
      ],
    },
    {
      id: "results",
      body: [
        "We launched on time and beat every target. Patient satisfaction went 2.3 → 4.6 out of 5 in the first quarter. Medication fulfillment dropped from 4 to 6 hours to under 45 minutes once real-time inventory killed the manual coordination. Stockouts fell 60% because the system predicted demand from admissions and prescription trends.",
        "The three siloed departments now ran as one. Admissions triggered pharmacy alerts automatically, stock updated live across locations, and doctors prescribed knowing exactly where the medication was. That synchronization took out $2M+ a year in duplicate orders and emergency procurement.",
        "The team that started out hostile ended up owning it, within six months they shipped four new features on their own, which is the only real proof the knowledge transfer worked. Patients felt it immediately: scan a prescription from the app, find a pharmacy with live stock, pull history across facilities. 50K+ interactions in month one, 89% reporting a better experience.",
      ],
      metrics: [
        { label: "Patient Satisfaction", before: 2.3, after: 4.6, unit: "/5", color: "#4F57B0" },
        { label: "Medication Fulfillment Time", before: 360, after: 45, unit: "mins", color: "#98487F" },
        { label: "Stockout Reduction", before: 0, after: 60, unit: "%", color: "#8A6118" },
        { label: "Annual Cost Savings", before: 0, after: 2, unit: "M$", color: "#AC4A2D" },
      ],
    },
    {
      id: "learnings",
      body: [
        "Cultural change is harder than technical change, and it matters more. We spent as much time on change management as on code. Earning trust from a skeptical, hierarchical team took patience and humility; the tech alone would never have carried it.",
        "Visual communication bridges gaps that documents can't. Boards, diagrams and journey maps invited people in instead of presenting at them, and that worked across language and authority lines.",
        "Incremental wins convert skeptics faster than grand visions. The pharmacy locator wasn't glamorous, but it proved we could deliver, and that bought us room for the riskier work.",
        "The real product was the org, not the software. Tech can't force collaboration; we designed for the people and the workflows first, then built to match.",
      ],
      insight:
        "If the client still needs you a year later, you didn't transform anything, you rented them a dependency.",
    },
  ],
};
