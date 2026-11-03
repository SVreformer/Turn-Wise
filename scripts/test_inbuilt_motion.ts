import { InbuiltMotionDetector, MotionActivityType } from '../mobile/src/services/inbuiltMotionDetector';

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

console.log('=== Turn Wise: Inbuilt Mobile Motion & Step Detection Test Suite ===\n');

async function runTests() {
  const detector = new InbuiltMotionDetector();

  // Test Group 1: Initialization & Reset
  console.log('Test Group 1: Detector Initialization');
  assert(detector.steps === 0, 'Initial steps count is 0');
  assert(detector.motionState === 'STATIONARY', 'Initial motion state is STATIONARY');

  // Test Group 2: Stationary Signal (No Steps Detected)
  console.log('\nTest Group 2: Stationary Noise Rejection');
  let detectedSteps = 0;
  detector.onStep(() => {
    detectedSteps++;
  });

  // Feed 30 samples of stationary phone (resting at 1g gravity)
  let t = 1000;
  for (let i = 0; i < 30; i++) {
    detector.processAccelerometerSample(0, 0.98, 0.05, t);
    t += 40;
  }
  assert(detectedSteps === 0, 'Stationary device registers 0 steps');
  assert(detector.motionState === 'STATIONARY', 'Device remains in STATIONARY state when resting');

  // Test Group 3: Human Walking Gait Signal (Peak & Valley)
  console.log('\nTest Group 3: Physical Gait Step Detection');
  // Human gait at ~100 steps/min -> 600ms per step
  // At 25Hz (40ms interval), 1 step cycle is ~15 samples:
  // Starts at 1.0g -> dips to 0.8g (valley) -> rises to 1.35g (heel strike peak) -> settles to 1.0g
  for (let step = 0; step < 5; step++) {
    // Valley phase (loading response)
    detector.processAccelerometerSample(0.1, 0.75, 0.1, t);
    t += 80;
    detector.processAccelerometerSample(0.1, 0.78, 0.1, t);
    t += 80;

    // Peak phase (heel strike impact)
    detector.processAccelerometerSample(0.2, 1.38, 0.2, t);
    t += 80;
    detector.processAccelerometerSample(0.1, 1.15, 0.1, t);
    t += 120;

    // Midstance phase
    detector.processAccelerometerSample(0.05, 0.98, 0.05, t);
    t += 240;
  }

  assert(detector.steps === 5, `Expected 5 walking steps, detected: ${detector.steps}`);
  assert(detector.motionState === 'WALKING', 'Motion state transitions to WALKING');

  // Test Group 4: Bounce Rejection (Refractory Protection)
  console.log('\nTest Group 4: Rapid Bounce / Vibration Rejection');
  const stepsBefore = detector.steps;
  // Trigger a peak
  detector.processAccelerometerSample(0.1, 0.75, 0.1, t);
  t += 40;
  detector.processAccelerometerSample(0.2, 1.40, 0.2, t);
  t += 40;
  const stepCountMid = detector.steps;
  assert(stepCountMid === stepsBefore + 1, 'First valid peak registered');

  // Immediate subsequent vibration peak at only 80ms (way below 310ms threshold)
  detector.processAccelerometerSample(0.1, 0.75, 0.1, t + 40);
  detector.processAccelerometerSample(0.2, 1.45, 0.2, t + 80);
  assert(detector.steps === stepCountMid, 'Vibration bounce under 310ms safely rejected');

  // Test Group 5: High-Intensity Running Gait
  console.log('\nTest Group 5: High-Cadence Running Detection');
  detector.reset();
  t = 20000;
  // Fast running gait: ~160 spm (375ms per step, high g peaks > 1.8g)
  for (let step = 0; step < 6; step++) {
    // Swing / valley phase (2 samples at ~0.65g)
    detector.processAccelerometerSample(0.2, 0.65, 0.2, t);
    t += 60;
    detector.processAccelerometerSample(0.2, 0.68, 0.2, t);
    t += 60;

    // Heel strike / propulsion peak
    detector.processAccelerometerSample(0.4, 1.85, 0.4, t);
    t += 80;
    detector.processAccelerometerSample(0.2, 1.30, 0.2, t);
    t += 180;
  }
  assert(detector.steps === 6, `Expected 6 running steps, detected: ${detector.steps}`);
  assert(detector.motionState === 'RUNNING', 'High-cadence motion classified as RUNNING');

  console.log(`\n========================================`);
  console.log(`Total tests passed: ${passed}`);
  console.log(`Total tests failed: ${failed}`);
  console.log(`========================================\n`);

  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
