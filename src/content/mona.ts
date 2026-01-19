export const mona = {
  id: "mona",
  title: "Mona — HR Platform",
  sentimentScores: [12, 25, 40, 78, 92], // Chaos to order arc
  beats: [
    {
      id: "problem",
      body: [
        "During my time at Upshift, we hit a classic scale-up breaking point: our growth massively outpaced our internal systems. We were hiring aggressively across seven countries—Argentina, Serbia, Macedonia, South Africa, Poland, Philippines, and the United States. Each region had different payment structures, tax requirements, employment contracts, and payment schedules. Managing this complexity through Google Drive and Excel spreadsheets was becoming unsustainable and actively risky.",
        "The chaos was tangible. HR spent 15+ hours per week manually reconciling payroll data across multiple spreadsheets. Payment errors happened monthly because someone updated one file but not another. We had no centralized employee directory, no formal progression framework, and time-off requests were handled verbally or via Slack messages. When someone asked 'How many vacation days does Maria have left?' the answer required digging through email threads and manager notes.",
        "This wasn't just inefficient—it was unprofessional and created resentment among a distributed team that deserved better. As we scaled toward 150+ employees, the lack of structure threatened compliance, created payroll errors that damaged trust, and made HR processes so opaque that managers couldn't make informed staffing decisions. Leadership recognized that fixing this wasn't optional—it was existential for the next phase of growth."
      ],
      stakeholders: [
        { name: "HR Lead", role: "Operations & Compliance", color: "#FF0080" },
        { name: "Finance Controller", role: "Payroll & Budget", color: "#00FFFF" },
        { name: "Regional Managers", role: "Team Leadership", color: "#FFD700" },
        { name: "CEO/Founder", role: "Growth & Culture", color: "#FF6B35" },
        { name: "Employee Reps", role: "Distributed Team Voice", color: "#00FF00" }
      ]
    },
    {
      id: "constraints",
      body: [
        "Management wanted to buy an off-the-shelf solution immediately. The problem: there was no one-size-fits-all platform that met our needs. We evaluated BambooHR, Gusto, Rippling, and Deel. Some had strong payroll but weak file management. Others handled international contractors well but lacked progression frameworks. A few covered vacation tracking but had no customizable employee directories or performance review workflows.",
        "The platforms that came close were prohibitively expensive. For a distributed team of 150 across seven countries, quotes ranged from $18K to $35K annually, plus implementation fees and per-employee costs. Worse, they were rigid—we'd be forced to adapt our workflows to their structure instead of building a system that matched how we actually operated.",
        "Time pressure compounded the constraint. HR was drowning, and we couldn't wait 6 months for vendor evaluation, contract negotiation, and implementation. We needed a solution in weeks, not quarters. And we had no budget for custom software development—hiring engineers to build an internal HR platform wasn't realistic for a company focused on marketplace product development. Some leaders questioned whether HR tooling was even a priority compared to customer-facing product work."
      ],
      decisions: [
        {
          label: "Buy Expensive Enterprise Vendor",
          speed: 60,
          risk: 40,
          isChosen: false,
          color: "#FFD700"
        },
        {
          label: "Build Custom with Engineers",
          speed: 30,
          risk: 60,
          isChosen: false,
          color: "#FF6B35"
        },
        {
          label: "Build with No-Code & Consultants",
          speed: 85,
          risk: 25,
          isChosen: true,
          color: "#FF0080"
        }
      ]
    },
    {
      id: "approach",
      body: [
        "We went entrepreneurial and built it ourselves using no-code tools. I hired two freelance no-code consultants who specialized in Airtable, Softr, and Zapier. The strategy: make them compete. I challenged both to deliver the best functional demo after one week, winner gets a longer-term contract to build and iterate the full platform. This competitive dynamic ensured maximum effort, creativity, and speed.",
        "I acted as the Product Manager, not the engineer. I defined the requirements obsessively: employee directory with custom fields per region, vacation tracking with accrual rules by country, file storage for contracts and performance reviews, progression framework visualizations, payroll data integration, and manager dashboards showing team composition and time-off calendars. I prioritized features based on HR pain points and compliance risk, not technical complexity.",
        "The consultants worked in parallel for one week, building competing prototypes. At the end, we demoed both to HR, Finance, and leadership. One consultant built a more polished UI but lacked flexibility; the other built something scrappier but infinitely customizable. We chose the flexible option because we knew requirements would evolve as the company grew. The winning consultant got a 3-month contract to refine and deploy.",
        "We launched incrementally. Week 1: employee directory and basic file storage. Week 2: vacation tracking and manager approvals. Week 3: payroll data structure and integrations. Week 4: progression framework and performance review workflows. Each release solved an immediate HR pain point, building momentum and stakeholder buy-in."
      ],
      initiatives: [
        {
          label: "Employee Directory & File Storage",
          effort: 30,
          impact: 75,
          timeToValue: 10,
          color: "#FF0080"
        },
        {
          label: "Vacation Tracking & Accrual Rules",
          effort: 35,
          impact: 80,
          timeToValue: 15,
          color: "#00FFFF"
        },
        {
          label: "Payroll Data Integration",
          effort: 50,
          impact: 90,
          timeToValue: 25,
          color: "#FFD700"
        },
        {
          label: "Progression Framework & Performance Reviews",
          effort: 45,
          impact: 85,
          timeToValue: 30,
          color: "#FF6B35"
        }
      ]
    },
    {
      id: "results",
      body: [
        "We built exactly what we needed without writing a single line of code. The platform handled employee data for 150+ people across seven countries, with country-specific payroll structures, vacation accrual rules, and tax compliance built in. HR went from 15 hours per week on manual reconciliation to under 3 hours. Payroll errors disappeared entirely because the system enforced data consistency and automated calculations.",
        "Managers loved it. For the first time, they had real-time visibility into team composition, time-off schedules, and direct report progression. They could approve vacation requests with one click instead of email chains. The employee directory became the single source of truth for contact info, role definitions, and reporting structures, eliminating the 'Who owns this?' confusion that plagued distributed teams.",
        "The progression framework was transformative. Employees could now see clear career paths, expected competencies at each level, and what they needed to do to advance. This transparency increased retention and made performance conversations less subjective. HR reported that promotion discussions went from vague and contentious to structured and evidence-based.",
        "The total cost: $12K for the no-code consultant over 3 months, plus $200/month for Airtable and Softr subscriptions. Compared to $18K-$35K annually for off-the-shelf platforms, we saved 50-70% while getting a system perfectly tailored to our needs."
      ],
      metrics: [
        { label: "HR Admin Hours/Week", before: 15, after: 3, unit: "hours", color: "#FF0080" },
        { label: "Payroll Errors", before: 12, after: 0, unit: "/year", color: "#00FFFF" },
        { label: "Cost vs Enterprise", before: 25, after: 12, unit: "K$/yr", color: "#FFD700" },
        { label: "Employee Retention Lift", before: 82, after: 94, unit: "%", color: "#FF6B35" }
      ]
    },
    {
      id: "learnings",
      body: [
        "No-code unlocks speed and customization when off-the-shelf tools don't fit. We went from concept to deployed platform in 4 weeks, something that would've taken months with traditional software development or vendor implementation. The flexibility to iterate based on real usage was more valuable than polished UI.",
        "Competition drives excellence. By making two consultants compete for the contract, we got better outcomes than if we'd hired one upfront. The competitive pressure ensured maximum effort, creativity, and responsiveness. This model works for any project where multiple freelancers can deliver in parallel.",
        "Product Management is the skill, not coding. I didn't write code, but I defined requirements, prioritized features, tested prototypes, and drove iteration. The consultants were execution partners, not decision-makers. This reinforced that PM is about identifying problems and validating solutions, not technical implementation.",
        "Internal tools deserve the same rigor as customer-facing products. HR systems directly impact employee experience, retention, and operational efficiency. Treating this as a real product—with user research, iterative releases, and stakeholder feedback—made the difference between a spreadsheet replacement and a transformative platform.",
        "Incremental releases build momentum and reduce risk. Launching the full platform at once would've been overwhelming and risky. By shipping features weekly, we proved value continuously, adapted based on feedback, and built organizational buy-in before anyone could question whether the project was worth it."
      ]
    }
  ]
};
