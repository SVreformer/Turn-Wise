# DATA_ANALYSIS.md: KSR Bengaluru Spatial & Source Data Analysis
**Project:** RAILMARGA — Smart & Accessible Indoor Navigation for KSR Bengaluru  
**Source Files Analyzed:**
- `ksrsvg.svg` (3,530,370 bytes, SVG vector map)
- `ksr_map_data (1).json` (2,910,084 bytes, 53 layers, 9,219 features)
- `ksr_map_features.csv` (2,502,049 bytes, 26 columns, 9,219 geometry rows)
- `layers.csv` (2,221 bytes, 53 layers with element & geometry type counts)
- `KSR_Bengaluru_Navigation_Project.pdf` (16.4 MB official high-resolution reference schematic)

---

## 1. Executive Summary & Coordinate System

### Canonical Coordinate Space
- **Coordinate Space:** SVG ViewBox `0 0 3456 1728` (Width = 3456 units, Height = 1728 units, Aspect Ratio = 2:1).
- **Origin (0,0):** Top-left corner of the station boundary.
- **Orientation:**
  - **Horizontal Axis (X: 0 → 3456):** West (Mysuru End, Metro Station, Terminal 3) to East (Okkalpuram / Dharmavaram End, Terminal 2).
  - **Vertical Axis (Y: 0 → 1728):** North (Platform 10, Platform 9 tracks) to South (Terminal 1 Main Concourse, Gubbi Thotadappa Road).
- **Geographic Projection:** The source data is an architectural CAD/GIS floor plan. There are no raw WGS84 GPS coordinates inside the SVG. The canonical coordinate system for all indoor navigation nodes, edges, and rendering is the SVG ViewBox coordinate space `(x, y) ∈ [0, 3456] × [0, 1728]`.
- Outdoor entrance reference GPS coordinates for KSR Bengaluru Station are anchored at `12.9784° N, 77.5695° E` for outer gate geo-fencing when online.

---

## 2. Complete Layer Inventory & Categorization

The 53 source layers are grouped into four operational categories:

| Category | Layer Names | Count | Role in RailMarga |
|---|---|---|---|
| **NAVIGATION PATHS** | `PATHWAY`, `Floor_n_subwy`, `Floor_Div`, `TRLY_PATH` | 1,142 | Walkways, subway corridors, concourse circulation, ramps |
| **VERTICAL CONNECTIONS** | `LIFT`, `_x31__lift_1_`, `_x31__lift_2_`, `_x31__lift_3_`, `Lift_sign`, `Stair`, `_x31__Stair_1_`, `ESCALTR_2_`, `Ramp`, `Ramp_1_` to `Ramp_7_`, `RAMP`, `_x31__RAMP_2_`, `FOB`, `FOB_1`, `FOB_2`, `Fob1`, `Metro_FOB` | 1,180 | Inter-level transitions between Platform Level (Level 0), Subway (Level -1), and Footover Bridges (Level +1) |
| **DESTINATIONS & FACILITIES** | `Platform`, `Terminals`, `T2_Booking`, `Entry`, `Entry_1_` to `Entry_5_`, `Entry_Ext`, `TOILET`, `_x39__TOILET_1_` to `_x39__TOILET_5_`, `_x38__TOILET_1_`, `_x38__TOILET_2_`, `Toilet_2_`, `Water_VM` | 913 | Searchable targets, passenger points of interest, boarding gates |
| **VISUAL-ONLY BASEMAP** | `Tracks`, `ROAD`, `ROADS`, `ROAD_1_`, `Parking`, `Floor`, `FLOOR_1_` | 5,984 | Background visual context; **NOT** converted into navigation graph nodes to preserve 60 FPS performance |

---

## 3. Platform Geometry & Spatial Coordinates

Every platform from 1 to 10 has exact geometric markers and badges verified from the source data:

| Platform | Left Badge (X, Y) | Right Badge (X, Y) | Track / Platform Y-Band | Physical Scope & Access |
|---|---|---|---|---|
| **Platform 1** | (862.3, 980.9) | (2172.6, 971.2) | Y ≈ 950 – 1010 | Direct ground access to Terminal 1, Ramps, Lifts, Subway |
| **Platform 2** | (862.3, 889.8) | (2444.7, 889.3) | Y ≈ 870 – 915 | Island platform with PF 3; Connected to FOB 1, FOB 2, Subway |
| **Platform 3** | (862.3, 832.7) | (2440.1, 830.4) | Y ≈ 815 – 860 | Island platform with PF 2; Connected to FOB 1, FOB 2, Subway |
| **Platform 4** | (862.3, 725.7) | (1961.9, 725.1) | Y ≈ 705 – 755 | Central platform; Connected to FOB 1, FOB 2, Subway, Water VM |
| **Platform 5** | (862.3, 600.7) | (2438.5, 715.0) | Y ≈ 580 – 635 | Island platform with PF 6; Connected to FOB 1, FOB 2, Subway |
| **Platform 6** | (862.3, 548.5) | (2437.4, 660.8) | Y ≈ 530 – 575 | Island platform with PF 5; Connected to FOB 1, FOB 2, Subway |
| **Platform 7** | (862.3, 450.6) | (2295.5, 464.6) | Y ≈ 430 – 480 | Island platform with PF 8; Connected to FOB 1, FOB 2 (Lift 1), Ramp 1 |
| **Platform 8** | (862.3, 375.9) | (2295.5, 376.1) | Y ≈ 355 – 405 | Island platform with PF 7; Connected to FOB 1, FOB 2 (Lift 1), Ramp 1 |
| **Platform 9** | (862.3, 278.9) | (2294.4, 278.9) | Y ≈ 255 – 305 | Island platform with PF 10; North boundary, Connected to FOB 1 & FOB 2 |
| **Platform 10** | (862.3, 214.6) | (2294.4, 214.7) | Y ≈ 190 – 245 | Outermost northern platform; Direct access to Mysuru End FOB |

---

## 4. Vertical Connections & Accessibility Facilities

### Lifts (Accessible Level Transitions)
1. **Lift 1 (Platform 7/8 & FOB 2 Okkalpuram End):**
   - Coordinates: `(2586.7, 434.2)`
   - Serves: Platform 7/8 ↔ Okkalpuram Footover Bridge (FOB 2)
   - Accessibility: Wheelchair accessible, Elderly friendly
2. **Lift 2 (Terminal 1 Main Concourse):**
   - Coordinates: `(1661.7, 1110.6)`
   - Serves: Terminal 1 Ground Floor ↔ Majestic Subway / Concourse Upper Level
   - Accessibility: Wheelchair accessible, Elderly friendly
3. **Lift 3 (Platform 1 East & Terminal 2 Connection):**
   - Coordinates: `(2659.2, 973.8)`
   - Serves: Platform 1 East ↔ FOB 2 / Terminal 2 Walkway
   - Accessibility: Wheelchair accessible, Elderly friendly

### Ramps (Accessible Level Transitions)
1. **Ramp 1 / Ramp 7 (Platform 7/8 North Ramp):** `(2702.1, 465.4)`
2. **Ramp 2 / Ramp 6 (Platform 4/5 Central Ramp):** `(2550.0, 725.0)`
3. **Ramp 3 / Ramp 5 (Platform 1/2 South Ramp):** `(2586.0, 1000.0)`
4. **RAMP Terminal 1 Main Entrance Subway Ramp:** `(1492.6, 1245.6)`
5. **_x31__RAMP_2_ Terminal 1 West Concourse Ramp:** `(1547.2, 1175.7)`

### Stairs (Non-Accessible Level Transitions)
- Primary clusters at FOB staircases across platforms:
  - Cluster PF 1/2 FOB Stairs: `(1409.2, 1146.4)`
  - Cluster PF 5/6 FOB Stairs: `(1364.5, 263.0)`
  - Cluster Terminal 1 Subway Stairs: `(1354.5, 1144.1)`
- Prohibited for `mobilityDisabled` profile; penalized for `elderly` profile.

### Footover Bridges (FOBs)
1. **Metro FOB (West / Terminal 3 End):**
   - X: `324.4 – 888.2`, Y: `25.9 – 1698.0`
   - Direct connection between KSR Metro Station, Terminal 3, and all Platforms.
2. **FOB 1 (Mysuru End FOB):**
   - X: `589.6 – 1426.8`, Y: `74.8 – 941.9`
   - Spans Platform 1 through Platform 10.
3. **FOB 2 (Okkalpuram / Dharmavaram End FOB):**
   - X: `2610.2 – 2626.3`, Y: `462.9 – 884.9`
   - Equipped with Lift 1, Lift 3, and Ramps 1, 2, 3.

---

## 5. Passenger Facilities & Terminals

### Entrances & Exits
- **Terminal 1 Main Entrance (East):** `(1811.0, 1163.0)`
- **Terminal 1 Main Entrance (West):** `(1573.2, 1138.3)`
- **Terminal 1 Concourse Center:** `(1710.5, 1080.9)`
- **Terminal 2 East Entrance:** `(2973.4, 554.7)`
- **Terminal 2 Okkalpuram Gate:** `(3163.6, 719.4)`
- **Terminal 2 Booking Office (`T2_Booking`):** `(2862.8, 552.9)`
- **Terminal 3 Metro Entrance:** `(745.0, 1280.0)`

### Toilets
- `_x39__TOILET_1_`: Platform 5/6 Toilet `(1368.2, 582.2)`
- `_x39__TOILET_2_`: Platform 9/10 East Toilet `(2630.0, 262.4)`
- `_x39__TOILET_3_`: Platform 4 Central Toilet `(1271.1, 735.7)`
- `_x39__TOILET_4_`: Platform 1 West Toilet `(1372.5, 1053.2)`
- `_x39__TOILET_5_`: Terminal 1 South Parking Toilet `(1249.7, 1434.4)`
- `_x38__TOILET_1_`: Platform 2/3 Toilet `(1575.0, 865.3)`
- `_x38__TOILET_2_`: Platform 7/8 Toilet `(1480.0, 378.6)`
- `Toilet_2_`: Terminal 2 Public Toilet `(2957.8, 611.2)`
- `TOILET` Concourse: Terminal 1 Waiting Hall Restroom `(1762.4, 639.9)`

---

## 6. Graph Generation & Mobile Performance Strategy

1. **Separation of Concerns:**
   - Visual layers (`Tracks`, `ROAD`, `Parking`, background floor polygons) are bundled into an optimized SVG layer or high-res vector path rendering that is statically cached.
   - The navigation graph is compiled into a lightweight `nodes.json` and `edges.json` structure containing **only topological decision points** (junctions, platform boarding points, vertical transition nodes, facility entrances).
2. **Coordinate Transformation:**
   - Scale factor: $S_x = \text{ScreenWidth} / 3456$, $S_y = \text{ScreenHeight} / 1728$.
   - Transform Matrix: $P_{\text{screen}} = (P_x \cdot s + t_x, P_y \cdot s + t_y)$ with smooth pinch-zoom and pan via React Native Gesture Handler & Reanimated.
