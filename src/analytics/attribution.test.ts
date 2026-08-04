import { beforeEach, describe, expect, it } from "vitest";
import {
  buildAttribution,
  classifyChannel,
  hostOf,
  isMeaningful,
  parseUtm,
  resolveTouches,
  stripCampaignParams,
  toSuperProperties,
} from "./attribution";

describe("parseUtm", () => {
  it("reads the standard parameters, lowercased", () => {
    expect(parseUtm("?utm_source=LinkedIn&utm_medium=Post&utm_campaign=Portfolio")).toEqual({
      utm_source: "linkedin",
      utm_medium: "post",
      utm_campaign: "portfolio",
    });
  });

  it("treats ?ref= and ?src= as a source with referral medium", () => {
    expect(parseUtm("?ref=cv")).toEqual({ utm_source: "cv", utm_medium: "referral" });
    expect(parseUtm("?src=github")).toEqual({ utm_source: "github", utm_medium: "referral" });
  });

  it("does not let an alias override an explicit utm_source", () => {
    expect(parseUtm("?utm_source=linkedin&ref=cv").utm_source).toBe("linkedin");
  });

  it("returns nothing for an empty query", () => {
    expect(parseUtm("")).toEqual({});
  });
});

describe("classifyChannel", () => {
  const site = "utkuacikgoz.com";

  it("prefers the campaign tags over the referrer", () => {
    expect(classifyChannel({ utm_source: "cv", utm_medium: "pdf" }, "https://google.com/", site)).toBe("cv");
    expect(classifyChannel({ utm_medium: "email" }, "", site)).toBe("email");
    expect(classifyChannel({ utm_source: "linkedin" }, "", site)).toBe("social");
    expect(classifyChannel({ utm_medium: "cpc" }, "", site)).toBe("campaign");
  });

  it("falls back to the referrer host", () => {
    expect(classifyChannel({}, "https://www.google.com/search?q=utku", site)).toBe("organic_search");
    expect(classifyChannel({}, "https://www.linkedin.com/feed/", site)).toBe("social");
    expect(classifyChannel({}, "https://mail.google.com/mail/u/0", site)).toBe("email");
    expect(classifyChannel({}, "https://some-blog.dev/post", site)).toBe("referral");
  });

  it("counts no referrer, and our own pages, as direct", () => {
    expect(classifyChannel({}, "", site)).toBe("direct");
    expect(classifyChannel({}, "https://utkuacikgoz.com/resume", site)).toBe("direct");
  });
});

describe("buildAttribution", () => {
  it("captures the touch and drops self-referrals", () => {
    const attr = buildAttribution({
      search: "?utm_source=linkedin&utm_medium=dm",
      referrer: "https://utkuacikgoz.com/",
      pathname: "/p/bilira",
      siteHost: "utkuacikgoz.com",
      now: new Date("2026-08-04T10:00:00Z"),
    });

    expect(attr.channel).toBe("social");
    expect(attr.referrerHost).toBeNull();
    expect(attr.landingPath).toBe("/p/bilira");
    expect(attr.at).toBe("2026-08-04T10:00:00.000Z");
  });

  it("marks a bare direct visit as not meaningful", () => {
    const attr = buildAttribution({ search: "", referrer: "", pathname: "/", siteHost: "utkuacikgoz.com" });
    expect(isMeaningful(attr)).toBe(false);
  });
});

describe("toSuperProperties", () => {
  it("keeps first touch and last touch apart", () => {
    const first = buildAttribution({
      search: "?utm_source=cv&utm_medium=pdf",
      referrer: "",
      pathname: "/",
      siteHost: "utkuacikgoz.com",
    });
    const last = buildAttribution({
      search: "",
      referrer: "https://www.linkedin.com/in/someone",
      pathname: "/resume",
      siteHost: "utkuacikgoz.com",
    });

    expect(toSuperProperties(first, last)).toMatchObject({
      channel: "social",
      first_channel: "cv",
      first_utm_source: "cv",
      referrer_host: "linkedin.com",
      landing_path: "/resume",
      first_landing_path: "/",
    });
  });
});

describe("resolveTouches", () => {
  const touch = (search: string, referrer = "", pathname = "/") =>
    buildAttribution({ search, referrer, pathname, siteHost: "utkuacikgoz.com" });

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("keeps the very first touch forever", () => {
    resolveTouches(touch("?utm_source=cv&utm_medium=pdf"));
    const second = resolveTouches(touch("?utm_source=linkedin&utm_medium=post", "", "/resume"));

    expect(second.first.utm.utm_source).toBe("cv");
    expect(second.last.utm.utm_source).toBe("linkedin");
  });

  it("does not let an internal navigation overwrite the session source", () => {
    resolveTouches(touch("?utm_source=linkedin&utm_medium=dm"));
    const internal = resolveTouches(touch("", "https://utkuacikgoz.com/", "/p/bilira"));

    expect(internal.last.utm.utm_source).toBe("linkedin");
    expect(internal.last.channel).toBe("social");
  });

  it("treats corrupt stored attribution as absent", () => {
    localStorage.setItem("pf:attr:first", "{not json");
    const resolved = resolveTouches(touch("?utm_source=github"));

    expect(resolved.first.utm.utm_source).toBe("github");
  });
});

describe("stripCampaignParams", () => {
  it("removes campaign noise and keeps everything else", () => {
    expect(stripCampaignParams("https://utkuacikgoz.com/p/bilira?utm_source=linkedin&keep=1#beats")).toBe(
      "/p/bilira?keep=1#beats"
    );
  });

  it("leaves a clean url alone", () => {
    expect(stripCampaignParams("https://utkuacikgoz.com/resume")).toBe("/resume");
  });

  it("returns the input unchanged when it is not a url", () => {
    expect(stripCampaignParams("nonsense")).toBe("nonsense");
  });
});

describe("hostOf", () => {
  it("strips protocol and www", () => {
    expect(hostOf("https://www.LinkedIn.com/in/x")).toBe("linkedin.com");
    expect(hostOf("not a url")).toBeNull();
    expect(hostOf("")).toBeNull();
  });
});
