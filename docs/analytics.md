# Analytics, attribution and UTM

What is measured, how a visitor's source is recorded, and which link to paste where.

## Setup (one time)

1. In PostHog, create a project and copy the **project API key** (`phc_...`).
2. In Vercel → Project → Settings → Environment Variables, add for **Production**
   and **Preview**:

   | Variable | Value |
   | --- | --- |
   | `VITE_POSTHOG_PROJECT_TOKEN` | `phc_...` |

   Nothing else is required. `VITE_POSTHOG_HOST` defaults to `/ingest`, and
   `VITE_POSTHOG_UI_HOST` defaults to `https://us.posthog.com` (set it to
   `https://eu.posthog.com` if the project lives in the EU region, and point
   `VITE_POSTHOG_HOST` at `https://eu.i.posthog.com` in that case, since the
   proxy rewrites in `vercel.json` target the US ingest hosts).
3. Redeploy. With no token set, analytics is a no-op, which is what local dev
   and forks want.

### Why /ingest

`vercel.json` rewrites `/ingest/*` to PostHog and `vite.config.ts` does the same
for `npm run dev`. Requests then leave the browser as first-party calls to
`utkuacikgoz.com`, so blockers (common on corporate laptops, which is exactly
what a recruiter is using) stop silently deleting a chunk of the data.

### Privacy posture

- `person_profiles: "identified_only"` and nobody is ever identified, so this is
  anonymous traffic analysis, not people tracking.
- Session replay is **on with everything masked**: `maskAllInputs` plus
  `maskTextSelector: "*"`. Replays show layout, cursor and navigation, never text.

## The events

Autocapture is on, but autocaptured clicks are keyed to CSS selectors and break
on every restyle. These named events are the funnel:

| Event | Fires when | Key properties |
| --- | --- | --- |
| `$pageview` / `$pageleave` | route change (history based) | `$current_url` |
| `world_entered` | camera dives into the world | |
| `avatar_picked` | character gate answered | `avatar` |
| `case_study_opened` | a project panel opens | `project_id`, `position` |
| `case_study_read` | scrolled to the final section | `project_id` |
| `case_study_advanced` | "Next: X" clicked at the end | `from_project_id`, `to` |
| `case_study_closed` | panel dismissed | `project_id` |
| `indie_shelf_viewed` | "What I'm building" opened | `source` |
| `resume_opened` | `/resume` rendered | |
| `cv_downloaded` | CV PDF download clicked | `location` |
| `cta_clicked` | booking / email / resume links | `cta`, `location`, `project_id?` |
| `surf_entered` | free surf mode entered | |
| `surf_run_completed` | all 42 collectibles found | |
| `easter_egg_found` | konami or "hire" typed | `egg` |

**Setting these up: `docs/posthog-setup.md`** has the click-through. Until those
funnels exist, none of this instrumentation is being read.

The two funnels worth saving in PostHog:

1. **Recruiter funnel**: `$pageview` → `case_study_opened` → `case_study_read` →
   `cta_clicked` (or `cv_downloaded`). Break down by `channel`.
2. **Skip funnel**: `$pageview` → `resume_opened` without `world_entered`. If
   this dominates, the world is a toll booth, not a hook.

## Attribution

`src/analytics/attribution.ts` reads the landing URL and referrer once per page
load and registers super properties on every subsequent event:

| Property | Meaning |
| --- | --- |
| `utm_source` … `utm_term` | this session's campaign tags |
| `first_utm_*` | the tags from the visitor's very first ever visit |
| `channel` / `first_channel` | `direct`, `organic_search`, `social`, `email`, `cv`, `campaign`, `referral` |
| `referrer_host` / `first_referrer_host` | referring domain, self-referrals excluded |
| `landing_path` / `first_landing_path` | front door vs deep link |

Details worth knowing:

- Short links work: `?ref=linkedin` and `?src=cv` are treated as
  `utm_source` with medium `referral`.
- First touch lives in `localStorage`, session touch in `sessionStorage`. An
  internal navigation never overwrites "arrived from LinkedIn" with "direct".
- Campaign parameters are stripped from the address bar right after capture, so
  the URL a visitor copies is the clean canonical one.

## The links to paste

`npm run utm -- --list` prints the canonical set. Current standard links:

| Where | Link |
| --- | --- |
| LinkedIn profile / website field | `https://utkuacikgoz.com/?utm_source=linkedin&utm_medium=profile&utm_campaign=portfolio` |
| LinkedIn post or comment | `https://utkuacikgoz.com/?utm_source=linkedin&utm_medium=post&utm_campaign=portfolio` |
| LinkedIn DM to a recruiter | `https://utkuacikgoz.com/resume?utm_source=linkedin&utm_medium=dm&utm_campaign=portfolio` |
| CV PDF footer | `https://utkuacikgoz.com/?utm_source=cv&utm_medium=pdf&utm_campaign=portfolio` |
| Email signature | `https://utkuacikgoz.com/?utm_source=email&utm_medium=signature&utm_campaign=portfolio` |
| Job application form | `https://utkuacikgoz.com/resume?utm_source=application&utm_medium=form&utm_campaign=portfolio` |
| GitHub profile README | `https://utkuacikgoz.com/?utm_source=github&utm_medium=profile&utm_campaign=portfolio` |
| X bio | `https://utkuacikgoz.com/?utm_source=x&utm_medium=bio&utm_campaign=portfolio` |
| Talk or slide | `https://utkuacikgoz.com/?utm_source=talk&utm_medium=slide&utm_campaign=portfolio` |

One-off links:

```bash
npm run utm -- --source linkedin --medium post --path /p/bilira --content bilira-case
```

Naming convention, so the breakdowns stay readable:

- `source` = where the click came from (`linkedin`, `cv`, `github`, `email`)
- `medium` = the surface inside it (`profile`, `post`, `dm`, `pdf`, `signature`)
- `campaign` = the push it belongs to (`portfolio`, `job-search-2026`)
- `content` = which variant of the link (`hero`, `footer`, `bilira-case`)

Lowercase, hyphens not spaces. Never tag internal links: an internal click
carrying `utm_source` restarts attribution and makes the funnel lie.
