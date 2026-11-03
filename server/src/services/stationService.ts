import fs from 'fs';
import path from 'path';
import { StationRouter, StationNode, RouteResult, IncidentReport, KSR_TRAIN_DATABASE } from '../algorithms/router';

export class StationService {
  private baseDir: string;
  public router: StationRouter;
  private platforms: any[] = [];
  private facilities: any[] = [];
  private checkpoints: any[] = [];
  private statusMap: Record<string, string> = {};

  // Real-time railway intelligence datasets
  private cities: any[] = [];
  private stationsMaster: any[] = [];
  private trainsMaster: any[] = [];
  private stationPlatforms: Record<string, any[]> = {};
  private stationSchedules: Record<string, any[]> = {};

  constructor(baseDir?: string) {
    this.baseDir = baseDir || path.resolve(__dirname, '../../../data');
    this.router = new StationRouter(this.baseDir);
    this.loadStationData();
  }

  private loadStationData(): void {
    const platPath = path.join(this.baseDir, 'station/platforms.json');
    const facPath = path.join(this.baseDir, 'station/facilities.json');
    const cpPath = path.join(this.baseDir, 'simulation/checkpoints.json');
    const statPath = path.join(this.baseDir, 'simulation/status.json');

    if (fs.existsSync(platPath)) this.platforms = JSON.parse(fs.readFileSync(platPath, 'utf-8'));
    if (fs.existsSync(facPath)) this.facilities = JSON.parse(fs.readFileSync(facPath, 'utf-8'));
    if (fs.existsSync(cpPath)) this.checkpoints = JSON.parse(fs.readFileSync(cpPath, 'utf-8'));
    if (fs.existsSync(statPath)) this.statusMap = JSON.parse(fs.readFileSync(statPath, 'utf-8'));

    // Load Real-time datasets
    const realtimeDir = path.join(this.baseDir, 'realtime');
    const citiesPath = path.join(realtimeDir, 'cities.json');
    const stationsPath = path.join(realtimeDir, 'stations_master.json');
    const trainsPath = path.join(realtimeDir, 'trains_master.json');
    const platRealtimePath = path.join(realtimeDir, 'station_platforms.json');
    const schedPath = path.join(realtimeDir, 'station_schedules.json');

    if (fs.existsSync(citiesPath)) this.cities = JSON.parse(fs.readFileSync(citiesPath, 'utf-8'));
    if (fs.existsSync(stationsPath)) this.stationsMaster = JSON.parse(fs.readFileSync(stationsPath, 'utf-8'));
    if (fs.existsSync(trainsPath)) this.trainsMaster = JSON.parse(fs.readFileSync(trainsPath, 'utf-8'));
    if (fs.existsSync(platRealtimePath)) this.stationPlatforms = JSON.parse(fs.readFileSync(platRealtimePath, 'utf-8'));
    if (fs.existsSync(schedPath)) this.stationSchedules = JSON.parse(fs.readFileSync(schedPath, 'utf-8'));
  }

  public getStationOverview() {
    return {
      stationName: "Krantivira Sangolli Rayanna (Bengaluru Railway Station)",
      stationCode: "SBC",
      tagline: "Smart & Accessible Navigation for KSR Bengaluru",
      viewBox: { width: 3456, height: 1728, minX: 0, minY: 0 },
      levels: [
        { level: -1, name: "Subway Level", description: "Majestic passenger subway connecting concourse and platforms" },
        { level: 0, name: "Platform Level", description: "Platforms 1 to 10, Terminal 1, Terminal 2, Terminal 3" },
        { level: 1, name: "Footover Bridge Level", description: "Metro FOB, FOB 1 (Mysuru End), FOB 2 (Okkalpuram End)" }
      ],
      totalPlatforms: this.platforms.length,
      totalFacilities: this.facilities.length,
      totalNodes: this.router.nodes.length,
      totalEdges: this.router.edges.length,
      trainsSupported: Object.keys(KSR_TRAIN_DATABASE).length
    };
  }

  public getPlatforms() {
    return this.platforms;
  }

  public getPlatformById(id: string) {
    const clean = id.toLowerCase().replace(/[^a-z0-9]/g, '');
    return this.platforms.find(p => {
      const pClean = p.id.toLowerCase().replace(/[^a-z0-9]/g, '');
      const numMatch = p.number.toString() === clean.replace('platform', '').replace('pf', '');
      return pClean === clean || numMatch || p.id === id;
    }) || null;
  }

  public getFacilities(category?: string, wheelchairOnly: boolean = false) {
    let result = this.facilities;
    if (category) {
      const cat = category.toUpperCase();
      result = result.filter(f => f.type.toUpperCase() === cat);
    }
    if (wheelchairOnly) {
      result = result.filter(f => f.accessibility?.wheelchairAccessible === true);
    }
    return result.map(f => ({
      ...f,
      status: this.statusMap[f.id] || f.status || 'OPEN'
    }));
  }

  public getFacilityById(id: string) {
    const f = this.facilities.find(item => item.id === id);
    if (!f) return null;
    return {
      ...f,
      status: this.statusMap[f.id] || f.status || 'OPEN'
    };
  }

  public getNodes(): StationNode[] {
    return this.router.nodes;
  }

  public getStatus(): Record<string, string> {
    return this.statusMap;
  }

  public setStatus(facilityId: string, status: string): Record<string, string> {
    this.statusMap[facilityId] = status;
    this.router.setStatus(facilityId, status);
    return this.statusMap;
  }

  public addIncidentReport(report: IncidentReport): void {
    this.router.addIncidentReport(report);
    if (report.verified || report.reporterRole === 'STAFF') {
      this.statusMap[report.facilityOrLocationId] = report.type === 'OUT_OF_SERVICE' ? 'BLOCKED' : 'LIMITED';
    }
  }

  public getIncidentReports(): IncidentReport[] {
    return this.router.getIncidentReports();
  }

  public resolveCheckpoint(qrCode: string) {
    const cleanCode = qrCode.trim().toUpperCase();
    const cp = this.checkpoints.find(c => c.id.toUpperCase() === cleanCode);
    if (!cp) return null;
    const node = this.router.nodeDict.get(cp.nodeId);
    return {
      checkpoint: cp,
      matchedNode: node || null
    };
  }

  public findTrain(query: string): any | null {
    const q = query.trim().toLowerCase();
    // 1. Direct 5-digit number
    const numMatch = q.match(/\b\d{5}\b/);
    if (numMatch) {
      const trainNo = numMatch[0];
      if (KSR_TRAIN_DATABASE[trainNo]) {
        return {
          ...KSR_TRAIN_DATABASE[trainNo],
          source: 'database'
        };
      }
      const foundInMaster = this.trainsMaster.find(t => String(t.trainNumber).trim() === trainNo);
      if (foundInMaster) return foundInMaster;
    }

    // 2. Nickname aliases (English, Kannada, Hindi)
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
        if (KSR_TRAIN_DATABASE[tNo]) return { ...KSR_TRAIN_DATABASE[tNo], source: 'database' };
        const found = this.trainsMaster.find(t => String(t.trainNumber).trim() === tNo);
        if (found) return found;
      }
    }

    // 3. Substring search in KSR_TRAIN_DATABASE
    for (const [no, t] of Object.entries(KSR_TRAIN_DATABASE)) {
      if (t.trainName.toLowerCase().includes(q) || q.includes(t.trainName.toLowerCase())) {
        return { ...t, source: 'database' };
      }
    }

    // 4. Substring search in trainsMaster
    const foundMaster = this.trainsMaster.find(t => {
      const name = String(t.trainName || '').toLowerCase();
      return name && (name.includes(q) || q.includes(name));
    });
    if (foundMaster) return foundMaster;

    return null;
  }

  public findNearestFacility(
    startNodeId: string,
    facilityType: string,
    profileId: string = 'first_time'
  ): { facility: any; route: RouteResult | null; distance: number } | null {
    const candidates = this.getFacilities(facilityType, profileId === 'mobility_disabled');
    if (candidates.length === 0) return null;

    let bestFacility: any = null;
    let bestRoute: RouteResult | null = null;
    let minDistance = Infinity;

    for (const cand of candidates) {
      const targetNode = this.router.getFacilityNode(cand);
      const targetNodeId = targetNode.id;

      if (targetNodeId) {
        const route = this.router.findRoute(startNodeId, targetNodeId, profileId);
        if (route && route.totalDistanceMeters < minDistance) {
          minDistance = route.totalDistanceMeters;
          bestRoute = {
            ...route,
            destination: targetNode
          };
          bestFacility = {
            ...cand,
            node: targetNode
          };
        }
      }
    }

    if (!bestFacility) return null;
    return {
      facility: bestFacility,
      route: bestRoute,
      distance: minDistance
    };
  }

  public findRouteToCoach(
    startId: string,
    trainNumber: string,
    coachNumber: string,
    profileId: string = 'first_time'
  ): RouteResult | null {
    return this.router.findRouteToCoach(startId, trainNumber, coachNumber, profileId);
  }

  /**
   * SPECIFICATION 3: LOST PASSENGER RESCUE
   * Resolves target rescue location (Help Desk, Main Exit, Toilet, Platform) with emergency instructions.
   */
  public resolveLostPassengerRescue(
    startNodeId: string,
    targetType: 'HELP_DESK' | 'EXIT' | 'TOILET' | 'PLATFORM' = 'HELP_DESK',
    profileId: string = 'first_time'
  ): { targetName: string; targetNodeId: string; route: RouteResult | null; rescueMessage: { en: string; kn: string; hi: string } } | null {
    let destNodeId = 'node_entry_t1_main_east';
    let targetName = 'Terminal 1 Help Desk & Information Center';

    if (targetType === 'HELP_DESK') {
      destNodeId = 'node_entry_t1_main_east';
      targetName = 'Station Help Desk (Terminal 1)';
    } else if (targetType === 'EXIT') {
      destNodeId = 'node_entry_t1_main_west';
      targetName = 'Terminal 1 Main Station Exit';
    } else if (targetType === 'TOILET') {
      const nearest = this.findNearestFacility(startNodeId, 'TOILET', profileId);
      if (nearest && nearest.route) {
        return {
          targetName: nearest.facility.name,
          targetNodeId: nearest.route.destination.id,
          route: nearest.route,
          rescueMessage: {
            en: `Rescue guidance activated: Head towards ${nearest.facility.name} (${nearest.distance.toFixed(0)}m).`,
            kn: `ರಕ್ಷಣೆ ಮಾರ್ಗ ಸಕ್ರಿಯಗೊಂಡಿದೆ: ${nearest.facility.name} ಕಡೆಗೆ ತೆರಳಿ (${nearest.distance.toFixed(0)} ಮೀಟರ್).`,
            hi: `बचाव मार्गदर्शन सक्रिय: ${nearest.facility.name} की ओर बढ़ें (${nearest.distance.toFixed(0)} मीटर)।`
          }
        };
      }
    } else if (targetType === 'PLATFORM') {
      destNodeId = 'node_pf1_center';
      targetName = 'Platform 1 Main Concourse';
    }

    const route = this.router.findRoute(startNodeId, destNodeId, profileId);
    return {
      targetName,
      targetNodeId: destNodeId,
      route,
      rescueMessage: {
        en: `Emergency Rescue Mode: Stay calm. Follow the illuminated path directly to ${targetName}.`,
        kn: `ತುರ್ತು ರಕ್ಷಣಾ ಮೋಡ್: ಶಾಂತರಾಗಿರಿ. ${targetName} ತಲುಪಲು ಈ ನೇರ ಮಾರ್ಗವನ್ನು ಅನುಸರಿಸಿ.`,
        hi: `आपातकालीन सहायता मोड: कृपया शांत रहें। ${targetName} पहुँचने के लिए इस सीधे मार्ग का पालन करें।`
      }
    };
  }

  public searchLocations(query: string) {
    const q = query.toLowerCase().trim();
    const results: Array<{ id: string; name: string; type: string; nodeId: string; coordinates: any }> = [];

    // Search platforms
    for (const p of this.platforms) {
      if (
        p.id.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        q === `platform ${p.number}` ||
        q === `pf ${p.number}` ||
        q === `pf${p.number}` ||
        q === `p${p.number}` ||
        q === `${p.number}`
      ) {
        results.push({
          id: p.id,
          name: p.name,
          type: 'PLATFORM',
          nodeId: `node_pf${p.number}_center`,
          coordinates: p.center
        });
      }
    }

    // Search facilities
    for (const f of this.facilities) {
      if (
        f.id.toLowerCase().includes(q) ||
        f.name.toLowerCase().includes(q) ||
        f.type.toLowerCase().includes(q) ||
        (q.includes('toilet') && f.type === 'TOILET') ||
        (q.includes('lift') && f.type === 'LIFT') ||
        (q.includes('ramp') && f.type === 'RAMP') ||
        (q.includes('metro') && (f.type === 'METRO' || f.name.toLowerCase().includes('metro'))) ||
        (q.includes('ticket') && (f.type === 'TICKET_COUNTER' || f.name.toLowerCase().includes('ticket'))) ||
        (q.includes('subway') && f.type === 'SUBWAY')
      ) {
        results.push({
          id: f.id,
          name: f.name,
          type: f.type,
          nodeId: f.nearestNode || `node_${f.id}`,
          coordinates: f.coordinates
        });
      }
    }

    return results;
  }

  // -------------------------------------------------------------
  // REAL-TIME RAILWAY DATA METHODS (Cities, Stations, Platforms, Trains)
  // -------------------------------------------------------------

  public getCities(): any[] {
    return this.cities;
  }

  public getCityById(cityId: string): any | null {
    return this.cities.find(c => c.id.toLowerCase() === cityId.toLowerCase()) || null;
  }

  public getStations(cityId?: string, query?: string, limit: number = 50): any[] {
    let result = this.stationsMaster;
    if (cityId) {
      result = result.filter(s => s.cityId === cityId || (s.city && s.city.toLowerCase() === cityId.toLowerCase()));
    }
    if (query) {
      const q = query.toLowerCase().trim();
      result = result.filter(s =>
        s.code.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        (s.city && s.city.toLowerCase().includes(q)) ||
        (s.state && s.state.toLowerCase().includes(q))
      );
    }

    const PRIMARY_STATIONS = new Set([
      'SBC', 'MYS', 'CSMT', 'NDLS', 'MAS', 'HWH', 'SC', 'PUNE', 'ADI', 'JP', 'LKO', 'ERS', 'PNBE'
    ]);
    result = [...result].sort((a, b) => {
      const aIsPrimary = PRIMARY_STATIONS.has(a.code) ? 1 : 0;
      const bIsPrimary = PRIMARY_STATIONS.has(b.code) ? 1 : 0;
      if (aIsPrimary !== bIsPrimary) return bIsPrimary - aIsPrimary;
      return (b.platforms || 0) - (a.platforms || 0);
    });

    return result.slice(0, limit);
  }

  public getStationByCode(code: string): any | null {
    const clean = code.trim().toUpperCase();
    return this.stationsMaster.find(s => s.code.toUpperCase() === clean) || null;
  }

  public getPlatformsForStation(code: string): any[] {
    const clean = code.trim().toUpperCase();
    if (this.stationPlatforms[clean]) {
      return this.stationPlatforms[clean];
    }
    // Fallback: generate default platforms if not in cache
    const station = this.getStationByCode(clean);
    const count = station?.platforms || 4;
    const plats: any[] = [];
    for (let i = 1; i <= count; i++) {
      plats.push({
        number: i,
        name: `Platform ${i}`,
        stationCode: clean,
        lengthMeters: 600,
        stepFree: i <= 2 || i === count,
        tactilePaving: true,
        hasLift: true,
        hasEscalator: i <= 3,
        hasRamp: true,
        status: i % 2 === 0 ? 'BOARDING' : 'CLEANED_READY',
        currentTrain: null
      });
    }
    return plats;
  }

  public getStationSchedules(code: string): any[] {
    const clean = code.trim().toUpperCase();
    if (this.stationSchedules[clean]) {
      return this.stationSchedules[clean];
    }
    return [];
  }

  public getTrains(query?: string, limit: number = 50): any[] {
    let result = this.trainsMaster;
    if (query) {
      const q = query.toLowerCase().trim();
      result = result.filter(t =>
        t.trainNumber.toLowerCase().includes(q) ||
        t.trainName.toLowerCase().includes(q) ||
        t.fromCode.toLowerCase().includes(q) ||
        t.toCode.toLowerCase().includes(q)
      );
    }
    return result.slice(0, limit);
  }

  public getTrainByNumber(trainNumber: string): any | null {
    const clean = trainNumber.trim();
    return this.trainsMaster.find(t => t.trainNumber === clean) || null;
  }
}
