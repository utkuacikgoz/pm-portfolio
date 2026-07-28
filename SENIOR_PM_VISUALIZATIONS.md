// Example: How to add the three new senior PM visualizations to your case studies

/_
For each beat where you want to add these visualizations, add the data like this:
_/

const exampleBeat = {
id: "decisions",
body: [
"We faced three strategic paths forward.",
"Option A was fast but risky, Option B was safe but slow, and Option C balanced both.",
"Here's how we evaluated and why we chose our path."
],

// 1. DECISION MATRIX
// Shows the tradeoff space you operated in
decisions: [
{
label: "Agile/Iterate (Option A)",
speed: 95, // 0-100: How fast to execute
risk: 85, // 0-100: How risky it is
isChosen: false,
color: "#FF6B35"
},
{
label: "Waterfall/Plan (Option B)",
speed: 30,
risk: 15,
isChosen: false,
color: "#FFD700"
},
{
label: "Phased Rollout (Our Choice)",
speed: 65, // Balanced approach
risk: 40,
isChosen: true, // Highlight your decision
color: "#FF0080"
}
],

// 2. EFFORT VS IMPACT PRIORITIZATION
// Shows which initiatives you tackled and why
initiatives: [
{
label: "Manual Review Automation",
effort: 35, // 0-100: How much effort required
impact: 90, // 0-100: How much business impact
timeToValue: 14, // Days to see value
color: "#FF0080"
},
{
label: "Compliance Dashboard",
effort: 55,
impact: 70,
timeToValue: 21,
color: "#00FFFF"
},
{
label: "API Documentation",
effort: 20,
impact: 45,
timeToValue: 7,
color: "#FFD700"
},
{
label: "Enterprise Integrations",
effort: 75,
impact: 85,
timeToValue: 45,
color: "#FF6B35"
}
],

// 3. STAKEHOLDER NETWORK
// Shows who you led across functions
stakeholders: [
{
name: "Head of Engineering",
role: "Technical Execution",
color: "#00FFFF"
},
{
name: "Legal & Compliance",
role: "Risk Management",
color: "#FFD700"
},
{
name: "VP Operations",
role: "Go-to-Market",
color: "#FF6B35"
},
{
name: "Head of Design",
role: "User Experience",
color: "#00FF00"
},
{
name: "Enterprise Sales",
role: "Customer Relations",
color: "#FF0080"
}
]
};

/\*
VISUALIZATION INTERPRETATION:

1. DECISION MATRIX
   - X-axis: SPEED (left = slow, right = fast)
   - Y-axis: RISK (bottom = safe, top = risky)
   - Your choice is connected with lines to other options
   - Shows strategic thinking and tradeoff analysis
   - Impresses senior leadership with explicit decision rationale

2. EFFORT VS IMPACT BUBBLES
   - X-axis: EFFORT (left = easy, right = hard)
   - Y-axis: IMPACT (bottom = low value, top = high value)
   - Bubble size: Time to value (bigger = slower)
   - Shows prioritization discipline
   - Demonstrates ruthless focus on high-impact work
   - Quick wins (low effort, high impact) are most attractive

3. STAKEHOLDER NETWORK
   - Center (large node): You (the PM)
   - Orbiting nodes: Your cross-functional partners
   - Lines: Collaboration and dependency
   - Shows leadership breadth and team management
   - Demonstrates ability to orchestrate complex projects
   - Number/type of stakeholders shows project complexity

WHY THESE MATTER FOR SENIOR ROLES:

✓ Decision Matrix: Proves you think strategically about tradeoffs
✓ Effort/Impact: Demonstrates ruthless prioritization discipline
✓ Stakeholder Network: Shows cross-functional leadership capability

These three visualizations together tell a complete leadership story:
"I made strategic decisions, prioritized ruthlessly, and led diverse teams."
\*/

export default exampleBeat;
