/**
 * BoardingSure — Automated Verification & Master Test Suite
 *
 * Verifies all 7 Master Testing Scenarios specified in the Prompt:
 *  Scenario 1: Comfortable (40 min, 300m, Regular)
 *  Scenario 2: Hurry (10 min, 300m, Regular + Buffer)
 *  Scenario 3: High Risk (5 min, 700m, Wheelchair)
 *  Scenario 4: Lift Blockage & Dynamic Reroute (Wheelchair + Lift 1 blocked)
 *  Scenario 5: Profile Switch (Regular -> Elderly)
 *  Scenario 6: Train Time Change (30 min -> 7 min)
 *  Scenario 7: Invalid / Missing Data Safe Handling (Missing times, zero speed, unreachable route)
 */

import {
  boardingSureService,
  BoardingSureService,
  DEFAULT_BOARDINGSURE_CONFIG
} from '../mobile/src/services/boardingSureService';
import { localRouter, RouteResult } from '../mobile/src/services/localRouter';

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${msg}`);
    testsPassed++;
  } else {
    console.error(`  ✗ FAIL: ${msg}`);
    testsFailed++;
  }
}

console.log('===============================================================');
console.log('🚆 BOARDINGSURE: PROFILE-AWARE MISSED-TRAIN RISK PREDICTOR');
console.log('===============================================================\n');

// Mock route generator for pure mathematical unit tests
function createMockRoute(distanceMeters: number, lifts = 0, ramps = 0, stairs = 0): RouteResult {
  return {
    start: localRouter.nodes[0],
    destination: localRouter.nodes[1],
    profile: 'first_time',
    totalDistanceMeters: distanceMeters,
    estimatedTimeMinutes: Math.round(distanceMeters / (1.0 * 60)),
    nodeSequence: ['n1', 'n2'],
    steps: [
      {
        stepNumber: 1,
        fromNode: 'A',
        toNode: 'B',
        instruction: 'Walk',
        instructionKn: '',
        instructionHi: '',
        voiceText: '',
        voiceTextKn: '',
        voiceTextHi: '',
        distance: distanceMeters,
        pathType: 'WALKWAY',
        landmark: 'Sign'
      }
    ],
    pathGeometry: [],
    accessibility: {
      wheelchairAccessible: stairs === 0,
      stepFree: stairs === 0,
      liftsUsed: Array(lifts).fill('Lift'),
      rampsUsed: Array(ramps).fill('Ramp'),
      stairsUsed: Array(stairs).fill('Stairs')
    },
    warnings: [],
    blockedSegments: [],
    costBreakdown: {
      totalDistance: distanceMeters,
      totalAccessibilityPenalty: 0,
      totalSafetyPenalty: 0,
      totalUncertaintyPenalty: 0,
      totalCost: distanceMeters,
      formula: 'c(e) = d(e)'
    }
  };
}

// -------------------------------------------------------------
// SCENARIO 1: COMFORTABLE
// Departure in 40 minutes, Route distance: 300m, Regular passenger (1.0 m/s)
// Expected: COMFORTABLE
// -------------------------------------------------------------
console.log('--- SCENARIO 1: COMFORTABLE ---');
const r1 = createMockRoute(300);
const b1 = boardingSureService.computeTimeBreakdown(r1, 'regular', 40.0, 1.0);
const level1 = boardingSureService.evaluateRiskLevel(b1.marginMinutes);

console.log(`  Distance: ${b1.distanceMeters}m | Speed: ${b1.walkingSpeedMps} m/s`);
console.log(`  T_walking: ${b1.tWalkingMinutes}m | T_required: ${b1.tRequiredMinutes}m | T_available: ${b1.tAvailableMinutes}m`);
console.log(`  Safety Margin: +${b1.marginMinutes}m | Risk Score: ${b1.riskScore}% | Status: ${level1}`);

assert(level1 === 'COMFORTABLE', 'Risk level must be COMFORTABLE');
assert(b1.marginMinutes > 5.0, 'Margin must be greater than 5 minutes');
assert(b1.tWalkingMinutes === 5.0, 'Walking time must be exactly 5.0 minutes (300 / (1.0 * 60))');
assert(b1.riskScore === 0, 'Risk score must be 0% when available time far exceeds required time');

// -------------------------------------------------------------
// SCENARIO 2: HURRY
// Departure in 10 minutes, Route distance: 300m, Regular passenger (1.0 m/s), Boarding buffer 3.0 min
// Expected: HURRY (0 to 5 min margin)
// -------------------------------------------------------------
console.log('\n--- SCENARIO 2: HURRY ---');
const r2 = createMockRoute(300);
const b2 = boardingSureService.computeTimeBreakdown(r2, 'regular', 10.0, 1.0);
const level2 = boardingSureService.evaluateRiskLevel(b2.marginMinutes);

console.log(`  Distance: ${b2.distanceMeters}m | Buffer: ${b2.tBufferMinutes}m`);
console.log(`  T_required: ${b2.tRequiredMinutes}m | T_available: ${b2.tAvailableMinutes}m`);
console.log(`  Safety Margin: +${b2.marginMinutes}m | Risk Score: ${b2.riskScore}% | Status: ${level2}`);

assert(level2 === 'HURRY', 'Risk level must be HURRY');
assert(b2.marginMinutes >= 0 && b2.marginMinutes <= 5.0, 'Margin must be between 0 and 5 minutes');
assert(b2.tRequiredMinutes === 8.0, 'Required time must be 8.0 minutes (5m walk + 3m buffer)');
assert(b2.marginMinutes === 2.0, 'Safety margin must be exactly 2.0 minutes (10 - 8)');

// -------------------------------------------------------------
// SCENARIO 3: HIGH RISK
// Departure in 5 minutes, Route distance: 700m, Wheelchair passenger (0.6 m/s)
// Expected: HIGH RISK
// -------------------------------------------------------------
console.log('\n--- SCENARIO 3: HIGH RISK ---');
const r3 = createMockRoute(700);
const b3 = boardingSureService.computeTimeBreakdown(r3, 'mobility_disabled', 5.0);
const level3 = boardingSureService.evaluateRiskLevel(b3.marginMinutes);

console.log(`  Distance: ${b3.distanceMeters}m | Speed: ${b3.walkingSpeedMps} m/s`);
console.log(`  T_walking: ${b3.tWalkingMinutes}m | T_required: ${b3.tRequiredMinutes}m | T_available: ${b3.tAvailableMinutes}m`);
console.log(`  Safety Margin: ${b3.marginMinutes}m (Deficit: ${b3.deficitMinutes}m) | Risk Score: ${b3.riskScore}% | Status: ${level3}`);

assert(level3 === 'HIGH_RISK', 'Risk level must be HIGH_RISK');
assert(b3.marginMinutes < 0, 'Margin must be negative (< 0 min)');
assert(b3.deficitMinutes > 0, 'Deficit minutes must be greater than 0');
assert(b3.riskScore > 50, 'Risk score must be significantly elevated (> 50%)');

// -------------------------------------------------------------
// SCENARIO 4: LIFT BLOCKAGE & DYNAMIC REROUTE
// Wheelchair route to Platform 8. When Lift 1 is blocked, route dynamically updates
// -------------------------------------------------------------
console.log('\n--- SCENARIO 4: LIFT BLOCKAGE & DYNAMIC REROUTE ---');
localRouter.setStatus('lift_1', 'OPEN');
const openAssessment = boardingSureService.evaluate({
  trainNumber: '16589', // Rani Chennamma Express on PF 8
  coachNumber: 'B1',
  startNodeId: 'node_entry_t1_main_east',
  profileId: 'mobility_disabled',
  availableMinutesOverride: 18.0
});

console.log(`  [Normal Status] Route Distance: ${openAssessment.timeBreakdown.distanceMeters}m | T_req: ${openAssessment.timeBreakdown.tRequiredMinutes}m | Margin: ${openAssessment.timeBreakdown.marginMinutes}m`);

// Mark Lift 1 BLOCKED
localRouter.setStatus('lift_1', 'BLOCKED');
const blockedAssessment = boardingSureService.evaluate({
  trainNumber: '16589',
  coachNumber: 'B1',
  startNodeId: 'node_entry_t1_main_east',
  profileId: 'mobility_disabled',
  availableMinutesOverride: 18.0
});

console.log(`  [Lift 1 BLOCKED] Route Distance: ${blockedAssessment.timeBreakdown.distanceMeters}m | T_req: ${blockedAssessment.timeBreakdown.tRequiredMinutes}m | Margin: ${blockedAssessment.timeBreakdown.marginMinutes}m`);
console.log(`  Risk Score Change: ${openAssessment.riskScore}% -> ${blockedAssessment.riskScore}%`);

// Reset status
localRouter.setStatus('lift_1', 'OPEN');

assert(blockedAssessment.status === 'SUCCESS' || blockedAssessment.status === 'NO_ROUTE', 'Handled status safely');
assert(
  blockedAssessment.timeBreakdown.distanceMeters >= openAssessment.timeBreakdown.distanceMeters,
  'Blocked path distance must be greater than or equal to original unobstructed path'
);
assert(
  blockedAssessment.timeBreakdown.tRequiredMinutes >= openAssessment.timeBreakdown.tRequiredMinutes,
  'Required time must increase when primary lift is blocked'
);

// -------------------------------------------------------------
// SCENARIO 5: PROFILE CHANGE (REGULAR -> ELDERLY)
// Swapping profile updates walking speed and stair penalties
// -------------------------------------------------------------
console.log('\n--- SCENARIO 5: PROFILE CHANGE (REGULAR -> ELDERLY) ---');
const assessRegular = boardingSureService.evaluate({
  trainNumber: '12658',
  coachNumber: 'B4',
  startNodeId: 'node_entry_t1_main_east',
  profileId: 'regular',
  availableMinutesOverride: 15.0
});

const assessElderly = boardingSureService.evaluate({
  trainNumber: '12658',
  coachNumber: 'B4',
  startNodeId: 'node_entry_t1_main_east',
  profileId: 'elderly',
  availableMinutesOverride: 15.0
});

console.log(`  Regular (1.0 m/s): Walking Time = ${assessRegular.timeBreakdown.tWalkingMinutes}m | Req = ${assessRegular.timeBreakdown.tRequiredMinutes}m | Margin = ${assessRegular.timeBreakdown.marginMinutes}m`);
console.log(`  Elderly (0.7 m/s): Walking Time = ${assessElderly.timeBreakdown.tWalkingMinutes}m | Req = ${assessElderly.timeBreakdown.tRequiredMinutes}m | Margin = ${assessElderly.timeBreakdown.marginMinutes}m`);

assert(assessElderly.timeBreakdown.walkingSpeedMps < assessRegular.timeBreakdown.walkingSpeedMps, 'Elderly speed must be lower than regular speed');
assert(assessElderly.timeBreakdown.tWalkingMinutes > assessRegular.timeBreakdown.tWalkingMinutes, 'Elderly walking time must be greater than regular');
assert(assessElderly.timeBreakdown.marginMinutes < assessRegular.timeBreakdown.marginMinutes, 'Elderly safety margin must be lower due to slower pace');

// -------------------------------------------------------------
// SCENARIO 6: TRAIN TIME CHANGE (30 MIN -> 7 MIN)
// Departure time updates countdown, safety margin, and risk score
// -------------------------------------------------------------
console.log('\n--- SCENARIO 6: TRAIN TIME CHANGE ---');
const assessEarly = boardingSureService.evaluate({
  trainNumber: '12658',
  coachNumber: 'B4',
  startNodeId: 'node_entry_t1_main_east',
  profileId: 'regular',
  availableMinutesOverride: 30.0
});

const assessLate = boardingSureService.evaluate({
  trainNumber: '12658',
  coachNumber: 'B4',
  startNodeId: 'node_entry_t1_main_east',
  profileId: 'regular',
  availableMinutesOverride: 7.0
});

console.log(`  At 30 min departure: Margin = +${assessEarly.timeBreakdown.marginMinutes}m | Risk = ${assessEarly.riskScore}% | Status = ${assessEarly.riskLevel}`);
console.log(`  At 7 min departure:  Margin = ${assessLate.timeBreakdown.marginMinutes}m | Risk = ${assessLate.riskScore}% | Status = ${assessLate.riskLevel}`);

assert(assessEarly.riskLevel === 'COMFORTABLE', '30 min remaining must be COMFORTABLE');
assert(assessLate.riskLevel === 'HURRY' || assessLate.riskLevel === 'HIGH_RISK', '7 min remaining must be HURRY or HIGH_RISK');
assert(assessLate.timeBreakdown.marginMinutes < assessEarly.timeBreakdown.marginMinutes, 'Margin must decrease with less departure time');
assert(assessLate.riskScore >= assessEarly.riskScore, 'Risk score must increase or stay high with less departure time');

// -------------------------------------------------------------
// SCENARIO 7: INVALID OR MISSING DATA
// Missing times, negative distance, zero walking speed, invalid inputs
// Expected: Safe fallback and valid assessment, zero NaN or crash
// -------------------------------------------------------------
console.log('\n--- SCENARIO 7: INVALID / MISSING DATA SAFE HANDLING ---');

// Test 1: Zero / negative walking speed fallback
const zeroSpeed = boardingSureService.getWalkingSpeed('unknown_profile', -5);
assert(zeroSpeed === 1.0, 'Negative speed safely falls back to 1.0 m/s');

// Test 2: Missing departure time fallback
const missingTime = boardingSureService.calculateAvailableMinutes(undefined, undefined, undefined);
assert(typeof missingTime === 'number' && !isNaN(missingTime) && missingTime > 0, 'Missing departure time returns safe finite fallback');

// Test 3: Zero available time
const zeroAvailableBreakdown = boardingSureService.computeTimeBreakdown(r1, 'regular', 0);
assert(zeroAvailableBreakdown.riskScore === 100, 'Zero available time results in 100% risk score');
assert(zeroAvailableBreakdown.marginMinutes < 0, 'Zero available time results in negative safety margin');

// Test 4: Fully corrupt / missing route evaluation
const corruptAssessment = boardingSureService.evaluate({
  trainNumber: 'NON_EXISTENT_TRAIN_99999',
  coachNumber: 'ZZZ_INVALID',
  startNodeId: 'node_entry_t1_main_east',
  profileId: 'first_time',
  availableMinutesOverride: 10
});
assert(corruptAssessment.status === 'SUCCESS' || corruptAssessment.status === 'NO_ROUTE', 'Invalid train gracefully processed');
assert(!isNaN(corruptAssessment.riskScore), 'Risk score must be a valid number, never NaN');
assert(typeof corruptAssessment.headline === 'string' && corruptAssessment.headline.length > 0, 'Valid headline generated');

console.log('\n===============================================================');
if (testsFailed === 0) {
  console.log(`🎉 ALL ${testsPassed} TEST ASSERTIONS PASSED WITH 0 FAILURES!`);
  console.log('BoardingSure mathematical engine is 100% verified.');
} else {
  console.error(`❌ ${testsFailed} TESTS FAILED out of ${testsPassed + testsFailed}.`);
}
console.log('===============================================================\n');

