import { Coordinates, StationNode, StationEdge } from '../../../services/localRouter';

export type PositionConfidenceState = 'CONFIRMED' | 'TRACKING' | 'UNCERTAIN' | 'RECOVERY';

export type PositioningSource = 'QR' | 'BLE' | 'PDR' | 'RECOVERY';

export interface StationQrCheckpoint {
  version: number;
  stationCode: string;
  checkpointId: string;
  name: string;
  level: number;
  associatedNodeId: string;
  coordinates: Coordinates;
  visualLandmark: string;
  description: string;
  checksum: string;
  accessibilityNotes?: {
    wheelchairClearanceMeters?: number;
    tactilePavingPresent?: boolean;
    braillePlateHeightCm?: number;
  };
}

export interface StationBleBeacon {
  beaconId: string;
  name: string;
  uuid: string;
  major: number;
  minor: number;
  level: number;
  coordinates: Coordinates;
  nearestNodeId: string;
  txPowerAt1m: number;
  pathLossExponent: number;
  coverageRadiusMeters: number;
  pillarId: string;
  zoneName: string;
}

export interface BleSignalSample {
  beaconId: string;
  name: string;
  rawRssi: number;
  filteredRssi: number;
  estimatedDistanceMeters: number;
  level: number;
  coordinates: Coordinates;
  pillarId: string;
  timestamp: number;
}

export interface HybridPositionEstimate {
  coordinates: Coordinates;
  level: number;
  nearestNodeId: string;
  snappedEdgeId: string | null;
  confidenceScore: number; // 0 to 100
  state: PositionConfidenceState;
  source: PositioningSource;
  floorName: string;
  lastConfirmedCheckpoint: {
    id: string;
    name: string;
    timestamp: number;
    nodeId: string;
    level: number;
  } | null;
  distanceFromLastCheckpointMeters: number;
  activeNearbyBeaconsCount: number;
  headingDegrees: number;
}

export interface CrowdDensityMetric {
  zoneId: string;
  zoneName: string;
  level: number;
  density: number; // passengers per m^2
  status: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  timestamp: number; // unix epoch ms
  verified: boolean;
  chokePoint: boolean;
}

export interface MultiFloorTransition {
  fromLevel: number;
  toLevel: number;
  portalType: 'LIFT' | 'RAMP' | 'STAIRS' | 'ESCALATOR' | 'SUBWAY' | 'FOB';
  fromNodeId: string;
  toNodeId: string;
  facilityName: string;
  isAccessible: boolean;
}

export interface MultiFloorRouteStep {
  stepNumber: number;
  fromNode: string;
  toNode: string;
  instruction: string;
  instructionKn: string;
  instructionHi: string;
  pathType: 'WALKWAY' | 'LIFT' | 'RAMP' | 'STAIRS' | 'ESCALATOR' | 'FOB' | 'SUBWAY';
  fromLevel: number;
  toLevel: number;
  distance: number;
  estimatedTimeSeconds: number;
  isVerticalTransition: boolean;
  landmarkHint?: string;
  transitionDetails?: MultiFloorTransition;
  voiceText: string;
  voiceTextKn: string;
  voiceTextHi: string;
}

export interface MultiFloorRouteResult {
  path: string[];
  steps: MultiFloorRouteStep[];
  totalDistance: number;
  estimatedTimeSeconds: number;
  levelsTraversed: number[];
  verticalTransitionsCount: number;
  accessible: boolean;
  crowdDelaySeconds: number;
  crowdStatus: 'AVAILABLE' | 'UNAVAILABLE' | 'STALE';
  source: StationNode;
  destination: StationNode;
}

export interface RecoveryActionPlan {
  currentEstimatedZone: string;
  nearestCheckpoints: Array<{
    checkpoint: StationQrCheckpoint;
    walkingDistanceMeters: number;
    visualDirection: string;
  }>;
  nearestHelpDeskNode: StationNode | null;
  recoveryGuidanceText: {
    en: string;
    kn: string;
    hi: string;
  };
}

