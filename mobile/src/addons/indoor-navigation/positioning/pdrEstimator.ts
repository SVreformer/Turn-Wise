import { Coordinates } from '../../../services/localRouter';

export interface PdrStepEvent {
  stepCount: number;
  strideLengthMeters: number;
  headingDegrees: number;
  deltaX: number;
  deltaY: number;
  timestamp: number;
}

export class PdrEstimator {
  private lastAnchorPosition: Coordinates | null = null;
  private currentEstimatedPosition: Coordinates | null = null;
  private stepCount: number = 0;
  private cumulativeDistanceMeters: number = 0;
  private headingDegrees: number = 0;
  private defaultStrideLengthMeters: number = 0.68;
  private maxUnanchoredDistanceMeters: number = 25.0;

  // Scale factor between station SVG coordinate pixels and physical meters
  // In KSR station map: station length is ~500m across ~3456 pixels (approx 6.9 pixels/meter)
  private pixelsPerMeter: number = 6.9;

  /**
   * Re-anchor the PDR starting position to absolute ground truth
   */
  public anchor(position: Coordinates): void {
    this.lastAnchorPosition = { ...position };
    this.currentEstimatedPosition = { ...position };
    this.stepCount = 0;
    this.cumulativeDistanceMeters = 0;
  }

  /**
   * Update passenger heading from compass / magnetometer
   */
  public updateHeading(degrees: number): void {
    this.headingDegrees = (degrees % 360 + 360) % 360;
  }

  /**
   * Process a detected step
   */
  public recordStep(strideLengthMeters?: number): PdrStepEvent | null {
    if (!this.currentEstimatedPosition) return null;

    const stride = strideLengthMeters || this.defaultStrideLengthMeters;
    this.stepCount += 1;
    this.cumulativeDistanceMeters += stride;

    // Convert heading degrees to radians
    // Note: Heading 0 deg is North (-Y in SVG space), 90 deg is East (+X)
    const rad = (this.headingDegrees - 90) * (Math.PI / 180);
    const pixelDistance = stride * this.pixelsPerMeter;

    const deltaX = Math.cos(rad) * pixelDistance;
    const deltaY = Math.sin(rad) * pixelDistance;

    this.currentEstimatedPosition = {
      x: this.currentEstimatedPosition.x + deltaX,
      y: this.currentEstimatedPosition.y + deltaY
    };

    return {
      stepCount: this.stepCount,
      strideLengthMeters: stride,
      headingDegrees: this.headingDegrees,
      deltaX,
      deltaY,
      timestamp: Date.now()
    };
  }

  public get estimatedPosition(): Coordinates | null {
    return this.currentEstimatedPosition ? { ...this.currentEstimatedPosition } : null;
  }

  public get totalSteps(): number {
    return this.stepCount;
  }

  public get distanceSinceAnchorMeters(): number {
    return this.cumulativeDistanceMeters;
  }

  public get isDriftExcessive(): boolean {
    return this.cumulativeDistanceMeters > this.maxUnanchoredDistanceMeters;
  }

  public reset(): void {
    this.lastAnchorPosition = null;
    this.currentEstimatedPosition = null;
    this.stepCount = 0;
    this.cumulativeDistanceMeters = 0;
  }
}

export const pdrEstimator = new PdrEstimator();

