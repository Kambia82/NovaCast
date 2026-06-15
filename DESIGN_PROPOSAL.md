# Novacast — Lake Workspace Design Proposal

> Design proposal only. No code changes.  
> Date: June 15, 2026  
> Based on: CURRENT_ARCHITECTURE.md, DATABASE_MAP.md, REFACTOR_RECOMMENDATIONS.md

---

## The Core Insight

In the current app, the lake is the **last** thing you pick (step 6 of 6 in the wizard). All the important decisions — what you're fishing for, what time of day, what the conditions are — happen before you ever choose where you're going.

The proposed redesign flips this. **The lake becomes the first decision and the permanent anchor of the session.** Once you've selected a body of water, all other features — conditions, recommendations, tacklebox, notes, trip planning — are organized *around* that lake and persist there between visits.

This is the difference between:
> "Here's a one-time game plan based on today's conditions."

and:
> "Here is your workspace for Preslar Lake. Everything you know about it, your memories from it, and your plan for today — all in one place."

---

## Navigation Structure: Before and After

### Current Flow (linear, one-session, stateless)

```
Welcome
  ├── GPS / Zip / Browse → feeds into Wizard
  │
  Wizard (6 sequential screens, no going back)
    ├── Screen 0: What are you fishing for?
    ├── Screen 1: What reel type? (skippable)
    ├── Screen 2: What time of day?
    ├── Screen 3: Conditions (sky, water, temp, wind, pressure) + weather auto-load
    ├── Screen 4: Recent weather (skippable)
    └── Screen 5: Pick a lake ← lake is last
          │
          Result (one-time, read-only game plan)
            ├── Fish movement bar
            ├── Barometric impact
            ├── Recent weather impacts
            ├── Recommended spots (sorted)
            ├── Lure recommendations
            ├── Color recommendations
            ├── Walmart shopping list
            ├── Pro tip
            └── Knot guide
              │
              ├── "My Tacklebox" → Tacklebox view (separate full screen)
              └── "Start Over" → back to Welcome (session wiped)

Reference (modal overlay, accessible from Welcome only)
```

Problems with this structure:
- The lake is selected after all conditions — you can't plan ahead for a specific lake
- Returning to a lake means running the entire wizard again from scratch
- The result screen is ephemeral — navigating away loses everything
- Tacklebox, Reference, and the Result have no shared context (they don't know which lake you were just at)
- The six wizard steps feel like a form to fill out, not a fishing app

---

### Proposed Flow (lake-anchored, persistent, hub-and-spoke)

```
Discovery Screen
  ├── Search by lake name, zip code, or "Near Me"
  ├── My Lakes (recently visited / starred)
  ├── Browse by region
  └── Select a lake → Lake Workspace

Lake Workspace (persistent hub for the selected lake)
  ├── Tab: Fishing Recommendations
  │     └── Conditions Panel (condensed wizard) → live recommendations
  ├── Tab: Learn
  │     └── Full reference content (unchanged)
  ├── Tab: Tacklebox
  │     └── Saved gear + lake-filtered memories
  ├── Tab: Lake Notes & Memories
  │     └── Lake-specific journal, trip log
  ├── Tab: Trip Planning
  │     └── Future trip date, expected conditions, gear checklist
  └── Tab: Multi-Angler (future)
        └── Shared session with friends
```

The Lake Workspace is not a one-time result screen. It is a **place you return to**. The selected lake stays selected until you deliberately choose a different one. Your notes, saved memories, and trip plans live on that lake's workspace page.

---

## The Three New Screens in Detail

### 1. Discovery Screen
*Replaces: Welcome Screen*

The current welcome screen has three entry points (GPS, zip, Browse) that all ultimately feed into the wizard at different points. The Discovery screen unifies these under a single question: **which lake are you going to?**

**What it contains:**
- Prominent search bar (lake name, city, or zip)
- "Near Me" GPS button — searches Supabase `water_bodies` + `admin_lakes` by distance (same as the Wizard's existing GPS flow, promoted to the top level)
- "My Lakes" section — shows the last 3–5 lakes the user visited, with quick-tap to jump back into that workspace
- Region browser — the 9 region tabs from the current Wizard screen 5
- Lake cards showing: name, type, species tags, distance (if GPS available), special regs indicator

**What changes vs Welcome:**
- The Overpass API "any OSM water body" GPS flow is removed (it returns unnamed ponds with no app data)
- The entry point becomes lake-first, not conditions-first
- "My Tacklebox" and "Reference" buttons move from the welcome screen into the workspace tabs (they're accessible once you're in a lake)

**What is reused unchanged:**
- The lake card component from Wizard screen 5 (the `WaterCard` component inside NovaCastWizard.jsx)
- The region list and labels from `data/waterBodies.ts`
- The Nominatim zip/city geocoding call
- The Supabase queries for `water_bodies`, `admin_lakes`, `custom_lakes`
- The haversine distance + sort logic

---

### 2. Lake Selection (Lake Profile Preview)
*Replaces: Wizard Screen 5 (the location step)*

In the current wizard, selecting a lake immediately completes the wizard and jumps to the result. In the proposed design, selecting a lake opens a brief **Lake Profile Preview** before entering the workspace — a moment to confirm you've picked the right place and see what the lake offers.

**What it contains:**
- Lake name, type, and region
- Species present (from `water_bodies.species`)
- Known spots list (from `water_bodies.spots`)
- Special regulations (from `water_bodies.special_regs`)
- Distance and Google Maps links
- "Open Workspace" button → enters the Lake Workspace

This screen is lightweight — it's the existing lake card information expanded. It gives the user a moment to say "yes, this is where I'm going" before committing to the workspace.

**What is reused unchanged:**
- All data fields from the `water_bodies` / `admin_lakes` / `custom_lakes` schemas
- The Google Maps satellite + directions deep links from the current Wizard `WaterCard`
- Special regs display

---

### 3. Lake Workspace
*Replaces: Result Screen (and absorbs Tacklebox and Reference)*

The Lake Workspace is a **tabbed hub** anchored to a specific lake. It does not reset when you navigate between tabs. Your selected lake and your last conditions choice are both remembered.

The workspace header is always visible regardless of active tab:
- Lake name + type badge
- Quick-access: species tags, distance, Maps link
- "Change Lake" button → returns to Discovery

---

## The Six Workspace Tabs

### Tab 1: Fishing Recommendations
*Evolves from: Result Screen + Wizard Screens 0–4*

This is where the existing recommendation engine lives. The conditions input (currently a 6-screen wizard) becomes a **collapsible conditions panel** within this tab — accessible at any time, not a one-way flow.

**Layout:**
```
[Conditions Panel — collapsed by default, expandable]
  └── Fish target | Reel | Time of day | Sky | Water | Temp | Wind | Pressure | Recent weather
      [Get Recommendations] button

[Recommendations Output — shown after conditions are set]
  ├── Fish Movement depth bar
  ├── Barometric pressure card
  ├── Recent weather impacts
  ├── Recommended Spots (filtered to this lake's spots JSONB)
  ├── Lure Recommendations (scored list)
  ├── Color Recommendations
  ├── Walmart Shopping List
  ├── Pro Tip
  └── Knot Guide
```

**Key UX difference:** After getting recommendations, the user can change one condition (say, time of day changes from morning to afternoon) and re-run without starting the wizard over. The conditions panel stays visible. The output updates in place.

**What is reused unchanged:**
- The entire `data/recommendations.ts` engine — `getLures()`, `getColors()`, `getWalmart()`, `getProTip()`, `getFishMovement()`, `getBarometricImpact()`, `getRecentWeatherImpact()`, `applyRecentWeatherToDepth()` — untouched
- All the lure, color, Walmart, and knot guide display components from the Result screen
- The fish movement depth bar visualization
- The heart/save button on lures, colors, and Walmart items (adds to tacklebox)
- The weather auto-load from OpenWeatherMap (triggered when conditions panel is opened)

**What changes:**
- Wizard screens 0–4 are reorganized into a single collapsible panel instead of a sequential multi-screen flow
- The result is no longer ephemeral — it persists within the tab until conditions are changed
- Spot recommendations are pre-filtered to the selected lake (they don't need to show a lake picker inside the recommendations)

---

### Tab 2: Learn
*Evolves from: NovaCastReference.tsx (modal overlay)*

The entire reference component moves from a modal overlay (accessible only from the welcome screen) to a permanent, always-accessible tab in the workspace.

**What is reused unchanged:**
- `NovaCastReference.tsx` — the entire file, content, and layout
- All four sub-sections: Reels guide, Lures by species, Knots guide, Beginner inventory, Where to buy

**What changes:**
- Rendered as a tab child instead of a full-screen modal
- The close button / modal wrapper removed (tab navigation replaces it)
- It is now accessible while at a lake, not only from the welcome screen — this makes the reference contextually useful (you're reading about lures while at the spot)

---

### Tab 3: Tacklebox
*Evolves from: NovaCastTacklebox.tsx (separate full-screen view)*

The tacklebox moves from a separate top-level view into a workspace tab. The "My Spots" memories sub-tab becomes lake-aware: memories from the currently selected lake surface at the top, all other memories below.

**What is reused unchanged:**
- `NovaCastTacklebox.tsx` — the full component
- All three sub-tabs: Saved (lures/colors/Walmart), My Spots (memories), Wish List
- localStorage persistence
- Add/delete memory and wishlist item interactions

**What changes:**
- The "My Spots" memories tab sorts to show memories tagged with the current lake first
- A "Log today's trip" shortcut button appears at the top when a lake is selected, pre-filling the lake name field on the memory form
- The tacklebox is no longer a sibling of the wizard — it's part of the workspace, so it always knows which lake is selected

---

### Tab 4: Lake Notes & Memories
*New — does not exist in current app*

This tab is the structured, lake-specific knowledge base. Separate from the general tacklebox, it's dedicated to everything the user knows about *this specific lake*.

**What it contains:**

**Free-form Lake Notes** (new)
> A simple text note pad tied to this lake. "The north dock always produces in June. The east bank is shallow and full of weeds — skip it in summer. Best parking is on the left side of the lot."

**Structured Trip Log** (extends current memories)
> Currently, memories in `NovaCastTacklebox.tsx` have fields: lake (text), lure (text), month (text), species (text), note (text). The structured trip log keeps these same fields but ties entries to the lake's actual ID instead of a free-text name, and adds: date (instead of just month), conditions snapshot (sky/water/temp from the wizard), and catch count (optional).

**Species Presence Notes** (new)
> "I've personally caught: Bass ✓, Crappie ✓, Catfish — never. The catfish tags might be wrong for this lake." User annotations on top of the database species list.

**What is reused:**
- Memory card data structure from `NovaCastTacklebox.tsx`
- The add/edit/delete interaction patterns from the existing memory form
- localStorage for persistence (Supabase `custom_lakes.notes` field for cloud sync, later)

**What is new / missing from current app:**
- Lake-ID-linked memories (current memories use a freeform lake name text field)
- Free-form notes pad per lake
- Conditions snapshot on each trip log entry
- The tab itself — there is no dedicated "Lake Notes" screen today

---

### Tab 5: Trip Planning
*New — does not exist in current app*

Trip Planning is forward-looking: instead of "what should I do right now?", it answers "I'm going to Preslar Lake on Saturday — what should I prepare?"

**What it contains:**

**Trip Date Picker**
> Select a future date. The app notes the month and uses it to pre-select seasonal lure recommendations via `getGeneralBestRecommendation(month)` from `recommendations.ts`.

**Planned Conditions**
> The same conditions panel from the Recommendations tab, but filled in with anticipated conditions ("I usually go in the morning, it's usually partly cloudy in June"). Generates a tentative gear list.

**Pre-Trip Gear Checklist** (new)
> A structured checklist of what to bring: rods, terminal tackle, specific lures from the recommendations. Items can be checked off the morning of the trip. Pre-populated from the recommendation output, user-editable.

**Trip Reminders** (future / lightweight)
> "You planned a trip to Preslar Lake for Saturday. Check conditions the night before." (In-app reminder, not push notification — no native notification API in a web app.)

**What is reused:**
- `getGeneralBestRecommendation(month)` from `recommendations.ts` — the seasonal baseline already exists and works perfectly here
- The Walmart / gear list display from the Result screen
- The wishlist add interaction from `NovaCastTacklebox.tsx`

**What is new / missing:**
- The date picker UI
- The gear checklist component (different from the wishlist — it's trip-specific, not permanent)
- The trip planning state (stored in localStorage under a new key, or in Supabase `custom_lakes.notes` as JSON)

---

### Tab 6: Multi-Angler (Future)
*Planned but not built — design scaffold only*

Multi-Angler support acknowledges that fishing is often a social activity. The most common scenario: you're going out with a friend who has a different setup (they have a spincast reel, you have a baitcaster; they're targeting crappie, you're targeting bass).

**Phase 1 concept (single device):**
> Add "Anglers" to the current session. Each angler sets their fish target and reel type. The recommendations tab generates **one result per angler** — separate lure lists, same shared conditions (time, sky, water, pressure). View switches between anglers with a simple pill selector.

**Phase 2 concept (multi-device, future):**
> A "shared trip" session where each device joins the same lake + conditions session via a short code. Each person's tacklebox is their own, but everyone shares the same conditions input and sees the same spots.

**What is reused:**
- The entire recommendation engine handles per-angler output naturally — `getLures(sky, water, temp, fish, time)` already takes `fish` as a parameter. Running it twice with different `fish` values produces two independent lure lists.

**What is new / missing:**
- The angler management UI (add angler, name each one, set their fish target + reel)
- The tab switcher for viewing angler-specific results
- Any multi-device sync layer (Phase 2)

---

## Component Reuse Summary

### Reused Unchanged

| Component / Module | Current location | Used as |
|---|---|---|
| `data/recommendations.ts` | `src/data/recommendations.ts` | Entire engine — all functions identical |
| `NovaCastReference.tsx` | `src/NovaCastReference.tsx` | "Learn" tab — remove modal wrapper only |
| `NovaCastTacklebox.tsx` | `src/NovaCastTacklebox.tsx` | "Tacklebox" tab — minor lake-awareness addition |
| Water body lake cards | Inside `NovaCastWizard.jsx` | Discovery screen + Lake Selection preview |
| Region browser | Wizard screen 5 + `data/waterBodies.ts` | Discovery screen region tabs |
| Supabase queries | `App.tsx` | Same queries, same data, same tables |
| Design tokens | `src/index.css` | All CSS custom properties unchanged |
| Knot guide display | Result section in `App.tsx` | Recommendations tab, unchanged |
| Fish movement depth bar | Result section in `App.tsx` | Recommendations tab, unchanged |
| Barometric impact card | Result section in `App.tsx` | Recommendations tab, unchanged |
| Google Maps deep links | Wizard `WaterCard` | Lake Workspace header + Lake Selection preview |
| Nominatim geocoding | `App.tsx` + `NovaCastWizard.jsx` | Discovery screen search |
| OpenWeatherMap auto-fill | `NovaCastWizard.jsx` | Conditions panel in Recommendations tab |

---

### Modified (Behavior / Wrapper Change, Not Logic)

| Component | Current behavior | Modified behavior |
|---|---|---|
| **Welcome Screen** | 3 entry points, feeds wizard | Becomes Discovery: lake-first search + My Lakes + region browse |
| **Wizard Screens 0–4** (conditions input) | Sequential multi-screen flow, one-way | Collapsed into a single expandable conditions panel within the Recommendations tab; re-runnable at any time |
| **Wizard Screen 5** (location) | Last wizard step, immediately triggers result | Promoted to Lake Selection — a standalone step before the workspace |
| **Result Screen** | Ephemeral one-time output, resets on navigation | Becomes the Recommendations tab — persistent, re-runnable, lake-aware |
| **NovaCastTacklebox.tsx** | Standalone full-screen view | Tab inside workspace; "My Spots" sorts lake-matched memories first |
| **NovaCastReference.tsx** | Modal overlay from Welcome only | Tab inside workspace; remove modal chrome |
| **App.tsx** view state | `'welcome' \| 'wizard' \| 'result' \| 'tacklebox' \| 'reference'` | `'discovery' \| 'workspace'` + `activeTab` within workspace |

---

### Missing Entirely (Must Be Built)

| Feature | Tab | What it needs |
|---|---|---|
| Persistent lake selection | Workspace header | `selectedLake` state that survives tab switches; stored in localStorage |
| Collapsible conditions panel | Recommendations | Accordion/drawer UI wrapping existing wizard inputs (not a new wizard) |
| "My Lakes" / recently visited | Discovery | Store last 5 visited lake IDs in localStorage; show on Discovery screen |
| Lake Notes (free-form text) | Lake Notes & Memories | Text area saved per lake ID in localStorage (later Supabase) |
| Trip Log with lake ID link | Lake Notes & Memories | Extend memory card schema: add `lakeId`, `date`, `conditionsSnapshot`, `catchCount` |
| Trip date picker | Trip Planning | Date input; derives month → feeds `getGeneralBestRecommendation(month)` |
| Pre-trip gear checklist | Trip Planning | New component; pre-populated from recommendation output; trip-scoped localStorage |
| Multi-angler selector | Multi-Angler | Angler list UI; per-angler fish target + reel; runs `getLures()` per angler |

---

## State Architecture Implication

The most significant structural change is what the app needs to remember.

**Current state model (App.tsx):**
- `view` — which screen is showing
- `wizardState` — conditions answers (fish, time, sky, water, etc.)
- `waterBodies` / `customLakes` / `adminLakes` — Supabase data
- `tacklebox` — saved gear

**Proposed state model:**
- `selectedLake` — the currently open lake (persists across tab switches, stored in localStorage)
- `activeTab` — which workspace tab is visible
- `conditions` — the conditions panel state (persists per lake; re-runnable)
- `recommendations` — the last computed output (cached until conditions change)
- `waterBodies` / `customLakes` / `adminLakes` — unchanged
- `tacklebox` — unchanged
- `recentlyVisited` — array of lake IDs (new, localStorage)
- `lakeNotes` — map of `{ [lakeId]: string }` (new, localStorage)
- `tripPlans` — map of `{ [lakeId]: TripPlan }` (new, localStorage)

The recommendation engine itself requires zero changes — it is a pure function that takes conditions and returns output. The state changes are all in what wraps it, not what it computes.

---

## What This Design Does Not Change

- The recommendation engine logic, scoring weights, lure objects, color logic, or Walmart items
- The knot guides content
- The reference (learn) content
- The tacklebox data structure (existing localStorage schema preserved)
- The Supabase table schemas
- The visual design system (colors, typography, Bebas Neue headers, dark navy theme)
- The species-based lure filtering
- The barometric and recent weather adjustment logic
- Any of the existing fishing advice, tips, or techniques

The proposal is a **reorganization** of the UX around a new center of gravity (the lake), not a replacement of what makes the app useful.

---

## Implementation Order (When Ready to Build)

1. **Discovery Screen** — replaces Welcome; reuses lake cards and Supabase queries
2. **Workspace shell + tab navigation** — the container with header and 6 tab slots
3. **Recommendations tab** — move existing Result Screen content into tab; convert wizard inputs to collapsible panel
4. **Learn tab** — drop `NovaCastReference.tsx` in, remove modal wrapper
5. **Tacklebox tab** — drop `NovaCastTacklebox.tsx` in, add lake-awareness to memory sort
6. **Lake Notes & Memories tab** — new component; start with free-form notes, add structured trip log
7. **Trip Planning tab** — date picker + seasonal recommendations + checklist
8. **Multi-Angler tab** — phase 1 (single device, multiple angler profiles)
