// PostHog wiring, in one place so both the provider and the fire-and-forget
// track() helper agree on whether analytics exists at all.
//
// Requests go to a first-party /ingest path (rewritten to PostHog in
// vercel.json, proxied in vite.config.ts for dev). Recruiters browse on
// corporate laptops with blockers installed; a third-party posthog.com request
// is the one most likely to be dropped, and a dropped event looks exactly like
// a visitor who never came.

export const POSTHOG_TOKEN = import.meta.env.VITE_POSTHOG_PROJECT_TOKEN as string | undefined;

/** Same-origin ingest path; override only to talk to PostHog directly. */
export const POSTHOG_HOST = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? "/ingest";

/** Where "view in PostHog" links point when the API host is a proxy path. */
export const POSTHOG_UI_HOST =
  (import.meta.env.VITE_POSTHOG_UI_HOST as string | undefined) ?? "https://us.posthog.com";

/** No token (local dev, forks, preview builds) means analytics stays off entirely. */
export const ANALYTICS_ENABLED = Boolean(POSTHOG_TOKEN);
