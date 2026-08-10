# NovaCast — Master Product Blueprint & Development Guardrails

> Status: **Adopted as source of truth** — 2026-08-10.
> This document establishes the product direction, architecture guardrails, and future functionality for NovaCast. It supersedes ad hoc decisions made in individual chats. When a request conflicts with this document, flag the conflict instead of silently picking one.
>
> See `CLAUDE.md` for the condensed guardrails + current implementation status that every session should read first.

We are continuing development of the existing NovaCast application.

## CRITICAL: NO SHIFTING

Do not reinterpret this project as a new app.
Do not redesign the product around a new concept.
Do not turn NovaCast back into a single-flow wizard.
Do not remove existing menus, flows, features, or functionality simply because you would design them differently.
Do not migrate the architecture unless explicitly instructed.

Firebase/Firestore is the current backend architecture. Supabase is NOT part of NovaCast.

Do not reintroduce:
- Supabase
- Supabase tables
- Supabase API calls
- Supabase environment variables
- `@supabase/supabase-js`
- old Supabase water-body architecture

Firebase/Firestore remains the backend/data layer.

The goal is to continue building the NovaCast we already have, not replace it.

## 1. Core NovaCast Purpose

NovaCast is not fundamentally a "magic lure picker."

The deeper purpose is:

> Help an angler understand the water they're fishing, determine what the fish are likely responding to, and decide what to do next.

The guiding principle is:

> You don't need the magic lure. You need something the fish will respond to, presented where and how they're willing to eat it.

Therefore, NovaCast should prioritize:
- Where fish are likely to be.
- What conditions are influencing their behavior.
- What presentation makes sense.
- What lure/tool can accomplish that presentation.
- What to change when it isn't working.

The app should not imply that there is always one perfect lure.

## 2. Users Are Not All the Same

NovaCast must remain option-driven. Do not assume every user wants an account, fishing history, a tackle inventory, catch logging, AI coaching, social features, advanced analytics, or premium features.

Some people will simply: Open NovaCast → find a lake → get conditions → fish → leave. That is a valid user.

Another person may want: Lake → conditions → tackle → catch → history → patterns. Also valid.

Another may want: Put headphones on → receive spoken fishing instructions → barely touch the phone. Also valid.

NovaCast should provide capabilities without pushing users into a particular way of using the app.

## 3. Water Discovery Is Foundational

The user should be able to open NovaCast and discover bodies of water around them.

Desired experience:
Open NovaCast → RECON → location permission popup → user enables location → map opens → "You are here" → nearby bodies of water appear → user can visually inspect them → user selects a waterbody → NovaCast identifies/enriches it → lake/water information appears → user chooses what they want to do next.

The map is not merely a decorative preview. It is a core water-discovery interface.

## 4. Recon Experience

When the user taps RECON:
1. Open the existing Recon interface/modal pattern.
2. Ask the user to enable device location if needed.
3. Request GPS permission.
4. Obtain coordinates.
5. Display the user's position.
6. Display nearby water bodies.
7. Allow the user to select a water body.
8. Identify the selected water body.
9. Pass that water body into the appropriate existing NovaCast flow.

If multiple bodies of water are nearby, don't silently guess — show candidates.
If no waterbody can be confidently identified, give the user a useful fallback. Do not simply say "No known spots in our database" when physical water may exist nearby.

## 5. Water-Data Architecture

Distinguish between "What water physically exists?" and "What do we know about that water?" Do not assume one database must answer both questions.

Preferred conceptual hierarchy:

- **Tier 1 — USGS 3D Hydrography Program (3DHP).** Investigate as a primary national hydrography foundation — waterbody polygons, lakes, ponds, reservoirs, rivers. Test against real NovaCast problem locations before replacing the current implementation. Do NOT blindly replace the existing system.
- **Tier 2 — GNIS.** Geographic naming information where available. A waterbody should be able to exist even without a recognized name (e.g. "Small pond, 0.3 mi away, 4.2 acres" is still valid).
- **Tier 3 — State fish & wildlife agencies.** Species, stocking, fisheries surveys, regulations, creel limits, size limits, fishery information.
- **Tier 4 — State/local GIS.** Small ponds, local waterbodies, access, jurisdiction, local naming, gaps in national datasets.
- **Tier 5 — OpenStreetMap.** Continue using where it adds useful supplemental information. Not responsible for being the entire national fishing-water database.
- **Tier 6 — NovaCast.** This is where NovaCast adds its own intelligence: given all of this information, what should this angler actually do?

## 6. Test 3DHP Before Replacing Current Location Code

Before implementing a major water-data migration, test USGS 3DHP against: Pressler, small neighborhood/subdivision ponds, known lakes, at least one waterbody currently working, at least one waterbody currently failing, unnamed/small water if possible.

Determine: Can it find the water? How accurate are the polygons? What information is returned? How quickly can nearby water be queried? Can it support the Recon map? Can it work alongside Firebase? What gaps exist?

Report the findings before replacing the current water-discovery system.

## 7. Waterbody Should Become a Core Object

Conceptually:

```
Waterbody
├── ID
├── polygon/location
├── name
├── alternate/local names
├── waterbody type
├── area
├── state/jurisdiction
├── species
├── regulations
├── depth/bathymetry
├── access
├── water characteristics
├── current weather
├── environmental conditions
└── NovaCast fishing intelligence
```

The exact implementation must follow the existing Firebase architecture rather than creating an unrelated architecture.

## 8. Lake Selection → Lake Snapshot

Once a user selects a waterbody, provide a brief, useful Lake Snapshot — not a giant information dump.

Example (PRESSLER — Quick Reference): species, relevant fishing regulations, size/length limits, creel limits, depth/bathymetry if available, access information, water characteristics, current conditions. Then: FISH HERE, or continue into the user's chosen workflow.

Regulatory information must eventually come from authoritative/current sources and should not be treated as permanent static trivia.

## 9. Environmental / Fish-Activity Model

Weather alone is not enough. Where data is available, consider: air temperature, water temperature, water clarity, water color, water level, recent rainfall, wind speed/direction/duration, barometric pressure and trend, cloud/light conditions, sunrise/sunset, moon phase, season, time of day, depth, structure, vegetation, forage/bait activity, current, thermal stratification/thermocline where useful, recent weather changes, lake-specific characteristics.

The app should automatically obtain information when it can. The user should only be asked for things the phone/data sources cannot reliably know. The user should not be expected to know the current barometric pressure.

## 10. On the Bank

On the Bank means: "What should I do right now while I'm standing here fishing?" It should provide actionable instructions, not merely a lure name.

Output should potentially include: starting lure/presentation, where to cast, casting angle, retrieve, approximate depth, cover/structure to target, how long to work an area, when to move, what to change, what to try next, why the recommendation makes sense.

The user should be able to provide observations such as: water clarity, water color, vegetation, cover, bait activity, visible fish activity, available tackle.

## 11. Optional AI Voice Fishing Coach (future)

When actively fishing, users shouldn't have to repeatedly stop, pick up the phone, and read. On the Bank should eventually support an optional hands-free AI voice coach.

Concept: ON THE BANK → establish location/conditions → generate fishing plan → user optionally starts Voice Fishing Coach → short spoken instructions through headphones.

Examples: "Start with the spinnerbait. Work it along the weed edge." / "Slow your retrieve down." / "Move ten feet to your right and cast parallel to the bank." / "Nothing after ten casts. Switch to the Texas rig."

Voice guidance should generally be short and actionable. It should not turn NovaCast into a voice-only app — visual NovaCast remains available, voice mode is optional. The AI must be grounded in actual NovaCast context and must not invent lake/weather/fishing conditions. Do not hard-code API secrets. Do not implement a separate AI application.

## 12. Tackle Box

The existing Tackle Box must actually work. Users should be able to add/save/edit/remove gear/lures, have them persist, and use saved tackle in recommendations.

Should eventually support: lure, type, size, color, rod, reel, line, line strength, other useful tackle attributes.

Do not redesign the Tackle Box unless necessary to make the existing one functional.

## 13. Catch Log

Optional feature. A user should be able to log: lake/waterbody, date/time, species, lure, rod/pole, reel, line, conditions, weather, water conditions, location/spot when available, notes, photo.

Whenever possible, pre-fill information NovaCast already knows (e.g. CAUGHT A FISH → current lake/conditions already known → user selects lure/pole → save). The user should not have to retype everything.

## 14. User Accounts

Users should eventually be able to create an account using Firebase Authentication. Login must be optional — a user should be able to use NovaCast without creating an account.

Account benefits may include: saved tackle, catch history, favorite waters, preferences, fishing history, synchronization across devices.

If an anonymous/guest user later creates an account, existing local data should ideally migrate into the account rather than disappear. Do not force login simply to use basic fishing functionality.

## 15. Personal History Must Remain Optional

Do not push "Log your catch!" or "Build your fishing history!" into the user's face. Some users simply want to fish. Personal history is a capability, not an obligation.

## 16. Fishing Line Masterclass

Add to the existing tutorial/reference system, using the existing tutorial/reference component/data pattern — do not create a separate tutorial architecture.

Cover: Monofilament (stretch, buoyancy, visibility, sensitivity, ease of use, advantages/disadvantages, applications), Fluorocarbon (low underwater visibility, sinking, stretch/sensitivity, abrasion resistance, advantages/disadvantages, applications), Braided line (low stretch, sensitivity, strength-to-diameter, vegetation/heavy-cover use, advantages/disadvantages, applications), Pound test (what 6/8/10/12/15/20+ lb actually means), Technique selection (Texas rig, spinnerbait, chatterbait, crankbait, jerkbait, topwater, frog, jig, finesse, heavy vegetation, clear water, stained/muddy water), Leaders (braid+fluorocarbon, braid+mono, when leaders help/aren't necessary), Knots (Palomar, Improved Clinch, appropriate leader connections).

Do not overcomplicate this.

> **Status: implemented.** See `artifacts/novacast/src/NovaCastReference.tsx` — `LINE_TYPES`/`LINE_STRENGTH`/`LINE_BY_TECHNIQUE`/`LEADERS` data + `LineTab`, wired into the existing `TABS` array as `🧵 Line`.

## 17. Quick-Change Connections

Educational information about snaps, swivels, snap swivels, direct-tie connections. Explain that some anglers use them to change lures quickly, and that extra hardware can affect the presentation/action of some lures. Do not teach "always use a swivel" — teach when it makes sense and when it doesn't.

## 18. Lure Selection: Include the Downsides

NovaCast should not simply list lure advantages — it should understand failure modes and environmental constraints.

Examples: Spinnerbait (algae, bottom debris, heavy vegetation — recommendation may need to change based on where/how it's retrieved). Jerkbait/treble-hook lure (sinking too deeply, bottom debris, algae, vegetation, snag risk).

The app should recognize that a theoretically excellent lure can be a poor choice in a specific environment. Guiding concept: the best lure isn't the best lure if you can't fish it effectively in that environment.

## 19. Troubleshooting / When Things Go Wrong

Add a practical tutorial/reference section.

- **Bird's Nest / Backlash** — why it happens, prevention, baitcaster brake basics, spool control, thumb control, how to clear it patiently, what not to do. Do not imply the user should panic or yank harder.
- **Snagged lure** — changing angle, moving position, steady pressure, distinguishing bottom snag vs. cover snag, when to stop pulling, avoiding damage to rod/line, safe recovery.
- **Bottom fouling** — recognizing algae/debris, adjusting retrieve, adjusting depth, changing presentation.
- **Line problems** — tangles, fraying, line twist, knot failure, when to cut and retie.
- **Stuck in cover** — troubleshoot rather than simply saying "use a different lure."

This material should be instructional. Do NOT turn it into a feed of "what other fishermen do."

## 20. Community Is Not the Core Product

NovaCast should not become a weaker copy of Fishbrain. Community/social content is not the primary purpose. NovaCast's job is: help me figure out what I should do right now. Future partnerships/integrations with fishing-community platforms are fine, but don't build an unnecessary social feed into NovaCast.

## 21. Monetization

Do NOT prematurely decide certain features must be paid — we don't have enough real user data yet. Initially, expose the broader useful experience so users understand what NovaCast can actually do. Build the architecture so capabilities can later be classified as free / premium / trial-preview / limited-usage without rebuilding the application.

Potential premium candidates (possibilities, not final decisions): advanced lake intelligence, deeper bathymetry, historical weather, advanced fish-activity analysis, personalized recommendations, advanced catch analysis, AI voice coach, advanced analytics.

Do not make the basic fishing experience artificially useless to force payment.

## 22. User Feedback About Payment

Consider a small, unobtrusive feedback option such as "What would you pay for?" / "Help us decide what to build next." with choices like: advanced lake information, regulations, depth/bathymetry, historical weather, advanced fish-activity analysis, personalized history, AI fishing coach, voice coaching, detailed catch analysis, something else, I wouldn't pay for anything.

This is research, not a commitment to charge users. Use actual user feedback to determine what deserves premium treatment.

## 23. Early Product Strategy

Show users the value before restricting it. Trials/previews can come later if evidence supports them. Do not remove potentially valuable functionality simply because only a small number of people currently use the app. The first goal is learning what users value.

## 24. Data Should Work Together

Eventually the system should connect: Waterbody + Current conditions + Lake information + User's available tackle + Observed conditions + Fishing presentation + Optional user history = NovaCast Recommendation. Then: Recommendation → optional Voice Coach → optional Catch Log → optional History. None of those steps should be mandatory.

## 25. Development Rule

When implementing anything from this blueprint:

**FIRST:** Inspect what already exists. Determine what is already implemented, partially implemented, broken, or missing; what data/components/services already exist.

**SECOND:** Give a diagnosis. For any significant change, report: What is currently happening? What is broken/missing? What existing code already solves part of it? What is the smallest change needed? Which files will change? What dependencies/services are involved?

**THIRD:** Implement only the approved scope. Do not use one requested feature as an excuse to refactor unrelated systems.

**FOURTH:** Verify. Run typecheck, build, tests if available. Then, when applicable, verify the actual deployed/physical-device behavior. A successful build does not prove GPS, maps, Firebase, weather APIs, or external GIS services work.

## 26. Priority Order

Do not attempt to implement this entire blueprint at once.

- **PRIORITY 1 — Make location/water discovery work.** RECON → Enable Location → show me → show nearby water → let me select water → identify water → show map → continue into NovaCast. Then test: Find Water Near Me, Search a Place, Recon, Game Plan location, On the Bank.
- **PRIORITY 2** — Make sure the selected waterbody correctly feeds lake information, weather, environmental conditions, Game Plan, On the Bank.
- **PRIORITY 3** — Audit existing functionality: Tackle Box actually saves, Catch Log actually saves, existing tutorial/reference system works, existing menus remain intact.
- **PRIORITY 4** — Add the Line Masterclass and troubleshooting material.
- **PRIORITY 5** — Investigate/test USGS 3DHP against the actual NovaCast problem waters before changing the water-discovery architecture.
- **PRIORITY 6** — Design Firebase Authentication as an optional account layer.
- **PRIORITY 7** — Add optional AI voice coaching to the existing On the Bank experience.
- **PRIORITY 8** — Collect real user feedback before deciding what belongs behind a paywall.

## FINAL GUARDRAIL

Do not shift NovaCast away from what we already have. New ideas in this document are additions or future modules unless explicitly identified as a replacement.

The core vision remains: **Discover the water. Understand the conditions. Figure out where and how to fish. Help the angler make a decision. Let them fish the way they want.**

NovaCast should be useful to someone who wants nothing more than "Tell me where the fish might be and what I should throw." And equally useful to someone who wants "Give me the lake data, conditions, tackle recommendations, catch history, and an AI voice coach in my headphones." Both users belong in the same NovaCast.
