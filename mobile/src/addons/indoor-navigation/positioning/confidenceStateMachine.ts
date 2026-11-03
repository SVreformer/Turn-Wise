import { PositionConfidenceState, PositioningSource } from '../types';

export interface ConfidenceEvaluation {
  score: number; // 0 to 100
  state: PositionConfidenceState;
  source: PositioningSource;
  timeSinceLastAnchorSeconds: number;
  factors: {
    sourceWeightScore: number;
    decayScore: number;
    proximityScore: number;
    graphScore: number;
  };
}

export class ConfidenceStateMachine {
  private currentState: PositionConfidenceState = 'CONFIRMED';
  private currentScore: number = 100;
  private currentSource: PositioningSource = 'QR';
  private lastAnchorTimestamp: number = Date.now();
  private lastEvaluationTimestamp: number = Date.now();

  // Model weights (sum = 1.0)
  private readonly wSource = 0.35;
  private readonly wDecay = 0.25;
  private readonly wProx = 0.20;
  private readonly wGraph = 0.20;

  // Exponential decay constant: e^(-lambda * dt)
  // lambda = 0.025 means confidence naturally halves after ~28 seconds without radio/checkpoint refreshes
  private readonly lambda = 0.025;

  // Thresholds
  private readonly confirmedThreshold = 70;
  private readonly trackingThreshold = 40;
  private readonly recoveryThreshold = 15;

  /**
   * Inject ground-truth position confirmation from a verified QR checkpoint
   */
  public onQrConfirmed(): ConfidenceEvaluation {
    this.lastAnchorTimestamp = Date.now();
    this.currentSource = 'QR';
    return this.evaluate({
      sourceType: 'QR',
      nearestBeaconDistanceMeters: 0,
      isGraphConsistent: true
    });
  }

  /**
   * Update with continuous BLE beacon readings
   */
  public onBleSample(nearestBeaconDistanceMeters: number, beaconCount: number, isGraphConsistent: boolean): ConfidenceEvaluation {
    const srcType = beaconCount >= 3 ? 'BLE_HIGH' : (beaconCount >= 1 ? 'BLE_LOW' : 'PDR');
    return this.evaluate({
      sourceType: srcType,
      nearestBeaconDistanceMeters,
      isGraphConsistent
    });
  }

  /**
   * Update with Dead Reckoning steps only
   */
  public onPdrStep(distanceSinceAnchorMeters: number, isGraphConsistent: boolean): ConfidenceEvaluation {
    const isDriftHigh = distanceSinceAnchorMeters > 20.0;
    return this.evaluate({
      sourceType: 'PDR',
      nearestBeaconDistanceMeters: distanceSinceAnchorMeters,
      isGraphConsistent: isGraphConsistent && !isDriftHigh
    });
  }

  /**
   * Evaluate the mathematical confidence score and update state
   */
  public evaluate(params: {
    sourceType: 'QR' | 'BLE_HIGH' | 'BLE_LOW' | 'PDR' | 'RECOVERY';
    nearestBeaconDistanceMeters: number;
    isGraphConsistent: boolean;
  }): ConfidenceEvaluation {
    const now = Date.now();
    this.lastEvaluationTimestamp = now;
    const deltaT = Math.max(0, (now - this.lastAnchorTimestamp) / 1000);

    // 1. Source score S_source in [0, 1]
    let sSource = 0.3;
    if (params.sourceType === 'QR') {
      sSource = 1.0;
      this.currentSource = 'QR';
    } else if (params.sourceType === 'BLE_HIGH') {
      sSource = 0.8;
      this.currentSource = 'BLE';
    } else if (params.sourceType === 'BLE_LOW') {
      sSource = 0.55;
      this.currentSource = 'BLE';
    } else if (params.sourceType === 'PDR') {
      sSource = 0.35;
      this.currentSource = 'PDR';
    } else {
      sSource = 0.1;
      this.currentSource = 'RECOVERY';
    }

    // 2. Exponential time decay factor
    const sDecay = Math.exp(-this.lambda * deltaT);

    // 3. Proximity score S_prox in [0, 1]
    let sProx = 0.2;
    if (params.nearestBeaconDistanceMeters <= 3.0) {
      sProx = 1.0;
    } else if (params.nearestBeaconDistanceMeters <= 7.0) {
      sProx = 0.7;
    } else if (params.nearestBeaconDistanceMeters <= 15.0) {
      sProx = 0.4;
    }

    // 4. Graph topological consistency
    const sGraph = params.isGraphConsistent ? 1.0 : 0.0;

    // Mathematical formula: C(t) = (w1*S1 + w2*S2 + w3*S3 + w4*S4) * 100%
    const rawScore = (
      this.wSource * sSource +
      this.wDecay * sDecay +
      this.wProx * sProx +
      this.wGraph * sGraph
    ) * 100;

    const boundedScore = Math.max(5, Math.min(100, Math.round(rawScore)));
    this.currentScore = boundedScore;

    // State machine transitions
    if (boundedScore >= this.confirmedThreshold) {
      this.currentState = 'CONFIRMED';
    } else if (boundedScore >= this.trackingThreshold) {
      this.currentState = 'TRACKING';
    } else if (boundedScore >= this.recoveryThreshold) {
      this.currentState = 'UNCERTAIN';
    } else {
      this.currentState = 'RECOVERY';
    }

    return {
      score: this.currentScore,
      state: this.currentState,
      source: this.currentSource,
      timeSinceLastAnchorSeconds: Math.round(deltaT),
      factors: {
        sourceWeightScore: Math.round(this.wSource * sSource * 100),
        decayScore: Math.round(this.wDecay * sDecay * 100),
        proximityScore: Math.round(this.wProx * sProx * 100),
        graphScore: Math.round(this.wGraph * sGraph * 100)
      }
    };
  }

  public get state(): PositionConfidenceState {
    return this.currentState;
  }

  public get score(): number {
    return this.currentScore;
  }

  public get source(): PositioningSource {
    return this.currentSource;
  }
}

export const confidenceStateMachine = new ConfidenceStateMachine();

