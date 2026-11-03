# GRAPH_DESIGN.md: Navigation Topology & Graph Design
**Project:** RAILMARGA — Smart & Accessible Indoor Navigation for KSR Bengaluru

---

## 1. Topological Structure & Multilevel Modeling

KSR Bengaluru is a multi-level transit facility with 3 distinct elevation levels:
1. **Level -1 (Subway Tunnel):** The Majestic Passenger Subway (`Floor_n_subwy`), connecting Terminal 1 to platform subway stairs/ramps.
2. **Level 0 (Platform & Concourse Level):** Platforms 1 through 10, Terminal 1 main hall, Terminal 2, Terminal 3, parking, and street entrances.
3. **Level +1 (Footover Bridges - FOB):**
   - **Metro FOB (West):** Connects Namma Metro KSR Station and Terminal 3 to all platforms.
   - **FOB 1 (Mysuru End FOB):** Central passenger footbridge spanning Platforms 1 to 10.
   - **FOB 2 (Okkalpuram / Dharmavaram FOB):** Eastern footbridge equipped with Lift 1 (PF 7/8), Lift 3 (PF 1), and Ramps.

---

## 2. Graph Schema Specifications

### Node Schema (`nodes.json`)
```json
{
  "id": "node_pf8_fob2_lift",
  "name": "Platform 8 FOB 2 Lift (Lift 1)",
  "type": "LIFT",
  "coordinates": { "x": 2586.7, "y": 376.1 },
  "level": 0,
  "layer": "LIFT",
  "accessible": true,
  "wheelchairAccessible": true,
  "elderlyFriendly": true,
  "visualLandmark": "Lift 1 Tower beside Platform 8 eastern staircase",
  "qrCheckpointId": "QR-KSR-LIFT-1",
  "status": "OPEN"
}
```

### Edge Schema (`edges.json`)
```json
{
  "id": "edge_pf8_to_lift1",
  "from": "node_pf8_center",
  "to": "node_pf8_fob2_lift",
  "distance": 85.4,
  "estimatedTimeSeconds": 68,
  "pathType": "WALKWAY",
  "accessible": true,
  "wheelchairAccessible": true,
  "elderlyFriendly": true,
  "visualGuidanceAvailable": true,
  "level": 0,
  "status": "OPEN",
  "geometry": [
    { "x": 2295.5, "y": 376.1 },
    { "x": 2586.7, "y": 376.1 }
  ]
}
```

---

## 3. Cost Function & Profile Weight Matrix

Edge traversal cost is computed dynamically:
$$\text{Cost}(e, P) = \text{Distance}(e) \times W_{\text{type}}(P, e.\text{pathType}) + \text{Penalty}_{\text{turn}} + \text{Penalty}_{\text{level\_change}}$$

If an edge is marked `BLOCKED`, $\text{Cost}(e) = \infty$ (edge is removed from graph exploration).

### Profile Weight Table (`routingConfig.json`)

| Path Type | Default | First-Time (P1) | Elderly (P2) | Child (P3) | Visually Impaired (P4) | Mobility Disability (P5) |
|---|---|---|---|---|---|---|
| **WALKWAY / CORRIDOR** | 1.0 | 1.0 (Simple) | 1.2 | 1.0 | 1.1 | 1.0 |
| **RAMP** | 1.1 | 1.1 | 1.0 (Preferred) | 1.1 | 1.2 | **0.8 (Highly Preferred)** |
| **LIFT** | 1.2 | 1.2 | **0.8 (Highly Preferred)** | 1.2 | 1.3 | **0.7 (Highly Preferred)** |
| **STAIRS** | 1.5 | 1.8 | **5.0 (High Penalty)** | 2.0 | 2.5 | **PROHIBITED ($\infty$)** |
| **ESCALATOR** | 1.2 | 1.2 | 2.0 | 2.5 | 3.0 | **PROHIBITED ($\infty$)** |
| **FOB FOOTBRIDGE** | 1.1 | 1.1 | 1.3 | 1.1 | 1.2 | 1.1 |
| **SUBWAY TUNNEL** | 1.1 | 1.3 | 1.3 | 1.4 | 1.3 | 1.1 |
| **Turn Penalty (per turn)** | +5m | **+15m (Fewer turns)** | +10m | +15m | **+20m (Fewer turns)** | +8m |

---

## 4. Key Physical Route Topologies

### Scenario A: Terminal 1 Main Entrance → Platform 8
- **Profile 1 (First-Time):** Terminal 1 Entrance → Concourse Central Hall (Landmark: Ticket Counter) → Main Corridors → FOB 2 Stairs/Ramp → Platform 8 (Clear landmarks, 3 turns).
- **Profile 5 (Mobility Disability / Wheelchair):**
  1. Terminal 1 Entrance `(1811.0, 1163.0)`
  2. Main Concourse Smooth Corridor → Lift 2 `(1661.7, 1110.6)` or Ground Ramp `(1547.2, 1175.7)`
  3. East Concourse Accessible Pathway to FOB 2
  4. Platform 7/8 Accessible Lift 1 `(2586.7, 434.2)` or Ramp 1 `(2702.1, 465.4)`
  5. Smooth descent to Platform 8 `(2295.5, 376.1)`
  - **Zero stairs, fully validated accessible path.**
- **Blockage Reroute Event:** If Lift 1 or Lift 2 is toggled to `BLOCKED`:
  - System immediately eliminates Lift edge.
  - Recalculates via Ramp 1 (`Ramp_7_` at `(2702.1, 465.4)`) or Ramp 3.
  - Emits voice warning: *"Lift 1 is currently unavailable. Rerouting via Platform 8 Accessible Ramp."*

---

## 5. Disconnected Region Prevention & Graph Validation

To ensure no orphaned nodes or impassable islands:
1. Every platform (1 to 10) has a minimum of:
   - 1 FOB 1 (Mysuru End) connection.
   - 1 FOB 2 (Okkalpuram End) connection.
   - 1 Subway tunnel connection.
2. Every Lift and Ramp connects bi-directionally between Level 0 and Level +1 / -1.
3. Automated graph validation check (`npm run validate-data`) performs all-pairs BFS connectivity verification before build completion.
