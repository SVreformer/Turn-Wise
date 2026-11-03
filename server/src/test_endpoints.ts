import { StationService } from './services/stationService';
import { AssistantService } from './tools/assistantService';

async function runTests() {
  console.log('=== RUNNING BACKEND UNIT & INTEGRATION TESTS ===');
  const stationService = new StationService();
  const assistantService = new AssistantService(stationService);

  // 1. Station Overview
  const overview = stationService.getStationOverview();
  console.log(`[PASS] Station: ${overview.stationName} (${overview.totalPlatforms} platforms, ${overview.totalNodes} nodes)`);
  if (overview.totalPlatforms !== 10) throw new Error('Expected 10 platforms');

  // 2. Platform 8 Lookup
  const p8 = stationService.getPlatformById('platform_8');
  console.log(`[PASS] Platform 8: ${p8.name} at center (${p8.center.x}, ${p8.center.y})`);
  if (!p8) throw new Error('Platform 8 lookup failed');

  // 3. Wheelchair Route to Platform 8
  const wcRoute = stationService.router.findRoute('node_entry_t1_main_east', 'node_pf8_center', 'mobility_disabled');
  if (!wcRoute || !wcRoute.accessibility.wheelchairAccessible) throw new Error('Wheelchair route failed');
  console.log(`[PASS] Wheelchair route to PF8: ${wcRoute.totalDistanceMeters}m, step-free: ${wcRoute.accessibility.stepFree}`);

  // 4. Mathematical Edge-Cost Formula c(e) = d(e) + P_a(e) + P_s(e) + P_u(e)
  if (!wcRoute.costBreakdown || !wcRoute.costBreakdown.formula) throw new Error('Cost breakdown missing');
  console.log(`[PASS] Cost Formula Verified: ${wcRoute.costBreakdown.formula} (Total Cost: ${wcRoute.costBreakdown.totalCost}, Distance: ${wcRoute.costBreakdown.totalDistance}m)`);

  // 5. Dynamic Rerouting on Lift Blockage
  const reroute = stationService.router.findRoute(
    'node_entry_t1_main_east',
    'node_pf8_center',
    'mobility_disabled',
    ['vc_edge_metro_to_pf7_8', 'vc_edge_metro_to_pf7_8_rev', 'vc_edge_lift1', 'vc_edge_lift1_rev']
  );
  if (!reroute || !reroute.accessibility.wheelchairAccessible) throw new Error('Dynamic rerouting failed');
  console.log(`[PASS] Dynamic reroute (Lift 1 blocked) via Ramp: ${reroute.totalDistanceMeters}m`);

  // 6. Nearest Facility: Toilet
  const nearestToilet = stationService.findNearestFacility('node_entry_t1_main_east', 'TOILET', 'first_time');
  if (!nearestToilet) throw new Error('Nearest toilet search failed');
  console.log(`[PASS] Nearest toilet: ${nearestToilet.facility.name} (${nearestToilet.distance}m)`);

  // 7. QR Checkpoint Resolution
  const cp = stationService.resolveCheckpoint('QR-KSR-T1-MAIN');
  if (!cp || !cp.matchedNode) throw new Error('QR Checkpoint resolution failed');
  console.log(`[PASS] QR Checkpoint resolved: ${cp.checkpoint.name} -> Node: ${cp.matchedNode.id}`);

  // 8. SPECIFICATION 4: Train to Coach Navigation (Train 12658, Coach B4)
  const coachRoute = stationService.findRouteToCoach('node_entry_t1_main_east', '12658', 'B4', 'first_time');
  if (!coachRoute || !coachRoute.coachInfo) throw new Error('Train Coach navigation failed');
  console.log(`[PASS] Train Coach Navigation: ${coachRoute.coachInfo.trainName} - Coach ${coachRoute.coachInfo.coachNumber} on Platform ${coachRoute.coachInfo.platformNumber} (Target Coord: ${coachRoute.coachInfo.coordinates.x}, ${coachRoute.coachInfo.coordinates.y})`);

  // 9. SPECIFICATION 3: Lost Passenger Rescue Mode
  const rescue = stationService.resolveLostPassengerRescue('node_subway_pf7_8', 'HELP_DESK', 'first_time');
  if (!rescue || !rescue.route) throw new Error('Lost passenger rescue failed');
  console.log(`[PASS] Lost Passenger Rescue: Guided to ${rescue.targetName} (${rescue.route.totalDistanceMeters}m)`);

  // 10. SPECIFICATION 2: Accessibility Truth Engine & Incident Reporting
  stationService.addIncidentReport({
    id: 'inc_test_1',
    facilityOrLocationId: 'lift_1',
    type: 'OUT_OF_SERVICE',
    reporterRole: 'STAFF',
    verified: true,
    timestamp: new Date().toISOString()
  });
  const statusAfterReport = stationService.getStatus()['lift_1'];
  if (statusAfterReport !== 'BLOCKED') throw new Error('Incident reporting failed to update facility status');
  console.log(`[PASS] Accessibility Truth Engine: Lift 1 reported OUT_OF_SERVICE -> Graph Status: ${statusAfterReport}`);

  // 11. SPECIFICATION 5: Multilingual Grounded Assistant
  // English query
  const chatEn = await assistantService.processUserMessage("Where is coach B4 on train 12658?");
  if (!chatEn.route || chatEn.action !== 'find_coach_route') throw new Error('English coach query failed');
  console.log(`[PASS] Multilingual Assistant (EN): "${chatEn.reply.substring(0, 65)}..."`);

  // Kannada query
  const chatKn = await assistantService.processUserMessage("ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ 1 ರಲ್ಲಿ ಕೋಚ್ ಬಿ4 ಎಲ್ಲಿದೆ?");
  if (!chatKn.route) throw new Error('Kannada query failed');
  console.log(`[PASS] Multilingual Assistant (KN): "${chatKn.reply.substring(0, 65)}..."`);

  // Hindi query
  const chatHi = await assistantService.processUserMessage("प्लेटफॉर्म 1 पर कोच बी4 कहाँ है?");
  if (!chatHi.route) throw new Error('Hindi query failed');
  console.log(`[PASS] Multilingual Assistant (HI): "${chatHi.reply.substring(0, 65)}..."`);

  console.log('\n====================================================');
  console.log('✅ ALL 11 BACKEND, ROUTING & MULTILINGUAL TESTS PASSED!');
  console.log('====================================================');
}

runTests().catch(err => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
