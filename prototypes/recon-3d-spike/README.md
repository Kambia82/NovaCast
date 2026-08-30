# Recon 3D Spike — isolated prototype

**What this is:** a single standalone `index.html`, not part of the NovaCast Vite app, not
referenced by any build config, not deployed by the Firebase Hosting workflow. It exists only
to test whether Google's Photorealistic 3D Maps (`Map3DElement` / `<gmp-map-3d>`, the `maps3d`
library) can produce the tilted aerial reconnaissance look NovaCast wants for Recon, on a real
Android Chrome device, before touching any production code.

**What it deliberately does NOT do:**
- Does not call `discoverNearbyWater()`, `fetch3DHPWater()`, or the Overpass fallback.
- Does not touch Firestore, `App.tsx` routing, or the existing Leaflet-based `NovaCastRecon.tsx`.
- Does not use Google Places or any Google water-data source — the one test marker and one
  test polygon are hardcoded fake coordinates near a known lake, not real discovery results.
- Contains no API key. You supply your own at runtime; it's kept only in your browser's
  `localStorage`, never committed, never sent anywhere but directly to Google.

**Test location:** Horseshoe Lake, Madison County IL (38.6900, -90.0870) — ~10 miles NE of
downtown St. Louis, the same lake verified live against USGS 3DHP in commit `a84228f`.

## Running it

1. In Google Cloud Console (a project with billing enabled):
   - Enable the **Maps JavaScript API**.
   - Create an API key. For a quick phone test you can leave it unrestricted temporarily —
     restrict it (HTTP referrers) before using it anywhere longer-lived.
   - Create a **Map ID** (Map Management) and explicitly configure it for **3D**.
2. Serve this folder over HTTP(S) and open it on the phone — e.g. from `prototypes/recon-3d-spike`:
   ```
   python3 -m http.server 8090
   ```
   then reach it via a tunnel (this repo already depends on `localtunnel`) or any other means
   of getting a phone onto that local server.
3. Paste the API key and Map ID into the page's two fields and tap **Load 3D Map**.
4. Use the **Satellite / Hybrid** buttons to compare imagery modes, **Select Marker** to see the
   test marker/polygon change style (this mirrors the highlight logic from `aff314d`), and touch
   gestures (drag/pinch/two-finger tilt) to explore the terrain.

If it fails to load, the on-page error panel will show the thrown error — the most common causes
are: API key missing the Maps JavaScript API, billing not enabled, or a Map ID that exists but
isn't configured for 3D.

## Disposal

This is throwaway spike code for a go/no-go decision. Delete the `prototypes/` directory once
the decision is made, whichever way it goes.
