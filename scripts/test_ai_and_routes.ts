import { apiService } from '../mobile/src/services/apiService';
import { localRouter } from '../mobile/src/services/localRouter';

async function test() {
  console.log('=== 1. AI Command: "Platform 4 without stairs" ===');
  const r1 = await apiService.queryAssistant('Platform 4 without stairs');
  console.log('Reply:', r1.reply);
  console.log('Detected Profile:', r1.profile);
  console.log('Start Node:', r1.startNode?.name);
  console.log('Destination Node:', r1.destinationNode?.name);
  console.log('Route Dist:', r1.route?.totalDistanceMeters, 'm | Est Time:', r1.route?.estimatedTimeMinutes, 'min');
  console.log('Is Step Free:', r1.route?.accessibility.stepFree);

  console.log('\n=== 2. AI Command: "From PF 1 to PF 8 for elderly" ===');
  const r2 = await apiService.queryAssistant('From PF 1 to PF 8 for elderly');
  console.log('Reply:', r2.reply);
  console.log('Detected Profile:', r2.profile);
  console.log('Start Node:', r2.startNode?.name);
  console.log('Destination Node:', r2.destinationNode?.name);
  console.log('Route Dist:', r2.route?.totalDistanceMeters, 'm | Est Time:', r2.route?.estimatedTimeMinutes, 'min');

  console.log('\n=== 3. AI Command: "Nearest toilet" ===');
  const r3 = await apiService.queryAssistant('Nearest toilet');
  console.log('Reply:', r3.reply);
  console.log('Destination Node:', r3.destinationNode?.name);
  console.log('Route Dist:', r3.route?.totalDistanceMeters, 'm');

  console.log('\n=== 4. Distinct Routes & Times Across Profiles (Main Entrance -> PF 8) ===');
  const profiles = ['first_time', 'mobility_disabled', 'elderly', 'visually_impaired', 'luggage_heavy'];
  for (const p of profiles) {
    const route = localRouter.findRoute('node_entry_t1_main_east', 'node_pf8_center', p);
    console.log(
      p.padEnd(20),
      '| Distance:', String(route?.totalDistanceMeters + 'm').padEnd(8),
      '| Time:', String(route?.estimatedTimeMinutes + ' min').padEnd(8),
      '| Step-Free:', String(route?.accessibility.stepFree).padEnd(6),
      '| Lifts:', route?.accessibility.liftsUsed.length || 0,
      '| Ramps:', route?.accessibility.rampsUsed.length || 0
    );
  }
}

test().catch(console.error);

