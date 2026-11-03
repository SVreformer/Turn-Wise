import { create } from 'zustand';
import { RouteResult, StationNode, localRouter, Coordinates } from '../services/localRouter';
import { apiService } from '../services/apiService';
import { voiceService, SupportedLanguage } from '../services/voiceService';
import {
  liveNavigationService,
  LiveNavUpdate,
  LocationConfidence,
  SensorStatus,
  ArrivalSummaryData
} from '../services/liveNavigationService';
import { MotionActivityType } from '../services/inbuiltMotionDetector';

export type SourceMethod = 'SEARCH' | 'MAP' | 'QR' | 'GPS' | 'FACILITY' | 'PLATFORM' | null;
export type DestinationMethod = 'SEARCH' | 'MAP' | 'FACILITY' | 'PLATFORM' | null;

interface NavigationState {
  startNode: StationNode | null;
  destinationNode: StationNode | null;
  sourceMethod: SourceMethod;
  destinationMethod: DestinationMethod;
  selectedProfile: string;
  activeRoute: RouteResult | null;
  currentStepIndex: number;
  isNavigating: boolean;
  isOnline: boolean;
  voiceEnabled: boolean;
  language: SupportedLanguage;
  blockageAlert: string | null;
  mapSelectionMode: 'none' | 'source' | 'destination';
  isFullscreenMap: boolean;
  coachMarker: {
    trainNo: string;
    coachNo: string;
    platform: number;
    coordinates: Coordinates;
  } | null;

  // Real-time Live Indoor Navigation State
  liveSteps: number;
  liveDistanceMeters: number;
  liveDistanceRemainingMeters: number;
  liveCoordinates: Coordinates | null;
  liveBearing: number;
  locationConfidence: LocationConfidence;
  sensorStatus: SensorStatus;
  isOffRoute: boolean;
  offRouteAlert: string | null;
  arrivalSummary: ArrivalSummaryData | null;
  nearestZoneName: string;
  nextTurnInstruction: string;
  nextTurnDistanceMeters: number;
  isTrackingLocation: boolean;
  motionActivity: MotionActivityType;
  cadenceStepsPerMin: number;
  sensorSourceDescription: string;

  // Real-time City & Station Selection
  selectedCity: string;
  selectedStation: any;
  cities: any[];
  stationsInCity: any[];

  setSelectedCity: (cityId: string) => Promise<void>;
  setSelectedStation: (station: any) => void;
  loadCitiesAndStations: () => Promise<void>;

  setStartNode: (node: StationNode | null, method?: SourceMethod) => void;
  setDestinationNode: (node: StationNode | null, method?: DestinationMethod) => void;
  setIsFullscreenMap: (fullscreen: boolean) => void;
  swapSourceAndDestination: () => void;
  setMapSelectionMode: (mode: 'none' | 'source' | 'destination') => void;
  setProfile: (profileId: string) => void;
  setLanguage: (lang: SupportedLanguage) => void;
  setCoachMarker: (marker: any) => void;
  calculateRoute: () => Promise<RouteResult | null>;
  calculateCoachRoute: (trainNo: string, coachNo: string) => Promise<RouteResult | null>;
  startNavigation: (route?: RouteResult) => void;
  stopNavigation: () => void;
  resetNavigation: () => void;
  advanceStep: () => void;
  previousStep: () => void;
  toggleVoice: () => void;
  checkNetwork: () => Promise<void>;
  triggerDynamicReroute: (blockedFacilityId: string) => Promise<void>;
  clearBlockageAlert: () => void;

  // Live Navigation Actions
  simulateLiveStep: (stepCount?: number) => void;
  anchorViaQr: (nodeId: string, checkpointName?: string) => boolean;
  clearArrivalSummary: () => void;
  clearOffRouteAlert: () => void;
  startLocationTracking: () => Promise<void>;
  stopLocationTracking: () => void;
}

let activeNavUpdateUnsub: (() => void) | null = null;
let activeNavOffRouteUnsub: (() => void) | null = null;
let activeNavArrivalUnsub: (() => void) | null = null;

export const useNavigationStore = create<NavigationState>((set, get) => ({
  startNode: null,
  destinationNode: null,
  sourceMethod: null,
  destinationMethod: null,
  selectedProfile: 'first_time',
  activeRoute: null,
  currentStepIndex: 0,
  isNavigating: false,
  isOnline: false,
  voiceEnabled: true,
  language: 'en',
  blockageAlert: null,
  mapSelectionMode: 'none',
  isFullscreenMap: false,
  coachMarker: null,
  isTrackingLocation: false,

  // Real-time Live Indoor Navigation State defaults
  liveSteps: 0,
  liveDistanceMeters: 0,
  liveDistanceRemainingMeters: 0,
  liveCoordinates: null,
  liveBearing: 0,
  locationConfidence: 'HIGH',
  sensorStatus: 'UNAVAILABLE',
  isOffRoute: false,
  offRouteAlert: null,
  arrivalSummary: null,
  nearestZoneName: 'Station Concourse',
  nextTurnInstruction: '',
  nextTurnDistanceMeters: 0,
  motionActivity: 'STATIONARY',
  cadenceStepsPerMin: 0,
  sensorSourceDescription: '📱 Inbuilt Motion + Compass',

  // Default to Bengaluru - KSR Bengaluru (SBC)
  selectedCity: 'bengaluru',
  selectedStation: {
    code: 'SBC',
    name: 'KSR Bengaluru (City Station)',
    platforms: 10,
    division: 'SBC',
    zone: 'SWR',
    city: 'Bengaluru'
  },
  cities: [],
  stationsInCity: [],

  loadCitiesAndStations: async () => {
    try {
      const cities = await apiService.getCities();
      const currentCityId = get().selectedCity || 'bengaluru';
      const stations = await apiService.getStations(currentCityId);
      set({ cities, stationsInCity: stations });
    } catch {}
  },

  setSelectedCity: async (cityId: string) => {
    set({ selectedCity: cityId });
    try {
      const stations = await apiService.getStations(cityId);
      set({ stationsInCity: stations });
      if (stations && stations.length > 0) {
        set({ selectedStation: stations[0] });
      }
    } catch {}
  },

  setSelectedStation: (station: any) => {
    set({ selectedStation: station });
  },

  setStartNode: (node, method = 'SEARCH') => {
    set({ startNode: node, sourceMethod: node ? method : null });
    const { destinationNode } = get();
    if (node && destinationNode) {
      get().calculateRoute();
    } else {
      set({ activeRoute: null });
    }
  },

  setDestinationNode: (node, method = 'SEARCH') => {
    set({ destinationNode: node, destinationMethod: node ? method : null });
    const { startNode } = get();
    if (startNode && node) {
      get().calculateRoute();
    } else {
      set({ activeRoute: null });
    }
  },

  setLanguage: (lang: SupportedLanguage) => {
    voiceService.setLanguage(lang);
    set({ language: lang });
  },

  setCoachMarker: (marker) => set({ coachMarker: marker }),

  swapSourceAndDestination: () => {
    const { startNode, destinationNode, sourceMethod, destinationMethod } = get();
    set({
      startNode: destinationNode,
      destinationNode: startNode,
      sourceMethod: destinationMethod as SourceMethod,
      destinationMethod: sourceMethod as DestinationMethod
    });
    if (destinationNode && startNode) {
      get().calculateRoute();
    }
  },

  setMapSelectionMode: (mode) => set({ mapSelectionMode: mode }),

  setIsFullscreenMap: (fullscreen: boolean) => set({ isFullscreenMap: fullscreen }),

  setProfile: (profileId: string) => {
    set({ selectedProfile: profileId });
    const { startNode, destinationNode } = get();
    if (startNode && destinationNode) {
      get().calculateRoute();
    }
  },

  calculateRoute: async () => {
    const { startNode, destinationNode, selectedProfile } = get();
    if (!startNode || !destinationNode) {
      set({ activeRoute: null });
      return null;
    }

    const route = await apiService.getRoute(startNode.id, destinationNode.id, selectedProfile);
    if (route) {
      set({ activeRoute: route, currentStepIndex: 0 });
    }
    return route;
  },

  calculateCoachRoute: async (trainNo: string, coachNo: string) => {
    const { startNode, selectedProfile } = get();
    const effectiveStart = startNode || localRouter.nodeDict.get('node_entry_t1_main_east')!;
    if (!startNode) {
      set({ startNode: effectiveStart, sourceMethod: 'SEARCH' });
    }

    const route = await apiService.getCoachRoute(effectiveStart.id, trainNo, coachNo, selectedProfile);
    if (route) {
      set({
        activeRoute: route,
        destinationNode: route.destination,
        destinationMethod: 'SEARCH',
        currentStepIndex: 0,
        coachMarker: route.coachInfo ? {
          trainNo: route.coachInfo.trainNumber,
          coachNo: route.coachInfo.coachNumber,
          platform: route.coachInfo.platformNumber,
          coordinates: route.coachInfo.coordinates
        } : null
      });
    }
    return route;
  },

  startNavigation: (customRoute?: any) => {
    const route = (customRoute && typeof customRoute === 'object' && Array.isArray(customRoute.steps))
      ? customRoute
      : get().activeRoute;
    if (!route || !Array.isArray(route.steps)) return;

    set({
      activeRoute: route,
      isNavigating: true,
      currentStepIndex: 0,
      liveSteps: 0,
      liveDistanceMeters: 0,
      liveDistanceRemainingMeters: route.totalDistanceMeters,
      liveCoordinates: route.start ? { ...route.start.coordinates } : null,
      locationConfidence: 'HIGH',
      isOffRoute: false,
      offRouteAlert: null,
      arrivalSummary: null,
      nearestZoneName: route.start?.name || 'Station Concourse',
      nextTurnInstruction: route.steps[0]?.instruction || '',
      nextTurnDistanceMeters: route.steps[0]?.distance || 0
    });

    // Initialize live navigation service
    liveNavigationService.start(route, get().selectedProfile).then(({ sensorStatus }) => {
      set({ sensorStatus });
    });

    if (activeNavUpdateUnsub) activeNavUpdateUnsub();
    if (activeNavOffRouteUnsub) activeNavOffRouteUnsub();
    if (activeNavArrivalUnsub) activeNavArrivalUnsub();

    // Subscribe to continuous live updates (pedometer, orientation, map matching)
    activeNavUpdateUnsub = liveNavigationService.onUpdate((update: LiveNavUpdate) => {
      set({
        liveCoordinates: update.coordinates,
        liveBearing: update.headingDegrees,
        liveSteps: update.stepsTaken,
        liveDistanceMeters: update.distanceTravelledMeters,
        liveDistanceRemainingMeters: update.distanceRemainingMeters,
        locationConfidence: update.confidence,
        sensorStatus: update.sensorStatus,
        isOffRoute: update.isOffRoute,
        currentStepIndex: update.currentStepIndex,
        nearestZoneName: update.nearestZoneName,
        nextTurnInstruction: update.currentInstruction,
        nextTurnDistanceMeters: update.nextTurnDistanceMeters,
        motionActivity: update.motionActivity,
        cadenceStepsPerMin: update.cadenceStepsPerMin,
        sensorSourceDescription: update.sensorSourceDescription
      });
    });

    // Subscribe to off-route detection event
    activeNavOffRouteUnsub = liveNavigationService.onOffRoute((deviationMeters, nearestNode) => {
      const alertMsg = `⚠️ Off Route (${deviationMeters}m deviation). Recalculating route from ${nearestNode.name}...`;
      set({ isOffRoute: true, offRouteAlert: alertMsg });
      if (get().voiceEnabled) {
        voiceService.speak("Wrong turn detected. Recalculating your path.");
      }
    });

    // Subscribe to arrival event
    activeNavArrivalUnsub = liveNavigationService.onArrival((summary: ArrivalSummaryData) => {
      set({
        isNavigating: false,
        arrivalSummary: summary
      });
      if (get().voiceEnabled) {
        voiceService.speak(`You have reached your destination: ${summary.destinationName}.`);
      }
    });

    if (route.steps.length > 0 && get().voiceEnabled) {
      const step = route.steps[0];
      const lang = get().language;
      const voiceText = lang === 'kn' ? (step.voiceTextKn || step.voiceText) : (lang === 'hi' ? (step.voiceTextHi || step.voiceText) : step.voiceText);
      voiceService.speak(voiceText, { language: lang });
    }
  },

  stopNavigation: () => {
    liveNavigationService.stop();
    voiceService.stop();
    set({
      isNavigating: false,
      currentStepIndex: 0,
      blockageAlert: null,
      offRouteAlert: null,
      isOffRoute: false
    });
  },

  resetNavigation: () => {
    liveNavigationService.stop();
    voiceService.stop();
    set({
      startNode: null,
      destinationNode: null,
      sourceMethod: null,
      destinationMethod: null,
      activeRoute: null,
      isNavigating: false,
      currentStepIndex: 0,
      blockageAlert: null,
      offRouteAlert: null,
      isOffRoute: false,
      mapSelectionMode: 'none',
      coachMarker: null,
      arrivalSummary: null,
      liveSteps: 0,
      liveDistanceMeters: 0,
      liveCoordinates: null,
      motionActivity: 'STATIONARY',
      cadenceStepsPerMin: 0
    });
  },

  advanceStep: () => {
    const { activeRoute, currentStepIndex, voiceEnabled, language } = get();
    if (!activeRoute) return;
    liveNavigationService.advanceToNextStep();
    if (currentStepIndex < activeRoute.steps.length - 1) {
      const nextIdx = currentStepIndex + 1;
      const step = activeRoute.steps[nextIdx];
      const stepNode = step
        ? (localRouter.getNode(step.fromNode) || (step.fromCoords ? ({ id: step.fromNodeId || '', name: step.fromNode, coordinates: step.fromCoords } as any) : null))
        : null;
      set({
        currentStepIndex: nextIdx,
        startNode: stepNode || get().startNode
      });
      if (voiceEnabled) {
        const text = language === 'kn'
          ? (step?.voiceTextKn || step?.instructionKn || step?.voiceText || '')
          : (language === 'hi'
            ? (step?.voiceTextHi || step?.instructionHi || step?.voiceText || '')
            : (step?.voiceText || step?.instruction || ''));
        voiceService.speak(text, { language });
      }
    } else {
      if (voiceEnabled) {
        const destName = activeRoute.destination.name;
        const msg = language === 'kn'
          ? `ನಿಮ್ಮ ಗಮ್ಯಸ್ಥಾನವನ್ನು ತಲುಪಿದ್ದೀರಿ: ${destName}.`
          : (language === 'hi'
            ? `आप अपने गंतव्य पर पहुँच गए हैं: ${destName}।`
            : `You have reached your destination: ${destName}.`);
        voiceService.speak(msg, { language });
      }
    }
  },

  previousStep: () => {
    const { activeRoute, currentStepIndex, voiceEnabled, language } = get();
    if (!activeRoute || currentStepIndex === 0) return;
    liveNavigationService.previousStep();
    const prevIdx = currentStepIndex - 1;
    const step = activeRoute.steps[prevIdx];
    const stepNode = step
      ? (localRouter.getNode(step.fromNode) || (step.fromCoords ? ({ id: step.fromNodeId || '', name: step.fromNode, coordinates: step.fromCoords } as any) : null))
      : null;
    set({
      currentStepIndex: prevIdx,
      startNode: stepNode || get().startNode
    });
    if (voiceEnabled) {
      const text = language === 'kn'
        ? (step?.voiceTextKn || step?.instructionKn || step?.voiceText || '')
        : (language === 'hi'
          ? (step?.voiceTextHi || step?.instructionHi || step?.voiceText || '')
          : (step?.voiceText || step?.instruction || ''));
      voiceService.speak(text, { language });
    }
  },

  toggleVoice: () => {
    const next = !get().voiceEnabled;
    voiceService.setEnabled(next);
    set({ voiceEnabled: next });
  },

  checkNetwork: async () => {
    const online = await apiService.checkConnectivity();
    set({ isOnline: online });
  },

  triggerDynamicReroute: async (blockedFacilityId: string) => {
    const { startNode, destinationNode, selectedProfile, voiceEnabled, language } = get();
    if (!startNode || !destinationNode) return;

    set({ blockageAlert: `⚠️ PATH BLOCKED: ${blockedFacilityId} is unavailable. Recalculating route...` });
    if (voiceEnabled) {
      const warning = language === 'kn'
        ? `ಎಚ್ಚರಿಕೆ. ${blockedFacilityId} ನಿರ್ಬಂಧಿಸಲಾಗಿದೆ. ಪರ್ಯಾಯ ಮಾರ್ಗವನ್ನು ಲೆಕ್ಕಹಾಕಲಾಗುತ್ತಿದೆ.`
        : (language === 'hi'
          ? `चेतावनी। ${blockedFacilityId} अवरुद्ध है। वैकल्पिक मार्ग खोजा जा रहा है।`
          : `Warning. ${blockedFacilityId} is currently blocked. Recalculating an alternative route.`);
      voiceService.speak(warning, { language });
    }

    const newRoute = await apiService.reroute(startNode.id, destinationNode.id, selectedProfile, blockedFacilityId);
    if (newRoute) {
      set({ activeRoute: newRoute, currentStepIndex: 0 });
      setTimeout(() => {
        if (voiceEnabled && newRoute.steps.length > 0) {
          const firstStep = newRoute.steps[0];
          const text = language === 'kn'
            ? (firstStep?.voiceTextKn || firstStep?.instructionKn || '')
            : (language === 'hi'
              ? (firstStep?.voiceTextHi || firstStep?.instructionHi || '')
              : (firstStep?.voiceText || firstStep?.instruction || ''));
          voiceService.speak(text, { language });
        }
      }, 2500);
    }
  },

  clearBlockageAlert: () => set({ blockageAlert: null }),

  simulateLiveStep: (stepCount: number = 1) => {
    liveNavigationService.simulateStep(stepCount);
  },

  anchorViaQr: (nodeId: string, checkpointName?: string) => {
    const success = liveNavigationService.anchorToCheckpoint(nodeId);
    if (success) {
      const node = localRouter.nodeDict.get(nodeId);
      if (node) {
        set({
          startNode: node,
          sourceMethod: 'QR',
          locationConfidence: 'HIGH',
          isOffRoute: false,
          offRouteAlert: null
        });
        if (liveNavigationService.route) {
          set({
            activeRoute: liveNavigationService.route,
            currentStepIndex: 0,
            liveDistanceRemainingMeters: liveNavigationService.route.totalDistanceMeters
          });
        }
        if (get().voiceEnabled) {
          voiceService.speak(`Location anchored to ${checkpointName || node.name}.`);
        }
      }
    }
    return success;
  },

  clearArrivalSummary: () => set({ arrivalSummary: null }),
  clearOffRouteAlert: () => set({ offRouteAlert: null, isOffRoute: false }),

  startLocationTracking: async () => {
    const { startNode } = get();
    const initialCoords = startNode ? startNode.coordinates : undefined;
    set({ isTrackingLocation: true });

    const { sensorStatus } = await liveNavigationService.startContinuousTracking(initialCoords);
    set({ sensorStatus });

    liveNavigationService.onUpdate((update: LiveNavUpdate) => {
      set({
        liveCoordinates: update.coordinates,
        liveBearing: update.headingDegrees,
        liveSteps: update.stepsTaken,
        liveDistanceMeters: update.distanceTravelledMeters,
        locationConfidence: update.confidence,
        sensorStatus: update.sensorStatus,
        nearestZoneName: update.nearestZoneName,
        motionActivity: update.motionActivity,
        cadenceStepsPerMin: update.cadenceStepsPerMin,
        sensorSourceDescription: update.sensorSourceDescription
      });

      // When tracking location freely, snap startNode to nearest station node if not currently navigating
      if (!get().isNavigating && update.nearestNode) {
        set({ startNode: update.nearestNode, sourceMethod: 'GPS' });
      }
    });
  },

  stopLocationTracking: () => {
    if (!get().isNavigating) {
      liveNavigationService.stop();
    }
    set({ isTrackingLocation: false });
  }
}));
