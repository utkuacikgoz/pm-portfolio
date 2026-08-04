// Acquisition attribution: where a visitor came from, kept as first-touch
// (the very first visit, ever) and last-touch (this session).
//
// PostHog already records $initial_utm_* on the person profile, but that only
// exists for identified people and it ignores the short `?ref=` / `?src=` links
// that are far easier to paste into a LinkedIn bio or a CV footer. Parsing here
// means every event carries the channel as a super property, so any funnel can
// be broken down by source without touching person profiles.

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;

type UtmKey = (typeof UTM_KEYS)[number];
type Utm = Partial<Record<UtmKey, string>>;

/** Coarse bucket used for "which channel actually sends recruiters" reporting. */
type Channel =
  | "direct"
  | "organic_search"
  | "social"
  | "email"
  | "cv"
  | "campaign"
  | "referral";

interface Attribution {
  utm: Utm;
  /** Bare hostname of the referring page, null when there is none. */
  referrerHost: string | null;
  channel: Channel;
  /** Path the visitor landed on, useful for "deep link vs front door". */
  landingPath: string;
  /** ISO timestamp of the touch. */
  at: string;
}

const FIRST_TOUCH_KEY = "pf:attr:first";
const SESSION_TOUCH_KEY = "pf:attr:session";

// Short aliases so a link can stay human-readable: /?ref=linkedin behaves like
// utm_source=linkedin&utm_medium=referral.
const SOURCE_ALIASES = ["ref", "src", "source"];

// Bare names, no TLD: they match the name itself (so utm_source=linkedin works),
// any TLD (linkedin.com) and any subdomain (de.linkedin.com).
const SEARCH_HOSTS = [
  "google",
  "bing",
  "duckduckgo",
  "yahoo",
  "yandex",
  "baidu",
  "ecosia",
  "brave",
  "startpage",
  "perplexity",
  "chatgpt",
  "claude",
];

const SOCIAL_HOSTS = [
  "linkedin",
  "lnkd.in",
  "twitter",
  "x.com",
  "t.co",
  "facebook",
  "instagram",
  "reddit",
  "news.ycombinator.com",
  "github",
  "medium",
  "threads",
  "bsky",
  "youtube",
  "tiktok",
  "producthunt",
];

// Checked before the search hosts: mail.google.com is an inbox, not a search.
const MAIL_HOSTS = ["mail.google", "outlook", "mail.yahoo", "superhuman", "hey.com", "proton.me"];

const PAID_MEDIUMS = ["cpc", "ppc", "paid", "paidsocial", "paid_social", "display", "banner"];

function matchesHost(host: string, needles: string[]): boolean {
  return needles.some(
    (n) => host === n || host.startsWith(`${n}.`) || host.endsWith(`.${n}`) || host.includes(`.${n}.`)
  );
}

/** Strip protocol/www so "https://www.linkedin.com/in/x" reads as "linkedin.com". */
export function hostOf(url: string): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

/** Read utm_* (plus the ref/src aliases) out of a query string. */
export function parseUtm(search: string): Utm {
  const params = new URLSearchParams(search);
  const utm: Utm = {};

  for (const key of UTM_KEYS) {
    const value = params.get(key)?.trim();
    if (value) utm[key] = value.slice(0, 120).toLowerCase();
  }

  if (!utm.utm_source) {
    for (const alias of SOURCE_ALIASES) {
      const value = params.get(alias)?.trim();
      if (value) {
        utm.utm_source = value.slice(0, 120).toLowerCase();
        utm.utm_medium ??= "referral";
        break;
      }
    }
  }

  return utm;
}

/** Bucket a touch into a channel. UTM wins, then the referrer, then direct. */
export function classifyChannel(utm: Utm, referrer: string, siteHost: string): Channel {
  const medium = utm.utm_medium ?? "";
  const source = utm.utm_source ?? "";

  if (medium === "email" || medium === "newsletter" || source === "email") return "email";
  if (medium === "cv" || medium === "resume" || medium === "pdf" || source === "cv") return "cv";
  if (PAID_MEDIUMS.includes(medium)) return "campaign";
  if (medium === "social" || matchesHost(source, SOCIAL_HOSTS)) return "social";
  if (medium === "organic" || matchesHost(source, SEARCH_HOSTS)) return "organic_search";
  if (source || medium) return "campaign";

  const host = hostOf(referrer);
  if (!host || host === siteHost.replace(/^www\./, "")) return "direct";
  if (matchesHost(host, MAIL_HOSTS)) return "email";
  if (matchesHost(host, SEARCH_HOSTS)) return "organic_search";
  if (matchesHost(host, SOCIAL_HOSTS)) return "social";
  return "referral";
}

export function buildAttribution(input: {
  search: string;
  referrer: string;
  pathname: string;
  siteHost: string;
  now?: Date;
}): Attribution {
  const utm = parseUtm(input.search);
  const referrerHost = hostOf(input.referrer);
  return {
    utm,
    // Self-referrals (internal navigation) are not an acquisition source.
    referrerHost: referrerHost === input.siteHost.replace(/^www\./, "") ? null : referrerHost,
    channel: classifyChannel(utm, input.referrer, input.siteHost),
    landingPath: input.pathname || "/",
    at: (input.now ?? new Date()).toISOString(),
  };
}

/** True when the touch says something we did not already know. */
export function isMeaningful(attr: Attribution): boolean {
  return Object.keys(attr.utm).length > 0 || attr.channel !== "direct";
}

/**
 * Flatten a first/last touch pair into PostHog super properties. Prefixed so
 * they never collide with PostHog's own $utm_* / $referrer properties.
 */
export function toSuperProperties(first: Attribution, last: Attribution): Record<string, string> {
  const props: Record<string, string> = {
    channel: last.channel,
    first_channel: first.channel,
    landing_path: last.landingPath,
    first_landing_path: first.landingPath,
    first_seen_at: first.at,
  };

  for (const key of UTM_KEYS) {
    if (last.utm[key]) props[key] = last.utm[key] as string;
    if (first.utm[key]) props[`first_${key}`] = first.utm[key] as string;
  }
  if (last.referrerHost) props.referrer_host = last.referrerHost;
  if (first.referrerHost) props.first_referrer_host = first.referrerHost;

  return props;
}

function readStored(storage: Storage | undefined, key: string): Attribution | null {
  try {
    const raw = storage?.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Attribution;
    return parsed && typeof parsed.channel === "string" ? parsed : null;
  } catch {
    return null;
  }
}

function writeStored(storage: Storage | undefined, key: string, attr: Attribution): void {
  try {
    storage?.setItem(key, JSON.stringify(attr));
  } catch {
    // Private mode / storage full: attribution is nice to have, never fatal.
  }
}

/**
 * Resolve the touches for this page load and persist them. First touch is
 * written once and never overwritten; the session touch is refreshed whenever a
 * new visit arrives with real source information.
 */
export function resolveTouches(current: Attribution): { first: Attribution; last: Attribution } {
  const ls = typeof localStorage === "undefined" ? undefined : localStorage;
  const ss = typeof sessionStorage === "undefined" ? undefined : sessionStorage;

  const storedFirst = readStored(ls, FIRST_TOUCH_KEY);
  const first = storedFirst ?? current;
  if (!storedFirst) writeStored(ls, FIRST_TOUCH_KEY, current);

  const storedSession = readStored(ss, SESSION_TOUCH_KEY);
  // A mid-session internal navigation must not overwrite "arrived from LinkedIn"
  // with "direct", so only a meaningful touch replaces the stored one.
  const last = isMeaningful(current) || !storedSession ? current : storedSession;
  if (last === current) writeStored(ss, SESSION_TOUCH_KEY, current);

  return { first, last };
}

/**
 * Drop utm_* / ref params from the address bar once captured, so the URL a
 * visitor copies out of the bar is the clean canonical one.
 */
export function stripCampaignParams(url: string): string {
  try {
    const parsed = new URL(url);
    for (const key of [...UTM_KEYS, ...SOURCE_ALIASES, "gclid", "fbclid", "li_fat_id"]) {
      parsed.searchParams.delete(key);
    }
    const query = parsed.searchParams.toString();
    return `${parsed.pathname}${query ? `?${query}` : ""}${parsed.hash}`;
  } catch {
    return url;
  }
}
