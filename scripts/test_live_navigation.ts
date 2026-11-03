import { liveNavigationService, LiveNavigationService } from '../mobile/src/services/liveNavigationService';
import { localRouter, StationNode } from '../mobile/src/services/localRouter';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
    failed++;
  }
}

console.log('=== Turn Wise: Live Indoor Navigation Engine Test Suite ===\n');

async function runTests() {
  // Test 1: Route finding and initialization
  console.log('Test Group 1: Navigation Lifecycle & Pedometer Processing');
  const startId = 'node_entry_t1_main_east';
  const destId = 'node_pf4_center';
  const initialRoute = localRouter.findRoute(startId, destId, 'regular');

  assert(initialRoute !== null, 'Route calculation from T1 Main East to PF4 Center succeeds');
  if (!initialRoute) return;

  const nav = new LiveNavigationService();
  await nav.start(initialRoute, 'regular');

  assert(nav.active === true, 'Navigation starts actively');
  assert(nav.steps === 0, 'Initial session steps is 0');
  assert(nav.coordinates.x === initialRoute.start.coordinates.x, 'Starting X matches start node');
  assert(nav.coordinates.y === initialRoute.start.coordinates.y, 'Starting Y matches start node');
  assert(nav.currentConfidence === 'HIGH', 'Initial location confidence is HIGH (start anchor)');

  // Test 2: Step counting and displacement
  const initX = nav.coordinates.x;
  const initY = nav.coordinates.y;
  nav.processPhysicalSteps(5); // 5 steps
  assert(nav.steps === 5, 'Session steps counter increments to 5');
  assert(
    nav.coordinates.x !== initX || nav.coordinates.y !== initY,
    'Coordinates move along the corridor as steps are processed'
  );

  // Test 3: Stride calibration for different profiles
  console.log('\nTest Group 2: Profile-Aware Stride Lengths');
  nav.calibrateStrideForProfile('wheelchair');
  assert(nav.strideLengthMeters === 0.60, 'Wheelchair profile calibrates stride to 0.60m');

  nav.calibrateStrideForProfile('elderly');
  assert(nav.strideLengthMeters === 0.65, 'Elderly profile calibrates stride to 0.65m');

  nav.calibrateStrideForProfile('regular');
  assert(nav.strideLengthMeters === 0.72, 'Regular profile calibrates stride to 0.72m');

  // Test 4: Compass and Angle calculations
  console.log('\nTest Group 3: Heading & Angle Geometry');
  const pA = { x: 100, y: 100 };
  const pEast = { x: 200, y: 100 };
  const pSouth = { x: 100, y: 200 };
  const pWest = { x: 0, y: 100 };
  const pNorth = { x: 100, y: 0 };

  assert(nav.calculateAngleDegrees(pA, pEast) === 0, 'East direction is 0 degrees');
  assert(nav.calculateAngleDegrees(pA, pSouth) === 90, 'South direction is 90 degrees');
  assert(nav.calculateAngleDegrees(pA, pWest) === 180, 'West direction is 180 degrees');
  assert(nav.calculateAngleDegrees(pA, pNorth) === 270, 'North direction is 270 degrees');
  assert(nav.getCompassLabel(0) === 'E', '0 degrees corresponds to East');
  assert(nav.getCompassLabel(90) === 'S', '90 degrees corresponds to South');
  assert(nav.getCompassLabel(270) === 'N', '270 degrees corresponds to North');

  // Test 5: Perpendicular Distance to Polyline
  console.log('\nTest Group 4: Polyline Distance & Deviation Detection');
  const polyline = [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 100 }
  ];

  const onLinePt = { x: 50, y: 0 };
  assert(nav.getPerpendicularDistanceToPolyline(onLinePt, polyline) === 0, 'Point on line has 0 distance');

  const offLinePt = { x: 50, y: 34.5 }; // 34.5 pixels / 6.9 = 5.0 meters
  const distPixels = nav.getPerpendicularDistanceToPolyline(offLinePt, polyline);
  const distMeters = Math.round((distPixels / nav.pixelsPerMeter) * 10) / 10;
  assert(distMeters === 5.0, 'Perpendicular deviation correctly measures 5.0 meters');

  // Test 6: 8-Meter Threshold & 3-Consecutive Update Filter
  console.log('\nTest Group 5: Automatic Wrong-Turn & Rerouting Logic');
  const testNav = new LiveNavigationService();
  await testNav.start(initialRoute, 'regular');

  let offRouteTriggered = false;
  testNav.onOffRoute((dev, nearest) => {
    offRouteTriggered = true;
  });

  // Small deviation (4 meters) should not trigger off-route
  const routePt = initialRoute.pathGeometry[0];
  // Deliberately position 4 meters away
  (testNav as any).currentCoordinates = {
    x: routePt.x + 4 * testNav.pixelsPerMeter,
    y: routePt.y
  };
  (testNav as any).checkRouteDeviation();
  assert((testNav as any).consecutiveDeviations === 0, '4m deviation is below 8m threshold (no deviation counted)');

  // Large deviation (12 meters) - 1st reading
  (testNav as any).currentCoordinates = {
    x: routePt.x + 12 * testNav.pixelsPerMeter,
    y: routePt.y
  };
  (testNav as any).checkRouteDeviation();
  assert((testNav as any).consecutiveDeviations === 1, '1st 12m deviation increments consecutive count to 1');
  assert(offRouteTriggered === false, '1st deviation does not immediately trigger reroute (noise immunity)');

  // 2nd reading
  (testNav as any).checkRouteDeviation();
  assert((testNav as any).consecutiveDeviations === 2, '2nd consecutive deviation increments count to 2');
  assert(offRouteTriggered === false, '2nd deviation still avoids premature rerouting');

  // 3rd reading -> Should trigger off-route and automatic reroute!
  (testNav as any).checkRouteDeviation();
  assert(offRouteTriggered === true, '3rd consecutive deviation triggers off-route detection');

  // Test 7: Accessibility profile respect during reroute
  console.log('\nTest Group 6: Wheelchair Accessibility & Avoidance of Stairs');
  const wheelchairNav = new LiveNavigationService();
  const wcRoute = localRouter.findRoute('node_entry_t1_main_east', 'node_pf8_center', 'wheelchair');
  assert(wcRoute !== null, 'Initial wheelchair route found');
  if (wcRoute) {
    const hasStairs = wcRoute.steps.some((s) => s.pathType === 'stairs');
    assert(!hasStairs, 'Wheelchair route has no stairs');
  }

  // Test 8: QR Checkpoint Re-anchoring
  console.log('\nTest Group 7: QR Checkpoint Location Anchoring & Drift Reset');
  const qrNav = new LiveNavigationService();
  await qrNav.start(initialRoute, 'first_time');
  qrNav.processPhysicalSteps(80); // ~56 meters of walking without QR
  assert(qrNav.currentConfidence === 'LOW', 'Accumulated unanchored distance degrades confidence to LOW');

  const anchorSuccess = qrNav.anchorToCheckpoint('node_pf1_center');
  assert(anchorSuccess === true, 'QR Checkpoint anchoring succeeds for node_pf1_center');
  assert(qrNav.currentConfidence === 'HIGH', 'QR anchor restores confidence to HIGH');
  assert(qrNav.coordinates.x === localRouter.getNode('node_pf1_center')!.coordinates.x, 'Coordinates snap to QR node');

  // Test 9: Destination Arrival Detection
  console.log('\nTest Group 8: Destination Arrival Detection (<= 10m)');
  const arrNav = new LiveNavigationService();
  await arrNav.start(initialRoute, 'first_time');

  let arrivalSummaryReceived: any = null;
  arrNav.onArrival((summary) => {
    arrivalSummaryReceived = summary;
  });

  // Teleport to within 5m of destination
  const destCoords = initialRoute.destination.coordinates;
  (arrNav as any).currentCoordinates = {
    x: destCoords.x + 3 * arrNav.pixelsPerMeter,
    y: destCoords.y
  };
  arrNav.processPhysicalSteps(1); // Process a step to trigger arrival evaluation

  assert(arrivalSummaryReceived !== null, 'Arrival event triggered when within 10m of destination');
  assert(arrivalSummaryReceived.destinationName === initialRoute.destination.name, 'Arrival summary contains correct destination');
  assert(arrNav.active === false, 'Navigation automatically stopped upon arrival');

  // Test 10: GPS Georeferencing & Transformation
  console.log('\nTest Group 9: Real-World GPS Georeferencing & Transformation');
  const { georeferenceService } = await import('../mobile/src/services/georeferenceService');

  // Terminal 1 Main Entrance East
  const t1Gps = { latitude: 12.97728, longitude: 77.57075, accuracy: 5 };
  const stationT1 = georeferenceService.gpsToStationCoordinates(t1Gps);
  assert(stationT1 !== null, 'GPS coordinate converts to station map coordinates');
  if (stationT1) {
    const dx = Math.abs(stationT1.x - 1811.0);
    const dy = Math.abs(stationT1.y - 1163.0);
    const errMeters = Math.sqrt(dx * dx + dy * dy) / 6.9;
    assert(errMeters < 5.0, `T1 East GPS converts to station map within 5m (actual: ${errMeters.toFixed(1)}m)`);
  }

  // Station Boundary Check
  assert(georeferenceService.isInsideStationPerimeter(12.9781, 77.5695) === true, 'Center of station is within perimeter');
  assert(georeferenceService.isInsideStationPerimeter(13.5000, 78.0000) === false, 'Far-off location is outside perimeter');

  // Out of bounds GPS returns null safely
  const farGps = { latitude: 13.5000, longitude: 78.0000 };
  assert(georeferenceService.gpsToStationCoordinates(farGps) === null, 'Out-of-bounds GPS safely returns null');

  // Test 11: Standalone Continuous Live Tracking (Free-Walking)
  console.log('\nTest Group 10: Continuous Live Tracking (Free-Walking Exploration)');
  const freeTrackNav = new LiveNavigationService();
  await freeTrackNav.startContinuousTracking({ x: 1811, y: 1163 });
  assert(freeTrackNav.active === true, 'Continuous live tracking active');
  assert(freeTrackNav.route === null, 'Continuous tracking operates without requiring active route');

  const startCoord = freeTrackNav.coordinates;
  // User takes 10 physical steps facing East (bearing = 0)
  (freeTrackNav as any).currentBearing = 0;
  freeTrackNav.processPhysicalSteps(10);
  assert(freeTrackNav.steps === 10, 'Step counter registers 10 physical steps');
  assert(freeTrackNav.coordinates.x > startCoord.x, 'Position advances along walking heading during continuous tracking');

  console.log(`\n========================================`);
  console.log(`Total tests passed: ${passed}`);
  console.log(`Total tests failed: ${failed}`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});

