import { localRouter, RouteResult, StationNode, IncidentReport } from './localRouter';
import platformsData from '../data/station/platforms.json';
import facilitiesData from '../data/station/facilities.json';
import checkpointsData from '../data/simulation/checkpoints.json';

// Real-time railway intelligence datasets
import citiesData from '../data/realtime/cities.json';
import stationsBundle from '../data/realtime/stations_bundle.json';
import stationPlatformsData from '../data/realtime/station_platforms.json';
import stationSchedulesData from '../data/realtime/station_schedules.json';
import trainsBundle from '../data/realtime/trains_bundle.json';

const ENV_BACKEND_URL = process.env.EXPO_PUBLIC_API_URL ? process.env.EXPO_PUBLIC_API_URL.replace(/\/+$/, '') : '';
const CANDIDATE_URLS = [
  ENV_BACKEND_URL,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://10.0.2.2:3000'
].filter(Boolean) as string[];

export class ApiService {
  private isOnlineState: boolean = true;
  private backendBaseUrl: string = ENV_BACKEND_URL || 'http://localhost:3000';

  constructor() {
    this.checkConnectivity();
  }

  public async checkConnectivity(): Promise<boolean> {
    for (const url of CANDIDATE_URLS) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const res = await fetch(`${url}/health`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
          this.backendBaseUrl = url;
          this.isOnlineState = true;
          return true;
        }
      } catch {}
    }
    this.isOnlineState = false;
    return false;
  }

  public get isOnline(): boolean {
    return this.isOnlineState;
  }

  public setBackendUrl(url: string) {
    this.backendBaseUrl = url;
  }

  // 1. Station Overview
  public async getStationOverview() {
    if (this.isOnlineState) {
      try {
        const res = await fetch(`${this.backendBaseUrl}/api/station`);
        if (res.ok) return await res.json();
      } catch {}
    }
    return {
      stationName: "Krantivira Sangolli Rayanna (Bengaluru Railway Station)",
      stationCode: "SBC",
      tagline: "Smart & Accessible Navigation for KSR Bengaluru",
      viewBox: { width: 3456, height: 1728, minX: 0, minY: 0 },
      totalPlatforms: platformsData.length,
      totalFacilities: facilitiesData.length,
      totalNodes: localRouter.nodes.length,
      isOffline: !this.isOnlineState
    };
  }

  // 2. Platforms
  public async getPlatforms(): Promise<any[]> {
    if (this.isOnlineState) {
      try {
        const res = await fetch(`${this.backendBaseUrl}/api/platforms`);
        if (res.ok) return await res.json();
      } catch {}
    }
    return platformsData;
  }

  // 3. Facilities
  public async getFacilities(category?: string, wheelchairOnly?: boolean): Promise<any[]> {
    if (this.isOnlineState) {
      try {
        const queryParams: string[] = [];
        if (category) queryParams.push(`category=${encodeURIComponent(category)}`);
        if (wheelchairOnly) queryParams.push('wheelchair=true');
        const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
        const res = await fetch(`${this.backendBaseUrl}/api/facilities${queryString}`);
        if (res.ok) return await res.json();
      } catch {}
    }
    let res = facilitiesData;
    if (category) {
      res = res.filter((f: any) => f.type.toUpperCase() === category.toUpperCase());
    }
    if (wheelchairOnly) {
      res = res.filter((f: any) => f.accessibility?.wheelchairAccessible === true);
    }
    const currentStatus = localRouter.status;
    return res.map((f: any) => ({
      ...f,
      status: currentStatus[f.id] || f.status || 'OPEN'
    }));
  }

  // 4. Calculate Route (Deterministic local router fallback + backend)
  public async getRoute(
    startNodeId: string,
    destinationNodeId: string,
    profileId: string = 'first_time',
    blockedIds: string[] = []
  ): Promise<RouteResult | null> {
    const local = localRouter.findRoute(startNodeId, destinationNodeId, profileId, blockedIds);
    if (local) return local;

    if (this.isOnlineState) {
      try {
        const res = await fetch(`${this.backendBaseUrl}/api/route`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ startNodeId, destinationNodeId, profileId, blockedIds })
        });
        if (res.ok) return await res.json();
      } catch {}
    }

    return null;
  }

  // 5. SPECIFICATION 4: Train to Coach Navigation
  public async getCoachRoute(
    startNodeId: string,
    trainNumber: string,
    coachNumber: string,
    profileId: string = 'first_time'
  ): Promise<RouteResult | null> {
    const local = localRouter.findRouteToCoach(startNodeId, trainNumber, coachNumber, profileId);
    if (local) return local;

    if (this.isOnlineState) {
      try {
        const res = await fetch(`${this.backendBaseUrl}/api/route/coach`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ startNodeId, trainNumber, coachNumber, profileId })
        });
        if (res.ok) return await res.json();
      } catch {}
    }

    return null;
  }

  // 6. SPECIFICATION 3: Lost Passenger Rescue Mode
  public async getRescueRoute(
    startNodeId: string,
    targetType: 'HELP_DESK' | 'EXIT' | 'TOILET' | 'PLATFORM' = 'HELP_DESK',
    profileId: string = 'first_time'
  ): Promise<any | null> {
    if (this.isOnlineState) {
      try {
        const res = await fetch(`${this.backendBaseUrl}/api/rescue`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ startNodeId, targetType, profileId })
        });
        if (res.ok) return await res.json();
      } catch {}
    }

    // Local rescue fallback
    let targetId = 'node_entry_t1_main_east';
    let targetName = 'Terminal 1 Help Desk';
    if (targetType === 'EXIT') {
      targetId = 'node_entry_t1_main_west';
      targetName = 'Main Station Exit';
    } else if (targetType === 'PLATFORM') {
      targetId = 'node_pf1_center';
      targetName = 'Platform 1';
    } else if (targetType === 'TOILET') {
      targetId = 'node_pf1_toilet';
      targetName = 'Platform 1 Restroom';
    }

    const route = localRouter.findRoute(startNodeId, targetId, profileId);
    return {
      targetName,
      targetNodeId: targetId,
      route,
      rescueMessage: {
        en: `Emergency Rescue: Head towards ${targetName}.`,
        kn: `ತುರ್ತು ರಕ್ಷಣೆ: ${targetName} ಕಡೆಗೆ ಮುನ್ನಡೆಯಿರಿ.`,
        hi: `आपातकालीन सहायता: ${targetName} की ओर बढ़ें।`
      }
    };
  }

  // 7. SPECIFICATION 2: Accessibility Truth Engine & Incident Reporting
  public async reportIncident(
    facilityOrLocationId: string,
    type: 'OUT_OF_SERVICE' | 'OVERCROWDED' | 'MAINTENANCE' | 'SLIPPERY',
    reporterRole: 'STAFF' | 'PASSENGER' = 'PASSENGER',
    description?: string
  ): Promise<any> {
    const report: IncidentReport = {
      id: `inc_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      facilityOrLocationId,
      type,
      reporterRole,
      verified: reporterRole === 'STAFF',
      timestamp: new Date().toISOString(),
      description
    };

    localRouter.addIncidentReport(report);

    if (this.isOnlineState) {
      try {
        await fetch(`${this.backendBaseUrl}/api/incidents`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(report)
        });
      } catch {}
    }

    return report;
  }

  public async getIncidentReports(): Promise<IncidentReport[]> {
    if (this.isOnlineState) {
      try {
        const res = await fetch(`${this.backendBaseUrl}/api/incidents`);
        if (res.ok) return await res.json();
      } catch {}
    }
    return localRouter.getIncidentReports();
  }

  // 8. Dynamic Reroute
  public async reroute(
    startNodeId: string,
    destinationNodeId: string,
    profileId: string,
    blockedLocationId: string
  ): Promise<RouteResult | null> {
    const blocked = [blockedLocationId, `${blockedLocationId}_rev`];
    const local = localRouter.findRoute(startNodeId, destinationNodeId, profileId, blocked);
    if (local) return local;

    if (this.isOnlineState) {
      try {
        const res = await fetch(`${this.backendBaseUrl}/api/reroute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ startNodeId, destinationNodeId, profileId, blockedLocationId })
        });
        if (res.ok) {
          const data = await res.json();
          return data.route;
        }
      } catch {}
    }

    return null;
  }

  // 9. Update Facility Status
  public async updateStatus(facilityId: string, status: string): Promise<Record<string, string>> {
    localRouter.setStatus(facilityId, status);
    if (this.isOnlineState) {
      try {
        await fetch(`${this.backendBaseUrl}/api/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ facilityId, status })
        });
      } catch {}
    }
    return localRouter.status;
  }

  // 10. SPECIFICATION 5: Multilingual Voice & Text Assistant
  private findNearestFacilityOffline(startNodeId: string, facilityType: string, profileId: string = 'first_time') {
    const isWheelchair = profileId === 'mobility_disabled';
    const cands = (facilitiesData as any[]).filter((f: any) => {
      const matchType = f.type.toUpperCase() === facilityType.toUpperCase();
      if (!matchType) return false;
      if (isWheelchair) return f.accessibility?.wheelchairAccessible === true;
      return true;
    });

    let bestFacility: any = null;
    let bestRoute: RouteResult | null = null;
    let minDistance = Infinity;

    for (const cand of cands) {
      const targetNode = localRouter.getFacilityNode(cand);
      const r = localRouter.findRoute(startNodeId, targetNode.id, profileId);
      if (r && r.totalDistanceMeters < minDistance) {
        minDistance = r.totalDistanceMeters;
        bestRoute = {
          ...r,
          destination: targetNode
        };
        bestFacility = cand;
      }
    }

    if (!bestFacility) return null;
    return { facility: bestFacility, route: bestRoute, distance: minDistance };
  }

  private findTrainOffline(query: string): any | null {
    const q = query.trim().toLowerCase();
    const numMatch = q.match(/\b\d{5}\b/);
    if (numMatch) {
      const trainNo = numMatch[0];
      const found = (trainsBundle as any[]).find((t: any) => String(t.trainNumber).trim() === trainNo);
      if (found) return found;
    }

    const aliases: Record<string, string> = {
      'karnataka': '12628',
      'ಕರ್ನಾಟಕ': '12628',
      'कर्नाटक': '12628',
      'chennai mail': '12658',
      'ಚೆನ್ನೈ': '12658',
      'चेन्नई': '12658',
      'vande bharat': '20608',
      'ವಂದೇ': '20608',
      'ವಂದೇ ಭಾರತ್': '20608',
      'वंदे भारत': '20608',
      'वंदे': '20608',
      'shatabdi': '12007',
      'ಶತಾಬ್ದಿ': '12007',
      'शताब्दी': '12007',
      'rani chennamma': '16589',
      'ರಾಣಿ ಚೆನ್ನಮ್ಮ': '16589',
      'चेन्नम्मा': '16589',
      'sampark kranti': '12649',
      'ಸಂಪರ್ಕ ಕ್ರಾಂತಿ': '12649',
      'सम्पर्क क्रांति': '12649',
      'chamundi': '16216',
      'ಚಾಮುಂಡಿ': '16216',
      'चामुंडी': '16216',
      'hampi': '16591',
      'ಹಂಪಿ': '16591',
      'हम्पी': '16591',
      'gol gumbaz': '16535',
      'ಗೋಲ್ ಗುಂಬಜ್': '16535',
      'गोल गुम्बज': '16535',
      'kaveri': '16227',
      'ಕಾವೇರಿ': '16227',
      'कावेरी': '16227'
    };

    for (const [alias, tNo] of Object.entries(aliases)) {
      if (q.includes(alias)) {
        const found = (trainsBundle as any[]).find((t: any) => String(t.trainNumber).trim() === tNo);
        if (found) return found;
      }
    }

    const found = (trainsBundle as any[]).find((t: any) => {
      const name = String(t.trainName || '').toLowerCase();
      return name && (name.includes(q) || q.includes(name));
    });
    return found || null;
  }

  public async queryAssistant(
    message: string,
    context: { currentNodeId?: string; profileId?: string; language?: 'en' | 'kn' | 'hi'; activeRoute?: any } = {}
  ): Promise<{ reply: string; action?: string; route?: RouteResult | null; facility?: any; language?: 'en' | 'kn' | 'hi' }> {
    if (this.isOnlineState) {
      try {
        const res = await fetch(`${this.backendBaseUrl}/api/assistant`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, ...context })
        });
        if (res.ok) return await res.json();
      } catch {}
    }

    // Full offline multilingual parsing
    const defaultStart = context.currentNodeId || 'node_entry_t1_main_east';
    let profile = context.profileId || 'first_time';
    const lang = context.language || 'en';
    const q = message.toLowerCase().trim();

    // 1. Accessibility Profile detection
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
    let effectiveStart = defaultStart;
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
      const rescueTargetNode = localRouter.nodeDict.get('node_entry_t1_main_east') || localRouter.nodes[0];
      const rescueRoute = localRouter.findRoute(effectiveStart, rescueTargetNode.id, profile);
      const reply = lang === 'kn'
        ? 'ತುರ್ತು ರಕ್ಷಣಾ ಮೋಡ್: ಶಾಂತರಾಗಿರಿ. ಟರ್ಮಿನಲ್ 1 ಸಹಾಯ ಕೇಂದ್ರಕ್ಕೆ ಈ ನೇರ ಮಾರ್ಗವನ್ನು ಅನುಸರಿಸಿ.'
        : (lang === 'hi'
          ? 'आपातकालीन सहायता मोड: कृपया शांत रहें। टर्मिनल 1 सहायता केंद्र पहुँचने के लिए इस सीधे मार्ग का पालन करें।'
          : 'Emergency Rescue Mode: Stay calm. Follow the illuminated path directly to Terminal 1 Station Help Desk.');

      return {
        reply,
        action: 'lost_passenger_rescue',
        route: rescueRoute,
        language: lang
      };
    }

    // 4. Train Coach Query
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
      const trainMatch = q.match(/(?:train|ರೈಲು|ट्रेन|ಗಾಡಿ)?\s*(\d{5})/i);
      let trainNo = trainMatch ? trainMatch[1] : '';
      if (!trainNo) {
        const namedTrain = this.findTrainOffline(q);
        trainNo = namedTrain ? namedTrain.trainNumber : '12658';
      }

      const coachRoute = localRouter.findRouteToCoach(effectiveStart, trainNo, coachCode, profile);
      if (coachRoute) {
        const pf = coachRoute.coachInfo?.platformNumber || 1;
        const tName = coachRoute.coachInfo?.trainName || `Train ${trainNo}`;

        let reply = `Coach ${coachCode} is positioned at Platform ${pf} (${tName}). Direct step-by-step walking route calculated (${coachRoute.totalDistanceMeters}m, ~${coachRoute.estimatedTimeMinutes} min).`;
        if (lang === 'kn') {
          reply = `ಕೋಚ್ ${coachCode} ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ${pf} ನಲ್ಲಿದೆ (${tName}). ನಿಮ್ಮ ಕೋಚ್ ಹತ್ತುವ ನಿಖರ ಸ್ಥಳಕ್ಕೆ (${coachRoute.totalDistanceMeters} ಮೀಟರ್, ~${coachRoute.estimatedTimeMinutes} ನಿಮಿಷ) ಮಾರ್ಗವನ್ನು ತೋರಿಸಲಾಗಿದೆ.`;
        } else if (lang === 'hi') {
          reply = `कोच ${coachCode} प्लेटफॉर्म ${pf} पर स्थित है (${tName})। आपके कोच बोर्डिंग स्पॉट तक (${coachRoute.totalDistanceMeters} मीटर, ~${coachRoute.estimatedTimeMinutes} मिनट) का सीधा मार्ग तैयार किया गया है।`;
        }

        return {
          reply,
          action: 'find_coach_route',
          route: coachRoute,
          language: lang
        };
      }
    }

    // 5. Train Inquiry
    const trainInfo = this.findTrainOffline(q);
    if (trainInfo) {
      const pfNum = trainInfo.platformNumber || trainInfo.platform || 1;
      const tName = trainInfo.trainName || `Train ${trainInfo.trainNumber}`;
      const destNodeId = `node_pf${pfNum}_center`;
      const route = localRouter.findRoute(effectiveStart, destNodeId, profile);

      let reply = `${tName} (Train ${trainInfo.trainNumber}) departs from Platform ${pfNum}. Walking route to Platform ${pfNum} (${route ? route.totalDistanceMeters + 'm' : '~3 min'}).`;
      if (lang === 'kn') {
        reply = `${tName} (ರೈಲು ಸಂಖ್ಯೆ ${trainInfo.trainNumber}) ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ${pfNum} ನಿಂದ ಹೊರಡುತ್ತದೆ. ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ${pfNum} ಗೆ ನೇರ ಮಾರ್ಗ ಇಲ್ಲಿದೆ (${route ? route.totalDistanceMeters + ' ಮೀಟರ್' : ''}).`;
      } else if (lang === 'hi') {
        reply = `${tName} (ट्रेन ${trainInfo.trainNumber}) प्लेटफॉर्म ${pfNum} से रवाना होती है। प्लेटफॉर्म ${pfNum} के लिए मार्ग तैयार है (${route ? route.totalDistanceMeters + ' मीटर' : ''})।`;
      }

      return {
        reply,
        action: 'find_route',
        route,
        language: lang
      };
    }

    // 6. Platform Query (e.g. "Platform 8", "pf 5", "platform no 4")
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
      const route = localRouter.findRoute(effectiveStart, targetDestNodeId, profile);
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
            language: lang
          };
        }
      }

    // 7. Specific Facility Shortcuts
    // Lift 1, 2, 3
    const liftMatch = q.match(/(?:lift|elevator|ಲಿಫ್ಟ್|लिफ्ट)\s*(\d)/i);
    if (liftMatch) {
      const liftNum = liftMatch[1];
      const liftId = `lift_${liftNum}`;
      const cand = (facilitiesData as any[]).find((f: any) => f.id === liftId);
      if (cand) {
        const destNode = localRouter.getFacilityNode(cand);
        const route = localRouter.findRoute(effectiveStart, destNode.id, profile);
        return {
          reply: `Here is the route to ${cand.name} (${route?.totalDistanceMeters || 0}m).`,
          action: 'find_facility',
          route: route ? { ...route, destination: destNode } : null,
          facility: cand,
          language: lang
        };
      }
    }

    // Platform-specific restrooms
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

      const cand = (facilitiesData as any[]).find((f: any) => f.id === toiletId);
      if (cand) {
        const destNode = localRouter.getFacilityNode(cand);
        const route = localRouter.findRoute(effectiveStart, destNode.id, profile);
        return {
          reply: `Here is the route to Restroom for Platform ${pfn} (${cand.name}).`,
          action: 'find_facility',
          route: route ? { ...route, destination: destNode } : null,
          facility: cand,
          language: lang
        };
      }
    }

    // 8. General Restrooms
    if (
      q.includes('toilet') || q.includes('restroom') || q.includes('washroom') || q.includes('lavatory') ||
      q.includes('urinal') || q.includes('wc') ||
      q.includes('ಶೌಚಾಲಯ') || q.includes('ಶೌಚಾಗಾರ') || q.includes('ಟಾಯ್ಲೆಟ್') ||
      q.includes('शौचालय') || q.includes('टॉयलेट') || q.includes('बाथरूम') || q.includes('वॉशरूम')
    ) {
      const res = this.findNearestFacilityOffline(effectiveStart, 'TOILET', profile);
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

    // 9. Lifts
    if (q.includes('lift') || q.includes('elevator') || q.includes('ಲಿಫ್ಟ್') || q.includes('ಎಲಿವೇಟರ್') || q.includes('लिफ्ट') || q.includes('एलिवेटर')) {
      const res = this.findNearestFacilityOffline(effectiveStart, 'LIFT', profile);
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

    // 10. Ramps
    if (q.includes('ramp') || q.includes('sloped') || q.includes('slope') || q.includes('ರಾಂಪ್') || q.includes('ಇಳಿಜಾರು') || q.includes('रैंप') || q.includes('ढलान')) {
      const res = this.findNearestFacilityOffline(effectiveStart, 'RAMP', profile);
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
      const res = this.findNearestFacilityOffline(effectiveStart, 'TICKET_COUNTER', profile);
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
      const res = this.findNearestFacilityOffline(effectiveStart, 'METRO', profile);
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

    // 13. Subway
    if (
      q.includes('subway') || q.includes('tunnel') || q.includes('underground') || q.includes('underpass') ||
      q.includes('ಸಬ್‌ವೇ') || q.includes('ನೆಲದಡಿಯ') || q.includes('ಸುರಂಗ') ||
      q.includes('सबवे') || q.includes('भूमिगत') || q.includes('सुरंग')
    ) {
      const res = this.findNearestFacilityOffline(effectiveStart, 'SUBWAY', profile);
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
      const res = this.findNearestFacilityOffline(effectiveStart, 'FOB', profile);
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
      const res = this.findNearestFacilityOffline(effectiveStart, 'ENTRANCE', profile);
      if (res && res.route) {
        let reply = `The station entrance/exit gate is ${res.facility.name} (${res.distance.toFixed(0)}m away).`;
        if (lang === 'kn') {
          reply = `ನಿಲ್ದಾಣದ ಪ್ರವೇಶ/ನಿರ್ಗಮನ ದ್ವಾರವು ${res.facility.name} ಆಗಿದೆ (${res.distance.toFixed(0)} ಮೀಟರ್ ದೂರ).`;
        } else if (lang === 'hi') {
          reply = `ಸ್ಟೇಷನ್ ಕಾ ಪ್ರವೇಶ/ನಿಕಾಸ ದ್ವಾರ ${res.facility.name} ಹೈ (${res.distance.toFixed(0)} ಮೀಟರ್ ದೂರ).`;
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
      const destNode = localRouter.nodeDict.get('node_entry_t1_center') || localRouter.nodeDict.get('node_entry_t1_main_east');
      if (destNode) {
        const route = localRouter.findRoute(effectiveStart, destNode.id, profile);
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
          facility: { name: 'Terminal 1 Central Concourse' },
          language: lang
        };
      }
    }

    return {
      reply: lang === 'kn'
        ? "ನಾನು ಕೆಎಸ್ಆರ್ ಬೆಂಗಳೂರು ನಿಲ್ದಾಣದ ಅಧಿಕೃತ ಟರ್ನ್ ವೈಸ್ (Turn Wise) ಎಐ ಸಹಾಯಕ. ಯಾವುದೇ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ (1-10), ರೈಲು ವಿವರ (ಉದಾ: 'ಕರ್ನಾಟಕ ಎಕ್ಸ್‌ಪ್ರೆಸ್'), ಕೋಚ್ ವಿವರ (ಉದಾ: 'ಕೋಚ್ B4'), ಲಿಫ್ಟ್, ರಾಂಪ್ ಅಥವಾ ಶೌಚಾಲಯದ ಮಾರ್ಗದರ್ಶನಕ್ಕಾಗಿ ನನ್ನನ್ನು ಕೇಳಿ."
        : (lang === 'hi'
          ? "मैं केएसआर बेंगलुरु स्टेशन के लिए टर्न वाइज (Turn Wise) एआई सहायक हूँ। किसी भी प्लेटफॉर्म (1-10), ट्रेन की जानकारी (उदा: 'कर्नाटक एक्सप्रेस'), कोच की स्थिति (उदा: 'कोच B4'), निकटतम लिफ्ट, रैंप या शौचालय के लिए मुझसे पूछें।"
          : "I am Turn Wise AI Assistant for KSR Bengaluru Station. Ask me for directions to any platform (1-10), train status (e.g. 'Karnataka Express'), coach location (e.g. 'Coach B4'), nearest lift, ramp, or accessible restroom."),
      language: lang
    };
  }

  // 11. Checkpoint Verification
  public async verifyCheckpoint(qrCode: string): Promise<any> {
    if (this.isOnlineState) {
      try {
        const res = await fetch(`${this.backendBaseUrl}/api/checkpoint`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ qrCode })
        });
        if (res.ok) return await res.json();
      } catch {}
    }
    const clean = qrCode.trim().toUpperCase();
    const cp = checkpointsData.find((c: any) => c.id.toUpperCase() === clean);
    if (!cp) return null;
    const node = localRouter.nodeDict.get(cp.nodeId);
    return { checkpoint: cp, matchedNode: node || null };
  }

  // =========================================================================
  // REAL-TIME RAILWAY DATA METHODS (Cities, Stations, Platforms, Live Trains)
  // =========================================================================

  public async getCities(): Promise<any[]> {
    if (this.isOnlineState) {
      try {
        const res = await fetch(`${this.backendBaseUrl}/api/cities`);
        if (res.ok) return await res.json();
      } catch {}
    }
    return citiesData as any[];
  }

  public async getStations(cityId?: string, query?: string): Promise<any[]> {
    if (this.isOnlineState) {
      try {
        const params: string[] = [];
        if (cityId) params.push(`city=${encodeURIComponent(cityId)}`);
        if (query) params.push(`search=${encodeURIComponent(query)}`);
        const qStr = params.length > 0 ? `?${params.join('&')}` : '';
        const res = await fetch(`${this.backendBaseUrl}/api/stations${qStr}`);
        if (res.ok) return await res.json();
      } catch {}
    }
    let list = stationsBundle as any[];
    if (cityId) {
      list = list.filter((s: any) => s.cityId === cityId || (s.city && s.city.toLowerCase() === cityId.toLowerCase()));
    }
    if (query) {
      const q = query.toLowerCase().trim();
      list = list.filter((s: any) =>
        s.code.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        (s.city && s.city.toLowerCase().includes(q))
      );
    }
    const PRIMARY_STATIONS = new Set([
      'SBC', 'MYS', 'CSMT', 'NDLS', 'MAS', 'HWH', 'SC', 'PUNE', 'ADI', 'JP', 'LKO', 'ERS', 'PNBE'
    ]);
    return [...list].sort((a, b) => {
      const aIsPrimary = PRIMARY_STATIONS.has(a.code) ? 1 : 0;
      const bIsPrimary = PRIMARY_STATIONS.has(b.code) ? 1 : 0;
      if (aIsPrimary !== bIsPrimary) return bIsPrimary - aIsPrimary;
      return (b.platforms || 0) - (a.platforms || 0);
    });
  }

  public async getStationPlatforms(stationCode: string): Promise<any[]> {
    const code = stationCode.trim().toUpperCase();
    if (this.isOnlineState) {
      try {
        const res = await fetch(`${this.backendBaseUrl}/api/station/${code}/platforms`);
        if (res.ok) {
          const data = await res.json();
          return data.platforms || [];
        }
      } catch {}
    }
    const map = stationPlatformsData as Record<string, any[]>;
    if (map[code]) return map[code];

    // Fallback platforms
    const defaultPlats: any[] = [];
    for (let i = 1; i <= 6; i++) {
      defaultPlats.push({
        number: i,
        name: `Platform ${i}`,
        stationCode: code,
        lengthMeters: 600,
        stepFree: i <= 2,
        tactilePaving: true,
        hasLift: true,
        hasEscalator: i <= 3,
        hasRamp: true,
        status: i % 2 === 0 ? 'BOARDING' : 'CLEANED_READY',
        currentTrain: null
      });
    }
    return defaultPlats;
  }

  public async getStationTrains(stationCode: string): Promise<any[]> {
    const code = stationCode.trim().toUpperCase();
    if (this.isOnlineState) {
      try {
        const res = await fetch(`${this.backendBaseUrl}/api/station/${code}/trains`);
        if (res.ok) {
          const data = await res.json();
          return data.trains || [];
        }
      } catch {}
    }
    const schedMap = stationSchedulesData as Record<string, any[]>;
    return schedMap[code] || [];
  }

  public async getTrainDetails(trainNumber: string): Promise<any | null> {
    const clean = trainNumber.trim();
    if (this.isOnlineState) {
      try {
        const res = await fetch(`${this.backendBaseUrl}/api/train/${clean}`);
        if (res.ok) return await res.json();
      } catch {}
    }
    const tBundle = trainsBundle as any[];
    return tBundle.find((t: any) => t.trainNumber === clean) || null;
  }
}

export const apiService = new ApiService();
