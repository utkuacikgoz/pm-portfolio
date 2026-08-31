import { ANALYTICS_ENABLED } from "./config";

/**
 * The event vocabulary. Autocapture records every click, but autocaptured
 * selectors break the moment a style changes, so the handful of moments that
 * actually answer "is this portfolio doing its job" are named explicitly:
 *
 *   arrival -> entered the world -> opened a case study -> asked for the resume
 *   or the call.
 *
 * Keep names snake_case and past-tense; they show up verbatim in PostHog.
 */
export const EVENTS = {
  worldEntered: "world_entered",
  avatarPicked: "avatar_picked",
  caseStudyOpened: "case_study_opened",
  caseStudyClosed: "case_study_closed",
  /** Scrolled to the final section: the study was actually read, not glanced at. */
  caseStudyRead: "case_study_read",
  caseStudyAdvanced: "case_study_advanced",
  indieShelfViewed: "indie_shelf_viewed",
  /** Clicked through to a live indie product. The indie funnel's first real step. */
  indieProductOpened: "indie_product_opened",
  resumeOpened: "resume_opened",
  cvDownloaded: "cv_downloaded",
  ctaClicked: "cta_clicked",
  surfEntered: "surf_entered",
  /** Caught the wave at a break, which is how the ocean introduces a project. */
  surfWaveCaught: "surf_wave_caught",
  surfRunCompleted: "surf_run_completed",
  /** Made a run card. The only thing on the site that can leave it. */
  runShared: "run_shared",
  easterEggFound: "easter_egg_found",
  /** A render threw and a fallback was shown. Rare, and worth knowing about. */
  appCrashed: "app_crashed",
} as const;

type EventName = (typeof EVENTS)[keyof typeof EVENTS];

type EventProps = Record<string, string | number | boolean | null | undefined>;

// posthog-js is 243 KB, roughly two thirds of the entry chunk, and nothing it
// does is needed before first paint: the earliest event (world_entered) cannot
// fire until someone clicks. So it is imported lazily (type-only above, so no
// runtime edge) and everything called before it lands is queued here.
//
// The queue is bounded. If analytics never loads, a long session must not grow
// an unbounded array of events nobody will ever send.
type QueuedCall = { event: EventName; props?: EventProps };

/**
 * Only the two methods this module actually calls. Structural rather than
 * posthog's own `PostHog` type, because the instance handed to the `loaded`
 * callback is typed `PostHogInterface`, a different (narrower) type in the same
 * package. Depending on the shape we use keeps this immune to that churn.
 */
export type AnalyticsClient = {
  capture: (event: string, props?: EventProps) => unknown;
  register: (props: Record<string, string>) => void;
};

const QUEUE_LIMIT = 50;
const queue: QueuedCall[] = [];
let client: AnalyticsClient | null = null;

/**
 * Called once posthog-js has initialized. Drains the queue in order.
 * Super properties are registered on the instance by the caller *before* this
 * runs, so queued events go out already carrying their acquisition properties.
 */
export function attachPostHog(instance: AnalyticsClient): void {
  client = instance;
  for (const call of queue.splice(0)) {
    try {
      instance.capture(call.event, call.props);
    } catch {
      // See track().
    }
  }
}

/**
 * Fire an event. Safe to call from anywhere: with no token, or before PostHog
 * has finished loading, this queues or no-ops rather than crashing a click handler.
 */
export function track(event: EventName, props?: EventProps): void {
  if (!ANALYTICS_ENABLED) return;
  if (!client) {
    if (queue.length < QUEUE_LIMIT) queue.push({ event, props });
    return;
  }
  try {
    client.capture(event, props);
  } catch {
    // Analytics must never take the page down with it.
  }
}
