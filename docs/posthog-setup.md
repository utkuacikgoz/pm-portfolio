# PostHog: what to build once, then read weekly

Events and attribution have been flowing since the token went in. Nothing in
PostHog reads them yet, so right now the instrumentation is decoration. This is
the click-through to fix that. Twenty minutes, once.

Everything below uses events already being sent. Nothing here needs code.

## Before you start

Confirm data is arriving: **Activity** in the left nav should show `$pageview`
and, after you click through the site yourself, `world_entered` and
`case_study_opened`. If it is empty, the token is missing from the Vercel
environment rather than anything being wrong here.

## 1. The funnel that answers the real question

**Product → Funnels → New funnel.** Steps, in order:

1. `$pageview`
2. `case_study_opened`
3. `case_study_read`
4. `cta_clicked`

Set the window to 30 minutes and save it as **"Recruiter journey"**.

Then **Breakdown → `channel`**. That is the whole point: it tells you whether
the people who actually read a case study came from LinkedIn, from your CV, or
from a link you pasted in an application.

What to do with it:

- **Big drop at step 1 to 2** means the world is a toll booth, not a hook. The
  hero is not convincing people to explore.
- **Big drop at 3 to 4** means the work impresses and the ask does not. That is
  a CTA copy problem, not a traffic problem.
- **One channel converting far better** is your answer about where to spend
  effort. Tag more links for that channel, stop bothering with the others.

## 2. The bounce-to-resume funnel

Same builder, saved as **"Skipped the world"**:

1. `$pageview`
2. `resume_opened`

Add the filter `world_entered` **did not happen**.

If this dominates the first funnel, the 3D world is costing you more attention
than it earns, and the honest response is to make `/resume` the front door and
keep the world as the bonus. That is a real product decision, and this is the
number that should make it for you.

## 3. A dashboard worth opening

**Dashboards → New**. Add these as insights:

| Insight | Type | Config |
| --- | --- | --- |
| Visitors by channel | Trends | `$pageview`, unique users, breakdown `channel` |
| First touch vs last | Trends | `$pageview`, breakdown `first_channel` |
| Case studies opened | Trends | `case_study_opened`, breakdown `project_id` |
| Read-through rate | Trends | `case_study_read` / `case_study_opened` |
| Asks | Trends | `cta_clicked` breakdown `cta`, plus `cv_downloaded` |
| Deep links vs front door | Trends | `$pageview` breakdown `landing_path` |
| Surf completion | Trends | `surf_entered` and `surf_run_completed` |

**Case studies opened, broken down by `project_id`, is the most useful single
chart on there.** It tells you which story earns attention, which is the one
thing that should drive what you write next.

## 4. Two alerts so you do not have to check

On the "Asks" insight, **Subscribe** → weekly email. And set an alert on
`cta_clicked` for any spike: when someone books a call after a LinkedIn post,
you want to know which post.

## What NOT to bother with

- **Session replay for every visitor.** It is on and masked, which is right, but
  watch replays only for sessions that did something interesting: filter to
  people who hit `case_study_read` or `surf_run_completed`.
- **Retention and cohort reports.** This is a portfolio. Nobody comes back
  weekly, and a retention curve here will just look broken.
- **Feature flags.** Nothing to gate yet. Revisit when the indie products ship.

## Reading it honestly

The trap with a site like this is measuring the fun and ignoring the funnel.
`surf_run_completed` will feel great when it fires, and it means almost nothing
for the site's job. `cta_clicked` from `channel = linkedin` is the number that
tracks whether this thing is working.
