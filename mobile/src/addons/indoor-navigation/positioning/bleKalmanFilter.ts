import { Coordinates } from '../../../services/localRouter';
import { StationBleBeacon, BleSignalSample } from '../types';
import beaconsData from '../data/stationBeacons.json';

export class SingleBeaconKalmanFilter {
  private x: number; // State estimate (smoothed RSSI)
  private p: number; // Error covariance
  private q: number; // Process noise covariance
  private r: number; // Measurement noise covariance

  constructor(initialRssi: number = -70, q: number = 0.05, r: number = 4.0) {
    this.x = initialRssi;
    this.p = 1.0;
    this.q = q;
    this.r = r;
  }

  public update(rawRssi: number): number {
    // 1. Prediction step
    const xMinus = this.x;
    const pMinus = this.p + this.q;

    // 2. Kalman gain
    const k = pMinus / (pMinus + this.r);

    // 3. Measurement update
    this.x = xMinus + k * (rawRssi - xMinus);
    this.p = (1 - k) * pMinus;

    return this.x;
  }

  public get currentRssi(): number {
    return this.x;
  }
}

export class BleKalmanFilterEngine {
  private beaconCatalog: Map<string, StationBleBeacon> = new Map();
  private filters: Map<string, SingleBeaconKalmanFilter> = new Map();
  private lastSampleTimes: Map<string, number> = new Map();

  constructor() {
    this.loadBeacons();
  }

  private loadBeacons(): void {
    (beaconsData as StationBleBeacon[]).forEach((b) => {
      this.beaconCatalog.set(b.beaconId.toUpperCase(), b);
    });
  }

  /**
   * Process a raw RSSI measurement from a BLE beacon
   */
  public processSample(beaconId: string, rawRssi: number, timestamp: number = Date.now()): BleSignalSample | null {
    const cleanId = beaconId.toUpperCase();
    const beacon = this.beaconCatalog.get(cleanId);
    if (!beacon) return null;

    let filter = this.filters.get(cleanId);
    if (!filter) {
      filter = new SingleBeaconKalmanFilter(rawRssi);
      this.filters.set(cleanId, filter);
    }

    const filteredRssi = filter.update(rawRssi);
    this.lastSampleTimes.set(cleanId, timestamp);

    // Compute estimated distance using log-distance path loss formula:
    // d = 10 ^ ((txPower - RSSI) / (10 * eta))
    const exp = (beacon.txPowerAt1m - filteredRssi) / (10 * beacon.pathLossExponent);
    // Clamp distance between 0.2m and 50m to avoid mathematical singularity
    const estimatedDistanceMeters = Math.max(0.2, Math.min(50.0, Math.pow(10, exp)));

    return {
      beaconId: beacon.beaconId,
      name: beacon.name,
      rawRssi,
      filteredRssi: Math.round(filteredRssi * 10) / 10,
      estimatedDistanceMeters: Math.round(estimatedDistanceMeters * 10) / 10,
      level: beacon.level,
      coordinates: beacon.coordinates,
      pillarId: beacon.pillarId,
      timestamp
    };
  }

  /**
   * Estimate multi-beacon proximity position (Weighted Centroid / Trilateration)
   */
  public estimatePosition(activeSamples: BleSignalSample[]): {
    coordinates: Coordinates;
    level: number;
    nearestBeacon: BleSignalSample;
    confidence: number;
  } | null {
    if (!activeSamples || activeSamples.length === 0) return null;

    // Filter samples from the last 6 seconds
    const now = Date.now();
    const validSamples = activeSamples.filter(s => (now - s.timestamp) < 6000);
    if (validSamples.length === 0) return null;

    // Determine the consensus floor level by majority weight
    const levelWeights = new Map<number, number>();
    validSamples.forEach((s) => {
      const weight = 1 / Math.max(0.5, s.estimatedDistanceMeters);
      levelWeights.set(s.level, (levelWeights.get(s.level) || 0) + weight);
    });

    let bestLevel = 0;
    let maxLevelWeight = -1;
    levelWeights.forEach((w, lvl) => {
      if (w > maxLevelWeight) {
        maxLevelWeight = w;
        bestLevel = lvl;
      }
    });

    // Only use beacons on the best estimated level
    const sameLevelSamples = validSamples.filter(s => s.level === bestLevel);
    if (sameLevelSamples.length === 0) return null;

    // Sort by signal strength (closest first)
    sameLevelSamples.sort((a, b) => b.filteredRssi - a.filteredRssi);
    const nearest = sameLevelSamples[0];

    // Compute weighted centroid: (x, y) = sum(w_i * pos_i) / sum(w_i)
    // with weight w_i = 1 / (d_i ^ 2)
    let totalWeight = 0;
    let sumX = 0;
    let sumY = 0;

    // Take at most 4 strongest beacons to avoid dilution from far-away beacons
    const topBeacons = sameLevelSamples.slice(0, 4);
    topBeacons.forEach((b) => {
      const dist = Math.max(0.5, b.estimatedDistanceMeters);
      const w = 1.0 / (dist * dist);
      sumX += b.coordinates.x * w;
      sumY += b.coordinates.y * w;
      totalWeight += w;
    });

    const estX = totalWeight > 0 ? sumX / totalWeight : nearest.coordinates.x;
    const estY = totalWeight > 0 ? sumY / totalWeight : nearest.coordinates.y;

    // Confidence metric: based on beacon count and closeness of strongest beacon
    let confidence = 0.4;
    if (nearest.filteredRssi > -65) confidence += 0.3;
    else if (nearest.filteredRssi > -75) confidence += 0.2;

    if (topBeacons.length >= 3) confidence += 0.2;
    else if (topBeacons.length >= 2) confidence += 0.1;

    return {
      coordinates: {
        x: Math.round(estX * 10) / 10,
        y: Math.round(estY * 10) / 10
      },
      level: bestLevel,
      nearestBeacon: nearest,
      confidence: Math.min(0.9, Math.round(confidence * 100) / 100)
    };
  }

  public getBeaconById(id: string): StationBleBeacon | undefined {
    return this.beaconCatalog.get(id.toUpperCase());
  }

  public getAllBeacons(): StationBleBeacon[] {
    return Array.from(this.beaconCatalog.values());
  }
}

export const bleKalmanFilterEngine = new BleKalmanFilterEngine();

