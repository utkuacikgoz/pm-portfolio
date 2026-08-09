import { Component, type ReactNode } from "react";
import { EVENTS, track } from "../analytics/events";

interface Props {
  children: ReactNode;
  fallback: ReactNode;
  /** Where this boundary sits, so a report says which part failed. */
  area: "world" | "app";
}

/**
 * Catches render/runtime errors and shows a fallback instead of a white screen.
 *
 * Two are mounted: one around the 3D world, which degrades to the flat map, and
 * one around the whole app, which is the difference between a visitor seeing a
 * blank page and seeing a way to reach the resume.
 *
 * It also reports. A crash used to be console.error only, which means it
 * happened on a recruiter's machine, they left, and it looked identical to
 * someone who simply did not engage.
 */
export default class ErrorBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${this.props.area}] render failed, showing fallback:`, error);
    track(EVENTS.appCrashed, {
      area: this.props.area,
      message: message.slice(0, 300),
      // The world path is a degrade (flat map still works); the app path is not.
      fatal: this.props.area === "app",
    });
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
