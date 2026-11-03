const { localRouter } = require('../mobile/src/services/localRouter');

// Let's test custom edge cost function for profiles
function testRouting(startId, destId) {
  const profiles = ['first_time', 'mobility_disabled', 'elderly', 'visually_impaired', 'child', 'luggage_heavy'];
  console.log(`=== ROUTING: ${startId} -> ${destId} ===`);
  
  profiles.forEach(p => {
    const route = localRouter.findRoute(startId, destId, p);
    if (!route) {
      console.log(`[${p}] No route`);
    } else {
      const stairs = route.accessibility.stairsUsed.length;
      const lifts = route.accessibility.liftsUsed.length;
      const ramps = route.accessibility.rampsUsed.length;
      console.log(`[${p}] Dist: ${route.totalDistanceMeters}m | Time: ${route.estimatedTimeMinutes}m | Stairs: ${stairs} | Lifts: ${lifts} | Ramps: ${ramps}`);
    }
  });
}

testRouting('node_entry_t1_main_east', 'node_pf4_center');
testRouting('node_entry_t1_main_east', 'node_pf1_center');
testRouting('node_entry_t1_main_east', 'node_pf6_center');
testRouting('node_entry_t1_main_east', 'node_pf8_center');

