import { useCallback, useRef, useState } from "react";
import { T, TYPE, textAccent } from "../theme";
import { EVENTS, track } from "../analytics/events";
import { loadFrame, renderShareCard } from "./render-share-card";
import { SHARE_TITLE, shareFileName, shareRoute, shareText, shareUrl, type RunStats } from "./share-card";

/**
 * The one thing that leaves the site.
 *
 * A visitor who enjoys the surf run has, until now, had nothing to send
 * anyone: no image, no result, no link carrying state. This composites the
 * frame they are looking at with what they have actually done and hands it to
 * the operating system share sheet on a phone, or to a download plus a copied
 * link on a desktop.
 *
 * It lives beside "Exit surf" rather than on the completion card on purpose.
 * Finishing all 42 coins is rare; wanting to show someone the ocean is not, and
 * a share button nobody reaches is the same as no share button.
 */
export default function ShareRun({
  stats,
  capture,
}: {
  stats: RunStats;
  /** Returns the current WebGL frame as a data URL, or null if there is none. */
  capture: () => string | null;
}) {
  const [state, setState] = useState<"idle" | "working" | "shared" | "copied" | "failed">("idle");
  const busy = useRef(false);

  const onShare = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    setState("working");
    try {
      // Captured before anything else: an await here would let a frame present
      // and the drawing buffer clear before it is read.
      const dataUrl = capture();
      const url = shareUrl(window.location.origin);
      const blob = await renderShareCard(await loadFrame(dataUrl), stats, url);
      const file = blob ? new File([blob], shareFileName(), { type: "image/png" }) : null;

      if (shareRoute(navigator, file) === "web-share" && file) {
        await navigator.share({ files: [file], title: SHARE_TITLE, text: shareText(stats) });
        track(EVENTS.runShared, { route: "web_share", coins: stats.coins, waves: stats.waves });
        setState("shared");
      } else {
        if (file) {
          const href = URL.createObjectURL(file);
          const a = document.createElement("a");
          a.href = href;
          a.download = file.name;
          a.click();
          // Revoked on the next tick rather than immediately: Safari has not
          // started reading the blob by the time click() returns.
          setTimeout(() => URL.revokeObjectURL(href), 10_000);
        }
        await navigator.clipboard?.writeText?.(url).catch(() => {});
        track(EVENTS.runShared, { route: "download", coins: stats.coins, waves: stats.waves });
        setState("copied");
      }
    } catch (error) {
      // A dismissed share sheet throws AbortError. That is a visitor changing
      // their mind, not a failure worth showing them.
      const aborted = error instanceof DOMException && error.name === "AbortError";
      setState(aborted ? "idle" : "failed");
    } finally {
      busy.current = false;
      setTimeout(() => setState("idle"), 2600);
    }
  }, [capture, stats]);

  const label =
    state === "working"
      ? "Making card…"
      : state === "shared"
        ? "Shared"
        : state === "copied"
          ? "Saved, link copied"
          : state === "failed"
            ? "Could not make it"
            : "📸 Share this run";

  return (
    <button
      onClick={onShare}
      disabled={state === "working"}
      aria-label="Share this surf run as an image"
      style={{
        position: "fixed",
        bottom: "calc(24px + env(safe-area-inset-bottom))",
        left: 24,
        zIndex: 44,
        padding: "11px 18px",
        background: T.scrim,
        border: `2px solid ${T.seafoam}`,
        color: textAccent(T.seafoam),
        fontSize: TYPE.small,
        fontWeight: 800,
        cursor: state === "working" ? "progress" : "pointer",
        backdropFilter: "blur(6px)",
      }}
    >
      {label}
    </button>
  );
}
