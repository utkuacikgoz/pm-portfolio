import { LIVE_INDIE_WORD } from "../projects/projects";

// The positioning claim, in one place. It had been typed separately into the
// desktop hero and the resume, and the phone landing (FlatMap) never got it at
// all: phones skip the hero, so the page most recruiters actually open kept the
// old credential line for a month after the claim shipped.
//
// Import this file directly, never through `content/index.ts`: that barrel pulls
// in every case study, which would drag their prose back into the entry chunk.
export const CLAIM = "I earn the big change by shipping a small result first.";

// The claim plus one line of where, for the two landing surfaces: the desktop
// hero and the phone list that stands in for it.
export const LANDING_LINE = `${CLAIM} Fintech infrastructure, marketplaces, and ${LIVE_INDIE_WORD} products of my own.`;

// Availability, reachable from every landing surface. It used to appear only in
// the footer of a case study and at the bottom of the phone list, so a recruiter
// had to read a whole study before learning whether Utku was looking at all.
export const AVAILABILITY = "Open to senior product and AI product roles.";

// The primary ask (Utku, 2026-11-24): a 30 minute call. Every surface that
// offers it uses this label, so the ask reads the same everywhere it appears.
export const BOOK_CALL = "Book a 30 min call";

// The indie shelf's heading, shared by the resume and the phone list, which had
// drifted to "Building on my own time" and "Independent products". The shelf
// only carries products a visitor can open, so "shipped" is the accurate word,
// and it is the claim above, demonstrated on Utku's own time.
export const SHELF_TITLE = "SHIPPED ON MY OWN TIME";
