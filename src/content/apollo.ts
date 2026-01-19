export const apollo = {
  id: "apollo",
  title: "Apollo — Healthcare Digital Transformation",
  sentimentScores: [15, 28, 45, 82, 95], // Crisis to triumph arc
  beats: [
    {
      id: "problem",
      body: [
        "We partnered with one of Saudi Arabia's largest conglomerates to modernize their healthcare engineering division. The core issue was an outdated technology stack built on legacy systems that hadn't evolved with modern best practices. The platform consisted of three disconnected services: hospital management, pharmacy operations, and stock/inventory control that operated in complete isolation from each other.",
        "The system was fundamentally disconnected from patient needs. There was no way for patients to locate nearby pharmacies, scan prescriptions digitally, or access their medical records across facilities. Doctors couldn't see pharmacy inventory in real-time, pharmacists had no visibility into hospital admissions, and inventory managers worked blind to actual demand. The technology gap wasn't just inefficient, also it was actively harming patient care and operational capacity.",
        "The business impact was severe: medication delays averaged 4-6 hours because inventory checks required manual phone calls between departments. Patient satisfaction scores were 2.3/5. The conglomerate's leadership recognized they were losing market share to competitors who had digitized years earlier. This wasn't just a software problem."
      ],
      stakeholders: [
        { name: "Hospital Management", role: "Clinical Leadership", color: "#FF0080" },
        { name: "Pharmacy Directors", role: "Operations", color: "#00FFFF" },
        { name: "IT Leadership", role: "Legacy System Owners", color: "#FFD700" },
        { name: "Inventory Managers", role: "Supply Chain", color: "#FF6B35" },
        { name: "Patient Services", role: "Customer Advocacy", color: "#00FF00" }
      ]
    },
    {
      id: "constraints",
      body: [
        "Time pressure from upper management was immense. This was a high-stakes consultancy engagement with a fixed 4-month delivery window. Missing the deadline would mean contract penalties and reputational damage across the region. We weren't just building software. We were also responsible for training internal teams to maintain and evolve the system after handoff.",
        "The internal team presented a major cultural barrier. They were deeply skeptical of new technologies, unfamiliar with modern development practices (Agile, CI/CD, user-centered design), and protective of their existing workflows. Many had worked the same way for 10-15 years. Introducing React, microservices architecture, and cloud infrastructure felt threatening rather than empowering.",
        "Operationally, the challenge was even deeper: we weren't just changing software, we were changing how three departments worked. Hospital staff, pharmacists, and inventory managers had operated asynchronously for decades. Asking them to work as one integrated system required organizational transformation, not just technical implementation. The team had a strict hierarchical approval process (every decision required sign-off from 3+ layers of management), while we operated lean and iterative.",
        "Language and cultural barriers compounded everything. Miscommunications weren't just about vocabulary. They were about decision-making norms, authority structures, and trust. We had to prove we weren't there to replace them or impose foreign practices. We were there to enable them."
      ],
      decisions: [
        {
          label: "Legacy + Gradual Updates",
          speed: 20,
          risk: 15,
          isChosen: false,
          color: "#FF6B35"
        },
        {
          label: "Rip-and-Replace Modernization",
          speed: 92,
          risk: 85,
          isChosen: false,
          color: "#FFD700"
        },
        {
          label: "Phased Modernization with Trust-Building",
          speed: 75,
          risk: 38,
          isChosen: true,
          color: "#FF0080"
        }
      ]
    },
    {
      id: "approach",
      body: [
        "We started with clarity, not code. Before writing a single line, we mapped every user journey: patients, doctors, nurses, pharmacists, inventory managers, hospital administrators. We discovered there were actually 9 distinct user personas, each with different workflows, pain points, and success metrics. We created visual artifacts obsessively: customer journey maps, service blueprints, interaction flows, and system architecture diagrams, all displayed on physical boards in the client's office.",
        "By making our reasoning visible and inviting feedback at every stage, we demonstrated two things: (1) we weren't hostile outsiders imposing solutions, and (2) we genuinely understood the complexity of their operations better than anyone. We over-communicated our technical decisions. Why microservices instead of a monolith? Why React over Angular? Why cloud-native architecture? Every choice was explained with trade-offs, not authority.",
        "When the internal team questioned our stack, we didn't defend upfront. We ran workshops showing how modern practices (automated testing, feature flags, incremental releases) would reduce risk and accelerate iteration. Slowly, skepticism turned to curiosity. We also adapted our process to their culture. Instead of forcing Agile ceremonies, we created hybrid rituals that respected their hierarchical approval structure while maintaining iterative progress.",
        "Most importantly, we delivered incremental wins fast. Within 3 weeks, we shipped a patient-facing pharmacy locator feature that worked across all facilities. Pharmacists loved it. Hospital staff started asking, 'What else can we do?' That early win converted skeptics into advocates."
      ],
      initiatives: [
        {
          label: "User Research & Design",
          effort: 70,
          impact: 92,
          timeToValue: 25,
          color: "#FF0080"
        },
        {
          label: "Microservices Architecture",
          effort: 85,
          impact: 88,
          timeToValue: 90,
          color: "#00FFFF"
        },
        {
          label: "Real-time Inventory System",
          effort: 75,
          impact: 90,
          timeToValue: 60,
          color: "#FFD700"
        },
        {
          label: "Change Management & Training",
          effort: 65,
          impact: 85,
          timeToValue: 40,
          color: "#FF6B35"
        }
      ]
    },
    {
      id: "results",
      body: [
        "The platform launched on time and exceeded every success metric. Patient satisfaction jumped from 2.3/5 to 4.6/5 within the first quarter post-launch. Medication fulfillment time dropped from 4-6 hours to under 45 minutes because real-time inventory visibility eliminated manual coordination. Pharmacists reported 60% reduction in stockouts because the system predicted demand based on hospital admissions and prescription trends.",
        "Operationally, the three previously disconnected departments now functioned as one integrated system. Hospital admissions automatically triggered pharmacy alerts; inventory levels updated in real-time across all locations; doctors could prescribe medications knowing exactly which pharmacy had stock. This synchronization unlocked $2M+ in annual cost savings by eliminating duplicate orders and reducing emergency procurement.",
        "The internal team that were initially hostile became champions. They didn't just maintain the system; they evolved it. Within 6 months post-launch, they shipped 4 new features independently, proving the training and knowledge transfer had worked. Patients experienced the difference immediately: they could now scan prescriptions via mobile app, locate pharmacies with real-time stock availability, and access their medical history across facilities. The platform processed 50K+ patient interactions in the first month, with 89% reporting improved experience."
      ],
      metrics: [
        { label: "Patient Satisfaction", before: 2.3, after: 4.6, unit: "/5", color: "#FF0080" },
        { label: "Medication Fulfillment Time", before: 360, after: 45, unit: "mins", color: "#00FFFF" },
        { label: "Stockout Reduction", before: 0, after: 60, unit: "%", color: "#FFD700" },
        { label: "Annual Cost Savings", before: 0, after: 2, unit: "M$", color: "#FF6B35" }
      ]
    },
    {
      id: "learnings",
      body: [
        "Cultural transformation is harder than technical transformation—and more important. We spent as much time on change management as on code. Building trust with a skeptical, hierarchical team required patience, transparency, and humility. Technical excellence alone wouldn't have succeeded; we had to meet them where they were and guide them forward.",
        "Visual communication bridges gaps that documentation can't. By making our reasoning physical and collaborative (boards, diagrams, journey maps), we invited participation instead of imposing decisions. This approach worked across language and cultural barriers because the artifacts spoke louder than presentations.",
        "Incremental wins convert skeptics faster than grand visions. The pharmacy locator feature wasn't glamorous, but it proved we could deliver value fast. That credibility unlocked trust for the harder, riskier parts of the project. Start small, ship fast, build momentum.",
        "Organizational integration is the real product. The software was the enabler, but the transformation was making three departments work as one. Technology can't force collaboration. We succeeded because we designed for people and workflows first, then built the software to match.",
        "Training and knowledge transfer determine long-term success. Our job was to empower the internal team to own it. We invested heavily in pairing, documentation, and hands-on workshops. Six months later, they were shipping features independently. That's the real measure of success: the client doesn't need you anymore."
      ]
    }
  ]
};
