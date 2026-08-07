import { useEffect, type ReactNode } from "react";
import { ANALYTICS_ENABLED, POSTHOG_HOST, POSTHOG_TOKEN, POSTHOG_UI_HOST } from "./config";
import { attachPostHog, type AnalyticsClient } from "./events";
import { buildAttribution, resolveTouches, stripCampaignParams, toSuperProperties } from "./attribution";

// posthog-js is ~243 KB and none of it is needed before first paint: the first
// named event (world_entered) cannot fire until the visitor clicks. So it is
// imported dynamically on idle, and ./events queues any track() call made in the
// meantime and flushes it once the client attaches.
//
// Deliberately NOT using @posthog/react's PostHogProvider. Nothing here consumes
// its hooks (components call our own track()), and mounting a provider around
// the app *after* load would remount the entire tree, throwing away world state
// mid-session. An imperative init has no such effect.

/**
 * Runs once, right after PostHog finishes loading, so the first pageview still
 * carries the raw utm_* params before they are wiped from the address bar.
 */
function onPostHogLoaded(instance: AnalyticsClient) {
  const attribution = buildAttribution({
    search: window.location.search,
    referrer: document.referrer,
    pathname: window.location.pathname,
    siteHost: window.location.hostname,
  });

  const { first, last } = resolveTouches(attribution);
  // Registered directly on the instance, before the queue drains, so every
  // queued event goes out already carrying its acquisition properties.
  instance.register(toSuperProperties(first, last));
  attachPostHog(instance);

  // Clean URL afterwards: the link a visitor copies out of the address bar
  // should be the canonical one, not one still carrying someone else's campaign.
  const cleaned = stripCampaignParams(window.location.href);
  const currentRelative = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (cleaned !== currentRelative) window.history.replaceState(null, "", cleaned);
}

function initPostHog() {
  void import("posthog-js").then(({ default: posthog }) => {
    posthog.init(POSTHOG_TOKEN as string, {
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
    });
  });
}

type AnalyticsProviderProps = { children: ReactNode };

// Keep analytics opt-in at deployment time: local builds and previews work without a token.
export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  useEffect(() => {
    if (!ANALYTICS_ENABLED) return;
    const idle = window.requestIdleCallback?.(initPostHog, { timeout: 4000 });
    const timer = idle === undefined ? window.setTimeout(initPostHog, 1500) : undefined;
    return () => {
      if (idle !== undefined) window.cancelIdleCallback?.(idle);
      if (timer !== undefined) clearTimeout(timer);
    };
  }, []);

  return children;
}
