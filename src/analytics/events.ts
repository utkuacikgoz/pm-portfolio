import posthog from "posthog-js";
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
  resumeOpened: "resume_opened",
  cvDownloaded: "cv_downloaded",
  ctaClicked: "cta_clicked",
  surfEntered: "surf_entered",
  surfRunCompleted: "surf_run_completed",
  easterEggFound: "easter_egg_found",
} as const;

type EventName = (typeof EVENTS)[keyof typeof EVENTS];

type EventProps = Record<string, string | number | boolean | null | undefined>;

/**
 * Fire an event. Safe to call from anywhere: with no token, or before PostHog
 * has finished loading, this is a no-op rather than a crash in a click handler.
 */
export function track(event: EventName, props?: EventProps): void {
  if (!ANALYTICS_ENABLED) return;
  try {
    posthog.capture(event, props);
  } catch {
    // Analytics must never take the page down with it.
  }
}

/** Attach properties to every subsequent event in this browser. */
export function registerSuperProperties(props: Record<string, string>): void {
  if (!ANALYTICS_ENABLED) return;
  try {
    posthog.register(props);
  } catch {
    // See track().
  }
}
