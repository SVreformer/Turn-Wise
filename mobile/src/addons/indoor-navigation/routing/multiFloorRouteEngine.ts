import {
  StationNode,
  StationEdge,
  Coordinates
} from '../../../services/localRouter';
import nodesData from '../../../data/station/nodes.json';
import edgesData from '../../../data/station/edges.json';
import verticalConnectionsData from '../../../data/station/verticalConnections.json';
import {
  MultiFloorRouteResult,
  MultiFloorRouteStep,
  MultiFloorTransition
} from '../types';
import { crowdCostEvaluator } from './crowdCostEvaluator';

interface PriorityQueueItem {
  nodeId: string;
  priority: number;
}

class SimplePriorityQueue {
  private items: PriorityQueueItem[] = [];

  push(nodeId: string, priority: number): void {
    this.items.push({ nodeId, priority });
    this.items.sort((a, b) => a.priority - b.priority);
  }

  pop(): string | undefined {
    return this.items.shift()?.nodeId;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }
}

export class MultiFloorRouteEngine {
  private nodes: StationNode[] = [];
  private edges: StationEdge[] = [];
  private nodeDict: Map<string, StationNode> = new Map();
  private adjacency: Map<string, StationEdge[]> = new Map();
  private verticalMap: Map<string, any> = new Map();

  constructor() {
    this.loadGraph();
  }

  private loadGraph(): void {
    this.nodes = nodesData as StationNode[];
    this.edges = edgesData as StationEdge[];

    this.nodes.forEach((n) => {
      this.nodeDict.set(n.id, n);
      this.adjacency.set(n.id, []);
    });

    this.edges.forEach((e) => {
      if (this.adjacency.has(e.from)) {
        this.adjacency.get(e.from)!.push(e);
      }
    });

    (verticalConnectionsData as any[]).forEach((vc) => {
      this.verticalMap.set(`${vc.fromNode}->${vc.toNode}`, vc);
      this.verticalMap.set(`${vc.toNode}->${vc.fromNode}`, vc);
    });
  }

  /**
   * Euclidean metric distance
   */
  private euclideanDistance(a: Coordinates, b: Coordinates): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Multi-floor A* Search algorithm
   */
  public findMultiFloorRoute(
    startNodeId: string,
    destinationNodeId: string,
    profileId: string = 'first_time',
    blockedEdgeIds: string[] = []
  ): MultiFloorRouteResult | null {
    const startNode = this.nodeDict.get(startNodeId);
    const destNode = this.nodeDict.get(destinationNodeId);
    if (!startNode || !destNode) return null;

    const blockedSet = new Set(blockedEdgeIds);

    const openSet = new SimplePriorityQueue();
    const cameFromEdge = new Map<string, StationEdge>();
    const cameFromNode = new Map<string, string>();
    const gScore = new Map<string, number>();
    const fScore = new Map<string, number>();

    this.nodes.forEach((n) => {
      gScore.set(n.id, Infinity);
      fScore.set(n.id, Infinity);
    });

    gScore.set(startNodeId, 0);
    const initialH = this.heuristic(startNode, destNode);
    fScore.set(startNodeId, initialH);
    openSet.push(startNodeId, initialH);

    const visited = new Set<string>();

    while (!openSet.isEmpty()) {
      const currentId = openSet.pop()!;
      if (currentId === destinationNodeId) {
        return this.reconstructRoute(currentId, cameFromEdge, cameFromNode, startNode, destNode, profileId);
      }

      visited.add(currentId);
      const currentNode = this.nodeDict.get(currentId)!;
      const outgoingEdges = this.adjacency.get(currentId) || [];

      for (const edge of outgoingEdges) {
        if (blockedSet.has(edge.id) || edge.status === 'BLOCKED') continue;

        const neighborNode = this.nodeDict.get(edge.to);
        if (!neighborNode || visited.has(neighborNode.id)) continue;

        // Anti-teleportation invariant check:
        // If floor level changes, edge MUST be a physical vertical transition portal
        const fromLevel = currentNode.level ?? 0;
        const toLevel = neighborNode.level ?? 0;
        if (fromLevel !== toLevel) {
          const isPhysicalVertical = ['LIFT', 'RAMP', 'STAIRS', 'ESCALATOR', 'FOB', 'SUBWAY'].includes(edge.pathType);
          if (!isPhysicalVertical) continue; // Discard invalid teleportation edge
        }

        // Accessibility filter: strictly forbid stairs for wheelchair users
        if (profileId === 'mobility_disabled') {
          if (edge.pathType === 'STAIRS' || !edge.wheelchairAccessible) {
            continue;
          }
        }

        const transitionCost = this.computeEdgeCost(edge, currentNode, neighborNode, profileId);
        const tentativeG = gScore.get(currentId)! + transitionCost;

        if (tentativeG < gScore.get(neighborNode.id)!) {
          cameFromNode.set(neighborNode.id, currentId);
          cameFromEdge.set(neighborNode.id, edge);
          gScore.set(neighborNode.id, tentativeG);
          const h = this.heuristic(neighborNode, destNode);
          const f = tentativeG + h;
          fScore.set(neighborNode.id, f);
          openSet.push(neighborNode.id, f);
        }
      }
    }

    return null;
  }

  /**
   * Admissible Heuristic incorporating 3D floor displacement penalty
   */
  private heuristic(a: StationNode, b: StationNode): number {
    const planarDist = this.euclideanDistance(a.coordinates, b.coordinates) / 6.9; // convert to meters
    const floorDiff = Math.abs((a.level ?? 0) - (b.level ?? 0));
    // Each floor difference adds at least 25 meters equivalent vertical traversal
    return planarDist + floorDiff * 25.0;
  }

  /**
   * Comprehensive edge cost calculation
   */
  private computeEdgeCost(
    edge: StationEdge,
    fromNode: StationNode,
    toNode: StationNode,
    profileId: string
  ): number {
    let cost = edge.distance || 5;

    // 1. Vertical Transition Costs
    const fromLevel = fromNode.level ?? 0;
    const toLevel = toNode.level ?? 0;
    if (fromLevel !== toLevel) {
      if (edge.pathType === 'LIFT') {
        cost += profileId === 'mobility_disabled' ? 5 : 25; // Lifts preferred for wheelchairs
      } else if (edge.pathType === 'RAMP') {
        cost += 10;
      } else if (edge.pathType === 'STAIRS') {
        cost += profileId === 'elderly' ? 45 : 15;
      } else if (edge.pathType === 'ESCALATOR') {
        cost += 12;
      }
    }

    // 2. Profile accessibility penalties
    if (profileId === 'elderly') {
      if (edge.pathType === 'STAIRS') cost += 50;
      if (edge.pathType === 'LIFT' || edge.pathType === 'RAMP') cost -= 5;
    }

    // 3. Dynamic Crowd Penalties
    const crowdEval = crowdCostEvaluator.evaluateCrowdPenalty(edge.id, edge.distance, profileId);
    cost += crowdEval.penaltyCost;

    return Math.max(1, cost);
  }

  /**
   * Reconstruct multi-floor path and generate rich instructions
   */
  private reconstructRoute(
    endNodeId: string,
    cameFromEdge: Map<string, StationEdge>,
    cameFromNode: Map<string, string>,
    startNode: StationNode,
    destNode: StationNode,
    profileId: string
  ): MultiFloorRouteResult {
    const pathNodes: string[] = [endNodeId];
    const pathEdges: StationEdge[] = [];

    let curr = endNodeId;
    while (cameFromNode.has(curr)) {
      const prev = cameFromNode.get(curr)!;
      const edge = cameFromEdge.get(curr)!;
      pathEdges.unshift(edge);
      pathNodes.unshift(prev);
      curr = prev;
    }

    let totalDist = 0;
    let totalTime = 0;
    let crowdDelay = 0;
    const levelsSet = new Set<number>();
    let verticalCount = 0;

    const steps: MultiFloorRouteStep[] = [];

    for (let i = 0; i < pathEdges.length; i++) {
      const edge = pathEdges[i];
      const fromN = this.nodeDict.get(edge.from)!;
      const toN = this.nodeDict.get(edge.to)!;

      const fromL = fromN.level ?? 0;
      const toL = toN.level ?? 0;
      levelsSet.add(fromL);
      levelsSet.add(toL);

      const isVertical = fromL !== toL;
      if (isVertical) verticalCount++;

      totalDist += edge.distance;
      const timeSec = edge.estimatedTimeSeconds || Math.round(edge.distance / 1.1);
      totalTime += timeSec;

      const crowdEval = crowdCostEvaluator.evaluateCrowdPenalty(edge.id, edge.distance, profileId);
      crowdDelay += crowdEval.delaySeconds;

      // Vertical transition details
      let transitionDetails: MultiFloorTransition | undefined = undefined;
      if (isVertical) {
        const portal = (edge.pathType as any) || 'STAIRS';
        transitionDetails = {
          fromLevel: fromL,
          toLevel: toL,
          portalType: portal,
          fromNodeId: fromN.id,
          toNodeId: toN.id,
          facilityName: `${portal} connecting Floor ${fromL} to Floor ${toL}`,
          isAccessible: edge.wheelchairAccessible
        };
      }

      // Generate natural language instructions with visual landmarks
      const stepInstructions = this.generateStepInstructions(
        edge,
        fromN,
        toN,
        fromL,
        toL,
        i === pathEdges.length - 1
      );

      steps.push({
        stepNumber: i + 1,
        fromNode: fromN.id,
        toNode: toN.id,
        instruction: stepInstructions.en,
        instructionKn: stepInstructions.kn,
        instructionHi: stepInstructions.hi,
        pathType: edge.pathType,
        fromLevel: fromL,
        toLevel: toL,
        distance: edge.distance,
        estimatedTimeSeconds: timeSec,
        isVerticalTransition: isVertical,
        landmarkHint: toN.visualLandmark || toN.name,
        transitionDetails,
        voiceText: stepInstructions.voiceEn,
        voiceTextKn: stepInstructions.voiceKn,
        voiceTextHi: stepInstructions.voiceHi
      });
    }

    return {
      path: pathNodes,
      steps,
      totalDistance: Math.round(totalDist * 10) / 10,
      estimatedTimeSeconds: totalTime + crowdDelay,
      levelsTraversed: Array.from(levelsSet).sort((a, b) => a - b),
      verticalTransitionsCount: verticalCount,
      accessible: profileId === 'mobility_disabled' ? true : steps.every(s => s.pathType !== 'STAIRS'),
      crowdDelaySeconds: crowdDelay,
      crowdStatus: 'AVAILABLE',
      source: startNode,
      destination: destNode
    };
  }

  private generateStepInstructions(
    edge: StationEdge,
    fromNode: StationNode,
    toNode: StationNode,
    fromLevel: number,
    toLevel: number,
    isLastStep: boolean
  ): {
    en: string;
    kn: string;
    hi: string;
    voiceEn: string;
    voiceKn: string;
    voiceHi: string;
  } {
    const dist = Math.round(edge.distance);
    const levelName = (lvl: number) => {
      if (lvl === -1) return 'Subway Tunnel (Level -1)';
      if (lvl === 1) return 'Foot-Over-Bridge (Level 1)';
      return 'Platform / Ground Level (Level 0)';
    };

    if (fromLevel !== toLevel) {
      if (edge.pathType === 'LIFT') {
        return {
          en: `Take the Lift from ${levelName(fromLevel)} to ${levelName(toLevel)}.`,
          kn: `${levelName(fromLevel)} ನಿಂದ ${levelName(toLevel)} ಗೆ ಲಿಫ್ಟ್ ತೆಗೆದುಕೊಳ್ಳಿ.`,
          hi: `${levelName(fromLevel)} से ${levelName(toLevel)} तक लिफ्ट लें।`,
          voiceEn: `Take the lift to ${levelName(toLevel)}.`,
          voiceKn: `${levelName(toLevel)} ಗೆ ಲಿಫ್ಟ್ ಬಳಸಿ.`,
          voiceHi: `${levelName(toLevel)} के लिए लिफ्ट लें।`
        };
      }
      if (edge.pathType === 'RAMP') {
        return {
          en: `Ascend the accessible ramp up ${dist}m to ${levelName(toLevel)}.`,
          kn: `${levelName(toLevel)} ಗೆ ${dist} ಮೀಟರ್ ಇಳಿಜಾರಿನ ರ‍್ಯಾಂಪ್ ಬಳಸಿ.`,
          hi: `${levelName(toLevel)} के लिए ${dist} मीटर रैंप से आगे बढ़ें।`,
          voiceEn: `Ascend the ramp to ${levelName(toLevel)}.`,
          voiceKn: `ರ‍್ಯಾಂಪ್ ಬಳಸಿ ಮುಂದುವರಿಯಿರಿ.`,
          voiceHi: `रैंप से आगे बढ़ें।`
        };
      }
      if (edge.pathType === 'STAIRS') {
        return {
          en: `Take the stairs (${dist}m) to ${levelName(toLevel)}.`,
          kn: `${levelName(toLevel)} ಗೆ ಮೆಟ್ಟಿಲುಗಳ ಮೂಲಕ ಹೋಗಿ.`,
          hi: `${levelName(toLevel)} के लिए सीढ़ियों से जाएं।`,
          voiceEn: `Take the stairs to ${levelName(toLevel)}.`,
          voiceKn: `ಮೆಟ್ಟಿಲುಗಳನ್ನು ಬಳಸಿ.`,
          voiceHi: `सीढ़ियां चढ़ें।`
        };
      }
    }

    if (isLastStep) {
      return {
        en: `Walk ${dist}m towards ${toNode.name}. You have reached your destination.`,
        kn: `${toNode.name} ಕಡೆಗೆ ${dist} ಮೀಟರ್ ನಡೆಯಿರಿ. ನೀವು ಗಮ್ಯಸ್ಥಾನ ತಲುಪಿದ್ದೀರಿ.`,
        hi: `${toNode.name} की ओर ${dist} मीटर चलें। आप अपने गंतव्य पर पहुंच गए हैं।`,
        voiceEn: `Arrived at ${toNode.name}.`,
        voiceKn: `${toNode.name} ತಲುಪಿದ್ದೀರಿ.`,
        voiceHi: `${toNode.name} पहुंच गए हैं।`
      };
    }

    const landmark = toNode.visualLandmark ? ` near ${toNode.visualLandmark}` : '';

    return {
      en: `Continue ${dist}m forward towards ${toNode.name}${landmark}.`,
      kn: `${toNode.name} ಕಡೆಗೆ ${dist} ಮೀಟರ್ ಮುಂದುವರಿಯಿರಿ.`,
      hi: `${toNode.name} की ओर ${dist} मीटर आगे बढ़ें।`,
      voiceEn: `Walk ${dist} meters towards ${toNode.name}.`,
      voiceKn: `${toNode.name} ಕಡೆಗೆ ಮುಂದುವರಿಯಿರಿ.`,
      voiceHi: `${toNode.name} की तरफ बढ़ें।`
    };
  }
}

export const multiFloorRouteEngine = new MultiFloorRouteEngine();
