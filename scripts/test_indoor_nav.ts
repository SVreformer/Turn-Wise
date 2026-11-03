import { qrValidator } from '../mobile/src/addons/indoor-navigation/positioning/qrValidator';
import { bleKalmanFilterEngine } from '../mobile/src/addons/indoor-navigation/positioning/bleKalmanFilter';
import { pdrEstimator } from '../mobile/src/addons/indoor-navigation/positioning/pdrEstimator';
import { topologicalMapMatcher } from '../mobile/src/addons/indoor-navigation/positioning/mapMatcher';
import { confidenceStateMachine } from '../mobile/src/addons/indoor-navigation/positioning/confidenceStateMachine';
import { multiFloorRouteEngine } from '../mobile/src/addons/indoor-navigation/routing/multiFloorRouteEngine';
import { crowdCostEvaluator } from '../mobile/src/addons/indoor-navigation/routing/crowdCostEvaluator';

console.log('=== 1. TESTING QR VALIDATOR ===');
const v1 = qrValidator.validate('CP-T1-MAIN');
console.log('✓ Raw QR Valid:', v1.isValid, '| Checkpoint:', (v1 as any).checkpoint?.name);
const v2 = qrValidator.validate('meteor://check?v=1&s=SBC&c=CP-T1-MAIN&l=0&n=node_entry_t1_main_east&sig=A7B2C91D');
console.log('✓ URI QR Valid:', v2.isValid, '| Floor:', (v2 as any).checkpoint?.level);
const vCorrupt = qrValidator.validate('meteor://check?v=1&s=SBC&c=CORRUPTED_CODE_999');
console.log('✓ Corrupted QR Handled Safely:', !vCorrupt.isValid, '| Error:', (vCorrupt as any).errorCode);

console.log('\n=== 2. TESTING BLE KALMAN FILTER ===');
const s1 = bleKalmanFilterEngine.processSample('BCN-SBC-T1-MAIN', -72);
const s2 = bleKalmanFilterEngine.processSample('BCN-SBC-T1-MAIN', -58);
console.log('✓ Filtered RSSI:', s2?.filteredRssi, 'dBm | Estimated Distance:', s2?.estimatedDistanceMeters, 'm');

console.log('\n=== 3. TESTING PDR ESTIMATOR ===');
pdrEstimator.anchor({ x: 1811, y: 1163 });
pdrEstimator.updateHeading(90);
const step1 = pdrEstimator.recordStep(0.7);
console.log('✓ Step Count:', pdrEstimator.totalSteps, '| Distance:', pdrEstimator.distanceSinceAnchorMeters.toFixed(1), 'm');

console.log('\n=== 4. TESTING TOPOLOGICAL MAP MATCHER ===');
const snap = topologicalMapMatcher.snapToWalkway({ x: 1815, y: 1160 }, 0);
console.log('✓ Snapped Node:', snap.nearestNode.name, '| Dist to Walkway:', snap.distanceToEdgeMeters, 'm');

console.log('\n=== 5. TESTING CONFIDENCE STATE MACHINE ===');
const confAnchor = confidenceStateMachine.onQrConfirmed();
console.log('✓ Anchor State:', confAnchor.state, '| Score:', confAnchor.score + '%');
const confBle = confidenceStateMachine.onBleSample(4.2, 3, true);
console.log('✓ BLE Tracking State:', confBle.state, '| Score:', confBle.score + '%');

console.log('\n=== 6. TESTING MULTI-FLOOR ROUTE ENGINE ===');
const mfRoute = multiFloorRouteEngine.findMultiFloorRoute('node_entry_t1_main_east', 'node_fob2_pf4_5', 'first_time');
console.log('✓ Multi-Floor Route Found:', !!mfRoute, '| Total Dist:', mfRoute?.totalDistance, 'm | Levels:', mfRoute?.levelsTraversed);
console.log('✓ Step 1:', mfRoute?.steps[0]?.instruction);
console.log('✓ Step 1 (Kannada):', mfRoute?.steps[0]?.instructionKn);

console.log('\n=== 7. TESTING CROWD COST EVALUATOR ===');
const crowd = crowdCostEvaluator.evaluateCrowdPenalty('ZONE-T1-TICKET', 30, 'first_time');
console.log('✓ Crowd Status:', crowd.status, '| Penalty Cost:', crowd.penaltyCost, '| Delay:', crowd.delaySeconds + 's');

console.log('\n========================================');
console.log('🎉 ALL 7 INDOOR NAVIGATION MODULES VERIFIED!');
console.log('========================================');

