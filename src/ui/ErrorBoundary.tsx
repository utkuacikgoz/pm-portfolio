import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback: ReactNode;
}

/**
 * Catches render/runtime errors in the 3D world (e.g. a WebGL context failure)
 * and shows a fallback instead of a white screen. Wired so the world degrades to
 * the flat map rather than taking the whole page down.
 */
export default class ErrorBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error("World render failed, showing fallback:", error);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
