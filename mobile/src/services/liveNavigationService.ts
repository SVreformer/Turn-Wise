import { Coordinates, StationNode, StationEdge, RouteResult, RouteStep, localRouter } from './localRouter';
import { topologicalMapMatcher } from '../addons/indoor-navigation/positioning/mapMatcher';
import { georeferenceService, GpsLocation } from './georeferenceService';
import { inbuiltMotionDetector, MotionActivityType } from './inbuiltMotionDetector';

// Safe platform check without top-level react-native Flow module import issues
const isNativePlatform = (): boolean => {
  try {
    const RN = require('react-native');
    return RN?.Platform?.OS === 'android' || RN?.Platform?.OS === 'ios';
  } catch {
    return false;
  }
};

// Types for live navigation
export type LocationConfidence = 'HIGH' | 'MEDIUM' | 'LOW';
export type SensorStatus = 'ACTIVE' | 'UNAVAILABLE' | 'PERMISSION_DENIED' | 'OFFLINE';

export interface LiveNavUpdate {
  coordinates: Coordinates;
  headingDegrees: number;
  headingDirection: string;
  stepsTaken: number;
  distanceTravelledMeters: number;
  distanceRemainingMeters: number;
  estimatedTimeRemainingMinutes: number;
  nearestNode: StationNode | null;
  nearestZoneName: string;
  confidence: LocationConfidence;
  sensorStatus: SensorStatus;
  isOffRoute: boolean;
  consecutiveDeviations: number;
  currentStepIndex: number;
  currentInstruction: string;
  nextTurnDistanceMeters: number;
  deviationMeters: number;
  motionActivity: MotionActivityType;
  cadenceStepsPerMin: number;
  sensorSourceDescription: string;
}

export interface ArrivalSummaryData {
  destinationName: string;
  totalSteps: number;
  distanceMeters: number;
  durationSeconds: number;
  averageSpeedMps: number;
  profileId: string;
}

export type LiveNavListener = (update: LiveNavUpdate) => void;
export type ArrivalListener = (summary: ArrivalSummaryData) => void;
export type OffRouteListener = (deviationMeters: number, nearestNode: StationNode) => void;

export class LiveNavigationService {
  // Sensor subscriptions
  private pedometerSubscription: { remove: () => void } | null = null;
  private magnetometerSubscription: { remove: () => void } | null = null;
  private locationSubscription: { remove: () => void } | null = null;
  private webWatchId: number | null = null;
  private inbuiltDetectorUnsub: (() => void) | null = null;
  private motionStateUnsub: (() => void) | null = null;

  // Inbuilt motion & gait state
  private motionActivity: MotionActivityType = 'STATIONARY';
  private currentCadence: number = 0;
  private lastStepSource: 'PEDOMETER' | 'INBUILT_ACCEL' | 'MANUAL' = 'INBUILT_ACCEL';
  private lastProcessedStepTime: number = 0;

  // Navigation & Tracking state
  private isRunning: boolean = false;
  private isContinuousTracking: boolean = false;
  private lastGpsReading: GpsLocation | null = null;
  private activeRoute: RouteResult | null = null;
  private currentStepIndex: number = 0;
  private selectedProfileId: string = 'first_time';
  private blockedFacilityIds: string[] = [];

  // Positioning & PDR state
  private currentCoordinates: Coordinates = { x: 0, y: 0 };
  private currentBearing: number = 0;
  private sessionSteps: number = 0;
  private previousSensorSteps: number = 0;
  private lastAnchorDistanceMeters: number = 0;
  private startTimeMs: number = 0;
  private sensorStatus: SensorStatus = 'UNAVAILABLE';

  // Configurable thresholds & parameters
  public strideLengthMeters: number = 0.70; // Configurable stride length
  public readonly pixelsPerMeter: number = 6.9; // Scale factor: ~6.9 pixels per physical meter
  public readonly deviationThresholdMeters: number = 8.0; // 8 meters wrong-turn threshold
  public readonly deviationTriggerCount: number = 3; // 3 consecutive deviation updates
  public readonly arrivalDistanceThresholdMeters: number = 10.0; // 10 meters destination threshold
  public readonly highConfidenceDistanceLimitMeters: number = 25.0; // QR anchor remains HIGH up to 25m
  public readonly lowConfidenceDistanceLimitMeters: number = 55.0; // Degrades to LOW after 55m without anchor

  // Deviation tracking
  private consecutiveDeviations: number = 0;
  private isCurrentlyOffRoute: boolean = false;
  private lastDeviationDistanceMeters: number = 0;
  private hasArrived: boolean = false;

  // Listeners
  private updateListeners: Set<LiveNavListener> = new Set();
  private arrivalListeners: Set<ArrivalListener> = new Set();
  private offRouteListeners: Set<OffRouteListener> = new Set();

  constructor() {
    // Calibrate stride based on default profiles
    this.calibrateStrideForProfile('first_time');
  }

  /**
   * Set user profile and calibrate stride length
   */
  public calibrateStrideForProfile(profileId: string): void {
    this.selectedProfileId = profileId;
    switch (profileId) {
      case 'wheelchair':
        this.strideLengthMeters = 0.60;
        break;
      case 'elderly':
      case 'visual':
        this.strideLengthMeters = 0.65;
        break;
      case 'luggage':
        this.strideLengthMeters = 0.68;
        break;
      case 'pregnant':
        this.strideLengthMeters = 0.65;
        break;
      default:
        this.strideLengthMeters = 0.72;
        break;
    }
  }

  /**
   * Subscribe to live navigation updates
   */
  public onUpdate(listener: LiveNavListener): () => void {
    this.updateListeners.add(listener);
    if (this.isRunning) {
      listener(this.generateUpdatePayload());
    }
    return () => {
      this.updateListeners.delete(listener);
    };
  }

  public onArrival(listener: ArrivalListener): () => void {
    this.arrivalListeners.add(listener);
    return () => {
      this.arrivalListeners.delete(listener);
    };
  }

  public onOffRoute(listener: OffRouteListener): () => void {
    this.offRouteListeners.add(listener);
    return () => {
      this.offRouteListeners.delete(listener);
    };
  }

  /**
   * Start live indoor navigation
   */
  public async start(
    route: RouteResult,
    profileId: string = 'first_time',
    blockedIds: string[] = []
  ): Promise<{ sensorStatus: SensorStatus }> {
    this.stop(); // Clean any previous session

    this.activeRoute = route;
    this.currentStepIndex = 0;
    this.selectedProfileId = profileId;
    this.blockedFacilityIds = [...blockedIds];
    this.calibrateStrideForProfile(profileId);

    // Initial position starts at start node of route
    this.currentCoordinates = { ...route.start.coordinates };
    this.sessionSteps = 0;
    this.previousSensorSteps = 0;
    this.lastAnchorDistanceMeters = 0;
    this.consecutiveDeviations = 0;
    this.isCurrentlyOffRoute = false;
    this.startTimeMs = Date.now();
    this.lastProcessedStepTime = 0;
    this.motionActivity = 'STATIONARY';
    this.currentCadence = 0;
    this.lastStepSource = 'INBUILT_ACCEL';
    this.isRunning = true;
    this.hasArrived = false;

    // Calculate initial bearing towards the first step waypoint
    if (route.steps.length > 0) {
      const step0 = route.steps[0];
      const fromCoord = step0.fromCoords || localRouter.getNode(step0.fromNode)?.coordinates;
      const toCoord = step0.toCoords || localRouter.getNode(step0.toNode)?.coordinates;
      if (fromCoord && toCoord) {
        this.currentBearing = this.calculateAngleDegrees(fromCoord, toCoord);
      }
    }

    // Initialize physical sensors on supported platforms
    await this.initHardwareSensors();

    // Broadcast initial state
    this.emitUpdate();

    return { sensorStatus: this.sensorStatus };
  }

  /**
   * Start Standalone Continuous Live Tracking (Tracks user with GPS + Pedometer even without active route)
   */
  public async startContinuousTracking(initialCoords?: Coordinates): Promise<{ sensorStatus: SensorStatus }> {
    this.stop();
    this.isContinuousTracking = true;
    this.isRunning = true;
    this.activeRoute = null;
    this.sessionSteps = 0;
    this.previousSensorSteps = 0;
    this.lastAnchorDistanceMeters = 0;
    this.consecutiveDeviations = 0;
    this.isCurrentlyOffRoute = false;
    this.startTimeMs = Date.now();
    this.lastProcessedStepTime = 0;
    this.motionActivity = 'STATIONARY';
    this.currentCadence = 0;
    this.lastStepSource = 'INBUILT_ACCEL';

    if (initialCoords) {
      this.currentCoordinates = { ...initialCoords };
    } else {
      const defaultNode = localRouter.nodeDict.get('node_entry_t1_main_east');
      this.currentCoordinates = defaultNode ? { ...defaultNode.coordinates } : { x: 1811, y: 1163 };
    }

    await this.initHardwareSensors();
    this.emitUpdate();
    return { sensorStatus: this.sensorStatus };
  }

  /**
   * Stop active navigation/tracking and cleanup all hardware sensor and GPS listeners
   */
  public stop(): void {
    this.isRunning = false;
    this.isContinuousTracking = false;

    if (this.pedometerSubscription) {
      try {
        this.pedometerSubscription.remove();
      } catch {}
      this.pedometerSubscription = null;
    }

    if (this.magnetometerSubscription) {
      try {
        this.magnetometerSubscription.remove();
      } catch {}
      this.magnetometerSubscription = null;
    }

    if (this.locationSubscription) {
      try {
        this.locationSubscription.remove();
      } catch {}
      this.locationSubscription = null;
    }

    if (this.webWatchId !== null && typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      try {
        navigator.geolocation.clearWatch(this.webWatchId);
      } catch {}
      this.webWatchId = null;
    }

    if (this.inbuiltDetectorUnsub) {
      try {
        this.inbuiltDetectorUnsub();
      } catch {}
      this.inbuiltDetectorUnsub = null;
    }

    if (this.motionStateUnsub) {
      try {
        this.motionStateUnsub();
      } catch {}
      this.motionStateUnsub = null;
    }

    try {
      inbuiltMotionDetector.stop();
    } catch {}
  }

  /**
   * Initialize Expo Pedometer, Magnetometer, GPS Location, and Inbuilt 3-Axis Motion Sensor
   */
  private async initHardwareSensors(): Promise<void> {
    // 1. Web browser fallback for GPS
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      try {
        this.webWatchId = navigator.geolocation.watchPosition(
          (pos) => {
            if (!this.isRunning) return;
            this.processGpsUpdate({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
              heading: pos.coords.heading,
              speed: pos.coords.speed,
              timestamp: pos.timestamp
            });
          },
          (err) => console.warn('Web Geolocation status:', err.message),
          { enableHighAccuracy: true, maximumAge: 3000, timeout: 12000 }
        );
      } catch {}
    }

    // 2. Mobile Native Sensors (Expo Pedometer, Magnetometer, Location)
    if (isNativePlatform()) {
      try {
        // Dynamically require expo-sensors and expo-location
        const Sensors = require('expo-sensors');
        const { Pedometer, Magnetometer } = Sensors;

        // A. Dedicated Pedometer Chip
        const isPedometerAvailable = await Pedometer.isAvailableAsync().catch(() => false);
        if (isPedometerAvailable) {
          const perm = await Pedometer.requestPermissionsAsync().catch(() => ({ status: 'denied' }));
          if (perm.status === 'granted') {
            this.sensorStatus = 'ACTIVE';
            this.previousSensorSteps = 0;

            this.pedometerSubscription = Pedometer.watchStepCount((result: { steps: number }) => {
              if (!this.isRunning) return;
              const delta = result.steps - this.previousSensorSteps;
              if (delta > 0 && delta < 50) { // Discard abnormal sensor jumps
                this.previousSensorSteps = result.steps;
                this.lastProcessedStepTime = Date.now();
                this.lastStepSource = 'PEDOMETER';
                this.processPhysicalSteps(delta);
              } else if (this.previousSensorSteps === 0 && result.steps > 0) {
                this.previousSensorSteps = result.steps;
                this.lastProcessedStepTime = Date.now();
                this.lastStepSource = 'PEDOMETER';
                this.processPhysicalSteps(1);
              }
            });
          } else {
            this.sensorStatus = 'PERMISSION_DENIED';
          }
        }

        // B. Magnetometer for smooth compass bearing
        const isMagAvailable = await Magnetometer.isAvailableAsync().catch(() => false);
        if (isMagAvailable) {
          Magnetometer.setUpdateInterval(250);
          this.magnetometerSubscription = Magnetometer.addListener((data: { x: number; y: number; z: number }) => {
            if (!this.isRunning) return;
            let angle = Math.atan2(-data.y, data.x) * (180 / Math.PI);
            if (angle < 0) angle += 360;
            this.currentBearing = Math.round(angle);
          });
        }

        // C. Expo Location (GPS)
        try {
          const Location = require('expo-location');
          const permLoc = await Location.requestForegroundPermissionsAsync().catch(() => ({ status: 'denied' }));
          if (permLoc.status === 'granted') {
            Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).then((loc: any) => {
              if (loc && loc.coords) {
                this.processGpsUpdate(loc.coords);
              }
            }).catch(() => {});

            this.locationSubscription = await Location.watchPositionAsync(
              {
                accuracy: Location.Accuracy.High,
                distanceInterval: 1, // trigger every 1 metre
                timeInterval: 1500  // or every 1.5 seconds
              },
              (loc: any) => {
                if (!this.isRunning) return;
                this.processGpsUpdate(loc.coords);
              }
            );
          }
        } catch (locErr) {
          console.warn('Native GPS watch not initialized:', locErr);
        }
      } catch (err) {
        console.warn('Native sensors not initialized on this platform:', err);
      }
    }

    // 3. Initialize Inbuilt 3-Axis Accelerometer Motion & Gait Detector
    // Works across 100% of mobile phones (including when pedometer chip is absent) and mobile web
    try {
      const started = await inbuiltMotionDetector.start();
      if (started && this.sensorStatus !== 'ACTIVE') {
        this.sensorStatus = 'ACTIVE';
      }

      this.inbuiltDetectorUnsub = inbuiltMotionDetector.onStep((stepEvent) => {
        if (!this.isRunning) return;
        const now = Date.now();
        // Prevent duplicate counting if dedicated hardware pedometer recently fired within 340ms
        if (now - this.lastProcessedStepTime < 340) {
          return;
        }
        this.lastProcessedStepTime = now;
        this.lastStepSource = 'INBUILT_ACCEL';
        this.currentCadence = stepEvent.cadenceStepsPerMin;
        this.processPhysicalSteps(1);
      });

      this.motionStateUnsub = inbuiltMotionDetector.onMotionStateChange((state) => {
        if (!this.isRunning) return;
        this.motionActivity = state;
        this.emitUpdate();
      });
    } catch (inbuiltErr) {
      console.warn('Inbuilt motion detector failed to start:', inbuiltErr);
    }
  }

  /**
   * Process GPS coordinates update and fuse with station map coordinates
   */
  public processGpsUpdate(gps: GpsLocation): void {
    this.lastGpsReading = gps;
    const stationCoords = georeferenceService.gpsToStationCoordinates(gps);
    if (!stationCoords) return;

    // Snap continuous coordinates to nearest walkable station corridor
    const snapped = topologicalMapMatcher.snapToWalkway(stationCoords, 0);
    const finalCoords = snapped.isWithinBounds ? snapped.snappedCoordinates : stationCoords;
    const accuracy = gps.accuracy || 20;

    if (accuracy <= 15) {
      // High-precision outdoor or entrance gate GPS fix -> directly anchor location
      this.currentCoordinates = finalCoords;
      this.lastAnchorDistanceMeters = 0;
    } else {
      // Indoor / covered platform: complementary blend of GPS with PDR
      const weightGps = Math.max(0.20, Math.min(0.60, 10 / accuracy));
      this.currentCoordinates = {
        x: Math.round((this.currentCoordinates.x * (1 - weightGps) + finalCoords.x * weightGps) * 10) / 10,
        y: Math.round((this.currentCoordinates.y * (1 - weightGps) + finalCoords.y * weightGps) * 10) / 10
      };
    }

    if (gps.heading !== undefined && gps.heading !== null && gps.heading >= 0) {
      this.currentBearing = Math.round(gps.heading);
    }

    if (this.activeRoute) {
      this.checkRouteDeviation();
      this.checkDestinationArrival();
    }

    this.emitUpdate();
  }

  /**
   * Process physically detected step(s) from Pedometer or motion sensors
   */
  public processPhysicalSteps(stepCount: number = 1): void {
    if (!this.isRunning) return;

    this.sessionSteps += stepCount;
    const distanceMeters = stepCount * this.strideLengthMeters;
    this.lastAnchorDistanceMeters += distanceMeters;

    // Displacement in SVG pixels
    const pixelDistance = distanceMeters * this.pixelsPerMeter;

    // A. Free-Walking Exploration Mode (No Active Route)
    if (!this.activeRoute) {
      const rad = (this.currentBearing - 90) * (Math.PI / 180);
      this.currentCoordinates = {
        x: this.currentCoordinates.x + Math.cos(rad) * pixelDistance,
        y: this.currentCoordinates.y + Math.sin(rad) * pixelDistance
      };

      // Snap to nearest walkable corridor
      const snapped = topologicalMapMatcher.snapToWalkway(this.currentCoordinates, 0);
      if (snapped.isWithinBounds) {
        this.currentCoordinates = snapped.snappedCoordinates;
      }
      this.emitUpdate();
      return;
    }

    // B. Route-Guided Navigation Mode
    const currentStep = this.activeRoute.steps[this.currentStepIndex];
    if (currentStep) {
      const stepStart = currentStep.fromCoords || localRouter.getNode(currentStep.fromNode)?.coordinates;
      const stepEnd = currentStep.toCoords || localRouter.getNode(currentStep.toNode)?.coordinates;

      if (stepStart && stepEnd) {
        // Target vector towards current waypoint
        const targetDx = stepEnd.x - this.currentCoordinates.x;
        const targetDy = stepEnd.y - this.currentCoordinates.y;
        const distToWaypointPixels = Math.sqrt(targetDx * targetDx + targetDy * targetDy);

        if (distToWaypointPixels <= pixelDistance || distToWaypointPixels < 15) {
          // Reached current waypoint! Advance to next waypoint
          this.currentCoordinates = { ...stepEnd };
          this.advanceToNextStep();
        } else {
          // Move forward along the corridor towards the waypoint
          const fraction = pixelDistance / distToWaypointPixels;
          this.currentCoordinates = {
            x: Math.round((this.currentCoordinates.x + targetDx * fraction) * 10) / 10,
            y: Math.round((this.currentCoordinates.y + targetDy * fraction) * 10) / 10
          };
        }
      }
    } else {
      // If no active step, move in direction of compass bearing
      const rad = (this.currentBearing - 90) * (Math.PI / 180);
      this.currentCoordinates = {
        x: this.currentCoordinates.x + Math.cos(rad) * pixelDistance,
        y: this.currentCoordinates.y + Math.sin(rad) * pixelDistance
      };
    }

    // Off-Route & Arrival Checks
    this.checkRouteDeviation();
    this.checkDestinationArrival();

    this.emitUpdate();
  }

  /**
   * Manual step simulation for Web browser or testing without physical pedometer
   */
  public simulateStep(stepCount: number = 1): void {
    this.lastStepSource = 'MANUAL';
    this.motionActivity = 'WALKING';
    this.currentCadence = 100;
    this.processPhysicalSteps(stepCount);
  }

  /**
   * Advance to the next turn/waypoint on the route
   */
  public advanceToNextStep(): void {
    if (!this.activeRoute) return;

    if (this.currentStepIndex < this.activeRoute.steps.length - 1) {
      this.currentStepIndex += 1;
      const nextStep = this.activeRoute.steps[this.currentStepIndex];
      const nextFrom = nextStep.fromCoords || localRouter.getNode(nextStep.fromNode)?.coordinates;
      const nextTo = nextStep.toCoords || localRouter.getNode(nextStep.toNode)?.coordinates;

      if (nextFrom && nextTo) {
        this.currentBearing = this.calculateAngleDegrees(nextFrom, nextTo);
      }
    } else {
      // Final destination reached
      this.checkDestinationArrival(true);
    }
  }

  /**
   * Go back to the previous step
   */
  public previousStep(): void {
    if (!this.activeRoute || this.currentStepIndex === 0) return;
    this.currentStepIndex -= 1;
    const step = this.activeRoute.steps[this.currentStepIndex];
    const fromCoord = step.fromCoords || localRouter.getNode(step.fromNode)?.coordinates;
    if (fromCoord) {
      this.currentCoordinates = { ...fromCoord };
    }
    this.emitUpdate();
  }

  /**
   * Re-anchor position using a scanned QR Checkpoint
   */
  public anchorToCheckpoint(checkpointNodeId: string): boolean {
    const node = localRouter.nodeDict.get(checkpointNodeId);
    if (!node) return false;

    // Update coordinates to ground truth
    this.currentCoordinates = { ...node.coordinates };
    this.lastAnchorDistanceMeters = 0;
    this.consecutiveDeviations = 0;
    this.isCurrentlyOffRoute = false;

    // Recalculate remaining route from this checkpoint to original destination
    if (this.activeRoute && this.activeRoute.destination) {
      const remainingRoute = localRouter.findRoute(
        node.id,
        this.activeRoute.destination.id,
        this.selectedProfileId,
        this.blockedFacilityIds
      );
      if (remainingRoute) {
        this.activeRoute = remainingRoute;
        this.currentStepIndex = 0;
      }
    }

    this.emitUpdate();
    return true;
  }

  /**
   * Off-Route Detection:
   * Calculate perpendicular deviation from the planned route polyline.
   * If deviation > 8m for 3 consecutive updates -> trigger automatic rerouting!
   */
  private checkRouteDeviation(): void {
    if (!this.activeRoute || !this.activeRoute.pathGeometry || this.activeRoute.pathGeometry.length < 2) {
      return;
    }

    const minDistancePixels = this.getPerpendicularDistanceToPolyline(
      this.currentCoordinates,
      this.activeRoute.pathGeometry
    );
    const deviationMeters = Math.round((minDistancePixels / this.pixelsPerMeter) * 10) / 10;
    this.lastDeviationDistanceMeters = deviationMeters;

    if (deviationMeters > this.deviationThresholdMeters) {
      this.consecutiveDeviations += 1;
      if (this.consecutiveDeviations >= this.deviationTriggerCount && !this.isCurrentlyOffRoute) {
        this.isCurrentlyOffRoute = true;
        this.handleOffRouteDetected(deviationMeters);
      }
    } else {
      // Back on route
      this.consecutiveDeviations = 0;
      this.isCurrentlyOffRoute = false;
    }
  }

  /**
   * Handle off-route trigger: identify nearest valid node and recalculate A* route
   */
  private handleOffRouteDetected(deviationMeters: number): void {
    // 1. Find nearest valid graph node to current position
    const nearest = this.findNearestGraphNode(this.currentCoordinates);
    if (!nearest || !this.activeRoute) return;

    // Notify off-route listeners
    this.offRouteListeners.forEach((listener) => {
      try {
        listener(deviationMeters, nearest);
      } catch (err) {
        console.error('Error in offRouteListener:', err);
      }
    });

    // Check confidence: If confidence is LOW (>50m drift), we ask for QR scan instead of misleading reroute
    if (this.currentConfidence === 'LOW') {
      return;
    }

    // 2. Perform dynamic reroute using existing A* algorithm
    // Respects accessibility profiles (wheelchair never takes stairs) and blockages
    const newRoute = localRouter.findRoute(
      nearest.id,
      this.activeRoute.destination.id,
      this.selectedProfileId,
      this.blockedFacilityIds
    );

    if (newRoute) {
      this.activeRoute = newRoute;
      this.currentStepIndex = 0;
      this.consecutiveDeviations = 0;
      this.isCurrentlyOffRoute = false;
    }
  }

  /**
   * Destination Arrival Detection:
   * Euclidean distance to destination node <= 10m on last step or forced via final waypoint arrival
   */
  private checkDestinationArrival(forced: boolean = false): void {
    if (!this.activeRoute || !this.activeRoute.destination || this.hasArrived) return;

    const destCoords = this.activeRoute.destination.coordinates;
    const dx = destCoords.x - this.currentCoordinates.x;
    const dy = destCoords.y - this.currentCoordinates.y;
    const distMeters = Math.sqrt(dx * dx + dy * dy) / this.pixelsPerMeter;

    if (distMeters <= this.arrivalDistanceThresholdMeters || forced) {
      this.hasArrived = true;
      const durationSeconds = Math.max(1, Math.round((Date.now() - this.startTimeMs) / 1000));
      const walkedDist = Math.round(this.sessionSteps * this.strideLengthMeters);
      const totalDistance = walkedDist > 0 ? walkedDist : (this.activeRoute.totalDistanceMeters || 10);
      const totalSteps = this.sessionSteps > 0 ? this.sessionSteps : Math.max(1, Math.round(totalDistance / this.strideLengthMeters));
      const avgSpeed = Math.round((totalDistance / durationSeconds) * 10) / 10;

      const summary: ArrivalSummaryData = {
        destinationName: this.activeRoute.destination.name,
        totalSteps,
        distanceMeters: totalDistance,
        durationSeconds,
        averageSpeedMps: avgSpeed > 0 ? avgSpeed : 1.1,
        profileId: this.selectedProfileId
      };

      // Stop active hardware sensors and navigation
      this.stop();

      // Trigger arrival callbacks
      this.arrivalListeners.forEach((listener) => {
        try {
          listener(summary);
        } catch (err) {
          console.error('Error in arrivalListener:', err);
        }
      });
    }
  }

  /**
   * Location Confidence State Machine:
   * HIGH: Recently confirmed by QR checkpoint or within 25m of anchor
   * MEDIUM: Sensor dead reckoning between 25m and 55m
   * LOW: Accumulated drift > 55m or high deviation -> prompt QR scan
   */
  public get currentConfidence(): LocationConfidence {
    if (this.lastAnchorDistanceMeters <= this.highConfidenceDistanceLimitMeters && !this.isCurrentlyOffRoute) {
      return 'HIGH';
    }
    if (this.lastAnchorDistanceMeters <= this.lowConfidenceDistanceLimitMeters && this.consecutiveDeviations < 2) {
      return 'MEDIUM';
    }
    return 'LOW';
  }

  /**
   * Generate state payload for UI components
   */
  public generateUpdatePayload(): LiveNavUpdate {
    const nearestNode = this.findNearestGraphNode(this.currentCoordinates);
    const totalDist = this.activeRoute ? this.activeRoute.totalDistanceMeters : 0;
    const walkedDist = Math.round(this.sessionSteps * this.strideLengthMeters);
    const remainingDist = Math.max(0, totalDist - walkedDist);
    const estTimeMinutes = Math.max(1, Math.ceil(remainingDist / (this.strideLengthMeters * 60)));

    const currentStep = this.activeRoute?.steps[this.currentStepIndex];
    let nextTurnDist = 0;
    if (currentStep) {
      const stepEnd = currentStep.toCoords || localRouter.getNode(currentStep.toNode)?.coordinates;
      if (stepEnd) {
        const dx = stepEnd.x - this.currentCoordinates.x;
        const dy = stepEnd.y - this.currentCoordinates.y;
        nextTurnDist = Math.round(Math.sqrt(dx * dx + dy * dy) / this.pixelsPerMeter);
      }
    }

    let sourceDesc = '📱 Inbuilt Motion + Compass';
    if (this.lastStepSource === 'PEDOMETER') {
      sourceDesc = '📱 Hardware Pedometer + Compass';
    } else if (this.lastStepSource === 'MANUAL') {
      sourceDesc = '🕹️ Manual / Simulated Steps';
    }

    return {
      coordinates: { ...this.currentCoordinates },
      headingDegrees: this.currentBearing,
      headingDirection: this.getCompassLabel(this.currentBearing),
      stepsTaken: this.sessionSteps,
      distanceTravelledMeters: walkedDist,
      distanceRemainingMeters: remainingDist,
      estimatedTimeRemainingMinutes: estTimeMinutes,
      nearestNode,
      nearestZoneName: nearestNode ? nearestNode.name : 'Station Concourse',
      confidence: this.currentConfidence,
      sensorStatus: this.sensorStatus,
      isOffRoute: this.isCurrentlyOffRoute,
      consecutiveDeviations: this.consecutiveDeviations,
      currentStepIndex: this.currentStepIndex,
      currentInstruction: currentStep ? currentStep.instruction : 'Follow station signage',
      nextTurnDistanceMeters: nextTurnDist,
      deviationMeters: this.lastDeviationDistanceMeters,
      motionActivity: this.motionActivity,
      cadenceStepsPerMin: this.currentCadence,
      sensorSourceDescription: sourceDesc
    };
  }

  private emitUpdate(): void {
    const payload = this.generateUpdatePayload();
    this.updateListeners.forEach((listener) => {
      try {
        listener(payload);
      } catch (err) {
        console.error('Error in LiveNavUpdate listener:', err);
      }
    });
  }

  // --- Helper Mathematical Functions ---

  /**
   * Find minimum perpendicular distance from point P to any segment of a polyline
   */
  public getPerpendicularDistanceToPolyline(p: Coordinates, polyline: Coordinates[]): number {
    if (polyline.length < 2) return 0;
    let minDistance = Infinity;

    for (let i = 0; i < polyline.length - 1; i++) {
      const a = polyline[i];
      const b = polyline[i + 1];
      const dist = this.distancePointToSegment(p, a, b);
      if (dist < minDistance) {
        minDistance = dist;
      }
    }

    return minDistance;
  }

  private distancePointToSegment(p: Coordinates, a: Coordinates, b: Coordinates): number {
    const abX = b.x - a.x;
    const abY = b.y - a.y;
    const abLenSq = abX * abX + abY * abY;
    if (abLenSq === 0) {
      const dx = p.x - a.x;
      const dy = p.y - a.y;
      return Math.sqrt(dx * dx + dy * dy);
    }

    const apX = p.x - a.x;
    const apY = p.y - a.y;
    let t = (apX * abX + apY * abY) / abLenSq;
    t = Math.max(0, Math.min(1, t));

    const projX = a.x + t * abX;
    const projY = a.y + t * abY;
    const dx = p.x - projX;
    const dy = p.y - projY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  public findNearestGraphNode(coords: Coordinates): StationNode | null {
    let nearest: StationNode | null = null;
    let minDistSq = Infinity;

    localRouter.nodes.forEach((n) => {
      const dx = n.coordinates.x - coords.x;
      const dy = n.coordinates.y - coords.y;
      const dSq = dx * dx + dy * dy;
      if (dSq < minDistSq) {
        minDistSq = dSq;
        nearest = n;
      }
    });

    return nearest;
  }

  public calculateAngleDegrees(from: Coordinates, to: Coordinates): number {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const deg = Math.round(Math.atan2(dy, dx) * (180 / Math.PI));
    return (deg + 360) % 360;
  }

  public getCompassLabel(degrees: number): string {
    const val = Math.floor((degrees / 45) + 0.5) % 8;
    const dirs = ['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE'];
    return dirs[val];
  }

  // Getters
  public get route(): RouteResult | null {
    return this.activeRoute;
  }

  public get stepIndex(): number {
    return this.currentStepIndex;
  }

  public get coordinates(): Coordinates {
    return { ...this.currentCoordinates };
  }

  public get bearing(): number {
    return this.currentBearing;
  }

  public get steps(): number {
    return this.sessionSteps;
  }

  public get active(): boolean {
    return this.isRunning;
  }

  public get status(): SensorStatus {
    return this.sensorStatus;
  }
}

export const liveNavigationService = new LiveNavigationService();
