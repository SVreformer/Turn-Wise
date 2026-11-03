const { localRouter } = require('../mobile/src/services/localRouter');

const startId = 'node_entry_t1_main_east';
const destId = 'node_pf4_mid';

const profiles = ['first_time', 'mobility_disabled', 'elderly', 'visually_impaired', 'child', 'luggage_heavy'];

profiles.forEach(p => {
  const route = localRouter.findRoute(startId, destId, p);
  if (!route) {
    console.log(`Profile ${p}: NO ROUTE FOUND`);
  } else {
    console.log(`Profile ${p}:`);
    console.log(`  Distance: ${route.totalDistanceMeters}m`);
    console.log(`  Estimated Time: ${route.estimatedTimeMinutes} min`);
    console.log(`  Node Sequence (${route.nodeSequence.length} nodes):`, route.nodeSequence.join(' -> '));
    console.log(`  Accessibility: Wheelchair=${route.accessibility.wheelchairAccessible}, StepFree=${route.accessibility.stepFree}`);
    console.log(`  Lifts:`, route.accessibility.liftsUsed);
    console.log(`  Stairs:`, route.accessibility.stairsUsed);
    console.log(`  Ramps:`, route.accessibility.rampsUsed);
  }
});

