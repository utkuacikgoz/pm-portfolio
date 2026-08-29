/* eslint-disable react-refresh/only-export-components -- router hooks share this module with the provider by design. */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type AnchorHTMLAttributes, type MouseEvent, type ReactNode } from "react";

type NavigateOptions = { replace?: boolean };

type RouterState = {
  pathname: string;
  /** Query string including the leading "?", or "" when there is none. */
  search: string;
  /** Fragment including the leading "#", or "" when there is none. */
  hash: string;
  navigate: (to: string, options?: NavigateOptions) => void;
};

const RouterContext = createContext<RouterState | null>(null);

/**
 * The whole location, not just the path.
 *
 * This used to read `window.location.pathname` alone. `navigate` pushed the
 * full URL, so the address bar was right, but the router's own state dropped
 * the query and the fragment the moment you moved: a link carrying either
 * worked on a cold load and then silently lost it on the first client-side
 * navigation. Nothing depended on either until a shareable link needed to
 * carry state, which is exactly how a latent bug announces itself.
 */
function readLocation() {
  const { pathname, search, hash } = window.location;
  return { pathname, search, hash };
}

export function BrowserRouter({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState(readLocation);

  useEffect(() => {
    const onPopState = () => setLocation(readLocation());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigate = useCallback((to: string, { replace = false }: NavigateOptions = {}) => {
    window.history[replace ? "replaceState" : "pushState"](null, "", to);
    setLocation(readLocation());
  }, []);

  const { pathname, search, hash } = location;
  const value = useMemo(() => ({ pathname, search, hash, navigate }), [pathname, search, hash, navigate]);
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

function useRouter() {
  const router = useContext(RouterContext);
  if (!router) throw new Error("Router hooks must be used inside BrowserRouter.");
  return router;
}

export function useLocation() {
  return useRouter();
}

export function useNavigate() {
  return useRouter().navigate;
}

export function useParams() {
  const { pathname } = useRouter();
  const match = pathname.match(/^\/p\/([^/]+)$/);
  return { id: match ? decodeURIComponent(match[1]) : undefined };
}

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { to: string };

export function Link({ to, onClick, ...props }: LinkProps) {
  const navigate = useNavigate();
  const onLinkClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.currentTarget.target === "_blank" ||
      event.metaKey ||
      event.altKey ||
      event.ctrlKey ||
      event.shiftKey
    ) return;
    event.preventDefault();
    navigate(to);
  };

  return <a href={to} onClick={onLinkClick} {...props} />;
}
