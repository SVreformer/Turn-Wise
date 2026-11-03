# IMPLEMENTATION_PLAN.md: RailMarga Phased Implementation Plan
**Project:** RAILMARGA — Smart & Accessible Indoor Navigation for KSR Bengaluru

---

## 1. Phased Execution Roadmap

### Phase 1: Data Ingestion, Extraction & Normalization
- **Objective:** Convert CAD/SVG layers into the canonical station data model.
- **Artifacts:**
  - `scripts/process_station_data.py`: Automated extractor reading `ksrsvg.svg`, `ksr_map_data (1).json`, `layers.csv`.
  - `data/station/platforms.json`: Exact geometries, centers, nearby lifts/stairs/ramps for Platforms 1–10.
  - `data/station/facilities.json`: Toilets, accessible toilets, ticket counters, waiting halls, water vending machines.
  - `data/station/verticalConnections.json`: Lifts (1, 2, 3), Ramps (1–7), Stairs, Escalators, FOBs (Metro FOB, FOB 1, FOB 2), Subway.
  - `data/station/nodes.json` & `edges.json`: Topological routing graph.
  - `data/accessibility/routingConfig.json`: Cost weights and profile penalty tables.
  - `data/simulation/checkpoints.json`: QR checkpoints with coordinates and descriptions.

### Phase 2: Graph Validation & Topological Verification
- **Objective:** Ensure 100% graph connectivity, zero orphan nodes, valid physical corridors.
- **Artifacts:**
  - `scripts/validate_graph.py` (`npm run validate-data`): Validates graph connectivity, runs BFS all-pairs reachability check, flags disconnected nodes.
  - `GRAPH_VALIDATION.md`: Report detailing generated nodes, edges, validated pathways, and verified connections.

### Phase 3: Offline-First Deterministic Routing Engine
- **Objective:** Implement high-performance $A^*$ with Euclidean heuristic, Dijkstra fallback, and 5 profile penalties.
- **Artifacts:**
  - Shared TypeScript / Python routing algorithm (`server/src/algorithms/router.ts` & `mobile/src/services/localRouter.ts`).
  - Five accessibility profiles: First-Time Traveller, Elderly, Child, Visually Impaired, Mobility Disability (Wheelchair).
  - Dynamic blockage avoidance engine: Instant pruning of blocked edges with automated rerouting.
  - Natural turn-by-turn guidance generator: Landmark-aware directions (e.g. *"Turn right past Ticket Counter towards Lift 2"*).

### Phase 4: Express Backend API & Gemini AI Tool-Calling Engine
- **Objective:** Production-grade Node.js/Express server providing REST APIs and Gemini function-calling assistant.
- **Artifacts:**
  - Endpoints: `GET /api/station`, `GET /api/platforms`, `GET /api/facilities`, `GET /api/nodes`, `GET /api/status`, `POST /api/route`, `POST /api/reroute`, `POST /api/assistant`, `POST /api/checkpoint`, `GET /api/location/:id`.
  - Server-side Gemini 1.5/2.0 integration with tool calling: `find_route`, `find_facility`, `get_location`, `get_location_status`, `get_station_info`, `reroute`, `search_station_locations`.
  - Security: `server/.env` isolating API keys from client bundle.

### Phase 5: React Native Expo Mobile Application (`mobile/`)
- **Objective:** Premium, accessible, high-contrast, 60 FPS mobile navigation app for Android.
- **Core Screens:**
  1. **Home Screen (`app/(tabs)/index.tsx`):** Destination search, Quick facility badges, Profile selector, Online/Offline indicator.
  2. **Station Map Screen (`app/(tabs)/map.tsx`):** Real KSR Bengaluru SVG basemap, Pan & Pinch-Zoom, Fit-to-Route, Live route polyline with neon cyan glow, POI markers with zoom LOD, Blockage overlays (🔴 Red / 🟠 Orange / 🟢 Green).
  3. **Turn-by-Turn Navigation Screen (`app/navigate.tsx`):** Active step cards, Remaining distance & ETA, Next turn preview, Voice navigation button, Dynamic reroute banner.
  4. **AI Assistant Screen (`app/(tabs)/assistant.tsx`):** Modern chat interface with grounded tool-calling cards, Quick action pills (*"Platform 8 Accessible Route"*, *"Nearest Accessible Toilet"*).
  5. **Platform Details Screen (`app/platform/[id].tsx`):** Platform number, Nearby lifts, ramps, stairs, FOBs, toilets, One-tap navigate button.
  6. **Facility Finder Screen (`app/(tabs)/facilities.tsx`):** Categorized directory, Graph-calculated walking distances, Wheelchair accessibility indicators.
  7. **QR Checkpoint Scanner Screen (`app/qr-scan.tsx`):** Instant indoor localization via simulated or camera QR scan, Automatic route recalculation.
  8. **Demo Mode Modal / Screen (`app/demo.tsx`):** Interactive judge sandbox to simulate Lift 1 / Lift 2 / Ramp blockages and trigger instant dynamic reroute.

### Phase 6: Automated Testing & Verification
- **Objective:** Continuous quality assurance across routing, accessibility, and UI components.
- **Artifacts:**
  - Unit tests for $A^*$ and Dijkstra on all 5 profiles.
  - Tests for dynamic rerouting upon blockage injection.
  - Offline fallback tests simulating network disconnection.
  - Gemini tool validation tests ensuring deterministic responses.

### Phase 7: Android APK Build & Developer Documentation
- **Objective:** Ensure seamless APK generation and execution on Android devices.
- **Artifacts:**
  - Expo / EAS configuration (`app.json`, `eas.json`).
  - Comprehensive `README.md` with installation, startup, offline testing, and APK build commands.
