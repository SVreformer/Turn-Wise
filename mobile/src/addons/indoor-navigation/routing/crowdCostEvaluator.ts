import { CrowdDensityMetric } from '../types';
import defaultCrowdData from '../data/crowdTelemetry.json';

export class CrowdCostEvaluator {
  private metricsMap: Map<string, CrowdDensityMetric> = new Map();
  // Telemetry validity TTL: 180 seconds (3 minutes)
  private readonly telemetryTtlMs = 180 * 1000;
  // Critical choke density in passengers per square meter
  private readonly criticalDensity = 3.5;

  constructor() {
    this.loadInitialTelemetry();
  }

  private loadInitialTelemetry(): void {
    (defaultCrowdData as CrowdDensityMetric[]).forEach((m) => {
      // Initialize with fresh timestamp for demo simulation
      this.metricsMap.set(m.zoneId.toUpperCase(), {
        ...m,
        timestamp: Date.now()
      });
    });
  }

  /**
   * Update or ingest real-time crowd sensor telemetry
   */
  public ingestTelemetry(metric: CrowdDensityMetric): void {
    this.metricsMap.set(metric.zoneId.toUpperCase(), {
      ...metric,
      timestamp: metric.timestamp || Date.now()
    });
  }

  /**
   * Evaluate crowd penalty for a corridor or zone
   */
  public evaluateCrowdPenalty(
    zoneOrLocationId: string,
    edgeDistanceMeters: number,
    profileId: string = 'first_time'
  ): {
    penaltyCost: number;
    delaySeconds: number;
    density: number;
    status: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
    telemetryStatus: 'AVAILABLE' | 'UNAVAILABLE' | 'STALE';
  } {
    const cleanId = zoneOrLocationId.toUpperCase();
    const metric = this.metricsMap.get(cleanId);

    // If no telemetry found or expired beyond TTL, fallback gracefully without hallucinating
    if (!metric) {
      return {
        penaltyCost: 0,
        delaySeconds: 0,
        density: 0,
        status: 'LOW',
        telemetryStatus: 'UNAVAILABLE'
      };
    }

    const age = Date.now() - metric.timestamp;
    if (age > this.telemetryTtlMs) {
      return {
        penaltyCost: 0,
        delaySeconds: 0,
        density: metric.density,
        status: metric.status,
        telemetryStatus: 'STALE'
      };
    }

    // Profile sensitivity factor alpha
    let alpha = 1.0;
    if (profileId === 'elderly' || profileId === 'child') {
      alpha = 2.5; // Highly sensitive to dense crowds
    } else if (profileId === 'mobility_disabled') {
      alpha = 3.0; // Needs clear open corridors for wheelchair clearance
    } else if (profileId === 'visually_impaired') {
      alpha = 2.0;
    }

    // Mathematical formula: P_crowd = d(e) * alpha * (rho / rho_max) ^ 2
    const ratio = Math.min(1.5, metric.density / this.criticalDensity);
    const penaltyCost = Math.round(edgeDistanceMeters * alpha * (ratio * ratio) * 10) / 10;
    const delaySeconds = Math.round(penaltyCost * 0.8);

    return {
      penaltyCost,
      delaySeconds,
      density: metric.density,
      status: metric.status,
      telemetryStatus: 'AVAILABLE'
    };
  }

  public getAllMetrics(): CrowdDensityMetric[] {
    return Array.from(this.metricsMap.values());
  }
}

export const crowdCostEvaluator = new CrowdCostEvaluator();

