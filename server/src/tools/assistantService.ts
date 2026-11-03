import { GoogleGenerativeAI, FunctionDeclaration, Tool, SchemaType } from '@google/generative-ai';
import { StationService } from '../services/stationService';
import { RouteResult } from '../algorithms/router';

export class AssistantService {
  private stationService: StationService;
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;

  constructor(stationService: StationService) {
    this.stationService = stationService;
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'your_gemini_api_key_here') {
      try {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
          tools: this.getToolDefinitions()
        });
      } catch (err) {
        console.warn('Gemini initialization warning, using deterministic fallback engine.');
      }
    }
  }

  private getToolDefinitions(): Tool[] {
    const findRouteDeclaration: FunctionDeclaration = {
      name: 'find_route',
      description: 'Calculates the optimal walking route between two station nodes for a specified accessibility profile.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          startNodeId: { type: SchemaType.STRING, description: 'Starting node ID' },
          destinationNodeId: { type: SchemaType.STRING, description: 'Destination node ID' },
          profileId: { type: SchemaType.STRING, description: 'Profile ID: first_time, mobility_disabled, elderly, visually_impaired, luggage_heavy' }
        },
        required: ['startNodeId', 'destinationNodeId']
      }
    };

    const findCoachRouteDeclaration: FunctionDeclaration = {
      name: 'find_coach_route',
      description: 'Finds exact platform boarding location for specific train and coach number (e.g. Train 12658, Coach B4).',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          startNodeId: { type: SchemaType.STRING },
          trainNumber: { type: SchemaType.STRING },
          coachNumber: { type: SchemaType.STRING },
          profileId: { type: SchemaType.STRING }
        },
        required: ['trainNumber', 'coachNumber']
      }
    };

    const findFacilityDeclaration: FunctionDeclaration = {
      name: 'find_facility',
      description: 'Finds nearest passenger facility (toilet, lift, ramp, ticket counter, metro) from current location.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          category: { type: SchemaType.STRING },
          startNodeId: { type: SchemaType.STRING },
          profileId: { type: SchemaType.STRING }
        },
        required: ['category']
      }
    };

    const rescueDeclaration: FunctionDeclaration = {
      name: 'lost_passenger_rescue',
      description: 'Emergency rescue mode for lost passengers to navigate to nearest Help Desk, Exit, or Platform.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          startNodeId: { type: SchemaType.STRING },
          targetType: { type: SchemaType.STRING, description: 'HELP_DESK, EXIT, TOILET, PLATFORM' },
          profileId: { type: SchemaType.STRING }
        }
      }
    };

    return [{
      functionDeclarations: [
        findRouteDeclaration,
        findCoachRouteDeclaration,
        findFacilityDeclaration,
        rescueDeclaration
      ]
    }];
  }

  public async processUserMessage(
    userMessage: string,
    context: {
      currentNodeId?: string;
      profileId?: string;
      language?: 'en' | 'kn' | 'hi';
      activeRoute?: any;
    } = {}
  ): Promise<{
    reply: string;
    action?: string;
    route?: RouteResult | null;
    facility?: any;
    data?: any;
    language?: 'en' | 'kn' | 'hi';
  }> {
    const startNode = context.currentNodeId || 'node_entry_t1_main_east';
    const profile = context.profileId || 'first_time';
    const language = context.language || this.detectLanguage(userMessage);

    // 1. Try Gemini Function Calling if model initialized
    if (this.model) {
      try {
        const prompt = `You are Turn Wise AI Assistant, the official multilingual navigation guide for KSR Bengaluru Railway Station.
Current passenger context:
- Location Node: ${startNode}
- Accessibility Profile: ${profile}
- Language: ${language}
IMPORTANT RULES:
- Never hallucinate non-existent platforms or routes.
- Respond in the passenger's language (${language === 'kn' ? 'Kannada' : (language === 'hi' ? 'Hindi' : 'English')}).
- If passenger mentions coach and train (e.g. coach B4, train 12658), invoke find_coach_route.
- If passenger is lost, invoke lost_passenger_rescue.
User Query: "${userMessage}"`;

        const chat = this.model.startChat();
        const result = await chat.sendMessage(prompt);
        const functionCalls = result.response.functionCalls();

        if (functionCalls && functionCalls.length > 0) {
          const call = functionCalls[0];
          const toolResult = this.executeTool(call.name, call.args, startNode, profile);

          const followUp = await chat.sendMessage([{
            functionResponse: {
              name: call.name,
              response: { result: toolResult }
            }
          }]);

          return {
            reply: followUp.response.text(),
            action: call.name,
            route: toolResult.route || null,
            facility: toolResult.facility || null,
            data: toolResult,
            language
          };
        }

        return {
          reply: result.response.text(),
          language
        };
      } catch (err: any) {
        console.warn('Gemini invocation error, using deterministic multilingual engine:', err.message);
      }
    }

    // 2. Deterministic Multilingual Fallback Engine
    return this.deterministicHandler(userMessage, startNode, profile, language);
  }

  private detectLanguage(text: string): 'en' | 'kn' | 'hi' {
    const knRegex = /[\u0C80-\u0CFF]/;
    const hiRegex = /[\u0900-\u097F]/;
    if (knRegex.test(text)) return 'kn';
    if (hiRegex.test(text)) return 'hi';
    return 'en';
  }

  private executeTool(name: string, args: any, defaultStart: string, defaultProfile: string): any {
    switch (name) {
      case 'find_route': {
        const s = args.startNodeId || defaultStart;
        const d = args.destinationNodeId;
        const p = args.profileId || defaultProfile;
        const route = this.stationService.router.findRoute(s, d, p);
        return { success: !!route, route };
      }
      case 'find_coach_route': {
        const s = args.startNodeId || defaultStart;
        const train = args.trainNumber || '12658';
        const coach = args.coachNumber || 'B4';
        const p = args.profileId || defaultProfile;
        const route = this.stationService.findRouteToCoach(s, train, coach, p);
        return { success: !!route, route, coach, train };
      }
      case 'find_facility': {
        const cat = args.category;
        const s = args.startNodeId || defaultStart;
        const p = args.profileId || defaultProfile;
        const res = this.stationService.findNearestFacility(s, cat, p);
        return { success: !!res, facility: res?.facility, route: res?.route, distance: res?.distance };
      }
      case 'lost_passenger_rescue': {
        const s = args.startNodeId || defaultStart;
        const target = args.targetType || 'HELP_DESK';
        const p = args.profileId || defaultProfile;
        const res = this.stationService.resolveLostPassengerRescue(s, target, p);
        return { success: !!res, ...res };
      }
      default:
        return { error: `Unknown tool: ${name}` };
    }
  }

  private deterministicHandler(
    query: string,
    startNodeId: string,
    currentProfile: string,
    lang: 'en' | 'kn' | 'hi'
  ) {
    const q = query.toLowerCase().trim();

    // 1. Accessibility Profile detection
    let profile = currentProfile;
    if (
      q.includes('wheelchair') || q.includes('step-free') || q.includes('step free') ||
      q.includes('no stairs') || q.includes('avoid stairs') ||
      q.includes('ವ್ಹೀಲ್ಚೇರ್') || q.includes('ಮೆಟ್ಟಿಲುಗಳಿಲ್ಲದೆ') ||
      q.includes('व्हीलचेयर') || q.includes('बिना सीढ़ी') || q.includes('mobility') || q.includes('disabled')
    ) {
      profile = 'mobility_disabled';
    } else if (q.includes('elderly') || q.includes('senior') || q.includes('ಹಿರಿಯ') || q.includes('ಬುಜುರ್ಗ್') || q.includes('बुजुर्ग')) {
      profile = 'elderly';
    } else if (q.includes('blind') || q.includes('vision') || q.includes('ಅಂಧ') || q.includes('ದೃಷ್ಟಿ') || q.includes('दृष्टि') || q.includes('नेत्रहीन')) {
      profile = 'visually_impaired';
    } else if (q.includes('luggage') || q.includes('baggage') || q.includes('bags') || q.includes('ಬ್ಯಾಗೇಜ್') || q.includes('ಸಾಮಾನು') || q.includes('सामान')) {
      profile = 'luggage_heavy';
    }

    // 2. Parse "From X to Y" if present
    let effectiveStart = startNodeId;
    let overrideDestId: string | null = null;
    let overrideDestPf: number | null = null;
    const fromToMatch = q.match(/(?:from|ಇಂದ|से)\s+(?:platform|pf|ಪ್ಲಾಟ್‌ಫಾರ್ಮ್|ಪ್ಲೇಟ್‌ಫಾರ್ಮ್|ಪ್ಲಾಟ್\s*ಫಾರ್ಮ್|प्लेटफॉर्म|प्लेटफार्म)\s*(\d{1,2})\s+(?:to|ಕಡೆಗೆ|ಗೆ|तक)\s+(?:platform|pf|ಪ್ಲಾಟ್‌ಫಾರ್ಮ್|ಪ್ಲೇಟ್‌ಫಾರ್ಮ್|ಪ್ಲಾಟ್\s*ಫಾರ್ಮ್|प्लेटफॉर्म|प्लेटफार्म)?\s*(\d{1,2})/i);
    if (fromToMatch) {
      const fromPf = parseInt(fromToMatch[1], 10);
      const toPf = parseInt(fromToMatch[2], 10);
      if (fromPf >= 1 && fromPf <= 10) effectiveStart = `node_pf${fromPf}_center`;
      if (toPf >= 1 && toPf <= 10) {
        overrideDestId = `node_pf${toPf}_center`;
        overrideDestPf = toPf;
      }
    } else {
      const fromMatch = q.match(/(?:from|ಇಂದ|से)\s+(?:platform|pf|ಪ್ಲಾಟ್‌ಫಾರ್ಮ್|ಪ್ಲೇಟ್‌ಫಾರ್ಮ್|ಪ್ಲಾಟ್\s*ಫಾರ್ಮ್|प्लेटफॉर्म|प्लेटफार्म)\s*(\d{1,2})/i);
      if (fromMatch) {
        const fromPf = parseInt(fromMatch[1], 10);
        if (fromPf >= 1 && fromPf <= 10) effectiveStart = `node_pf${fromPf}_center`;
      } else if (q.includes('from entrance') || q.includes('from main gate') || q.includes('ಪ್ರವೇಶದಿಂದ') || q.includes('गेट से')) {
        effectiveStart = 'node_entry_t1_main_east';
      }
    }

    // 3. Lost passenger rescue intent
    if (
      q.includes('lost') || q.includes('help me') || q.includes('rescue') ||
      q.includes('emergency') || q.includes('where am i') ||
      q.includes('ದಾರಿ ತಪ್ಪಿದೆ') || q.includes('ಸಹಾಯ') || q.includes('ಕಾಪಾಡಿ') ||
      q.includes('खो गया') || q.includes('मदद') || q.includes('रास्ता भूल') || q.includes('सहायता')
    ) {
      const rescue = this.stationService.resolveLostPassengerRescue(effectiveStart, 'HELP_DESK', profile);
      const reply = lang === 'kn'
        ? (rescue?.rescueMessage.kn || 'ರಕ್ಷಣಾ ಮಾರ್ಗ ಸಕ್ರಿಯಗೊಂಡಿದೆ. ದಯವಿಟ್ಟು ಸಹಾಯ ಕೇಂದ್ರದ ಕಡೆಗೆ ತೆರಳಿ.')
        : (lang === 'hi'
          ? (rescue?.rescueMessage.hi || 'बचाव मोड सक्रिय है। कृपया सहायता केंद्र की ओर बढ़ें।')
          : (rescue?.rescueMessage.en || 'Rescue Mode activated. Follow the route to the Help Desk.'));

      return {
        reply,
        action: 'lost_passenger_rescue',
        route: rescue?.route,
        data: { target: 'HELP_DESK', profile },
        language: lang
      };
    }

    // 4. Train Coach Query (e.g. "coach B4", "where is coach S3 on train 12658?", "ಕೋಚ್ ಬಿ4", "कोच B4")
    const normalizeCoach = (raw: string): string => {
      let c = raw.trim().toUpperCase();
      c = c.replace(/ಬಿ/g, 'B').replace(/ಎಸ್/g, 'S').replace(/ಎಚ್/g, 'H').replace(/ಎ/g, 'A').replace(/ಡಿ/g, 'D').replace(/ಸಿ/g, 'C').replace(/ಇ/g, 'E');
      c = c.replace(/बी/g, 'B').replace(/एस/g, 'S').replace(/एच/g, 'H').replace(/ए/g, 'A').replace(/डी/g, 'D').replace(/सी/g, 'C').replace(/ई/g, 'E');
      c = c.replace(/೦/g, '0').replace(/೧/g, '1').replace(/೨/g, '2').replace(/೩/g, '3').replace(/೪/g, '4').replace(/೫/g, '5').replace(/೬/g, '6').replace(/೭/g, '7').replace(/೮/g, '8').replace(/೯/g, '9');
      c = c.replace(/०/g, '0').replace(/१/g, '1').replace(/२/g, '2').replace(/३/g, '3').replace(/४/g, '4').replace(/५/g, '5').replace(/६/g, '6').replace(/७/g, '7').replace(/८/g, '8').replace(/९/g, '9');
      return c;
    };

    const coachMatch = q.match(/(?:coach|ಕೋಚ್|कोच)\s*([a-zA-Z\u0C80-\u0CFF\u0900-\u097F0-9]{1,4})/i) ||
      q.match(/([a-zA-Z\u0C80-\u0CFF\u0900-\u097F0-9]{1,4})\s*(?:coach|ಕೋಚ್|कोच)/i);

    if (coachMatch) {
      const coachCode = normalizeCoach(coachMatch[1]);
      // Look for train number or name
      const trainMatch = q.match(/(?:train|ರೈಲು|ट्रेन|ಗಾಡಿ)?\s*(\d{5})/i);
      let trainNo = trainMatch ? trainMatch[1] : '';
      if (!trainNo) {
        const namedTrain = this.stationService.findTrain(q);
        if (namedTrain) {
          trainNo = namedTrain.trainNumber;
        } else {
          trainNo = '12658'; // Default flagship SBC Mail
        }
      }

      const coachRoute = this.stationService.findRouteToCoach(effectiveStart, trainNo, coachCode, profile);
      if (coachRoute) {
        const pf = coachRoute.coachInfo?.platformNumber || 1;
        const tName = coachRoute.coachInfo?.trainName || `Train ${trainNo}`;

        let reply = `Coach ${coachCode} is positioned at Platform ${pf} (${tName}). I've mapped a step-by-step route (${coachRoute.totalDistanceMeters}m, ~${coachRoute.estimatedTimeMinutes} min) directly to your coach boarding spot.`;
        if (lang === 'kn') {
          reply = `ಕೋಚ್ ${coachCode} ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ${pf} ನಲ್ಲಿದೆ (${tName}). ನಿಮ್ಮ ಕೋಚ್ ಹತ್ತುವ ನಿಖರ ಸ್ಥಳಕ್ಕೆ (${coachRoute.totalDistanceMeters} ಮೀಟರ್, ~${coachRoute.estimatedTimeMinutes} ನಿಮಿಷ) ಮಾರ್ಗವನ್ನು ತೋರಿಸಲಾಗಿದೆ.`;
        } else if (lang === 'hi') {
          reply = `कोच ${coachCode} प्लेटफॉर्म ${pf} पर स्थित है (${tName})। आपके कोच बोर्डिंग स्पॉट तक (${coachRoute.totalDistanceMeters} मीटर, ~${coachRoute.estimatedTimeMinutes} मिनट) का सीधा मार्ग तैयार किया गया है।`;
        }

        return {
          reply,
          action: 'find_coach_route',
          route: coachRoute,
          data: { trainNo, coachCode, platform: pf },
          language: lang
        };
      }
    }

    // 5. Train Inquiry (e.g. "Karnataka Express platform", "Where is Vande Bharat?", "Train 12628")
    const trainInfo = this.stationService.findTrain(q);
    if (trainInfo) {
      const pfNum = trainInfo.platformNumber || trainInfo.platform || 1;
      const tName = trainInfo.trainName || `Train ${trainInfo.trainNumber}`;
      const destNodeId = `node_pf${pfNum}_center`;
      const route = this.stationService.router.findRoute(effectiveStart, destNodeId, profile);

      let reply = `${tName} (Train ${trainInfo.trainNumber}) departs from Platform ${pfNum}. Here is the navigation route to Platform ${pfNum} (${route ? route.totalDistanceMeters + 'm' : '~3 min'}).`;
      if (lang === 'kn') {
        reply = `${tName} (ರೈಲು ಸಂಖ್ಯೆ ${trainInfo.trainNumber}) ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ${pfNum} ನಿಂದ ಹೊರಡುತ್ತದೆ. ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ${pfNum} ಗೆ ನೇರ ಮಾರ್ಗ ಇಲ್ಲಿದೆ (${route ? route.totalDistanceMeters + ' ಮೀಟರ್' : ''}).`;
      } else if (lang === 'hi') {
        reply = `${tName} (ट्रेन ${trainInfo.trainNumber}) प्लेटफॉर्म ${pfNum} से रवाना होती है। प्लेटफॉर्म ${pfNum} के लिए मार्ग तैयार है (${route ? route.totalDistanceMeters + ' मीटर' : ''})।`;
      }

      return {
        reply,
        action: 'find_route',
        route,
        data: { train: trainInfo, platform: pfNum },
        language: lang
      };
    }

    // 6. Platform Query (e.g. "Platform 8", "pf 5", "platform no 4", "take me to 5th platform", "ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ 8", "ಪ್ಲೇಟ್‌ಫಾರ್ಮ್ 8", "प्लेटफॉर्म 8")
    let targetPfNum: number | null = overrideDestPf;
    let targetDestNodeId: string | null = overrideDestId;

    if (!targetDestNodeId) {
      const pfMatch = q.match(/(?:platform|pf|plat|ವೇದಿಕೆ|ಪ್ಲಾಟ್‌ಫಾರ್ಮ್|ಪ್ಲೇಟ್‌ಫಾರ್ಮ್|ಪ್ಲಾಟ್\s*ಫಾರ್ಮ್|प्लेटफॉर्म|प्लेटफार्म)\s*(?:no\.?|number|ಸಂಖ್ಯೆ|ನಂ|नंबर|नं)?\s*(\d{1,2})/i) ||
        q.match(/(\d{1,2})(?:st|nd|rd|th)?\s*(?:platform|pf|ಪ್ಲಾಟ್‌ಫಾರ್ಮ್|ಪ್ಲೇಟ್‌ಫಾರ್ಮ್|प्लेटफॉर्म)/i);

      if (pfMatch) {
        const pfNum = parseInt(pfMatch[1], 10);
        if (pfNum >= 1 && pfNum <= 10) {
          targetPfNum = pfNum;
          targetDestNodeId = `node_pf${pfNum}_center`;
        }
      }
    }

    if (targetDestNodeId && targetPfNum) {
      const pfNum = targetPfNum;
      const route = this.stationService.router.findRoute(effectiveStart, targetDestNodeId, profile);
      if (route) {
          const isWheelchair = profile === 'mobility_disabled';
          let reply = isWheelchair
            ? `I have calculated a step-free accessible route to Platform ${pfNum} (${route.totalDistanceMeters}m, ~${route.estimatedTimeMinutes} min) avoiding all stairs.`
            : `Here is the recommended route to Platform ${pfNum} (${route.totalDistanceMeters}m, ~${route.estimatedTimeMinutes} min).`;

          if (lang === 'kn') {
            reply = isWheelchair
              ? `ಮೆಟ್ಟಿಲುಗಳಿಲ್ಲದ ಸುಲಭ ಮಾರ್ಗವನ್ನು ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ${pfNum} ಗೆ (${route.totalDistanceMeters} ಮೀಟರ್, ~${route.estimatedTimeMinutes} ನಿಮಿಷ) ಸಿದ್ಧಪಡಿಸಲಾಗಿದೆ.`
              : `ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ${pfNum} ಗೆ ಶಿಫಾರಸು ಮಾಡಿದ ಮಾರ್ಗ ಇಲ್ಲಿದೆ (${route.totalDistanceMeters} ಮೀಟರ್, ~${route.estimatedTimeMinutes} ನಿಮಿಷ).`;
          } else if (lang === 'hi') {
            reply = isWheelchair
              ? `सीढ़ियों से बचते हुए प्लेटफॉर्म ${pfNum} के लिए सुगम मार्ग (${route.totalDistanceMeters} मीटर, ~${route.estimatedTimeMinutes} मिनट) तैयार किया गया है।`
              : `प्लेटफॉर्म ${pfNum} के लिए अनुशंसित मार्ग (${route.totalDistanceMeters} मीटर, ~${route.estimatedTimeMinutes} मिनट)।`;
          }

          return {
            reply,
            action: 'find_route',
            route,
            data: { profile, destination: `Platform ${pfNum}` },
            language: lang
          };
        }
    }

    // 7. Specific Facility Shortcuts
    // Lift 1, Lift 2, Lift 3
    const liftMatch = q.match(/(?:lift|elevator|ಲಿಫ್ಟ್|लिफ्ट)\s*(\d)/i);
    if (liftMatch) {
      const liftNum = liftMatch[1];
      const liftId = `lift_${liftNum}`;
      const cand = this.stationService.getFacilityById(liftId);
      if (cand) {
        const destNode = this.stationService.router.getFacilityNode(cand);
        const route = this.stationService.router.findRoute(effectiveStart, destNode.id, profile);
        return {
          reply: `Here is the route to ${cand.name} (${route?.totalDistanceMeters || 0}m).`,
          action: 'find_facility',
          route: route ? { ...route, destination: destNode } : null,
          facility: cand,
          language: lang
        };
      }
    }

    // Platform-specific restrooms (e.g. "Platform 4 toilet", "pf 7 restroom")
    const pfToiletMatch = q.match(/(?:toilet|restroom|washroom|ಶೌಚಾಲಯ|शौचालय).*(?:pf|platform|ಪ್ಲಾಟ್‌ಫಾರ್ಮ್|प्लेटफॉर्म)\s*(\d{1,2})/i) ||
      q.match(/(?:pf|platform|ಪ್ಲಾಟ್‌ಫಾರ್ಮ್|प्लेटफॉर्म)\s*(\d{1,2}).*(?:toilet|restroom|washroom|ಶೌಚಾಲಯ|शौचालय)/i);
    if (pfToiletMatch) {
      const pfn = parseInt(pfToiletMatch[1], 10);
      let toiletId = 'toilet_t1_main';
      if (pfn === 4) toiletId = 'toilet_pf4';
      else if (pfn === 1) toiletId = 'toilet_pf1_west';
      else if (pfn === 2 || pfn === 3) toiletId = 'toilet_pf2_3';
      else if (pfn === 5 || pfn === 6) toiletId = 'toilet_pf5_6';
      else if (pfn === 7 || pfn === 8) toiletId = 'toilet_pf7_8';
      else if (pfn === 9 || pfn === 10) toiletId = 'toilet_pf9_10_east';

      const cand = this.stationService.getFacilityById(toiletId);
      if (cand) {
        const destNode = this.stationService.router.getFacilityNode(cand);
        const route = this.stationService.router.findRoute(effectiveStart, destNode.id, profile);
        return {
          reply: `Here is the route to Restroom for Platform ${pfn} (${cand.name}).`,
          action: 'find_facility',
          route: route ? { ...route, destination: destNode } : null,
          facility: cand,
          language: lang
        };
      }
    }

    // 8. General Restrooms (toilet / washroom / ಶೌಚಾಲಯ / शौचालय)
    if (
      q.includes('toilet') || q.includes('restroom') || q.includes('washroom') || q.includes('lavatory') ||
      q.includes('urinal') || q.includes('wc') ||
      q.includes('ಶೌಚಾಲಯ') || q.includes('ಶೌಚಾಗಾರ') || q.includes('ಟಾಯ್ಲೆಟ್') ||
      q.includes('शौचालय') || q.includes('टॉयलेट') || q.includes('बाथरूम') || q.includes('वॉशरूम')
    ) {
      const res = this.stationService.findNearestFacility(effectiveStart, 'TOILET', profile);
      if (res && res.route) {
        let reply = `The nearest restroom is ${res.facility.name} (${res.distance.toFixed(0)}m away).`;
        if (lang === 'kn') {
          reply = `ಹತ್ತಿರದ ಶೌಚಾಲಯವು ${res.facility.name} ಆಗಿದೆ (${res.distance.toFixed(0)} ಮೀಟರ್ ದೂರದಲ್ಲಿದೆ).`;
        } else if (lang === 'hi') {
          reply = `निकटतम शौचालय ${res.facility.name} है (${res.distance.toFixed(0)} मीटर की दूरी पर)।`;
        }

        return {
          reply,
          action: 'find_facility',
          route: res.route,
          facility: res.facility,
          language: lang
        };
      }
    }

    // 9. Lifts (lift / elevator / ಲಿಫ್ಟ್ / लिफ्ट)
    if (q.includes('lift') || q.includes('elevator') || q.includes('ಲಿಫ್ಟ್') || q.includes('ಎಲಿವೇಟರ್') || q.includes('लिफ्ट') || q.includes('एलिवेटर')) {
      const res = this.stationService.findNearestFacility(effectiveStart, 'LIFT', profile);
      if (res && res.route) {
        let reply = `The nearest lift is ${res.facility.name} (${res.distance.toFixed(0)}m away).`;
        if (lang === 'kn') {
          reply = `ಹತ್ತಿರದ ಲಿಫ್ಟ್ ${res.facility.name} ಆಗಿದೆ (${res.distance.toFixed(0)} ಮೀಟರ್ ದೂರ).`;
        } else if (lang === 'hi') {
          reply = `निकटतम लिफ्ट ${res.facility.name} है (${res.distance.toFixed(0)} मीटर दूरी पर)।`;
        }

        return {
          reply,
          action: 'find_facility',
          route: res.route,
          facility: res.facility,
          language: lang
        };
      }
    }

    // 10. Ramps (ramp / sloped path / ರಾಂಪ್ / रैंप)
    if (q.includes('ramp') || q.includes('sloped') || q.includes('slope') || q.includes('ರಾಂಪ್') || q.includes('ಇಳಿಜಾರು') || q.includes('रैंप') || q.includes('ढलान')) {
      const res = this.stationService.findNearestFacility(effectiveStart, 'RAMP', profile);
      if (res && res.route) {
        let reply = `The nearest accessible ramp is ${res.facility.name} (${res.distance.toFixed(0)}m away).`;
        if (lang === 'kn') {
          reply = `ಹತ್ತಿರದ ಪ್ರವೇಶಿಸಬಹುದಾದ ರಾಂಪ್ ${res.facility.name} ಆಗಿದೆ (${res.distance.toFixed(0)} ಮೀಟರ್ ದೂರ).`;
        } else if (lang === 'hi') {
          reply = `निकटतम सुगम रैंप ${res.facility.name} है (${res.distance.toFixed(0)} मीटर की दूरी पर)।`;
        }

        return {
          reply,
          action: 'find_facility',
          route: res.route,
          facility: res.facility,
          language: lang
        };
      }
    }

    // 11. Ticket Counters / Booking Offices
    if (
      q.includes('ticket') || q.includes('booking') || q.includes('counter') || q.includes('uts') || q.includes('prs') ||
      q.includes('ಟಿಕೆಟ್') || q.includes('ಬುಕಿಂಗ್') ||
      q.includes('टिकट') || q.includes('बुकिंग')
    ) {
      const res = this.stationService.findNearestFacility(effectiveStart, 'TICKET_COUNTER', profile);
      if (res && res.route) {
        let reply = `The nearest ticket booking office is ${res.facility.name} (${res.distance.toFixed(0)}m away).`;
        if (lang === 'kn') {
          reply = `ಹತ್ತಿರದ ಟಿಕೆಟ್ ಕೌಂಟರ್ ${res.facility.name} ಆಗಿದೆ (${res.distance.toFixed(0)} ಮೀಟರ್ ದೂರದಲ್ಲಿದೆ).`;
        } else if (lang === 'hi') {
          reply = `निकटतम टिकट बुकिंग काउंटर ${res.facility.name} है (${res.distance.toFixed(0)} मीटर दूरी पर)।`;
        }

        return {
          reply,
          action: 'find_facility',
          route: res.route,
          facility: res.facility,
          language: lang
        };
      }
    }

    // 12. Metro Link (Namma Metro / Terminal 3)
    if (
      q.includes('metro') || q.includes('namma metro') || q.includes('terminal 3') ||
      q.includes('ಮೆಟ್ರೋ') || q.includes('ನಮ್ಮ ಮೆಟ್ರೋ') ||
      q.includes('मेट्रो') || q.includes('नम्मा मेट्रो')
    ) {
      const res = this.stationService.findNearestFacility(effectiveStart, 'METRO', profile);
      if (res && res.route) {
        let reply = `The Metro connectivity entrance is at ${res.facility.name} (${res.distance.toFixed(0)}m away). Follow the direct pedestrian bridge.`;
        if (lang === 'kn') {
          reply = `ನಮ್ಮ ಮೆಟ್ರೋ ಸಂಪರ್ಕ ದ್ವಾರವು ${res.facility.name} ನಲ್ಲಿದೆ (${res.distance.toFixed(0)} ಮೀಟರ್ ದೂರ). ನೇರ ಪಾದಚಾರಿ ಸೇತುವೆಯನ್ನು ಅನುಸರಿಸಿ.`;
        } else if (lang === 'hi') {
          reply = `नम्मा मेट्रो कनेक्टिविटी प्रवेश द्वार ${res.facility.name} पर है (${res.distance.toFixed(0)} मीटर की दूरी पर)। सीधे पैदल पुल का पालन करें।`;
        }

        return {
          reply,
          action: 'find_facility',
          route: res.route,
          facility: res.facility,
          language: lang
        };
      }
    }

    // 13. Subway (Majestic underground tunnel)
    if (
      q.includes('subway') || q.includes('tunnel') || q.includes('underground') || q.includes('underpass') ||
      q.includes('ಸಬ್‌ವೇ') || q.includes('ನೆಲದಡಿಯ') || q.includes('ಸುರಂಗ') ||
      q.includes('सबवे') || q.includes('भूमिगत') || q.includes('सुरंग')
    ) {
      const res = this.stationService.findNearestFacility(effectiveStart, 'SUBWAY', profile);
      if (res && res.route) {
        let reply = `Majestic Passenger Subway is at ${res.facility.name} (${res.distance.toFixed(0)}m away). Provides step-free ramp access.`;
        if (lang === 'kn') {
          reply = `ಮೆಜೆಸ್ಟಿಕ್ ಪ್ರಯಾಣಿಕರ ಸಬ್‌ವೇ ${res.facility.name} ನಲ್ಲಿದೆ (${res.distance.toFixed(0)} ಮೀಟರ್ ದೂರ). ಸುಲಭ ರಾಂಪ್ ಪ್ರವೇಶ ಲಭ್ಯವಿದೆ.`;
        } else if (lang === 'hi') {
          reply = `मजेस्टिक यात्री सबवे ${res.facility.name} पर है (${res.distance.toFixed(0)} मीटर की दूरी पर)। इसमें सुगम रैंप उपलब्ध है।`;
        }

        return {
          reply,
          action: 'find_facility',
          route: res.route,
          facility: res.facility,
          language: lang
        };
      }
    }

    // 14. Footover Bridges (FOB)
    if (
      q.includes('fob') || q.includes('bridge') || q.includes('footover') || q.includes('overbridge') ||
      q.includes('ಮೇಲ್ಸೇತುವೆ') || q.includes('ಎಫ್‌ಒಬಿ') || q.includes('ಬ್ರಿಡ್ಜ್') ||
      q.includes('फुटओवर') || q.includes('ओवरब्रिज') || q.includes('पुल')
    ) {
      const res = this.stationService.findNearestFacility(effectiveStart, 'FOB', profile);
      if (res && res.route) {
        let reply = `The nearest Footover Bridge is ${res.facility.name} (${res.distance.toFixed(0)}m away), connecting all platforms.`;
        if (lang === 'kn') {
          reply = `ಹತ್ತಿರದ ಮೇಲ್ಸೇತುವೆ (FOB) ${res.facility.name} ಆಗಿದೆ (${res.distance.toFixed(0)} ಮೀಟರ್ ದೂರ), ಇದು ಎಲ್ಲಾ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್‌ಗಳನ್ನು ಸಂಪರ್ಕಿಸುತ್ತದೆ.`;
        } else if (lang === 'hi') {
          reply = `निकटतम फुटओवर ब्रिज ${res.facility.name} है (${res.distance.toFixed(0)} मीटर दूरी पर), जो सभी प्लेटफॉर्मों को जोड़ता है।`;
        }

        return {
          reply,
          action: 'find_facility',
          route: res.route,
          facility: res.facility,
          language: lang
        };
      }
    }

    // 15. Entrance / Exit
    if (
      q.includes('entrance') || q.includes('exit') || q.includes('entry') || q.includes('main gate') ||
      q.includes('way out') || q.includes('leave') || q.includes('outside') ||
      q.includes('ಪ್ರವೇಶ') || q.includes('ನಿರ್ಗಮನ') || q.includes('ಹೊರಹೋಗುವ') || q.includes('ಮುಖ್ಯ ದ್ವಾರ') ||
      q.includes('प्रवेश') || q.includes('निकास') || q.includes('बाहर') || q.includes('मुख्य द्वार')
    ) {
      const res = this.stationService.findNearestFacility(effectiveStart, 'ENTRANCE', profile);
      if (res && res.route) {
        let reply = `The station entrance/exit gate is ${res.facility.name} (${res.distance.toFixed(0)}m away).`;
        if (lang === 'kn') {
          reply = `ನಿಲ್ದಾಣದ ಪ್ರವೇಶ/ನಿರ್ಗಮನ ದ್ವಾರವು ${res.facility.name} ಆಗಿದೆ (${res.distance.toFixed(0)} ಮೀಟರ್ ದೂರ).`;
        } else if (lang === 'hi') {
          reply = `स्टेशन का प्रवेश/निकास द्वार ${res.facility.name} है (${res.distance.toFixed(0)} मीटर दूरी पर)।`;
        }

        return {
          reply,
          action: 'find_facility',
          route: res.route,
          facility: res.facility,
          language: lang
        };
      }
    }

    // 16. Waiting Room / Lounge / Cloak Room
    if (
      q.includes('waiting') || q.includes('lounge') || q.includes('cloak') || q.includes('luggage room') ||
      q.includes('rest room') || q.includes('rest area') ||
      q.includes('ವಿಶ್ರಾಂತಿ') || q.includes('ವೇಟಿಂಗ್') || q.includes('ಕ್ಲೋಕ್‌ರೂಮ್') ||
      q.includes('प्रतीक्षालय') || q.includes('वेटिंग') || q.includes('क्लॉक')
    ) {
      const destNode = this.stationService.router.nodeDict.get('node_entry_t1_center') || this.stationService.router.nodeDict.get('node_entry_t1_main_east');
      if (destNode) {
        const route = this.stationService.router.findRoute(effectiveStart, destNode.id, profile);
        let reply = `The passenger waiting area and concourse amenities are located at Terminal 1 Central Passenger Concourse (${route?.totalDistanceMeters || 45}m).`;
        if (lang === 'kn') {
          reply = `ಪ್ರಯಾಣಿಕರ ವಿಶ್ರಾಂತಿ ಕೊಠಡಿ ಮತ್ತು ಸೌಲಭ್ಯಗಳು ಟರ್ಮಿನಲ್ 1 ರ ಕೇಂದ್ರ ಸಭಾಂಗಣದಲ್ಲಿವೆ (${route?.totalDistanceMeters || 45} ಮೀಟರ್).`;
        } else if (lang === 'hi') {
          reply = `यात्री प्रतीक्षालय और सुविधाएं टर्मिनल 1 के केंद्रीय हॉल में स्थित हैं (${route?.totalDistanceMeters || 45} मीटर)।`;
        }

        return {
          reply,
          action: 'find_facility',
          route: route ? { ...route, destination: destNode } : null,
          data: { location: 'Terminal 1 Central Concourse' },
          language: lang
        };
      }
    }

    // 17. General Welcome / Guidance
    let defaultReply = "I am Turn Wise AI Assistant for KSR Bengaluru Station. Ask me for directions to any platform (1-10), train status (e.g. 'Karnataka Express'), coach location (e.g. 'Coach B4'), nearest lift, ramp, or accessible restroom.";
    if (lang === 'kn') {
      defaultReply = "ನಾನು ಕೆಎಸ್ಆರ್ ಬೆಂಗಳೂರು ನಿಲ್ದಾಣದ ಅಧಿಕೃತ ಟರ್ನ್ ವೈಸ್ (Turn Wise) ಎಐ ಸಹಾಯಕ. ಯಾವುದೇ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ (1-10), ರೈಲು ವಿವರ (ಉದಾ: 'ಕರ್ನಾಟಕ ಎಕ್ಸ್‌ಪ್ರೆಸ್'), ಕೋಚ್ ವಿವರ (ಉದಾ: 'ಕೋಚ್ B4'), ಲಿಫ್ಟ್, ರಾಂಪ್ ಅಥವಾ ಶೌಚಾಲಯದ ಮಾರ್ಗದರ್ಶನಕ್ಕಾಗಿ ನನ್ನನ್ನು ಕೇಳಿ.";
    } else if (lang === 'hi') {
      defaultReply = "मैं केएसआर बेंगलुरु स्टेशन के लिए टर्न वाइज (Turn Wise) एआई सहायक हूँ। किसी भी प्लेटफॉर्म (1-10), ट्रेन की जानकारी (उदा: 'कर्नाटक एक्सप्रेस'), कोच की स्थिति (उदा: 'कोच B4'), निकटतम लिफ्ट, रैंप या शौचालय के लिए मुझसे पूछें।";
    }

    return {
      reply: defaultReply,
      language: lang
    };
  }
}
