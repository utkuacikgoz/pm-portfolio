import { PostHogProvider } from "@posthog/react";
import type { ReactNode } from "react";
import { ANALYTICS_ENABLED, POSTHOG_HOST, POSTHOG_TOKEN, POSTHOG_UI_HOST } from "./config";
import { registerSuperProperties } from "./events";
import { buildAttribution, resolveTouches, stripCampaignParams, toSuperProperties } from "./attribution";

// Components import { EVENTS, track } from "./analytics/events" directly; this
// module stays component-only so react-refresh keeps working.
type AnalyticsProviderProps = { children: ReactNode };

/**
 * Runs once, right after PostHog finishes loading, so the first pageview still
 * carries the raw utm_* params before they are wiped from the address bar.
 */
function onPostHogLoaded() {
  const attribution = buildAttribution({
    search: window.location.search,
    referrer: document.referrer,
    pathname: window.location.pathname,
    siteHost: window.location.hostname,
  });

  const { first, last } = resolveTouches(attribution);
  registerSuperProperties(toSuperProperties(first, last));

  // Clean URL afterwards: the link a visitor copies out of the address bar
  // should be the canonical one, not one still carrying someone else's campaign.
  const cleaned = stripCampaignParams(window.location.href);
  const currentRelative = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (cleaned !== currentRelative) window.history.replaceState(null, "", cleaned);
}

// Keep analytics opt-in at deployment time: local builds and previews work without a token.
export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  if (!ANALYTICS_ENABLED) return children;

  return (
    <PostHogProvider
      apiKey={POSTHOG_TOKEN as string}
      options={{
        // Same-origin path, rewritten to PostHog at the edge (see vercel.json).
        api_host: POSTHOG_HOST,
        ui_host: POSTHOG_UI_HOST,
        autocapture: true,
        capture_pageview: "history_change",
        capture_pageleave: true,
        defaults: "2026-05-30",
        person_profiles: "identified_only",
        // Replay is the only way to see how a recruiter actually moves through a
        // 3D portfolio (do they explore, or bolt for the resume?). Every string
        // and input is masked: the visitor's own screen is not the data we want.
        disable_session_recording: false,
        session_recording: {
          maskAllInputs: true,
          maskTextSelector: "*",
        },
        loaded: onPostHogLoaded,
      }}
    >
      {children}
    </PostHogProvider>
  );
}
