import { Coordinates, StationNode } from '../../../services/localRouter';
import {
  HybridPositionEstimate,
  StationBleBeacon,
  BleSignalSample,
  RecoveryActionPlan,
  MultiFloorRouteResult,
  MultiFloorRouteStep
} from '../types';
import { qrValidator } from '../positioning/qrValidator';
import { bleKalmanFilterEngine } from '../positioning/bleKalmanFilter';
import { pdrEstimator } from '../positioning/pdrEstimator';
import { topologicalMapMatcher } from '../positioning/mapMatcher';
import { confidenceStateMachine } from '../positioning/confidenceStateMachine';
import { multiFloorRouteEngine } from '../routing/multiFloorRouteEngine';

type EngineListener = (estimate: HybridPositionEstimate) => void;

export class IndoorNavigationEngine {
  private currentEstimate: HybridPositionEstimate;
  private activeBleSamples: Map<string, BleSignalSample> = new Map();
  private listeners: Set<EngineListener> = new Set();
  private activeMultiFloorRoute: MultiFloorRouteResult | null = null;
  private currentStepIndex: number = 0;

  constructor() {
    // Default initial location: Terminal 1 East Entrance Checkpoint (Level 0)
    this.currentEstimate = {
      coordinates: { x: 1811.0, y: 1163.0 },
      level: 0,
      nearestNodeId: 'node_entry_t1_main_east',
      snappedEdgeId: null,
      confidenceScore: 100,
      state: 'CONFIRMED',
      source: 'QR',
      floorName: 'Level 0 (Platforms / Ground Concourse)',
      lastConfirmedCheckpoint: {
        id: 'CP-T1-MAIN',
        name: 'Terminal 1 East Main Entry Checkpoint',
        timestamp: Date.now(),
        nodeId: 'node_entry_t1_main_east',
        level: 0
      },
      distanceFromLastCheckpointMeters: 0,
      activeNearbyBeaconsCount: 0,
      headingDegrees: 90
    };

    pdrEstimator.anchor(this.currentEstimate.coordinates);
  }

  public subscribe(listener: EngineListener): () => void {
    this.listeners.add(listener);
    listener(this.currentEstimate);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    this.listeners.forEach((listener) => {
      try {
        listener({ ...this.currentEstimate });
      } catch (err) {
        console.error('Error in IndoorNavigationEngine listener:', err);
      }
    });
  }

  /**
   * Action A: QR-Based Ground Truth Confirmation
   */
  public confirmCheckpoint(rawQrPayload: string): {
    success: boolean;
    checkpointName?: string;
    level?: number;
    errorMessage?: string;
  } {
    const valResult = qrValidator.validate(rawQrPayload);
    if (!valResult.isValid) {
      return {
        success: false,
        errorMessage: valResult.errorMessage
      };
    }

    const cp = valResult.checkpoint;
    const node = valResult.matchedNode;
    const coords = cp.coordinates || (node ? node.coordinates : this.currentEstimate.coordinates);

    // 1. Anchor PDR
    pdrEstimator.anchor(coords);

    // 2. Update Confidence State Machine
    const conf = confidenceStateMachine.onQrConfirmed();

    // 3. Update Current Estimate
    this.currentEstimate = {
      coordinates: coords,
      level: cp.level,
      nearestNodeId: cp.associatedNodeId,
      snappedEdgeId: null,
      confidenceScore: conf.score,
      state: conf.state,
      source: 'QR',
      floorName: this.getFloorLabel(cp.level),
      lastConfirmedCheckpoint: {
        id: cp.checkpointId,
        name: cp.name,
        timestamp: Date.now(),
        nodeId: cp.associatedNodeId,
        level: cp.level
      },
      distanceFromLastCheckpointMeters: 0,
      activeNearbyBeaconsCount: this.activeBleSamples.size,
      headingDegrees: this.currentEstimate.headingDegrees
    };

    this.notify();

    return {
      success: true,
      checkpointName: cp.name,
      level: cp.level
    };
  }

  /**
   * Action B: BLE-Based RSSI Sample Ingestion
   */
  public processBleSample(beaconId: string, rawRssi: number): void {
    const sample = bleKalmanFilterEngine.processSample(beaconId, rawRssi);
    if (!sample) return;

    this.activeBleSamples.set(sample.beaconId, sample);

    // Estimate multi-beacon proximity
    const samplesArray = Array.from(this.activeBleSamples.values());
    const blePos = bleKalmanFilterEngine.estimatePosition(samplesArray);

    if (blePos) {
      // Snap estimated BLE position to walkable station graph
      const snapped = topologicalMapMatcher.snapToWalkway(blePos.coordinates, blePos.level);

      // Evaluate confidence
      const conf = confidenceStateMachine.onBleSample(
        blePos.nearestBeacon.estimatedDistanceMeters,
        samplesArray.length,
        snapped.isWithinBounds
      );

      this.currentEstimate = {
        coordinates: snapped.snappedCoordinates,
        level: blePos.level,
        nearestNodeId: snapped.nearestNode.id,
        snappedEdgeId: snapped.snappedEdge?.id || null,
        confidenceScore: conf.score,
        state: conf.state,
        source: 'BLE',
        floorName: this.getFloorLabel(blePos.level),
        lastConfirmedCheckpoint: this.currentEstimate.lastConfirmedCheckpoint,
        distanceFromLastCheckpointMeters: Math.round(
          this.calculateDistanceMeters(
            this.currentEstimate.lastConfirmedCheckpoint?.nodeId
              ? topologicalMapMatcher.getNodeById(this.currentEstimate.lastConfirmedCheckpoint.nodeId)?.coordinates || snapped.snappedCoordinates
              : snapped.snappedCoordinates,
            snapped.snappedCoordinates
          )
        ),
        activeNearbyBeaconsCount: samplesArray.length,
        headingDegrees: this.currentEstimate.headingDegrees
      };

      this.notify();
    }
  }

  /**
   * Action C: PDR Step Event
   */
  public recordStep(strideMeters: number = 0.68): void {
    const stepEvt = pdrEstimator.recordStep(strideMeters);
    if (!stepEvt) return;

    const rawPos = pdrEstimator.estimatedPosition || this.currentEstimate.coordinates;
    const snapped = topologicalMapMatcher.snapToWalkway(rawPos, this.currentEstimate.level);

    const conf = confidenceStateMachine.onPdrStep(
      pdrEstimator.distanceSinceAnchorMeters,
      snapped.isWithinBounds
    );

    this.currentEstimate = {
      ...this.currentEstimate,
      coordinates: snapped.snappedCoordinates,
      nearestNodeId: snapped.nearestNode.id,
      snappedEdgeId: snapped.snappedEdge?.id || null,
      confidenceScore: conf.score,
      state: conf.state,
      source: 'PDR',
      distanceFromLastCheckpointMeters: Math.round(pdrEstimator.distanceSinceAnchorMeters)
    };

    this.notify();
  }

  /**
   * Action D: Multi-Floor Route Calculation
   */
  public planMultiFloorRoute(destinationNodeId: string, profileId: string = 'first_time'): MultiFloorRouteResult | null {
    const route = multiFloorRouteEngine.findMultiFloorRoute(
      this.currentEstimate.nearestNodeId,
      destinationNodeId,
      profileId
    );

    this.activeMultiFloorRoute = route;
    this.currentStepIndex = 0;
    return route;
  }

  /**
   * Action E: Advance directly to a specific step (e.g. Next / Previous step)
   */
  public advanceToStep(stepIdx: number): void {
    if (!this.activeMultiFloorRoute) return;
    const clampedIdx = Math.max(0, Math.min(this.activeMultiFloorRoute.steps.length - 1, stepIdx));
    this.currentStepIndex = clampedIdx;

    const step = this.activeMultiFloorRoute.steps[clampedIdx];
    if (step) {
      const fromNode = topologicalMapMatcher.getNodeById(step.fromNode);
      if (fromNode) {
        pdrEstimator.anchor(fromNode.coordinates);
        this.currentEstimate = {
          ...this.currentEstimate,
          coordinates: { ...fromNode.coordinates },
          level: step.fromLevel,
          nearestNodeId: fromNode.id,
          floorName: this.getFloorLabel(step.fromLevel)
        };
        this.notify();
      }
    }
  }

  /**
   * Action F: Continuous step detection / movement along the active route
   */
  public stepAlongRoute(strideMeters: number = 1.0): {
    completed: boolean;
    reachedDestination: boolean;
    remainingDistanceMeters: number;
    nextStepIndex?: number;
  } {
    if (!this.activeMultiFloorRoute) {
      return { completed: false, reachedDestination: false, remainingDistanceMeters: 0 };
    }

    const step = this.activeMultiFloorRoute.steps[this.currentStepIndex];
    if (!step) {
      return { completed: false, reachedDestination: false, remainingDistanceMeters: 0 };
    }

    const toNode = topologicalMapMatcher.getNodeById(step.toNode);
    if (!toNode) {
      return { completed: false, reachedDestination: false, remainingDistanceMeters: 0 };
    }

    const curr = this.currentEstimate.coordinates;
    const target = toNode.coordinates;
    const dx = target.x - curr.x;
    const dy = target.y - curr.y;
    const pixelDist = Math.sqrt(dx * dx + dy * dy);
    const pixelsToMove = strideMeters * 6.9; // 6.9 pixels/meter

    if (pixelDist <= pixelsToMove || pixelDist < 10) {
      // Waypoint / turn node reached!
      if (this.currentStepIndex < this.activeMultiFloorRoute.steps.length - 1) {
        this.advanceToStep(this.currentStepIndex + 1);
        return {
          completed: true,
          reachedDestination: false,
          remainingDistanceMeters: 0,
          nextStepIndex: this.currentStepIndex
        };
      } else {
        // Destination arrived!
        this.currentEstimate = {
          ...this.currentEstimate,
          coordinates: { ...target },
          nearestNodeId: toNode.id
        };
        this.notify();
        return {
          completed: true,
          reachedDestination: true,
          remainingDistanceMeters: 0
        };
      }
    } else {
      // Interpolate along route vector towards target waypoint
      const fraction = pixelsToMove / pixelDist;
      const nextX = Math.round((curr.x + dx * fraction) * 10) / 10;
      const nextY = Math.round((curr.y + dy * fraction) * 10) / 10;
      pdrEstimator.recordStep(strideMeters);

      const remainingMeters = Math.max(0, Math.round((pixelDist - pixelsToMove) / 6.9));

      this.currentEstimate = {
        ...this.currentEstimate,
        coordinates: { x: nextX, y: nextY },
        level: step.fromLevel,
        source: 'PDR'
      };
      this.notify();

      return {
        completed: false,
        reachedDestination: false,
        remainingDistanceMeters: remainingMeters
      };
    }
  }

  /**
   * Action G: Stop navigation and reset
   */
  public stopNavigation(): void {
    this.activeMultiFloorRoute = null;
    this.currentStepIndex = 0;
    this.notify();
  }

  public get currentStep(): MultiFloorRouteStep | undefined {
    return this.activeMultiFloorRoute?.steps[this.currentStepIndex];
  }

  public get stepIndex(): number {
    return this.currentStepIndex;
  }

  /**
   * Generate an emergency self-healing recovery plan when lost / uncertain
   */
  public generateRecoveryPlan(): RecoveryActionPlan {
    const allCps = qrValidator.getAllCheckpoints();
    const currentCoords = this.currentEstimate.coordinates;
    const currentLvl = this.currentEstimate.level;

    // Filter checkpoints on the same floor level
    const sameFloorCps = allCps.filter(c => c.level === currentLvl);

    const ranked = sameFloorCps.map((cp) => {
      const dist = this.calculateDistanceMeters(currentCoords, cp.coordinates);
      let dir = 'Ahead';
      const dx = cp.coordinates.x - currentCoords.x;
      const dy = cp.coordinates.y - currentCoords.y;
      if (Math.abs(dx) > Math.abs(dy)) {
        dir = dx > 0 ? 'East / Right' : 'West / Left';
      } else {
        dir = dy > 0 ? 'South / Forward' : 'North / Behind';
      }
      return {
        checkpoint: cp,
        walkingDistanceMeters: Math.round(dist),
        visualDirection: dir
      };
    }).sort((a, b) => a.walkingDistanceMeters - b.walkingDistanceMeters).slice(0, 3);

    const nearestNode = topologicalMapMatcher.getNodeById(this.currentEstimate.nearestNodeId);

    return {
      currentEstimatedZone: nearestNode ? nearestNode.name : 'Unknown Station Sector',
      nearestCheckpoints: ranked,
      nearestHelpDeskNode: topologicalMapMatcher.getNodeById('node_t1_main_concourse') || null,
      recoveryGuidanceText: {
        en: `Look up at station columns for yellow QR code plates. Nearest: ${ranked[0]?.checkpoint.name || 'Concourse Pillar'} (${ranked[0]?.walkingDistanceMeters || 15}m ${ranked[0]?.visualDirection || 'ahead'}).`,
        kn: `ಹಳದಿ ಕ್ಯೂಆರ್ ಕೋಡ್ ಫಲಕಗಳಿಗಾಗಿ ನಿಲ್ದಾಣದ ಕಂಬಗಳನ್ನು ನೋಡಿ. ಹತ್ತಿರದ ಫಲಕ: ${ranked[0]?.checkpoint.name || 'ಕಂಬ'} (${ranked[0]?.walkingDistanceMeters || 15} ಮೀಟರ್).`,
        hi: `स्टेशन के खंभों पर पीले क्यूआर कोड प्लेट देखें। निकटतम: ${ranked[0]?.checkpoint.name || 'खंभा'} (${ranked[0]?.walkingDistanceMeters || 15} मीटर आगे)।`
      }
    };
  }

  private calculateDistanceMeters(a: Coordinates, b: Coordinates): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy) / 6.9;
  }

  public getFloorLabel(lvl: number): string {
    if (lvl === -1) return 'Subway (Level -1)';
    if (lvl === 1) return 'Foot-Over-Bridge (Level 1)';
    return 'Platform Surface (Level 0)';
  }

  public get estimate(): HybridPositionEstimate {
    return { ...this.currentEstimate };
  }

  public get activeRoute(): MultiFloorRouteResult | null {
    return this.activeMultiFloorRoute;
  }
}

export const indoorNavigationEngine = new IndoorNavigationEngine();

