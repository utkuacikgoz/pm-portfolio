/* eslint-disable react-refresh/only-export-components -- router hooks share this module with the provider by design. */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type AnchorHTMLAttributes, type MouseEvent, type ReactNode } from "react";

type NavigateOptions = { replace?: boolean };

type RouterState = {
  pathname: string;
  navigate: (to: string, options?: NavigateOptions) => void;
};

const RouterContext = createContext<RouterState | null>(null);

function readPathname() {
  return window.location.pathname;
}

export function BrowserRouter({ children }: { children: ReactNode }) {
  const [pathname, setPathname] = useState(readPathname);

  useEffect(() => {
    const onPopState = () => setPathname(readPathname());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigate = useCallback((to: string, { replace = false }: NavigateOptions = {}) => {
    window.history[replace ? "replaceState" : "pushState"](null, "", to);
    setPathname(readPathname());
  }, []);

  const value = useMemo(() => ({ pathname, navigate }), [pathname, navigate]);
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
