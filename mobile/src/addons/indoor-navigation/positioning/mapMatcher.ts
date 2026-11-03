import { Coordinates, StationNode, StationEdge } from '../../../services/localRouter';
import nodesData from '../../../data/station/nodes.json';
import edgesData from '../../../data/station/edges.json';

export interface SnappedLocation {
  originalCoordinates: Coordinates;
  snappedCoordinates: Coordinates;
  nearestNode: StationNode;
  snappedEdge: StationEdge | null;
  distanceToEdgeMeters: number;
  isWithinBounds: boolean;
  level: number;
}

export class TopologicalMapMatcher {
  private nodes: StationNode[] = [];
  private edges: StationEdge[] = [];
  private nodesByLevel: Map<number, StationNode[]> = new Map();
  private edgesByLevel: Map<number, StationEdge[]> = new Map();
  private nodeDict: Map<string, StationNode> = new Map();

  // Pixels per meter conversion factor
  private pixelsPerMeter: number = 6.9;
  // Maximum snapping radius in physical meters (approx 55 pixels)
  private maxSnapRadiusMeters: number = 8.0;

  constructor() {
    this.initGraph();
  }

  private initGraph(): void {
    this.nodes = nodesData as StationNode[];
    this.edges = edgesData as StationEdge[];

    this.nodes.forEach((n) => {
      this.nodeDict.set(n.id, n);
      const lvl = n.level ?? 0;
      if (!this.nodesByLevel.has(lvl)) this.nodesByLevel.set(lvl, []);
      this.nodesByLevel.get(lvl)!.push(n);
    });

    this.edges.forEach((e) => {
      const fromNode = this.nodeDict.get(e.from);
      const lvl = e.level ?? fromNode?.level ?? 0;
      if (!this.edgesByLevel.has(lvl)) this.edgesByLevel.set(lvl, []);
      this.edgesByLevel.get(lvl)!.push(e);
    });
  }

  /**
   * Snap continuous coordinates (x, y) to the nearest walkable corridor on the given floor level
   */
  public snapToWalkway(rawCoords: Coordinates, level: number): SnappedLocation {
    const candidateNodes = this.nodesByLevel.get(level) || this.nodes;
    const candidateEdges = this.edgesByLevel.get(level) || this.edges;

    // 1. Find nearest node
    let nearestNode: StationNode = candidateNodes[0] || this.nodes[0];
    let minNodePixelDist = Infinity;

    for (const node of candidateNodes) {
      const dx = node.coordinates.x - rawCoords.x;
      const dy = node.coordinates.y - rawCoords.y;
      const distSq = dx * dx + dy * dy;
      if (distSq < minNodePixelDist) {
        minNodePixelDist = distSq;
        nearestNode = node;
      }
    }

    // 2. Find nearest edge and project point orthogonally
    let bestEdge: StationEdge | null = null;
    let bestSnappedCoords: Coordinates = { ...nearestNode.coordinates };
    let minEdgePixelDist = Math.sqrt(minNodePixelDist);

    for (const edge of candidateEdges) {
      const nFrom = this.nodeDict.get(edge.from);
      const nTo = this.nodeDict.get(edge.to);
      if (!nFrom || !nTo) continue;

      const proj = this.projectPointOntoSegment(rawCoords, nFrom.coordinates, nTo.coordinates);
      const dx = rawCoords.x - proj.x;
      const dy = rawCoords.y - proj.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < minEdgePixelDist) {
        minEdgePixelDist = dist;
        bestEdge = edge;
        bestSnappedCoords = proj;
      }
    }

    const distanceToEdgeMeters = minEdgePixelDist / this.pixelsPerMeter;
    const isWithinBounds = distanceToEdgeMeters <= this.maxSnapRadiusMeters;

    // If point is beyond max snapping radius, don't over-snap to an arbitrary distant corridor
    const finalCoords = isWithinBounds ? bestSnappedCoords : rawCoords;

    return {
      originalCoordinates: rawCoords,
      snappedCoordinates: finalCoords,
      nearestNode,
      snappedEdge: bestEdge,
      distanceToEdgeMeters: Math.round(distanceToEdgeMeters * 10) / 10,
      isWithinBounds,
      level
    };
  }

  /**
   * Orthogonal projection of point P onto line segment AB clamped between [A, B]
   */
  private projectPointOntoSegment(p: Coordinates, a: Coordinates, b: Coordinates): Coordinates {
    const abX = b.x - a.x;
    const abY = b.y - a.y;
    const abLenSq = abX * abX + abY * abY;

    if (abLenSq === 0) return { ...a };

    const apX = p.x - a.x;
    const apY = p.y - a.y;

    // Projection factor t in [0, 1]
    let t = (apX * abX + apY * abY) / abLenSq;
    t = Math.max(0, Math.min(1, t));

    return {
      x: a.x + t * abX,
      y: a.y + t * abY
    };
  }

  public getNodeById(id: string): StationNode | undefined {
    return this.nodeDict.get(id);
  }
}

export const topologicalMapMatcher = new TopologicalMapMatcher();
