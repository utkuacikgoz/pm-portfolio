#!/usr/bin/env node
// Mint tagged links so every place this portfolio is pasted is measurable.
//
//   npm run utm -- --list                       print the standard channel set
//   npm run utm -- --source linkedin --medium profile
//   npm run utm -- --source cv --medium pdf --path /resume --campaign job-search
//
// Convention (keep it, or the PostHog breakdowns turn to mush):
//   source   = where the click physically came from   (linkedin, cv, github, email)
//   medium   = the surface inside that source         (profile, post, dm, pdf, signature)
//   campaign = the push it belongs to                 (job-search-2026, launch-passats)
//   content  = which variant of the link              (hero, footer, comment)

const SITE = "https://utkuacikgoz.com";

// The links that actually get pasted somewhere. Keep this list short: a channel
// nobody uses is a filter nobody needs.
const STANDARD = [
  { name: "LinkedIn profile (featured / website field)", path: "/", source: "linkedin", medium: "profile" },
  { name: "LinkedIn post or comment", path: "/", source: "linkedin", medium: "post" },
  { name: "LinkedIn DM to a recruiter", path: "/resume", source: "linkedin", medium: "dm" },
  { name: "CV PDF footer", path: "/", source: "cv", medium: "pdf" },
  { name: "Email signature", path: "/", source: "email", medium: "signature" },
  { name: "Job application form", path: "/resume", source: "application", medium: "form" },
  { name: "GitHub profile README", path: "/", source: "github", medium: "profile" },
  { name: "X / Twitter bio", path: "/", source: "x", medium: "bio" },
  { name: "Conference or meetup slide", path: "/", source: "talk", medium: "slide" },
];

const DEFAULT_CAMPAIGN = "portfolio";

function build({ path = "/", source, medium, campaign = DEFAULT_CAMPAIGN, content, term }) {
  const url = new URL(path, SITE);
  url.searchParams.set("utm_source", source);
  if (medium) url.searchParams.set("utm_medium", medium);
  if (campaign) url.searchParams.set("utm_campaign", campaign);
  if (content) url.searchParams.set("utm_content", content);
  if (term) url.searchParams.set("utm_term", term);
  return url.toString();
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
    } else {
      args[key] = next;
      i += 1;
    }
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));

if (args.list || !args.source) {
  const campaign = typeof args.campaign === "string" ? args.campaign : DEFAULT_CAMPAIGN;
  console.log(`\nStandard tagged links (campaign "${campaign}"):\n`);
  for (const entry of STANDARD) {
    console.log(`  ${entry.name}`);
    console.log(`  ${build({ ...entry, campaign })}\n`);
  }
  console.log("Custom: npm run utm -- --source <source> --medium <medium> [--path /resume] [--campaign x] [--content y]\n");
  process.exit(0);
}

console.log(
  build({
    path: typeof args.path === "string" ? args.path : "/",
    source: args.source,
    medium: typeof args.medium === "string" ? args.medium : undefined,
    campaign: typeof args.campaign === "string" ? args.campaign : DEFAULT_CAMPAIGN,
    content: typeof args.content === "string" ? args.content : undefined,
    term: typeof args.term === "string" ? args.term : undefined,
  })
);
