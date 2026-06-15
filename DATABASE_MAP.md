# Novacast — Database Map

> Source: `.migration-backup/supabase/migrations/20260505114415_create_water_bodies_and_lakes.sql`  
> Database: Supabase (hosted PostgreSQL)  
> Auth: Supabase Auth (schema present, no UI built)

---

## Overview

The app uses **three Supabase tables**. All three have Row Level Security (RLS) enabled. There is no application-level ORM — all queries are made directly via the Supabase JavaScript client (`supabase.from('table').select(...)`, `.insert()`, `.delete()`).

---

## Table 1: `water_bodies`

**Purpose:** The curated, developer-maintained list of named fishing spots in the STL area. This is the primary location database.

```sql
CREATE TABLE water_bodies (
  id          uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  key         text          UNIQUE NOT NULL,      -- short slug, e.g. 'preslar', 'bigriver'
  name        text          NOT NULL,             -- display name, e.g. "Preslar Lake"
  location    text          NOT NULL,             -- area description, e.g. "Fenton, MO"
  region      text          NOT NULL,             -- region key (see Region Keys below)
  type        text          NOT NULL DEFAULT 'lake', -- 'lake' | 'pond' | 'river' | 'reservoir'
  species     text[]        DEFAULT '{}',         -- ['Bass', 'Crappie', 'Catfish', ...]
  tags        jsonb         DEFAULT '[]',         -- [{ "label": string, "color": "green"|"orange"|"red"|"blue" }]
  latitude    double precision,                   -- GPS lat (nullable — not all spots have coords)
  longitude   double precision,                   -- GPS lon
  spots       jsonb         DEFAULT '[]',         -- array of Spot objects (see below)
  special_regs text,                              -- e.g. "No gas motors. Electric only."
  created_at  timestamptz   DEFAULT now()
);
```

### `spots` JSONB schema
Each element in the `spots` array:
```json
{
  "name": "North Dock",
  "detail": "Crappie stack here during spawn. Drop a jig straight down.",
  "shallow": true,
  "deep": false,
  "always": false
}
```
- `shallow: true` → this spot scores higher at dawn/dusk/evening/night
- `deep: true` → this spot scores higher at sunny midday
- `always: true` → this spot is always ranked first regardless of conditions

### Region keys
| Key | Display label |
|---|---|
| `fenton` | Fenton / South |
| `westcounty` | West County |
| `southcounty` | South County / Hwy 30 |
| `jeffco` | Jefferson Co. |
| `stcharles` | St. Charles Co. |
| `i70` | I-70 / Hwy 70 Belt |
| `rivers` | Rivers |
| `springfield` | Springfield / Joplin |
| `stockton` | Stockton / Neosho |

### RLS Policies
```
SELECT: any authenticated user (TO authenticated USING true)
INSERT: blocked (no policy)
UPDATE: blocked (no policy)
DELETE: blocked (no policy)
```

**Current problem:** The policy requires `authenticated`. If the Supabase client is used without a signed-in user (anonymous session), all reads fail silently and `waterBodies` remains `[]`.

### How it's queried
```typescript
// App.tsx — loadWaterBodies()
const { data } = await supabase
  .from('water_bodies')
  .select('*')
  .order('name');
```

---

## Table 2: `custom_lakes`

**Purpose:** User-created personal spots — places the app doesn't know about. Intended to be private to each user.

```sql
CREATE TABLE custom_lakes (
  id          uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text    NOT NULL,
  location    text    DEFAULT '',
  type        text    NOT NULL DEFAULT 'pond',  -- 'pond' | 'lake' | 'river' | 'reservoir'
  notes       text    DEFAULT '',
  created_at  timestamptz DEFAULT now()
);
```

### RLS Policies
```
SELECT: auth.uid() = user_id
INSERT: auth.uid() = user_id
UPDATE: auth.uid() = user_id
DELETE: auth.uid() = user_id
```

### Current problem: No auth = no custom lakes
The app never calls `supabase.auth.signIn()` or any auth method. Without an authenticated Supabase session, `auth.uid()` returns `null` and all RLS policies fail. Custom lakes **cannot be read or written** in the current state. The custom lake form in the admin panel will silently produce empty results.

### How it's queried
```typescript
// App.tsx — loadCustomLakes()
const { data } = await supabase
  .from('custom_lakes')
  .select('*')
  .order('created_at', { ascending: false });

// App.tsx — addCustomLake() (currently broken — no auth)
await supabase.from('custom_lakes').insert({ name, location, type, notes });
```

### How custom lake spots work
Custom lakes don't have a `spots` column. When a custom lake is selected in the wizard, the app calls `getCustomSpots(type, notes)` from `recommendations.ts` — a function that generates generic spot suggestions based on the water body type and any freeform notes the user entered.

---

## Table 3: `admin_lakes`

**Purpose:** Extra, hand-curated spots added by the app admin through the password-protected `#admin` panel. Similar to `water_bodies` but added at runtime rather than via migration.

```sql
CREATE TABLE admin_lakes (
  id          uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text    NOT NULL,
  location    text    NOT NULL,
  region      text    NOT NULL,
  type        text    NOT NULL DEFAULT 'lake',
  species     text[]  DEFAULT '{}',
  spots       jsonb   DEFAULT '[]',     -- same schema as water_bodies.spots
  special_regs text   DEFAULT '',
  notes       text    DEFAULT '',
  created_at  timestamptz DEFAULT now()
);
```

**Notable differences from `water_bodies`:**
- No `key` (short slug) — identified by `id` (uuid)
- No `latitude`/`longitude` columns — admin lakes have **no GPS coordinates**
- Has `notes` column for internal admin notes
- Managed through a password-gated UI in the app

### RLS Policies
```
SELECT: any authenticated user (TO authenticated USING true)
INSERT: service_role only
UPDATE: service_role only
DELETE: service_role only
```

**Current problem:** The admin panel inserts via the client SDK, which uses the anon key — not the service role key. The RLS policy says only `service_role` can insert/update/delete. This means the admin panel's add/delete operations also silently fail unless the Supabase project is configured to allow the anon key elevated access, or RLS is effectively disabled.

### How it's queried
```typescript
// App.tsx — loadAdminLakes()
const { data } = await supabase
  .from('admin_lakes')
  .select('*')
  .order('created_at', { ascending: false });

// App.tsx — deleteAdminLake(id)
await supabase.from('admin_lakes').delete().eq('id', id);

// App.tsx — admin form submit (addAdminLake)
await supabase.from('admin_lakes').insert({
  name, location, region, type,
  species: species.split(',').map(s => s.trim()),
  spots: [spot1, spot2, spot3].filter(Boolean).map(s => ({ name: s, detail: '', always: true })),
  special_regs: regs,
  notes,
});
```

---

## External Data Sources (Not Supabase)

| Source | Used for | Where |
|---|---|---|
| OpenStreetMap Overpass API | Finding any water body within 30 km of GPS position | `App.tsx` welcome screen "Find Near Me" |
| Nominatim | Zip code → lat/lon geocoding; City name → lat/lon | `App.tsx` zip search, `NovaCastWizard.jsx` city search |
| OpenWeatherMap | Current conditions auto-fill (sky, temp, wind, pressure) | `NovaCastWizard.jsx` (hardcoded API key) |
| Google Maps (links only) | Deep links for satellite view + turn-by-turn directions | `NovaCastWizard.jsx` WaterCard component |

---

## localStorage Schema

These are not database tables but are the only working persistence layer for user data.

### Key: `novacast_tacklebox` (legacy, written by App.tsx)
```json
{
  "lures": ["Chatterbait", "Ned Rig"],
  "colors": ["Green Pumpkin"],
  "walmart": ["Z-Man TRD pack"]
}
```

### Key: `novacast_tacklebox_v2` (current, written by NovaCastTacklebox.tsx)
```json
{
  "lures": ["Chatterbait"],
  "colors": [],
  "walmart": [],
  "memories": [
    {
      "id": 1717000000000,
      "lake": "Preslar Lake",
      "lure": "Chatterbait",
      "month": "June",
      "species": "Bass",
      "note": "Caught 3 near the north dock"
    }
  ],
  "wishlist": [
    {
      "id": 1717000001000,
      "item": "Z-Man TRD pack",
      "note": "Try in green pumpkin",
      "done": false
    }
  ]
}
```

**The two keys are out of sync.** The lures/colors/walmart arrays exist in both keys independently and can diverge.

---

## Data Flow Diagram

```
User opens app
     │
     ├── supabase.from('water_bodies').select('*')  ──► [WaterBodyRow[]]
     ├── supabase.from('custom_lakes').select('*')   ──► [CustomLakeRow[]] (empty if no auth)
     └── supabase.from('admin_lakes').select('*')    ──► [AdminLakeRow[]] (empty if no auth)

User completes wizard
     │
     └── recommendations.ts pure functions (no DB queries)
           ├── getLures(sky, water, temp, fish, time, pressure)
           ├── getColors(sky, water, time)
           ├── getWalmart(fish, water, time)
           ├── getProTip(...)
           └── getFishMovement(time, sky)

User hearts a lure
     │
     └── localStorage.setItem('novacast_tacklebox', ...)  ← App.tsx writes old key
         NovaCastTacklebox writes 'novacast_tacklebox_v2' when opened

User adds a custom lake (currently broken)
     │
     └── supabase.from('custom_lakes').insert(...)  ← fails: no auth.uid()
```
