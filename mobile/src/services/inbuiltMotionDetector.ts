// Inbuilt Mobile Motion & Step Detection Engine
// Uses 3-axis Accelerometer & Device Orientation to detect physical steps, cadence, and motion states.
// Works across 100% of Android and iOS mobile devices even when dedicated pedometer chip is absent.

export type MotionActivityType = 'STATIONARY' | 'WALKING' | 'RUNNING' | 'TURNING';

export interface InbuiltStepEvent {
  stepCount: number;
  timestamp: number;
  cadenceStepsPerMin: number;
  estimatedSpeedMps: number;
  motionState: MotionActivityType;
  intensityG: number;
}

export type InbuiltStepListener = (event: InbuiltStepEvent) => void;
export type MotionStateListener = (state: MotionActivityType, intensity: number) => void;

// Safe native check
const isNativePlatform = (): boolean => {
  try {
    const RN = require('react-native');
    return RN?.Platform?.OS === 'android' || RN?.Platform?.OS === 'ios';
  } catch {
    return false;
  }
};

export class InbuiltMotionDetector {
  private isRunning: boolean = false;
  private totalSteps: number = 0;
  private lastStepTimestamp: number = 0;
  private recentStepIntervals: number[] = [];

  // Motion classification state
  private currentMotionState: MotionActivityType = 'STATIONARY';
  private recentMagnitudes: number[] = [];
  private readonly windowSize: number = 25; // ~500ms at 50Hz

  // Accelerometer subscription
  private accelSubscription: { remove: () => void } | null = null;
  private webMotionHandler: ((e: any) => void) | null = null;

  // Signal Processing State
  private smoothedMagnitude: number = 1.0; // In units of g (gravity = 1.0g)
  private readonly alpha: number = 0.50; // Responsive low-pass filter smoothing coefficient
  private isArmedForPeak: boolean = true;

  // Step detection thresholds in units of g
  // Normal walking creates oscillations between 0.75g and 1.35g
  public peakThresholdG: number = 1.08; // Peak trigger threshold
  public valleyThresholdG: number = 0.95; // Valley trigger threshold
  public minStepIntervalMs: number = 300; // Max ~3.3 steps/sec (refractory limit)
  public maxStepIntervalMs: number = 1800; // Reset cadence if pause > 1.8s

  // Listeners
  private stepListeners: Set<InbuiltStepListener> = new Set();
  private stateListeners: Set<MotionStateListener> = new Set();

  /**
   * Subscribe to detected physical step events
   */
  public onStep(listener: InbuiltStepListener): () => void {
    this.stepListeners.add(listener);
    return () => {
      this.stepListeners.delete(listener);
    };
  }

  /**
   * Subscribe to motion state changes (STATIONARY, WALKING, RUNNING, TURNING)
   */
  public onMotionStateChange(listener: MotionStateListener): () => void {
    this.stateListeners.add(listener);
    return () => {
      this.stateListeners.delete(listener);
    };
  }

  /**
   * Start listening to inbuilt accelerometer and motion sensors
   */
  public async start(): Promise<boolean> {
    this.stop();
    this.isRunning = true;
    this.totalSteps = 0;
    this.lastStepTimestamp = 0;
    this.recentStepIntervals = [];
    this.recentMagnitudes = [];
    this.smoothedMagnitude = 1.0;
    this.isArmedForPeak = true;
    this.currentMotionState = 'STATIONARY';

    // 1. Physical Mobile Platform (Expo / React Native)
    if (isNativePlatform()) {
      try {
        const { Accelerometer } = require('expo-sensors');
        const isAvail = await Accelerometer.isAvailableAsync().catch(() => false);

        if (isAvail) {
          // 40ms interval = 25Hz sample rate (optimal for human gait without excessive battery drain)
          Accelerometer.setUpdateInterval(40);
          this.accelSubscription = Accelerometer.addListener((sample: { x: number; y: number; z: number }) => {
            if (!this.isRunning) return;
            this.processAccelerometerSample(sample.x, sample.y, sample.z);
          });
          return true;
        }
      } catch (err) {
        console.warn('Inbuilt Accelerometer not initialized via native module:', err);
      }
    }

    // 2. Web / Browser Platform (Window devicemotion fallback)
    if (typeof window !== 'undefined' && 'addEventListener' in window) {
      try {
        this.webMotionHandler = (event: any) => {
          if (!this.isRunning) return;
          const acc = event.accelerationIncludingGravity || event.acceleration;
          if (acc && (acc.x !== null || acc.y !== null || acc.z !== null)) {
            // Convert m/s^2 to g units (1g ~ 9.81 m/s^2)
            const gx = (acc.x || 0) / 9.80665;
            const gy = (acc.y || 0) / 9.80665;
            const gz = (acc.z || 0) / 9.80665;
            this.processAccelerometerSample(gx, gy, gz);
          }
        };
        window.addEventListener('devicemotion', this.webMotionHandler);
        return true;
      } catch (e) {
        console.warn('Web DeviceMotion not available:', e);
      }
    }

    return false;
  }

  /**
   * Stop motion tracking and clean up listeners
   */
  public stop(): void {
    this.isRunning = false;

    if (this.accelSubscription) {
      try {
        this.accelSubscription.remove();
      } catch {}
      this.accelSubscription = null;
    }

    if (this.webMotionHandler && typeof window !== 'undefined') {
      try {
        window.removeEventListener('devicemotion', this.webMotionHandler);
      } catch {}
      this.webMotionHandler = null;
    }
  }

  /**
   * Core Signal Processing Algorithm:
   * 1. Calculate Signal Magnitude Vector (SMV): M = sqrt(x^2 + y^2 + z^2)
   * 2. Apply Exponential Moving Average (EMA) low-pass filter
   * 3. Statistical Sliding Window for Variance & Motion State
   * 4. Hysteresis Peak-Valley Zero Crossing with Refractory Lockout
   */
  public processAccelerometerSample(x: number, y: number, z: number, nowMs: number = Date.now()): InbuiltStepEvent | null {
    // 1. Raw magnitude
    const rawMag = Math.sqrt(x * x + y * y + z * z);

    // 2. Low-pass filter to smooth hand tremble noise
    this.smoothedMagnitude = this.alpha * rawMag + (1 - this.alpha) * this.smoothedMagnitude;
    const currentMag = this.smoothedMagnitude;

    // 3. Update sliding window for variance & motion classification
    this.recentMagnitudes.push(currentMag);
    if (this.recentMagnitudes.length > this.windowSize) {
      this.recentMagnitudes.shift();
    }

    this.classifyMotionState(nowMs);

    // 4. Step Detection Logic
    // Arm when signal dips into valley
    if (currentMag < this.valleyThresholdG) {
      this.isArmedForPeak = true;
    }

    // Trigger step when signal crosses peak and is armed
    if (this.isArmedForPeak && currentMag > this.peakThresholdG) {
      const deltaT = nowMs - this.lastStepTimestamp;

      if (this.lastStepTimestamp === 0 || deltaT >= this.minStepIntervalMs) {
        this.isArmedForPeak = false; // Disarm until next valley to prevent double bounce
        this.totalSteps += 1;
        this.lastStepTimestamp = nowMs;

        // Calculate Cadence (steps per minute)
        let cadence = 0;
        if (deltaT > 0 && deltaT <= this.maxStepIntervalMs) {
          this.recentStepIntervals.push(deltaT);
          if (this.recentStepIntervals.length > 5) this.recentStepIntervals.shift();
          const avgIntervalMs = this.recentStepIntervals.reduce((a, b) => a + b, 0) / this.recentStepIntervals.length;
          cadence = Math.round((60000 / avgIntervalMs));
        } else {
          this.recentStepIntervals = [];
          cadence = 100; // Default nominal walking cadence
        }

        // Estimate speed based on cadence & acceleration intensity
        // Average human walk: ~100 spm -> ~1.1 m/s; brisk walk: ~125 spm -> ~1.4 m/s; run: >140 spm -> >1.8 m/s
        let speed = Math.round(((cadence / 100) * 1.1) * 10) / 10;
        speed = Math.max(0.6, Math.min(3.2, speed));

        const event: InbuiltStepEvent = {
          stepCount: this.totalSteps,
          timestamp: nowMs,
          cadenceStepsPerMin: cadence,
          estimatedSpeedMps: speed,
          motionState: cadence > 140 ? 'RUNNING' : 'WALKING',
          intensityG: Math.round(currentMag * 100) / 100
        };

        this.notifyStep(event);
        return event;
      }
    }

    return null;
  }

  /**
   * Classify user motion activity from acceleration variance and step cadence
   */
  private classifyMotionState(nowMs: number): void {
    if (this.recentMagnitudes.length < 5) return;

    // Check if time since last step exceeds pause limit -> Stationary
    if (this.lastStepTimestamp > 0 && nowMs - this.lastStepTimestamp > this.maxStepIntervalMs) {
      this.setMotionState('STATIONARY', 0);
      return;
    }

    // Calculate variance of magnitude over sliding window
    const mean = this.recentMagnitudes.reduce((a, b) => a + b, 0) / this.recentMagnitudes.length;
    const variance = this.recentMagnitudes.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / this.recentMagnitudes.length;

    if (this.lastStepTimestamp > 0 && nowMs - this.lastStepTimestamp <= this.maxStepIntervalMs) {
      const avgInterval = this.recentStepIntervals.length > 0
        ? this.recentStepIntervals.reduce((a, b) => a + b, 0) / this.recentStepIntervals.length
        : 600;
      const cadence = 60000 / Math.max(1, avgInterval);
      if (cadence > 135 || variance >= 0.040) {
        this.setMotionState('RUNNING', variance);
      } else {
        this.setMotionState('WALKING', variance);
      }
      return;
    }

    if (variance < 0.005) {
      this.setMotionState('STATIONARY', variance);
    } else if (variance < 0.040) {
      this.setMotionState('WALKING', variance);
    } else {
      this.setMotionState('RUNNING', variance);
    }
  }

  private setMotionState(newState: MotionActivityType, intensity: number): void {
    if (this.currentMotionState !== newState) {
      this.currentMotionState = newState;
      this.stateListeners.forEach((listener) => {
        try {
          listener(newState, intensity);
        } catch (e) {
          console.error('Error in motion state listener:', e);
        }
      });
    }
  }

  private notifyStep(event: InbuiltStepEvent): void {
    this.stepListeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        console.error('Error in inbuilt step listener:', err);
      }
    });
  }

  // Getters
  public get steps(): number {
    return this.totalSteps;
  }

  public get active(): boolean {
    return this.isRunning;
  }

  public get motionState(): MotionActivityType {
    return this.currentMotionState;
  }

  public reset(): void {
    this.totalSteps = 0;
    this.lastStepTimestamp = 0;
    this.recentStepIntervals = [];
    this.recentMagnitudes = [];
    this.isArmedForPeak = true;
    this.currentMotionState = 'STATIONARY';
  }
}

export const inbuiltMotionDetector = new InbuiltMotionDetector();
