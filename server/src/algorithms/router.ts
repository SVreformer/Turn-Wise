import fs from 'fs';
import path from 'path';

export interface Coordinates {
  x: number;
  y: number;
}

export interface StationNode {
  id: string;
  name: string;
  type: string;
  coordinates: Coordinates;
  level: number;
  layer?: string;
  accessible: boolean;
  wheelchairAccessible: boolean;
  elderlyFriendly: boolean;
  visualLandmark?: string;
  qrCheckpointId?: string;
  status: string;
}

export interface StationEdge {
  id: string;
  from: string;
  to: string;
  distance: number;
  estimatedTimeSeconds: number;
  pathType: 'WALKWAY' | 'LIFT' | 'RAMP' | 'STAIRS' | 'ESCALATOR' | 'FOB' | 'SUBWAY';
  level: number;
  accessible: boolean;
  wheelchairAccessible: boolean;
  elderlyFriendly: boolean;
  visualGuidanceAvailable: boolean;
  status: string;
  geometry?: Coordinates[];
}

export interface EdgeCostBreakdown {
  distance: number;
  accessibilityPenalty: number;
  safetyPenalty: number;
  uncertaintyPenalty: number;
  totalCost: number;
}

export interface RouteStep {
  stepNumber: number;
  fromNode: string;
  toNode: string;
  fromNodeId?: string;
  toNodeId?: string;
  fromCoords?: Coordinates;
  toCoords?: Coordinates;
  geometry?: Coordinates[];
  instruction: string;
  instructionKn: string;
  instructionHi: string;
  voiceText: string;
  voiceTextKn: string;
  voiceTextHi: string;
  distance: number;
  pathType: string;
  landmark: string;
  costDetails?: EdgeCostBreakdown;
}

export interface RouteResult {
  start: StationNode;
  destination: StationNode;
  profile: string;
  totalDistanceMeters: number;
  estimatedTimeMinutes: number;
  nodeSequence: string[];
  steps: RouteStep[];
  pathGeometry: Coordinates[];
  accessibility: {
    wheelchairAccessible: boolean;
    stepFree: boolean;
    liftsUsed: string[];
    rampsUsed: string[];
    stairsUsed: string[];
  };
  warnings: string[];
  blockedSegments: string[];
  costBreakdown: {
    totalDistance: number;
    totalAccessibilityPenalty: number;
    totalSafetyPenalty: number;
    totalUncertaintyPenalty: number;
    totalCost: number;
    formula: string;
  };
  coachInfo?: {
    trainNumber: string;
    trainName: string;
    coachNumber: string;
    platformNumber: number;
    coordinates: Coordinates;
  };
}

export interface ProfileWeights {
  walkway: number;
  ramp: number;
  lift: number;
  stairs: number;
  escalator: number;
  turnPenalty: number;
  stairAvoidance: boolean;
  accessibilityPenaltyFactor?: number;
  safetyPenaltyFactor?: number;
  uncertaintyPenaltyFactor?: number;
}

export interface IncidentReport {
  id: string;
  facilityOrLocationId: string;
  type: 'OUT_OF_SERVICE' | 'OVERCROWDED' | 'MAINTENANCE' | 'SLIPPERY';
  reporterRole: 'STAFF' | 'PASSENGER';
  verified: boolean;
  timestamp: string;
  description?: string;
}

export interface TrainCoachInfo {
  trainNumber: string;
  trainName: string;
  platformNumber: number;
  rakeDirection: 'ENGINE_EAST' | 'ENGINE_WEST';
  totalCoaches: number;
  coaches: string[];
}

export const KSR_TRAIN_DATABASE: Record<string, TrainCoachInfo> = {
  '12658': {
    trainNumber: '12658',
    trainName: 'Bengaluru - Chennai Central Mail',
    platformNumber: 1,
    rakeDirection: 'ENGINE_EAST',
    totalCoaches: 24,
    coaches: ['ENG', 'SLR', 'GS', 'GS', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'A1', 'A2', 'H1', 'GS', 'GS', 'SLR']
  },
  '12628': {
    trainNumber: '12628',
    trainName: 'Karnataka Express (New Delhi - SBC)',
    platformNumber: 4,
    rakeDirection: 'ENGINE_WEST',
    totalCoaches: 24,
    coaches: ['ENG', 'SLR', 'GS', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'B1', 'B2', 'B3', 'B4', 'B5', 'A1', 'A2', 'A3', 'H1', 'PC', 'GS', 'GS', 'SLR']
  },
  '20608': {
    trainNumber: '20608',
    trainName: 'Vande Bharat Express (MGR Chennai)',
    platformNumber: 1,
    rakeDirection: 'ENGINE_EAST',
    totalCoaches: 16,
    coaches: ['DTC1', 'MC1', 'TC1', 'MC2', 'NDTC', 'MC3', 'TC2', 'MC4', 'EC1', 'EC2', 'MC5', 'TC3', 'MC6', 'NDTC2', 'MC7', 'DTC2']
  },
  '12007': {
    trainNumber: '12007',
    trainName: 'Chennai Central Shatabdi Express',
    platformNumber: 7,
    rakeDirection: 'ENGINE_EAST',
    totalCoaches: 16,
    coaches: ['ENG', 'EOG', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10', 'E1', 'E2', 'EOG']
  },
  '16589': {
    trainNumber: '16589',
    trainName: 'Rani Chennamma Express (Miraj)',
    platformNumber: 8,
    rakeDirection: 'ENGINE_WEST',
    totalCoaches: 22,
    coaches: ['ENG', 'SLR', 'GS', 'GS', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'B1', 'B2', 'B3', 'B4', 'A1', 'A2', 'H1', 'GS', 'GS', 'SLR']
  },
  '12649': {
    trainNumber: '12649',
    trainName: 'Karnataka Sampark Kranti Express',
    platformNumber: 3,
    rakeDirection: 'ENGINE_EAST',
    totalCoaches: 22,
    coaches: ['ENG', 'SLR', 'GS', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'B1', 'B2', 'B3', 'B4', 'A1', 'A2', 'PC', 'GS', 'GS', 'SLR']
  }
};

export class StationRouter {
  public nodes: StationNode[] = [];
  public edges: StationEdge[] = [];
  public nodeDict: Map<string, StationNode> = new Map();
  public adj: Map<string, StationEdge[]> = new Map();
  public profiles: Map<string, { id: string; name: string; weights: ProfileWeights }> = new Map();
  public status: Record<string, string> = {};
  public incidentReports: Map<string, IncidentReport> = new Map();
  public config: any = {};

  constructor(dataBasePath?: string) {
    const base = dataBasePath || path.resolve(__dirname, '../../../data');
    this.loadData(base);
  }

  public loadData(base: string): void {
    const nodesPath = path.join(base, 'station/nodes.json');
    const edgesPath = path.join(base, 'station/edges.json');
    const profilesPath = path.join(base, 'accessibility/profiles.json');
    const configPath = path.join(base, 'accessibility/routingConfig.json');
    const statusPath = path.join(base, 'simulation/status.json');

    if (fs.existsSync(nodesPath)) {
      this.nodes = JSON.parse(fs.readFileSync(nodesPath, 'utf-8'));
      this.nodeDict.clear();
      this.adj.clear();
      for (const n of this.nodes) {
        this.nodeDict.set(n.id, n);
        this.nodeDict.set(n.name, n);
        this.nodeDict.set(n.name.toLowerCase().trim(), n);
        this.adj.set(n.id, []);
      }
    }

    if (fs.existsSync(edgesPath)) {
      this.edges = JSON.parse(fs.readFileSync(edgesPath, 'utf-8'));
      for (const e of this.edges) {
        const list = this.adj.get(e.from) || [];
        list.push(e);
        this.adj.set(e.from, list);
      }
    }

    if (fs.existsSync(profilesPath)) {
      const pList = JSON.parse(fs.readFileSync(profilesPath, 'utf-8'));
      this.profiles.clear();
      for (const p of pList) {
        this.profiles.set(p.id, p);
      }
    }

    if (fs.existsSync(configPath)) {
      this.config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }

    if (fs.existsSync(statusPath)) {
      this.status = JSON.parse(fs.readFileSync(statusPath, 'utf-8'));
    }
  }

  public getNode(idOrName?: string | null): StationNode | undefined {
    if (!idOrName) return undefined;
    const direct = this.nodeDict.get(idOrName);
    if (direct) return direct;
    const lower = this.nodeDict.get(idOrName.toLowerCase().trim());
    if (lower) return lower;
    return this.nodes.find(
      (n) => n.id === idOrName || n.name === idOrName || n.name.toLowerCase() === idOrName.toLowerCase()
    );
  }

  public setStatus(facilityId: string, status: string): void {
    this.status[facilityId] = status;
  }

  public addIncidentReport(report: IncidentReport): void {
    this.incidentReports.set(report.id, report);
    if (report.verified || report.reporterRole === 'STAFF') {
      if (report.type === 'OUT_OF_SERVICE') {
        this.status[report.facilityOrLocationId] = 'BLOCKED';
      } else {
        this.status[report.facilityOrLocationId] = 'LIMITED';
      }
    }
  }

  public getIncidentReports(): IncidentReport[] {
    return Array.from(this.incidentReports.values());
  }

  public static readonly FACILITY_NODE_MAP: Record<string, string> = {
    lift_1: 'node_pf8_lift1',
    lift_2: 'node_t1_lift2_l0',
    lift_3: 'node_pf1_lift3',
    ramp_1: 'node_pf8_ramp1',
    ramp_2: 'node_pf4_5_ramp2',
    ramp_3: 'node_pf1_2_ramp3',
    ramp_t1_subway: 'node_t1_ramp_subway_l0',
    toilet_pf7_8: 'node_pf7_8_toilet',
    toilet_pf5_6: 'node_pf5_6_toilet',
    toilet_pf4: 'node_pf4_toilet',
    toilet_pf2_3: 'node_pf2_3_toilet',
    toilet_pf1_west: 'node_pf1_toilet',
    toilet_pf9_10_east: 'node_pf9_10_toilet',
    toilet_t1_main: 'node_t1_toilet',
    toilet_t2: 'node_entry_t2_east',
    booking_t1: 'node_t1_ticket',
    booking_t2: 'node_entry_t2_east',
    fob_metro: 'node_entry_t3_metro',
    fob_mysuru_1: 'node_pf1_stair_fob2',
    fob_okklapura_2: 'node_fob2_pf4_5',
    subway_majestic: 'node_subway_t1_l_minus_1',
    entry_t1_main_east: 'node_entry_t1_main_east',
    entry_t1_main_west: 'node_entry_t1_main_west',
    entry_t1_center: 'node_entry_t1_center',
    entry_t2_east: 'node_entry_t2_east',
    entry_t2_okklapura: 'node_entry_t2_okklapura',
    entry_t3_metro: 'node_entry_t3_metro'
  };

  public getFacilityNode(facility: any): StationNode {
    if (!facility) {
      return this.nodeDict.get('node_t1_toilet') || this.nodes[0];
    }
    const mappedNodeId =
      StationRouter.FACILITY_NODE_MAP[facility.id] ||
      `node_${facility.id}`;
    let baseNode = this.nodeDict.get(mappedNodeId);

    if (!baseNode) {
      if (facility.type === 'LIFT') {
        baseNode = this.nodeDict.get('node_pf8_lift1') || this.nodeDict.get('node_t1_lift2_l0');
      } else if (facility.type === 'RAMP') {
        baseNode = this.nodeDict.get('node_pf8_ramp1') || this.nodeDict.get('node_pf4_5_ramp2');
      } else if (facility.type === 'TOILET' || facility.type === 'ACCESSIBLE_TOILET') {
        baseNode = this.nodeDict.get('node_t1_toilet') || this.nodeDict.get('node_pf4_toilet');
      } else if (facility.type === 'TICKET_COUNTER') {
        baseNode = this.nodeDict.get('node_t1_ticket');
      } else if (facility.type === 'METRO' || facility.type === 'METRO_LINK') {
        baseNode = this.nodeDict.get('node_entry_t3_metro');
      } else {
        baseNode = this.nodeDict.get('node_entry_t1_main_east') || this.nodes[0];
      }
    }

    if (!baseNode) {
      baseNode = this.nodes[0];
    }

    return {
      ...baseNode,
      name: facility.name || baseNode.name,
      level: typeof facility.level === 'number' ? facility.level : baseNode.level,
      wheelchairAccessible: facility.accessibility?.wheelchairAccessible ?? baseNode.wheelchairAccessible
    };
  }

  public findNearestNode(coords: Coordinates): { node: StationNode; distance: number } | null {
    if (this.nodes.length === 0) return null;
    let bestNode = this.nodes[0];
    let minDist = Infinity;
    for (const n of this.nodes) {
      const d = Math.hypot(n.coordinates.x - coords.x, n.coordinates.y - coords.y);
      if (d < minDist) {
        minDist = d;
        bestNode = n;
      }
    }
    return { node: bestNode, distance: minDist };
  }

  public heuristic(nodeAId: string, nodeBId: string): number {
    const na = this.nodeDict.get(nodeAId);
    const nb = this.nodeDict.get(nodeBId);
    if (!na || !nb) return 0;
    const dx = na.coordinates.x - nb.coordinates.x;
    const dy = na.coordinates.y - nb.coordinates.y;
    return Math.sqrt(dx * dx + dy * dy) * 0.25;
  }

  /**
   * SPECIFICATION 1: Mathematical Edge-Cost Calculation:
   * c(e) = d(e) + P_a(e) + P_s(e) + P_u(e)
   * where:
   *   d(e) = physical distance
   *   P_a(e) = Accessibility Penalty (lift down, stairs for wheelchair user, etc.)
   *   P_s(e) = Safety / Disruption Penalty
   *   P_u(e) = Uncertainty Penalty
   */
  public computeEdgeCostComponents(
    edge: StationEdge,
    profileId: string,
    prevEdge?: StationEdge
  ): EdgeCostBreakdown {
    const prof = this.profiles.get(profileId) || this.profiles.get('first_time');
    const weights: ProfileWeights = prof ? prof.weights : {
      walkway: 1.0,
      ramp: 1.0,
      lift: 1.0,
      stairs: 1.5,
      escalator: 1.5,
      turnPenalty: 5.0,
      stairAvoidance: false,
      accessibilityPenaltyFactor: 1.0,
      safetyPenaltyFactor: 1.0,
      uncertaintyPenaltyFactor: 1.0
    };

    const d = edge.distance;
    const pt = edge.pathType.toLowerCase();
    const aFactor = weights.accessibilityPenaltyFactor || 1.0;
    const sFactor = weights.safetyPenaltyFactor || 1.0;
    const uFactor = weights.uncertaintyPenaltyFactor || 1.0;

    // 1. Accessibility Penalty P_a(e)
    let Pa = 0;

    // Strict Wheelchair / Mobility Barrier
    if (weights.stairAvoidance && (!edge.wheelchairAccessible || pt === 'stairs' || pt === 'escalator')) {
      return {
        distance: d,
        accessibilityPenalty: Infinity,
        safetyPenalty: 0,
        uncertaintyPenalty: 0,
        totalCost: Infinity
      };
    }

    if (pt === 'stairs') {
      Pa = d * (weights.stairs - 1.0) * aFactor;
    } else if (pt === 'escalator') {
      Pa = d * (weights.escalator - 1.0) * aFactor;
    } else if (pt === 'lift') {
      // Preference reduction for lifts for elderly/wheelchair/luggage
      const reduction = Math.max(0, 1.0 - weights.lift);
      Pa = -d * reduction * aFactor;
    } else if (pt === 'ramp') {
      const reduction = Math.max(0, 1.0 - weights.ramp);
      Pa = -d * reduction * aFactor;
    }

    // Check facility blockage status
    if (this.status[edge.id] === 'BLOCKED' || (edge.status && edge.status === 'BLOCKED')) {
      Pa = Infinity;
    }

    // 2. Safety / Disruption Penalty P_s(e)
    let Ps = 0;
    for (const report of this.incidentReports.values()) {
      if (report.facilityOrLocationId === edge.id || report.facilityOrLocationId === edge.from || report.facilityOrLocationId === edge.to) {
        if (report.type === 'OUT_OF_SERVICE') {
          Ps = Infinity;
        } else if (report.type === 'MAINTENANCE') {
          Ps += 150.0 * sFactor;
        } else if (report.type === 'OVERCROWDED') {
          Ps += 80.0 * sFactor;
        } else if (report.type === 'SLIPPERY') {
          Ps += 200.0 * sFactor;
        }
      }
    }

    // 3. Uncertainty Penalty P_u(e)
    let Pu = 0;
    const uNode = this.nodeDict.get(edge.from);
    const vNode = this.nodeDict.get(edge.to);

    // Vertical Level transition uncertainty
    if (uNode && vNode && uNode.level !== vNode.level) {
      Pu += 15.0 * uFactor;
    }

    // Tactile deficiency for visually impaired
    if (profileId === 'visually_impaired' && !edge.visualGuidanceAvailable) {
      Pu += 30.0 * uFactor;
    }

    // Directional change / Turn Penalty
    if (prevEdge) {
      const pFrom = this.nodeDict.get(prevEdge.from)?.coordinates;
      const pTo = this.nodeDict.get(prevEdge.to)?.coordinates;
      const cTo = vNode?.coordinates;
      if (pFrom && pTo && cTo) {
        const v1x = pTo.x - pFrom.x;
        const v1y = pTo.y - pFrom.y;
        const v2x = cTo.x - pTo.x;
        const v2y = cTo.y - pTo.y;
        const mag1 = Math.hypot(v1x, v1y);
        const mag2 = Math.hypot(v2x, v2y);
        if (mag1 > 0 && mag2 > 0) {
          const dot = (v1x * v2x + v1y * v2y) / (mag1 * mag2);
          const clamped = Math.max(-1.0, Math.min(1.0, dot));
          const angleDeg = Math.acos(clamped) * (180 / Math.PI);
          if (angleDeg > (this.config.turnAngleThresholdDegrees || 30.0)) {
            Pu += (weights.turnPenalty || 5.0) * uFactor;
          }
        }
      }
    }

    if (!isFinite(Pa) || !isFinite(Ps) || !isFinite(Pu)) {
      return {
        distance: d,
        accessibilityPenalty: isFinite(Pa) ? Pa : Infinity,
        safetyPenalty: isFinite(Ps) ? Ps : Infinity,
        uncertaintyPenalty: isFinite(Pu) ? Pu : Infinity,
        totalCost: Infinity
      };
    }

    const totalCost = Math.max(0.1, d + Pa + Ps + Pu);

    return {
      distance: Math.round(d * 10) / 10,
      accessibilityPenalty: Math.round(Pa * 10) / 10,
      safetyPenalty: Math.round(Ps * 10) / 10,
      uncertaintyPenalty: Math.round(Pu * 10) / 10,
      totalCost: Math.round(totalCost * 10) / 10
    };
  }

  public computeEdgeCost(edge: StationEdge, profileId: string, prevEdge?: StationEdge): number {
    const components = this.computeEdgeCostComponents(edge, profileId, prevEdge);
    return components.totalCost;
  }

  public findRoute(
    startId: string,
    destId: string,
    profileId: string = 'first_time',
    blockedIds: string[] = []
  ): RouteResult | null {
    const startNode = this.nodeDict.get(startId);
    const destNode = this.nodeDict.get(destId);
    if (!startNode || !destNode) return null;

    const blockedSet = new Set(blockedIds);
    for (const [k, v] of Object.entries(this.status)) {
      if (v === 'BLOCKED') {
        blockedSet.add(k);
      }
    }

    // Min-Priority Queue: { f, g, curr, pathEdges }
    const pq: Array<{ f: number; g: number; curr: string; pathEdges: StationEdge[] }> = [
      { f: 0, g: 0, curr: startId, pathEdges: [] }
    ];
    const bestG = new Map<string, number>();
    bestG.set(startId, 0);
    const visited = new Set<string>();

    while (pq.length > 0) {
      let minIdx = 0;
      for (let i = 1; i < pq.length; i++) {
        if (pq[i].f < pq[minIdx].f) minIdx = i;
      }
      const { g, curr, pathEdges } = pq.splice(minIdx, 1)[0];

      if (curr === destId) {
        return this.buildRouteResult(startNode, destNode, profileId, pathEdges, Array.from(blockedSet));
      }

      if (visited.has(curr) && g > (bestG.get(curr) ?? Infinity)) {
        continue;
      }
      visited.add(curr);

      const prevEdge = pathEdges.length > 0 ? pathEdges[pathEdges.length - 1] : undefined;
      const neighbors = this.adj.get(curr) || [];

      for (const edge of neighbors) {
        if (blockedSet.has(edge.id) || blockedSet.has(`${edge.id}_rev`)) continue;
        if (edge.status === 'BLOCKED') continue;

        const cost = this.computeEdgeCost(edge, profileId, prevEdge);
        if (!isFinite(cost)) continue;

        const nxt = edge.to;
        const newG = g + cost;
        if (newG < (bestG.get(nxt) ?? Infinity)) {
          bestG.set(nxt, newG);
          const h = this.heuristic(nxt, destId);
          pq.push({
            f: newG + h,
            g: newG,
            curr: nxt,
            pathEdges: [...pathEdges, edge]
          });
        }
      }
    }

    return null;
  }

  /**
   * SPECIFICATION 4: TRAIN TO COACH NAVIGATION
   * Calculates exact platform boarding coordinates for specific train coach and routes directly to it.
   */
  public findRouteToCoach(
    startId: string,
    trainNumber: string,
    coachNumber: string,
    profileId: string = 'first_time'
  ): RouteResult | null {
    const cleanTrainNo = trainNumber.trim();
    const cleanCoachNo = coachNumber.trim().toUpperCase();
    const train = KSR_TRAIN_DATABASE[cleanTrainNo] || {
      trainNumber: cleanTrainNo,
      trainName: `Train ${cleanTrainNo}`,
      platformNumber: 1,
      rakeDirection: 'ENGINE_EAST',
      totalCoaches: 24,
      coaches: ['ENG', 'SLR', 'GS', 'S1', 'S2', 'S3', 'S4', 'S5', 'B1', 'B2', 'B3', 'B4', 'A1', 'A2', 'H1', 'GS', 'SLR']
    };

    const pfNum = train.platformNumber;
    // Find matching coach index (1-based)
    let coachIdx = train.coaches.indexOf(cleanCoachNo);
    if (coachIdx === -1) {
      coachIdx = Math.min(10, Math.floor(train.totalCoaches / 2));
    }
    const coachFraction = (coachIdx + 0.5) / train.totalCoaches;

    // Platform track geometry coordinates
    const pfXMin = 500;
    const pfXMax = 2700;
    const coachX = train.rakeDirection === 'ENGINE_EAST'
      ? pfXMin + coachFraction * (pfXMax - pfXMin)
      : pfXMax - coachFraction * (pfXMax - pfXMin);

    // Platform Y coordinates
    const pfYMap: Record<number, number> = {
      1: 980.9, 2: 889.8, 3: 889.8, 4: 760.0, 5: 760.0,
      6: 640.0, 7: 500.0, 8: 375.9, 9: 250.0, 10: 150.0
    };
    const coachY = pfYMap[pfNum] || 980.9;

    // Pick the closest node on that platform
    const candidateNodes = [
      `node_pf${pfNum}_west`,
      `node_pf${pfNum}_center`,
      `node_pf${pfNum}_east`
    ].filter(id => this.nodeDict.has(id));

    let bestTargetId = candidateNodes[0] || `node_pf${pfNum}_center`;
    let minDist = Infinity;
    for (const cid of candidateNodes) {
      const node = this.nodeDict.get(cid)!;
      const d = Math.abs(node.coordinates.x - coachX);
      if (d < minDist) {
        minDist = d;
        bestTargetId = cid;
      }
    }

    const route = this.findRoute(startId, bestTargetId, profileId);
    if (!route) return null;

    const coachCoords = { x: Math.round(coachX), y: Math.round(coachY) };
    route.coachInfo = {
      trainNumber: train.trainNumber,
      trainName: train.trainName,
      coachNumber: cleanCoachNo,
      platformNumber: pfNum,
      coordinates: coachCoords
    };

    // Append coach boarding final step
    const finalStepNumber = route.steps.length + 1;
    route.steps.push({
      stepNumber: finalStepNumber,
      fromNode: route.destination.name,
      toNode: `Coach ${cleanCoachNo} Boarding Spot`,
      fromNodeId: route.destination.id,
      toNodeId: `node_coach_${cleanCoachNo}`,
      fromCoords: route.destination.coordinates,
      toCoords: coachCoords,
      geometry: [route.destination.coordinates, coachCoords],
      instruction: `Arrive at Platform ${pfNum}, Coach ${cleanCoachNo} halting marker (${train.trainName}).`,
      instructionKn: `ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ${pfNum} ರಲ್ಲಿ ಕೋಚ್ ${cleanCoachNo} ಹತ್ತುವ ಸ್ಥಳವನ್ನು ತಲುಪಿರಿ (${train.trainName}).`,
      instructionHi: `प्लेटफॉर्म ${pfNum} पर कोच ${cleanCoachNo} बोर्डिंग स्थल पर पहुँचें (${train.trainName})।`,
      voiceText: `Arrive at Platform ${pfNum}, Coach ${cleanCoachNo} halting marker for ${train.trainName}.`,
      voiceTextKn: `ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ${pfNum} ರಲ್ಲಿ ಕೋಚ್ ${cleanCoachNo} ಹತ್ತುವ ಸ್ಥಳಕ್ಕೆ ತಲುಪಿದ್ದೀರಿ.`,
      voiceTextHi: `प्लेटफॉर्म ${pfNum} पर कोच ${cleanCoachNo} बोर्डिंग स्पॉट पर पहुँच गए हैं।`,
      distance: 25,
      pathType: 'WALKWAY',
      landmark: `Coach ${cleanCoachNo} Marker`
    });

    return route;
  }

  private buildRouteResult(
    startNode: StationNode,
    destNode: StationNode,
    profileId: string,
    pathEdges: StationEdge[],
    blockedList: string[]
  ): RouteResult {
    const totalDist = pathEdges.reduce((sum, e) => sum + e.distance, 0);
    const totalTime = pathEdges.reduce((sum, e) => sum + e.estimatedTimeSeconds, 0);
    const nodeSequence = [startNode.id, ...pathEdges.map((e) => e.to)];

    const steps: RouteStep[] = [];
    const pathGeometry: Coordinates[] = [];
    const liftsUsed: string[] = [];
    const rampsUsed: string[] = [];
    const stairsUsed: string[] = [];

    let totalAccessibilityPenalty = 0;
    let totalSafetyPenalty = 0;
    let totalUncertaintyPenalty = 0;
    let totalCostAccum = 0;

    pathEdges.forEach((edge, idx) => {
      const u = this.nodeDict.get(edge.from)!;
      const v = this.nodeDict.get(edge.to)!;
      const pt = edge.pathType;

      if (pt === 'LIFT') liftsUsed.push(v.name);
      else if (pt === 'RAMP') rampsUsed.push(v.name);
      else if (pt === 'STAIRS') stairsUsed.push(v.name);

      const prevEdge = idx > 0 ? pathEdges[idx - 1] : undefined;
      const costComp = this.computeEdgeCostComponents(edge, profileId, prevEdge);

      totalAccessibilityPenalty += costComp.accessibilityPenalty;
      totalSafetyPenalty += costComp.safetyPenalty;
      totalUncertaintyPenalty += costComp.uncertaintyPenalty;
      totalCostAccum += costComp.totalCost;

      const geom = edge.geometry || [u.coordinates, v.coordinates];
      const inst = this.generateMultilingualInstructions(idx + 1, u, v, edge, profileId);
      steps.push({
        stepNumber: idx + 1,
        fromNode: u.name,
        toNode: v.name,
        fromNodeId: u.id,
        toNodeId: v.id,
        fromCoords: u.coordinates,
        toCoords: v.coordinates,
        geometry: geom,
        instruction: inst.en.text,
        instructionKn: inst.kn.text,
        instructionHi: inst.hi.text,
        voiceText: inst.en.voice,
        voiceTextKn: inst.kn.voice,
        voiceTextHi: inst.hi.voice,
        distance: edge.distance,
        pathType: pt,
        landmark: v.visualLandmark || v.name,
        costDetails: costComp
      });
      if (idx === 0) {
        pathGeometry.push(...geom);
      } else {
        pathGeometry.push(...geom.slice(1));
      }
    });

    const warnings: string[] = [];
    if (stairsUsed.length > 0 && profileId === 'mobility_disabled') {
      warnings.push('Warning: Route includes stairs; not wheelchair accessible.');
    }

    return {
      start: startNode,
      destination: destNode,
      profile: profileId,
      totalDistanceMeters: Math.round(totalDist * 10) / 10,
      estimatedTimeMinutes: Math.max(1, Math.round(totalTime / 60)),
      nodeSequence,
      steps,
      pathGeometry,
      accessibility: {
        wheelchairAccessible: stairsUsed.length === 0,
        stepFree: stairsUsed.length === 0,
        liftsUsed,
        rampsUsed,
        stairsUsed
      },
      warnings,
      blockedSegments: blockedList,
      costBreakdown: {
        totalDistance: Math.round(totalDist * 10) / 10,
        totalAccessibilityPenalty: Math.round(totalAccessibilityPenalty * 10) / 10,
        totalSafetyPenalty: Math.round(totalSafetyPenalty * 10) / 10,
        totalUncertaintyPenalty: Math.round(totalUncertaintyPenalty * 10) / 10,
        totalCost: Math.round(totalCostAccum * 10) / 10,
        formula: 'c(e) = d(e) + P_a(e) + P_s(e) + P_u(e)'
      }
    };
  }

  private generateMultilingualInstructions(
    stepNum: number,
    u: StationNode,
    v: StationNode,
    edge: StationEdge,
    profileId: string
  ): {
    en: { text: string; voice: string };
    kn: { text: string; voice: string };
    hi: { text: string; voice: string };
  } {
    const pt = edge.pathType;
    const dist = Math.round(edge.distance);
    const landmark = v.visualLandmark || v.name;

    if (pt === 'LIFT') {
      return {
        en: { text: `Take Lift to ${v.name}`, voice: `Take the lift to ${v.name}.` },
        kn: { text: `ಲಿಫ್ಟ್ ಬಳಸಿ ${v.name} ಗೆ ಹೋಗಿ`, voice: `ದಯವಿಟ್ಟು ಲಿಫ್ಟ್ ಮೂಲಕ ${v.name} ಗೆ ತೆರಳಿ.` },
        hi: { text: `लिफ्ट से ${v.name} जाएँ`, voice: `कृपया लिफ्ट से ${v.name} की ओर जाएँ।` }
      };
    }

    if (pt === 'RAMP') {
      return {
        en: { text: `Proceed along accessible ramp (${dist}m) to ${v.name}`, voice: `Follow the ramp for ${dist} meters to ${v.name}.` },
        kn: { text: `ಸುಲಭ ರಾಂಪ್ ಮೂಲಕ (${dist} ಮೀಟರ್) ${v.name} ಗೆ ಮುನ್ನಡೆಯಿರಿ`, voice: `ರಾಂಪ್ ಮೂಲಕ ${dist} ಮೀಟರ್ ಮುನ್ನಡೆದು ${v.name} ತಲುಪಿ.` },
        hi: { text: `सुगम रैंप से (${dist} मीटर) ${v.name} की ओर जाएँ`, voice: `रैंप के सहारे ${dist} मीटर आगे बढ़कर ${v.name} जाएँ।` }
      };
    }

    if (pt === 'STAIRS') {
      return {
        en: { text: `Take staircase (${dist}m) up to ${v.name}`, voice: `Take the stairs up to ${v.name}.` },
        kn: { text: `ಮೆಟ್ಟಿಲುಗಳ ಮೂಲಕ (${dist} ಮೀಟರ್) ${v.name} ಗೆ ತೆರಳಿ`, voice: `ಮೆಟ್ಟಿಲುಗಳನ್ನು ಏರಿ ${v.name} ಕಡೆಗೆ ಹೋಗಿ.` },
        hi: { text: `सीढ़ियों से (${dist} मीटर) ${v.name} पर जाएँ`, voice: `सीढ़ियों का उपयोग करके ${v.name} की ओर बढ़ें।` }
      };
    }

    if (pt === 'FOB') {
      return {
        en: { text: `Cross Footover Bridge for ${dist}m towards ${v.name}`, voice: `Continue along the footover bridge for ${dist} meters.` },
        kn: { text: `ಮೇಲ್ಸೇತುವೆ (FOB) ಮೇಲೆ ${dist} ಮೀಟರ್ ${v.name} ಕಡೆಗೆ ಮುನ್ನಡೆಯಿರಿ`, voice: `ಮೇಲ್ಸೇತುವೆ ಮೇಲೆ ${dist} ಮೀಟರ್ ಸಾಗಿ.` },
        hi: { text: `फुटओवर ब्रिज से ${dist} मीटर ${v.name} की ओर चलें`, voice: `फुटओवर ब्रिज पर ${dist} मीटर आगे बढ़ें।` }
      };
    }

    return {
      en: { text: `Walk ${dist}m towards ${landmark}`, voice: `Walk ${dist} meters towards ${landmark}.` },
      kn: { text: `${landmark} ಕಡೆಗೆ ${dist} ಮೀಟರ್ ನಡೆಯಿರಿ`, voice: `${landmark} ಕಡೆಗೆ ${dist} ಮೀಟರ್ ನೇರವಾಗಿ ನಡೆಯಿರಿ.` },
      hi: { text: `${landmark} की ओर ${dist} मीटर चलें`, voice: `${landmark} की तरफ ${dist} मीटर सीधा चलें।` }
    };
  }
}
