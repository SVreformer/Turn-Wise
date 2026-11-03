# ARCHITECTURE.md: RailMarga System Architecture
**Project:** RAILMARGA — Smart & Accessible Indoor Navigation for KSR Bengaluru

---

## 1. High-Level Architecture Overview

RailMarga is engineered with a **True Offline-First Architecture** combined with an **Intelligent Cloud-Enhanced Online Mode**. Passengers inside deep underground subways, FOB concourses, or dense railway platforms can lose internet connectivity at any moment. RailMarga guarantees 100% deterministic navigation, spatial queries, and voice guidance completely offline.

```
+-----------------------------------------------------------------------------------+
|                            RAILMARGA MOBILE (React Native / Expo)                 |
|                                                                                   |
|  +------------------------+  +--------------------------+  +-------------------+  |
|  |    Interactive Map     |  |   Navigation Controller  |  | Voice Synthesis   |  |
|  |  - Pan / Zoom / Reset  |  |  - Profile State Manager |  | (Native TTS -     |  |
|  |  - 60 FPS SVG Engine   |  |  - Turn-by-Turn Engine   |  |  Offline First)   |  |
|  |  - Route Overlay       |  |  - Live Reroute Trigger  |  +-------------------+  |
|  +------------------------+  +--------------------------+                         |
|               ^                            ^                                      |
|               |                            |                                      |
|  +-----------------------------------------------------------------------------+  |
|  |                        UNIFIED API SERVICE LAYER                            |  |
|  |    Checks Network Status: [ ONLINE ] ⇄ [ OFFLINE MODE ]                     |  |
|  +-----------------------------------------------------------------------------+  |
|               |                                            |                      |
|       (If Offline / Fallback)                       (If Online Available)         |
|               v                                            v                      |
|  +-------------------------+                 +---------------------------------+  |
|  | LOCAL EMBEDDED ENGINE   |                 | EXPRESS BACKEND REST API        |  |
|  | - Bundled nodes.json    |                 | (Node.js / Express / TypeScript)|  |
|  | - Bundled edges.json    |                 | - /api/station                  |  |
|  | - Bundled platforms    |                 | - /api/route & /api/reroute     |  |
|  | - Bundled facilities   |                 | - /api/assistant (Gemini Tools) |  |
|  | - TypeScript A* Router  |                 | - /api/status (Blockages)       |  |
|  +-------------------------+                 +---------------------------------+  |
+----------------------------------------------------------------|------------------+
                                                                 |
                                                                 v
                                               +------------------------------------+
                                               |         GOOGLE GEMINI API          |
                                               | - Grounded Tool Calling Only       |
                                               | - API Key Protected on Server      |
                                               +------------------------------------+
```

---

## 2. Directory Structure & Monorepo Layout

```text
METEOR/
├── data/
│   ├── source/               # Original CSVs, JSON, SVG (untouched)
│   ├── processed/            # Intermediate geometry extractions
│   ├── station/              # Normalized station models (nodes.json, edges.json, platforms.json, facilities.json)
│   ├── accessibility/        # routingConfig.json, profile weights
│   └── simulation/           # checkpoints.json, demoBlockages.json
├── docs/                     # DATA_ANALYSIS.md, ARCHITECTURE.md, GRAPH_DESIGN.md, IMPLEMENTATION_PLAN.md
├── scripts/                  # Preprocessing pipelines (SVG parser, graph builder, data validator)
├── server/                   # Node.js Express Backend
│   ├── src/
│   │   ├── routes/           # REST endpoints
│   │   ├── services/         # Routing service, Station service, Status service
│   │   ├── algorithms/       # A* & Dijkstra routing engines
│   │   ├── tools/            # Gemini AI Grounded Tools
│   │   └── index.ts          # Server entrypoint
│   └── .env                  # GEMINI_API_KEY, PORT
├── mobile/                   # React Native Expo Mobile Application
│   ├── app/                  # Screens & App Navigation
│   ├── components/           # KsrMap, RouteBanner, VoiceBar, FacilityList, BlockageModal
│   ├── services/             # Unified apiService, localRouter, voiceService, qrService
│   ├── store/                # Zustand navigationStore, profileStore, blockageStore
│   ├── utils/                # Coordinate transforms, SVG renderers, localization
│   └── assets/               # Preprocessed vector map assets, icons, fonts
└── tests/                    # Automated unit, integration, and routing tests
```

---

## 3. Offline vs. Online Architecture

### Offline Mode (Mandatory Zero-Latency Guarantee)
1. **Station Data:** Bundled directly in the mobile client (`mobile/src/data/station/`).
2. **Routing:** Pure TypeScript implementation of $A^*$ with Euclidean heuristic and profile penalties runs on-device in `< 5ms`.
3. **Voice Navigation:** Native `expo-speech` synthesizes turn instructions locally without needing internet or Gemini.
4. **QR Checkpoints:** Local dictionary lookup matching QR UUIDs (e.g. `QR-KSR-T1-MAIN`) to station node IDs.
5. **Blockage Simulation (Demo Mode):** Judge-controlled blockage toggles stored in local reactive state.

### Online Mode (Real-Time Cloud Enhancement)
1. **Dynamic Facility Status:** Fetches live maintenance status from `GET /api/status`.
2. **Gemini AI Assistant:** Natural language voice/text query processed by Express backend using Gemini 1.5/2.0 with function calling.
3. **Zero Security Leakage:** The mobile application contains **NO Gemini API keys**. All AI requests pass through `POST /api/assistant` where keys reside securely in `server/.env`.
4. **Tool Grounding:** Gemini is strictly prevented from fabricating routes or locations. Gemini calls `find_route` or `find_facility`, and Express executes the deterministic graph engine before returning the answer.

---

## 4. Map Performance & Rendering Strategy

The source SVG has 9,219 features and 8,751 track lines. Direct unoptimized rendering causes severe frame drops on mobile devices. RailMarga solves this with a **Multi-Tier Rendering Architecture**:

1. **Preprocessed Base Layer:** Tracks, parking lots, and outer road geometries are simplified and pre-grouped into a lightweight static vector layer.
2. **Dynamic Interactive Vector Layer:** Platforms, Footover Bridges, Subway corridors, Lifts, Ramps, and Stairs are rendered with reactive color fills (Open = Green, Caution = Orange, Blocked = Red).
3. **Route & Location Overlay:**
   - Active route polyline rendered on top using high-contrast glowing neon cyan (`#00E5FF`) with directional chevron pulses.
   - User marker pulsing blue dot (`#2979FF`).
   - Facility POI icons rendered with zoom-dependent level of detail (LOD).
4. **Smooth 60 FPS Pan/Zoom:** Powered by `react-native-gesture-handler` and `react-native-reanimated` with hardware-accelerated transforms.

---

## 5. Security & Reliability
- **Environment Isolation:** All sensitive credentials (`GEMINI_API_KEY`) reside exclusively in backend `.env`.
- **Fail-Safe Fallback:** If the backend API fails or times out (500ms), the mobile app instantly and silently falls back to local data and local routing without alerting the user with errors.
- **Data Integrity:** Validated via automated CI data validator (`npm run validate-data`).
