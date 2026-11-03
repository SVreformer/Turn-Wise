import { StationService } from '../server/src/services/stationService';
import { AssistantService } from '../server/src/tools/assistantService';

const stationService = new StationService();
const assistantService = new AssistantService(stationService);

const testQueries = [
  { q: 'Where is coach B4 on train 12658?', lang: 'en' as const, expectRoute: true },
  { q: 'Take me to Platform 8 without stairs', lang: 'en' as const, expectRoute: true },
  { q: 'Where is Karnataka Express?', lang: 'en' as const, expectRoute: true },
  { q: 'Find nearest accessible toilet', lang: 'en' as const, expectRoute: true },
  { q: 'Where is the nearest lift?', lang: 'en' as const, expectRoute: true },
  { q: 'Take me to ticket counter', lang: 'en' as const, expectRoute: true },
  { q: 'How to reach Namma Metro?', lang: 'en' as const, expectRoute: true },
  { q: 'where is ramp', lang: 'en' as const, expectRoute: true },
  { q: 'majestic subway', lang: 'en' as const, expectRoute: true },
  { q: 'platform no 5', lang: 'en' as const, expectRoute: true },
  { q: "I'm lost - rescue me", lang: 'en' as const, expectRoute: true },
  { q: 'from platform 1 to platform 8', lang: 'en' as const, expectRoute: true },
  { q: 'ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ 1 ರಲ್ಲಿ ಕೋಚ್ ಬಿ4 ಎಲ್ಲಿದೆ?', lang: 'kn' as const, expectRoute: true },
  { q: 'ಹತ್ತಿರದ ಶೌಚಾಲಯ ಎಲ್ಲಿದೆ?', lang: 'kn' as const, expectRoute: true },
  { q: 'ಕರ್ನಾಟಕ ಎಕ್ಸ್‌ಪ್ರೆಸ್ ಯಾವ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್?', lang: 'kn' as const, expectRoute: true },
  { q: 'कर्नाटक एक्सप्रेस किस प्लेटफॉर्म पर है?', lang: 'hi' as const, expectRoute: true },
  { q: 'निकटतम लिफ्ट कहाँ है?', lang: 'hi' as const, expectRoute: true }
];

async function runTests() {
  console.log('==============================================');
  console.log('🤖 TESTING AI CONCIERGE GROUNDED QUERY ENGINE');
  console.log('==============================================');

  let passed = 0;
  for (const item of testQueries) {
    const res = await assistantService.processUserMessage(item.q, {
      currentNodeId: 'node_entry_t1_main_east',
      profileId: 'first_time',
      language: item.lang
    });

    const hasRoute = !!res.route;
    const ok = item.expectRoute ? hasRoute : true;
    if (ok) passed++;

    console.log(`\nQuery [${item.lang}]: "${item.q}"`);
    console.log(`Action: ${res.action || 'none'}`);
    console.log(`Route Generated: ${hasRoute ? '✓ Yes (' + res.route?.totalDistanceMeters + 'm)' : '✗ No'}`);
    console.log(`Reply: ${res.reply}`);
  }

  console.log('\n==============================================');
  console.log(`Result: ${passed}/${testQueries.length} AI Concierge Commands PASSED!`);
  console.log('==============================================');
  if (passed !== testQueries.length) {
    process.exit(1);
  }
}

runTests();

