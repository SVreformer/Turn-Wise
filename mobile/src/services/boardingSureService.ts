/**
 * BoardingSure — Profile-Aware Missed-Train Risk Predictor Service
 *
 * Implements a transparent, deterministic Profile-Aware Time Budget Algorithm:
 *  1. Available time:        T_available = T_departure - T_current
 *  2. Walking time:          T_walking = D / (V * 60)
 *  3. Difficulty penalties:  T_required = T_walking + T_turns + T_level_changes + T_obstruction + T_buffer
 *  4. Boarding safety margin: M = T_available - T_required
 *     - M > 5 min:            COMFORTABLE (Green)
 *     - 0 <= M <= 5 min:      HURRY (Amber)
 *     - M < 0 min:            HIGH RISK (Red)
 *  5. Time-deficit risk score:
 *     R = clamp(((T_required - T_available) / T_required) * 100, 0, 100)
 */

import { localRouter, RouteResult, StationNode, Coordinates, KSR_TRAIN_DATABASE } from './localRouter';
import checkpointsData from '../data/simulation/checkpoints.json';
import profilesData from '../data/accessibility/profiles.json';

export type RiskLevel = 'COMFORTABLE' | 'HURRY' | 'HIGH_RISK';

export interface BoardingSureConfig {
  turnPenaltySeconds: number;
  liftTransitionSeconds: number;
  rampTransitionSeconds: number;
  stairsTransitionSeconds: number;
  boardingBufferMinutes: number;
  comfortableMarginThresholdMinutes: number;
  turnAngleThresholdDegrees: number;
}

export const DEFAULT_BOARDINGSURE_CONFIG: BoardingSureConfig = {
  turnPenaltySeconds: 5, // 5s per turn
  liftTransitionSeconds: 30, // 30s per lift
  rampTransitionSeconds: 15, // 15s per ramp
  stairsTransitionSeconds: 20, // 20s per stair flight (non-wheelchair only)
  boardingBufferMinutes: 3.0, // 3 min safety buffer before train doors close
  comfortableMarginThresholdMinutes: 5.0, // > 5m = comfortable, 0-5m = hurry, < 0m = high risk
  turnAngleThresholdDegrees: 30.0 // angle threshold to classify as turn
};

/**
 * Assumed prototype walking speeds in metres per second (m/s).
 * Transparently disclosed as prototype values, not medical absolutes.
 */
export const PROFILE_WALKING_SPEEDS: Record<string, number> = {
  regular: 1.0,
  first_time: 0.8,
  elderly: 0.7,
  mobility_disabled: 0.6,
  child: 0.8,
  visually_impaired: 0.75,
  luggage_heavy: 0.7
};

export interface BoardingSureInput {
  trainNumber: string;
  trainName?: string;
  platformNumber?: number;
  coachNumber: string;
  departureTime?: string | Date;
  currentTime?: string | Date;
  availableMinutesOverride?: number; // for interactive testing / simulation slider
  startNodeId: string;
  profileId: string;
  customSpeedMps?: number;
  config?: Partial<BoardingSureConfig>;
  blockedIds?: string[];
}

export interface TimeBreakdown {
  distanceMeters: number;
  walkingSpeedMps: number;
  tWalkingMinutes: number;
  turnCount: number;
  tTurnsMinutes: number;
  liftCount: number;
  rampCount: number;
  stairsCount: number;
  tLevelChangesMinutes: number;
  obstructionCount: number;
  tObstructionMinutes: number;
  tBufferMinutes: number;
  tRequiredMinutes: number;
  tAvailableMinutes: number;
  marginMinutes: number;
  deficitMinutes: number;
  riskScore: number;
}

export interface RouteComparisonItem {
  id: 'profile' | 'fastest' | 'step_free' | 'alternative';
  label: string;
  profileId: string;
  distanceMeters: number;
  walkingTimeMinutes: number;
  requiredTimeMinutes: number;
  safetyMarginMinutes: number;
  riskScore: number;
  riskLevel: RiskLevel;
  turnCount: number;
  levelChangesCount: number;
  wheelchairAccessible: boolean;
  route: RouteResult;
}

export interface BoardingSureAssessment {
  status: 'SUCCESS' | 'NO_ROUTE' | 'INVALID_INPUT';
  trainNumber: string;
  trainName: string;
  platformNumber: number;
  coachNumber: string;
  profileId: string;
  profileName: string;
  startNode: StationNode | null;
  destinationNode: StationNode | null;
  route: RouteResult | null;
  timeBreakdown: TimeBreakdown;
  riskLevel: RiskLevel;
  riskScore: number;
  headline: string;
  recommendationMessage: string;
  urgencyAlert: string | null;
  canMakeTrain: boolean;
  estimatedArrivalTime: string;
  alternativeRoutes: RouteComparisonItem[];
  nearestAssistance: {
    name: string;
    location: string;
    nodeId: string;
    distanceMeters: number;
  } | null;
  error?: string;
  transparencyNote: string;
}

export class BoardingSureService {
  private config: BoardingSureConfig;

  constructor(config: Partial<BoardingSureConfig> = {}) {
    this.config = { ...DEFAULT_BOARDINGSURE_CONFIG, ...config };
  }

  /**
   * Resolve walking speed safely with fallbacks.
   */
  public getWalkingSpeed(profileId: string, customSpeed?: number): number {
    if (typeof customSpeed === 'number' && customSpeed > 0 && isFinite(customSpeed)) {
      return customSpeed;
    }
    const speed = PROFILE_WALKING_SPEEDS[profileId] ?? PROFILE_WALKING_SPEEDS['regular'] ?? 1.0;
    return speed > 0 ? speed : 1.0;
  }

  /**
   * Parse available time T_available = T_departure - T_current (in minutes).
   */
  public calculateAvailableMinutes(
    departureTime?: string | Date,
    currentTime?: string | Date,
    overrideMinutes?: number
  ): number {
    if (typeof overrideMinutes === 'number' && isFinite(overrideMinutes)) {
      return Math.round(overrideMinutes * 10) / 10;
    }

    const now = currentTime instanceof Date
      ? currentTime
      : typeof currentTime === 'string'
      ? new Date(currentTime)
      : new Date();

    if (!departureTime) {
      // Default fallback: assume 20 minutes for demo if nothing specified
      return 20.0;
    }

    if (departureTime instanceof Date) {
      const diffMs = departureTime.getTime() - now.getTime();
      return Math.round((diffMs / 60000) * 10) / 10;
    }

    if (typeof departureTime === 'string') {
      // Check if it's "HH:MM" format
      const hhMmMatch = departureTime.match(/^(\d{1,2}):(\d{2})$/);
      if (hhMmMatch) {
        const depHours = parseInt(hhMmMatch[1], 10);
        const depMinutes = parseInt(hhMmMatch[2], 10);
        const targetDate = new Date(now);
        targetDate.setHours(depHours, depMinutes, 0, 0);

        // If target time is earlier than current time today, could be next day or just passed
        let diffMs = targetDate.getTime() - now.getTime();
        if (diffMs < -12 * 60 * 60 * 1000) {
          // Wrapped to next day
          targetDate.setDate(targetDate.getDate() + 1);
          diffMs = targetDate.getTime() - now.getTime();
        }
        return Math.round((diffMs / 60000) * 10) / 10;
      }

      // Try standard Date parsing
      const parsed = new Date(departureTime);
      if (!isNaN(parsed.getTime())) {
        const diffMs = parsed.getTime() - now.getTime();
        return Math.round((diffMs / 60000) * 10) / 10;
      }
    }

    return 20.0;
  }

  /**
   * Count significant turns (> 30 degrees) along route geometry.
   */
  public countRouteTurns(route: RouteResult): number {
    if (!route.steps || route.steps.length < 2) return 0;
    let turns = 0;
    const thresholdDeg = this.config.turnAngleThresholdDegrees;

    for (let i = 1; i < route.steps.length; i++) {
      const prev = route.steps[i - 1];
      const curr = route.steps[i];

      const pFrom = prev.fromCoords;
      const pTo = prev.toCoords;
      const cTo = curr.toCoords;

      if (pFrom && pTo && cTo) {
        const v1x = pTo.x - pFrom.x;
        const v1y = pTo.y - pFrom.y;
        const v2x = cTo.x - pTo.x;
        const v2y = cTo.y - pTo.y;

        const mag1 = Math.hypot(v1x, v1y);
        const mag2 = Math.hypot(v2x, v2y);

        if (mag1 > 0.01 && mag2 > 0.01) {
          const dot = (v1x * v2x + v1y * v2y) / (mag1 * mag2);
          const clamped = Math.max(-1.0, Math.min(1.0, dot));
          const angleDeg = Math.acos(clamped) * (180 / Math.PI);
          if (angleDeg > thresholdDeg) {
            turns++;
          }
        }
      }
    }

    // Secondary fallback: if no geometry, count steps that mention turns
    if (turns === 0 && route.steps.length > 2) {
      turns = Math.max(0, Math.floor(route.steps.length / 2));
    }

    return turns;
  }

  /**
   * Mathematical calculation of all time components.
   */
  public computeTimeBreakdown(
    route: RouteResult,
    profileId: string,
    tAvailableMinutes: number,
    customSpeedMps?: number,
    configOverride?: Partial<BoardingSureConfig>
  ): TimeBreakdown {
    const cfg = { ...this.config, ...configOverride };
    const distanceMeters = Math.max(0, route.totalDistanceMeters || 0);
    const speed = this.getWalkingSpeed(profileId, customSpeedMps);

    // 1. T_walking = D / (V * 60)
    const tWalkingMinutes = speed > 0 ? distanceMeters / (speed * 60) : distanceMeters / 60;

    // 2. Turns penalty (5s = 5/60 min per turn)
    const turnCount = this.countRouteTurns(route);
    const tTurnsMinutes = (turnCount * cfg.turnPenaltySeconds) / 60;

    // 3. Level transitions
    const liftCount = route.accessibility?.liftsUsed?.length || 0;
    const rampCount = route.accessibility?.rampsUsed?.length || 0;
    // Strict rule: For wheelchair users, stairs are 0 (strictly avoided). Never penalize stairs for wheelchair!
    const isWheelchair = profileId === 'mobility_disabled';
    const stairsCount = isWheelchair ? 0 : (route.accessibility?.stairsUsed?.length || 0);

    const tLiftMinutes = (liftCount * cfg.liftTransitionSeconds) / 60;
    const tRampMinutes = (rampCount * cfg.rampTransitionSeconds) / 60;
    const tStairsMinutes = (stairsCount * cfg.stairsTransitionSeconds) / 60;
    const tLevelChangesMinutes = tLiftMinutes + tRampMinutes + tStairsMinutes;

    // 4. Obstruction / crowd penalty
    const warnings = route.warnings || [];
    const blockedSegs = route.blockedSegments || [];
    const obstructionCount = warnings.length + (blockedSegs.length > 0 ? 1 : 0);
    const tObstructionMinutes = obstructionCount * 0.5; // 30s per obstruction advisory

    // 5. Boarding safety buffer
    const tBufferMinutes = cfg.boardingBufferMinutes;

    // T_required = T_walking + T_turns + T_level_changes + T_obstruction + T_buffer
    const tRequiredMinutes =
      tWalkingMinutes + tTurnsMinutes + tLevelChangesMinutes + tObstructionMinutes + tBufferMinutes;

    // Safety margin M = T_available - T_required
    const marginMinutes = tAvailableMinutes - tRequiredMinutes;
    const deficitMinutes = marginMinutes < 0 ? Math.abs(marginMinutes) : 0;

    // Time-deficit risk score R = clamp(((T_required - T_available) / T_required) * 100, 0, 100)
    let riskScore = 0;
    if (tRequiredMinutes > 0) {
      const rawRisk = ((tRequiredMinutes - tAvailableMinutes) / tRequiredMinutes) * 100;
      riskScore = Math.max(0, Math.min(100, rawRisk));
    } else {
      riskScore = tAvailableMinutes < 0 ? 100 : 0;
    }

    return {
      distanceMeters: Math.round(distanceMeters * 10) / 10,
      walkingSpeedMps: Math.round(speed * 100) / 100,
      tWalkingMinutes: Math.round(tWalkingMinutes * 10) / 10,
      turnCount,
      tTurnsMinutes: Math.round(tTurnsMinutes * 10) / 10,
      liftCount,
      rampCount,
      stairsCount,
      tLevelChangesMinutes: Math.round(tLevelChangesMinutes * 10) / 10,
      obstructionCount,
      tObstructionMinutes: Math.round(tObstructionMinutes * 10) / 10,
      tBufferMinutes: Math.round(tBufferMinutes * 10) / 10,
      tRequiredMinutes: Math.round(tRequiredMinutes * 10) / 10,
      tAvailableMinutes: Math.round(tAvailableMinutes * 10) / 10,
      marginMinutes: Math.round(marginMinutes * 10) / 10,
      deficitMinutes: Math.round(deficitMinutes * 10) / 10,
      riskScore: Math.round(riskScore * 10) / 10
    };
  }

  /**
   * Classify risk level based on safety margin M.
   * M > 5 min: COMFORTABLE
   * 0 <= M <= 5 min: HURRY
   * M < 0 min: HIGH_RISK
   */
  public evaluateRiskLevel(marginMinutes: number): RiskLevel {
    if (marginMinutes > this.config.comfortableMarginThresholdMinutes) {
      return 'COMFORTABLE';
    }
    if (marginMinutes >= 0) {
      return 'HURRY';
    }
    return 'HIGH_RISK';
  }

  /**
   * Find nearest physical railway assistance booth / RPF / Help desk from current start node.
   */
  public findNearestAssistance(startNode: StationNode): {
    name: string;
    location: string;
    nodeId: string;
    distanceMeters: number;
  } {
    const candidateNodes = [
      { id: 'node_t1_ticket', name: 'Terminal 1 Ticket Concourse & Help Desk', loc: 'Terminal 1 Concourse' },
      { id: 'node_entry_t1_center', name: 'Main Concourse Passenger Assistance Booth', loc: 'T1 Center' },
      { id: 'node_entry_t2_east', name: 'Terminal 2 May I Help You Counter', loc: 'Terminal 2 Entry' },
      { id: 'node_entry_t3_metro', name: 'Metro Link Assistance Kiosk', loc: 'T3 Skywalk' }
    ];

    let best = candidateNodes[0];
    let minDist = Infinity;

    for (const c of candidateNodes) {
      const node = localRouter.nodeDict.get(c.id);
      if (node) {
        const dx = node.coordinates.x - startNode.coordinates.x;
        const dy = node.coordinates.y - startNode.coordinates.y;
        const dist = Math.hypot(dx, dy) * 0.25;
        if (dist < minDist) {
          minDist = dist;
          best = c;
        }
      }
    }

    return {
      name: best.name,
      location: best.loc,
      nodeId: best.id,
      distanceMeters: Math.round(minDist)
    };
  }

  /**
   * Generate intelligent recommendations grounded in the passenger's risk assessment.
   */
  public generateRecommendations(
    riskLevel: RiskLevel,
    timeBreakdown: TimeBreakdown,
    trainName: string,
    coachNumber: string,
    platformNumber: number,
    profileId: string,
    isStepFree: boolean
  ): {
    headline: string;
    recommendationMessage: string;
    urgencyAlert: string | null;
  } {
    const margin = timeBreakdown.marginMinutes;
    const deficit = timeBreakdown.deficitMinutes;

    if (riskLevel === 'COMFORTABLE') {
      return {
        headline: `Comfortable Boarding Margin (+${margin}m)`,
        recommendationMessage: `At your expected walking pace, you have a safe margin of ${margin} min before Coach ${coachNumber} departure. The ${isStepFree ? 'step-free' : 'standard'} route is clear and unobstructed.`,
        urgencyAlert: null
      };
    }

    if (riskLevel === 'HURRY') {
      return {
        headline: `Hurry — Proceed to Platform ${platformNumber} (+${margin}m remaining)`,
        recommendationMessage: `You have only ${margin} min of safety buffer left before doors close. Walk at a steady pace directly toward Coach ${coachNumber}. Avoid non-essential stops or detours.`,
        urgencyAlert: 'Boarding window is tight. Head immediately to your coach.'
      };
    }

    // HIGH_RISK
    return {
      headline: `High Risk of Missing Train (${deficit}m deficit)`,
      recommendationMessage: `Your required walking time (${timeBreakdown.tRequiredMinutes}m) exceeds available time (${timeBreakdown.tAvailableMinutes}m) by ${deficit} minutes. Without assistance, you may miss departure of ${trainName}.`,
      urgencyAlert: `Critical Time Deficit: Estimated ${deficit}m late. Seek immediate station porter or RPF assistance.`
    };
  }

  /**
   * Main Assessment Entry Point:
   * Performs dynamic routing, profile-aware time budgeting, multi-route comparison, and safety evaluation.
   */
  public evaluate(input: BoardingSureInput): BoardingSureAssessment {
    const cleanTrainNo = (input.trainNumber || '12658').trim();
    const cleanCoachNo = (input.coachNumber || 'B4').trim().toUpperCase();
    const profileId = input.profileId || 'first_time';
    const profile = profilesData.find(p => p.id === profileId) || profilesData[0];

    const train = KSR_TRAIN_DATABASE[cleanTrainNo] || {
      trainNumber: cleanTrainNo,
      trainName: input.trainName || `Express ${cleanTrainNo}`,
      platformNumber: input.platformNumber || 1,
      rakeDirection: 'ENGINE_EAST',
      totalCoaches: 24,
      coaches: ['ENG', 'GEN', 'S1', 'S2', 'B1', 'B2', 'B3', 'B4', 'A1', 'A2', 'H1', 'GEN']
    };

    const platformNumber = input.platformNumber || train.platformNumber || 1;
    const startNode = localRouter.getNode(input.startNodeId) ||
      localRouter.getNode('node_entry_t1_main_east') ||
      localRouter.nodes[0];

    // Compute route to coach
    const primaryRoute = localRouter.findRouteToCoach(
      startNode.id,
      cleanTrainNo,
      cleanCoachNo,
      profileId
    );

    const tAvailableMinutes = this.calculateAvailableMinutes(
      input.departureTime,
      input.currentTime,
      input.availableMinutesOverride
    );

    // Calculate estimated arrival time HH:MM
    const now = input.currentTime instanceof Date
      ? input.currentTime
      : typeof input.currentTime === 'string'
      ? new Date(input.currentTime)
      : new Date();

    if (!primaryRoute) {
      // Route is blocked or inaccessible (e.g., all wheelchair paths blocked)
      const nearestAssist = this.findNearestAssistance(startNode);
      return {
        status: 'NO_ROUTE',
        trainNumber: cleanTrainNo,
        trainName: train.trainName,
        platformNumber,
        coachNumber: cleanCoachNo,
        profileId,
        profileName: profile?.name || 'General',
        startNode,
        destinationNode: null,
        route: null,
        timeBreakdown: {
          distanceMeters: 0,
          walkingSpeedMps: this.getWalkingSpeed(profileId, input.customSpeedMps),
          tWalkingMinutes: 0,
          turnCount: 0,
          tTurnsMinutes: 0,
          liftCount: 0,
          rampCount: 0,
          stairsCount: 0,
          tLevelChangesMinutes: 0,
          obstructionCount: 1,
          tObstructionMinutes: 0,
          tBufferMinutes: this.config.boardingBufferMinutes,
          tRequiredMinutes: Infinity,
          tAvailableMinutes,
          marginMinutes: -Infinity,
          deficitMinutes: Infinity,
          riskScore: 100
        },
        riskLevel: 'HIGH_RISK',
        riskScore: 100,
        headline: 'No Accessible Route Available',
        recommendationMessage: `No accessible path could be found to Platform ${platformNumber} (Coach ${cleanCoachNo}) under current facility statuses. Please contact the Special Assistance booth at ${nearestAssist.name}.`,
        urgencyAlert: 'Inaccessible route detected! Station staff support required immediately.',
        canMakeTrain: false,
        estimatedArrivalTime: '--:--',
        alternativeRoutes: [],
        nearestAssistance: nearestAssist,
        error: 'No accessible route found satisfying profile constraints or current facility blockages.',
        transparencyNote: 'Calculated using CAD station graph. Assumed walking speed: ' + this.getWalkingSpeed(profileId) + ' m/s.'
      };
    }

    // Mathematical time budget calculation
    const breakdown = this.computeTimeBreakdown(
      primaryRoute,
      profileId,
      tAvailableMinutes,
      input.customSpeedMps,
      input.config
    );

    const riskLevel = this.evaluateRiskLevel(breakdown.marginMinutes);
    const canMakeTrain = breakdown.marginMinutes >= 0;

    const arrivalDate = new Date(now.getTime() + breakdown.tRequiredMinutes * 60000);
    const estArrivalStr = arrivalDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

    const nearestAssist = this.findNearestAssistance(startNode);
    const recs = this.generateRecommendations(
      riskLevel,
      breakdown,
      train.trainName,
      cleanCoachNo,
      platformNumber,
      profileId,
      primaryRoute.accessibility.stepFree
    );

    // Multi-route comparison:
    // 1. Primary profile route
    // 2. Fastest direct route (using 'first_time' with 1.0 m/s)
    // 3. Step-free accessible route ('mobility_disabled')
    const comparisonRoutes: RouteComparisonItem[] = [];

    // Add primary
    comparisonRoutes.push({
      id: 'profile',
      label: `Current (${profile.name})`,
      profileId,
      distanceMeters: breakdown.distanceMeters,
      walkingTimeMinutes: breakdown.tWalkingMinutes,
      requiredTimeMinutes: breakdown.tRequiredMinutes,
      safetyMarginMinutes: breakdown.marginMinutes,
      riskScore: breakdown.riskScore,
      riskLevel,
      turnCount: breakdown.turnCount,
      levelChangesCount: breakdown.liftCount + breakdown.rampCount + breakdown.stairsCount,
      wheelchairAccessible: primaryRoute.accessibility.wheelchairAccessible,
      route: primaryRoute
    });

    // Fastest Route (unrestricted profile 'first_time')
    if (profileId !== 'first_time') {
      const fastRoute = localRouter.findRouteToCoach(startNode.id, cleanTrainNo, cleanCoachNo, 'first_time');
      if (fastRoute) {
        const fastBreakdown = this.computeTimeBreakdown(fastRoute, 'first_time', tAvailableMinutes);
        comparisonRoutes.push({
          id: 'fastest',
          label: 'Fastest Direct Path',
          profileId: 'first_time',
          distanceMeters: fastBreakdown.distanceMeters,
          walkingTimeMinutes: fastBreakdown.tWalkingMinutes,
          requiredTimeMinutes: fastBreakdown.tRequiredMinutes,
          safetyMarginMinutes: fastBreakdown.marginMinutes,
          riskScore: fastBreakdown.riskScore,
          riskLevel: this.evaluateRiskLevel(fastBreakdown.marginMinutes),
          turnCount: fastBreakdown.turnCount,
          levelChangesCount: fastBreakdown.liftCount + fastBreakdown.rampCount + fastBreakdown.stairsCount,
          wheelchairAccessible: fastRoute.accessibility.wheelchairAccessible,
          route: fastRoute
        });
      }
    }

    // Step-Free Route ('mobility_disabled')
    if (profileId !== 'mobility_disabled') {
      const stepFreeRoute = localRouter.findRouteToCoach(startNode.id, cleanTrainNo, cleanCoachNo, 'mobility_disabled');
      if (stepFreeRoute) {
        const stepFreeBreakdown = this.computeTimeBreakdown(stepFreeRoute, 'mobility_disabled', tAvailableMinutes);
        comparisonRoutes.push({
          id: 'step_free',
          label: '100% Step-Free Route',
          profileId: 'mobility_disabled',
          distanceMeters: stepFreeBreakdown.distanceMeters,
          walkingTimeMinutes: stepFreeBreakdown.tWalkingMinutes,
          requiredTimeMinutes: stepFreeBreakdown.tRequiredMinutes,
          safetyMarginMinutes: stepFreeBreakdown.marginMinutes,
          riskScore: stepFreeBreakdown.riskScore,
          riskLevel: this.evaluateRiskLevel(stepFreeBreakdown.marginMinutes),
          turnCount: stepFreeBreakdown.turnCount,
          levelChangesCount: stepFreeBreakdown.liftCount + stepFreeBreakdown.rampCount,
          wheelchairAccessible: true,
          route: stepFreeRoute
        });
      }
    }

    return {
      status: 'SUCCESS',
      trainNumber: cleanTrainNo,
      trainName: train.trainName,
      platformNumber,
      coachNumber: cleanCoachNo,
      profileId,
      profileName: profile?.name || 'General',
      startNode,
      destinationNode: primaryRoute.destination,
      route: primaryRoute,
      timeBreakdown: breakdown,
      riskLevel,
      riskScore: breakdown.riskScore,
      headline: recs.headline,
      recommendationMessage: recs.recommendationMessage,
      urgencyAlert: recs.urgencyAlert,
      canMakeTrain,
      estimatedArrivalTime: estArrivalStr,
      alternativeRoutes: comparisonRoutes,
      nearestAssistance: nearestAssist,
      transparencyNote: `Ground-truth station graph (${breakdown.distanceMeters}m). Walking speed calibrated for ${profile.name} at ${breakdown.walkingSpeedMps} m/s with a ${this.config.boardingBufferMinutes}m boarding buffer.`
    };
  }
}

export const boardingSureService = new BoardingSureService();

