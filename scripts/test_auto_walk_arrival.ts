import { localRouter } from '../mobile/src/services/localRouter';
import { liveNavigationService, ArrivalSummaryData, LiveNavUpdate } from '../mobile/src/services/liveNavigationService';

console.log('=== Turn Wise: Auto-Walk Step Counting & Arrival Details Test Suite ===\n');

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    testsPassed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    testsFailed++;
  }
}

async function runTests() {
  console.log('Test Group 1: Auto-Walk Step Increment & Live Updates');
  const route = localRouter.findRoute('node_entry_t1_main_east', 'node_pf8_center', 'first_time', []);
  assert(route !== null, 'Found route from T1 Main East to PF8 Center');
  if (!route) return;

  let updateCount = 0;
  let lastUpdate: LiveNavUpdate | null = null;
  let arrivalSummary: ArrivalSummaryData | null = null;

  liveNavigationService.onUpdate((update) => {
    updateCount++;
    lastUpdate = update;
  });

  liveNavigationService.onArrival((summary) => {
    arrivalSummary = summary;
  });

  await liveNavigationService.start(route, 'first_time');

  assert(liveNavigationService.active, 'Live navigation is active');
  assert(liveNavigationService.steps === 0, 'Initial steps count is 0');
  assert(lastUpdate !== null && lastUpdate.stepsTaken === 0, 'Update payload has 0 initial steps');

  // Simulate 10 automatic steps
  for (let i = 1; i <= 10; i++) {
    liveNavigationService.simulateStep(1);
    assert(liveNavigationService.steps === i, `Step ${i} automatically incremented`);
    assert(lastUpdate !== null && lastUpdate.stepsTaken === i, `Live HUD payload has ${i} steps`);
    assert(lastUpdate !== null && lastUpdate.motionActivity === 'WALKING', `Motion state shows WALKING`);
    assert(lastUpdate !== null && lastUpdate.distanceTravelledMeters > 0, `Distance travelled > 0 (${lastUpdate?.distanceTravelledMeters}m)`);
  }

  console.log('\nTest Group 2: Continuous Walk to Destination Arrival & Summary Modal Data');
  // Walk remaining distance until arrival
  let safetyLimit = 300;
  while (liveNavigationService.active && safetyLimit > 0) {
    liveNavigationService.simulateStep(5);
    safetyLimit--;
  }

  assert(safetyLimit > 0, 'Completed journey without hitting safety iteration limit');
  assert(!liveNavigationService.active, 'Navigation automatically stopped upon arrival');
  assert(arrivalSummary !== null, 'Arrival callback was triggered with summary data');

  if (arrivalSummary) {
    const summary = arrivalSummary as ArrivalSummaryData;
    console.log('\n--- Received Arrival Summary Details ---');
    console.log(`  Destination: ${summary.destinationName}`);
    console.log(`  Total Steps: ${summary.totalSteps}`);
    console.log(`  Total Distance: ${summary.distanceMeters}m`);
    console.log(`  Duration: ${summary.durationSeconds}s`);
    console.log(`  Walking Speed: ${summary.averageSpeedMps} m/s`);
    console.log(`  Profile: ${summary.profileId}`);

    assert(summary.destinationName.length > 0, 'Destination name is populated');
    assert(summary.totalSteps >= 10, `Total steps counted (${summary.totalSteps} >= 10)`);
    assert(summary.distanceMeters >= 50, `Total distance travelled (${summary.distanceMeters}m >= 50m)`);
    assert(summary.durationSeconds >= 1, `Journey duration is recorded (${summary.durationSeconds}s >= 1s)`);
    assert(summary.averageSpeedMps > 0, `Average walking speed calculated (${summary.averageSpeedMps} m/s)`);
    assert(summary.profileId === 'first_time', 'Profile ID matches');
  }

  console.log('\n========================================');
  console.log(`Total tests passed: ${testsPassed}`);
  console.log(`Total tests failed: ${testsFailed}`);
  console.log('========================================');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
