import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
  useWindowDimensions,
  Platform
} from 'react-native';
import { KsrMap } from '../components/KsrMap';
import { NavigationInputCard } from '../components/NavigationInputCard';
import { LocationSearchModal } from '../components/LocationSearchModal';
import { MapEntityModal, TappedEntity } from '../components/MapEntityModal';
import { RoutePreviewCard } from '../components/RoutePreviewCard';
import { ProfilePicker } from '../components/ProfilePicker';
import { QuickActionBadges } from '../components/QuickActionBadges';
import { NavigationBanner } from '../components/NavigationBanner';
import { BlockageModal } from '../components/BlockageModal';
import { RescueModeModal } from '../components/RescueModeModal';
import { CoachNavigationModal } from '../components/CoachNavigationModal';
import { AccessibilityTruthModal } from '../components/AccessibilityTruthModal';
import { CityStationSelectorModal } from '../components/CityStationSelectorModal';
import { LiveTrainBoardModal } from '../components/LiveTrainBoardModal';
import { BoardingSureModal } from '../components/BoardingSureModal';
import { SpatialArVrModal } from '../components/SpatialArVrModal';
import { AppDownloadModal } from '../components/AppDownloadModal';
import { ArrivalSummaryModal } from '../components/ArrivalSummaryModal';
import { useBoardingSureStore } from '../store/boardingSureStore';
import { AnimatedTrainTrackBackground } from '../components/AnimatedTrainTrackBackground';
import { MobileFrameContext } from '../components/MobileDeviceFrame';
import { useNavigationStore } from '../store/navigationStore';
import { SupportedLanguage } from '../services/voiceService';
import { StationNode, localRouter, Coordinates } from '../services/localRouter';
import { Colors, Shadows, Radii, Spacing } from '../theme/tokens';
import {
  CompassIcon,
  TrainIcon,
  SparkleIcon,
  QrIcon,
  AlertIcon,
  ArrowRightIcon,
  FullscreenIcon,
  CheckIcon,
  LayersIcon
} from '../components/Icons';

interface HomeScreenProps {
  onOpenAssistant: () => void;
  onOpenFacilities: () => void;
  onOpenPlatformDetail: (platform: any) => void;
  onOpenQrScan: () => void;
}

const PLATFORMS_LIST = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onOpenAssistant,
  onOpenFacilities,
  onOpenPlatformDetail,
  onOpenQrScan
}) => {
  const { width } = useWindowDimensions();
  const { isForceMobile } = React.useContext(MobileFrameContext);
  const isDesktop = isForceMobile ? false : width >= 1024;

  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchMode, setSearchMode] = useState<'source' | 'destination'>('destination');
  const [demoModalVisible, setDemoModalVisible] = useState(false);
  const [rescueModalVisible, setRescueModalVisible] = useState(false);
  const [coachModalVisible, setCoachModalVisible] = useState(false);
  const [truthModalVisible, setTruthModalVisible] = useState(false);
  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [liveBoardModalVisible, setLiveBoardModalVisible] = useState(false);
  const [boardingSureModalVisible, setBoardingSureModalVisible] = useState(false);
  const [arVrModalVisible, setArVrModalVisible] = useState(false);
  const [downloadModalVisible, setDownloadModalVisible] = useState(false);
  const [tappedEntity, setTappedEntity] = useState<TappedEntity | null>(null);
  const [selectedMapLevel, setSelectedMapLevel] = useState<number | 'all'>('all');

  const { setTrain: setBoardingSureTrain, setCoach: setBoardingSureCoach } = useBoardingSureStore();

  const handleOpenBoardingSure = (tNo?: string, cNo?: string) => {
    if (tNo) setBoardingSureTrain(tNo);
    if (cNo) setBoardingSureCoach(cNo);
    setBoardingSureModalVisible(true);
  };

  const scrollRef = useRef<ScrollView>(null);

  const {
    startNode,
    destinationNode,
    sourceMethod,
    destinationMethod,
    selectedProfile,
    activeRoute,
    currentStepIndex,
    isNavigating,
    isOnline,
    voiceEnabled,
    language,
    coachMarker,
    blockageAlert,
    mapSelectionMode,
    isFullscreenMap,
    setIsFullscreenMap,
    selectedCity,
    selectedStation,
    loadCitiesAndStations,
    setStartNode,
    setDestinationNode,
    swapSourceAndDestination,
    setMapSelectionMode,
    setProfile,
    setLanguage,
    calculateRoute,
    startNavigation,
    stopNavigation,
    advanceStep,
    previousStep,
    toggleVoice,
    checkNetwork,
    // Live Indoor Navigation State & Actions
    liveSteps,
    liveDistanceMeters,
    liveDistanceRemainingMeters,
    liveCoordinates,
    liveBearing,
    locationConfidence,
    sensorStatus,
    isOffRoute,
    offRouteAlert,
    arrivalSummary,
    nearestZoneName,
    simulateLiveStep,
    clearArrivalSummary,
    isTrackingLocation,
    startLocationTracking,
    stopLocationTracking,
    motionActivity,
    cadenceStepsPerMin,
    sensorSourceDescription
  } = useNavigationStore();

  useEffect(() => {
    checkNetwork();
    loadCitiesAndStations();
    const interval = setInterval(checkNetwork, 10000);
    return () => clearInterval(interval);
  }, []);

  // Enter/Exit Fullscreen Map Mode with safe browser full-viewport integration
  const handleEnterFullscreen = () => {
    setIsFullscreenMap(true);
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      try {
        if (document.fullscreenEnabled && !document.fullscreenElement && document.documentElement?.requestFullscreen) {
          const p = document.documentElement.requestFullscreen();
          if (p && typeof p.catch === 'function') {
            p.catch(() => {});
          }
        }
      } catch {}
    }
  };

  const handleExitFullscreen = () => {
    setIsFullscreenMap(false);
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      try {
        if (document.fullscreenElement && document.exitFullscreen) {
          const p = document.exitFullscreen();
          if (p && typeof p.catch === 'function') {
            p.catch(() => {});
          }
        }
      } catch {}
    }
  };

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const onFsChange = () => {
      if (!document.fullscreenElement && isFullscreenMap) {
        setIsFullscreenMap(false);
      }
    };
    const onFsError = (e: Event) => {
      if (typeof e.preventDefault === 'function') e.preventDefault();
      if (typeof e.stopPropagation === 'function') e.stopPropagation();
    };
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('fullscreenerror', onFsError);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('fullscreenerror', onFsError);
    };
  }, [isFullscreenMap]);

  // Smooth scroll down to route directions and map results
  const scrollToResults = () => {
    setTimeout(() => {
      if (typeof document !== 'undefined') {
        const el = document.getElementById('route-results-section');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: isDesktop ? 'nearest' : 'start' });
          return;
        }
      }
      if (scrollRef.current) {
        scrollRef.current.scrollTo({ y: isDesktop ? 180 : 460, animated: true });
      }
    }, 120);
  };

  // Open Search Modal
  const handleOpenSearch = (mode: 'source' | 'destination') => {
    setSearchMode(mode);
    setSearchModalVisible(true);
  };

  // Handle Location Selection from Search
  const handleSelectLocation = async (node: StationNode) => {
    if (searchMode === 'source') {
      setStartNode(node, 'SEARCH');
      if (destinationNode) {
        await calculateRoute();
      }
    } else {
      setDestinationNode(node, 'SEARCH');
      if (!startNode) {
        const defaultStartId = node.id === 'node_entry_t1_main_east' ? 'node_entry_t1_main_west' : 'node_entry_t1_main_east';
        const defaultStart = localRouter.nodeDict.get(defaultStartId);
        if (defaultStart) {
          setStartNode(defaultStart, 'SEARCH');
        }
      }
      await calculateRoute();
    }
  };

  // Quick 1-tap Platform Selector
  const handleQuickPlatformSelect = async (pfNumber: number) => {
    const pfNode = localRouter.nodeDict.get(`node_pf${pfNumber}_center`) ||
                   localRouter.nodeDict.get(`node_pf${pfNumber}_west`) ||
                   localRouter.nodes[0];
    const platformNode: StationNode = {
      ...pfNode,
      name: `Platform ${pfNumber}`
    };

    setDestinationNode(platformNode, 'PLATFORM');
    if (!startNode) {
      const defaultStart = localRouter.nodeDict.get('node_entry_t1_main_east');
      if (defaultStart) {
        setStartNode(defaultStart, 'SEARCH');
      }
    }
    await calculateRoute();
  };

  // Start Map Selection Mode
  const handleStartMapSelection = (mode: 'source' | 'destination') => {
    setMapSelectionMode(mode);
    scrollToResults();
  };

  // Handle Map Tap Coordinate
  const handleMapCoordinateSelected = (coords: Coordinates) => {
    const nearest = localRouter.findNearestNode(coords);
    if (!nearest) return;

    if (mapSelectionMode === 'source') {
      setStartNode(nearest.node, 'MAP');
      setMapSelectionMode('none');
      if (destinationNode) {
        calculateRoute();
      }
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    } else if (mapSelectionMode === 'destination') {
      setDestinationNode(nearest.node, 'MAP');
      setMapSelectionMode('none');
      if (!startNode) {
        const defaultStartId = nearest.node.id === 'node_entry_t1_main_east' ? 'node_entry_t1_main_west' : 'node_entry_t1_main_east';
        const defaultStart = localRouter.nodeDict.get(defaultStartId);
        if (defaultStart) {
          setStartNode(defaultStart, 'SEARCH');
        }
      }
      calculateRoute();
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  // Handle Map Platform Tap
  const handlePlatformTapped = (platform: any) => {
    const pfNode = localRouter.nodeDict.get(`node_pf${platform.number}_center`) ||
                   localRouter.nodeDict.get(`node_pf${platform.number}_west`) ||
                   localRouter.nodes[0];
    const platformNode: StationNode = {
      ...pfNode,
      name: `Platform ${platform.number}`
    };

    if (mapSelectionMode === 'destination') {
      setDestinationNode(platformNode, 'PLATFORM');
      setMapSelectionMode('none');
      if (!startNode) {
        const defaultStart = localRouter.nodeDict.get('node_entry_t1_main_east');
        if (defaultStart) {
          setStartNode(defaultStart, 'SEARCH');
        }
      }
      calculateRoute();
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    if (mapSelectionMode === 'source') {
      setStartNode(platformNode, 'PLATFORM');
      setMapSelectionMode('none');
      if (destinationNode) {
        calculateRoute();
      }
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    setTappedEntity({
      type: 'PLATFORM',
      id: platform.id,
      name: `Platform ${platform.number}`,
      level: 0,
      wheelchairAccessible: true,
      details: `Track bed and passenger boarding surface for Platform ${platform.number}. Serves departures and arrivals.`,
      node: platformNode
    });
  };

  // Handle Map Facility Tap
  const handleFacilityTapped = (facility: any) => {
    let node = localRouter.nodeDict.get(`node_${facility.id}`);
    if (!node) {
      if (facility.type === 'LIFT') {
        node = localRouter.nodeDict.get(facility.id === 'lift_1' ? 'node_pf8_lift1' : (facility.id === 'lift_3' ? 'node_pf1_lift3' : 'node_t1_lift2_l0'));
      } else if (facility.type === 'RAMP') {
        node = localRouter.nodeDict.get(facility.id === 'ramp_1' ? 'node_pf8_ramp1' : (facility.id === 'ramp_2' ? 'node_pf4_5_ramp2' : (facility.id === 'ramp_3' ? 'node_pf1_2_ramp3' : 'node_t1_ramp_subway_l0')));
      } else if (facility.type === 'TOILET' || facility.type === 'ACCESSIBLE_TOILET') {
        node = localRouter.nodeDict.get('node_t1_toilet');
      } else if (facility.type === 'TICKET_COUNTER') {
        node = localRouter.nodeDict.get('node_t1_ticket');
      } else if (facility.type === 'METRO_LINK') {
        node = localRouter.nodeDict.get('node_entry_t3_metro');
      }
    }
    const facilityNode: StationNode = {
      ...(node || localRouter.nodes[0]),
      name: facility.name
    };

    if (mapSelectionMode === 'destination') {
      setDestinationNode(facilityNode, 'FACILITY');
      setMapSelectionMode('none');
      if (!startNode) {
        const defaultStart = localRouter.nodeDict.get('node_entry_t1_main_east');
        if (defaultStart) {
          setStartNode(defaultStart, 'SEARCH');
        }
      }
      calculateRoute();
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    if (mapSelectionMode === 'source') {
      setStartNode(facilityNode, 'FACILITY');
      setMapSelectionMode('none');
      if (destinationNode) {
        calculateRoute();
      }
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    setTappedEntity({
      type: 'FACILITY',
      id: facility.id,
      name: facility.name,
      level: facility.level,
      wheelchairAccessible: facility.wheelchairAccessible,
      details: facility.description || `${facility.name} located at KSR Bengaluru Station.`,
      status: facility.status,
      node: facilityNode
    });
  };

  // Active step coordinates for highlighted map segment
  // Smooth scroll to CAD map
  const scrollToMap = useCallback(() => {
    setTimeout(() => {
      if (typeof document !== 'undefined') {
        const el = document.getElementById('map-card-section');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
      }
      if (scrollRef.current) {
        scrollRef.current.scrollTo({ y: isDesktop ? 0 : 540, animated: true });
      }
    }, 120);
  }, [isDesktop]);

  // Active step coordinates for highlighted map segment
  const activeStepCoords = useMemo(() => {
    if (!activeRoute || !activeRoute.steps || !activeRoute.steps[currentStepIndex]) return undefined;
    const step = activeRoute.steps[currentStepIndex];
    if (step.fromCoords && step.toCoords) {
      return [step.fromCoords, step.toCoords];
    }
    const nFrom = localRouter.getNode(step.fromNode);
    const nTo = localRouter.getNode(step.toNode);
    if (!nFrom || !nTo) return undefined;
    return [nFrom.coordinates, nTo.coordinates];
  }, [activeRoute, currentStepIndex]);

  // Live navigating coordinates along the active route
  const [navCurrentCoords, setNavCurrentCoords] = useState<Coordinates | null>(null);
  const [navBearing, setNavBearing] = useState<number>(0);
  const [isAutoWalking, setIsAutoWalking] = useState<boolean>(false);

  // Sync navCurrentCoords whenever navigation starts, step changes, or stops
  useEffect(() => {
    if (isNavigating && activeRoute && activeRoute.steps && activeRoute.steps[currentStepIndex]) {
      const step = activeRoute.steps[currentStepIndex];
      const fromCoords = step.fromCoords || localRouter.getNode(step.fromNode)?.coordinates;
      const toCoords = step.toCoords || localRouter.getNode(step.toNode)?.coordinates;

      if (!navCurrentCoords && fromCoords) {
        setNavCurrentCoords({ ...fromCoords });
      }
      if (fromCoords && toCoords) {
        const bearingDeg = Math.round(Math.atan2(toCoords.y - fromCoords.y, toCoords.x - fromCoords.x) * (180 / Math.PI));
        setNavBearing(bearingDeg);
      }
    } else if (!isNavigating) {
      setNavCurrentCoords(null);
      setIsAutoWalking(false);
    }
  }, [isNavigating, activeRoute, currentStepIndex]);

  // Advance to next step (on Next button click)
  const handleAdvanceStep = useCallback(() => {
    if (!activeRoute || !activeRoute.steps) return;
    if (currentStepIndex < activeRoute.steps.length - 1) {
      advanceStep();
      const nextStep = activeRoute.steps[currentStepIndex + 1];
      const nextFrom = nextStep.fromCoords || localRouter.getNode(nextStep.fromNode)?.coordinates;
      if (nextFrom) {
        setNavCurrentCoords({ ...nextFrom });
        const nextTo = nextStep.toCoords || localRouter.getNode(nextStep.toNode)?.coordinates;
        if (nextTo) {
          const bearingDeg = Math.round(Math.atan2(nextTo.y - nextFrom.y, nextTo.x - nextFrom.x) * (180 / Math.PI));
          setNavBearing(bearingDeg);
        }
      }
    } else {
      // Arrived at destination!
      setIsAutoWalking(false);
      advanceStep();
    }
  }, [activeRoute, currentStepIndex, advanceStep]);

  // Go back to previous step
  const handlePreviousStep = useCallback(() => {
    if (!activeRoute || !activeRoute.steps || currentStepIndex === 0) return;
    previousStep();
  }, [activeRoute, currentStepIndex, previousStep]);

  // Step movement along active route segment: delegates directly to liveNavigationService
  const handleNavStep = useCallback((stepCount: number = 1) => {
    if (!isNavigating || !activeRoute) return;
    simulateLiveStep(stepCount);
  }, [isNavigating, activeRoute, simulateLiveStep]);

  // Keep a stable ref for auto-walk interval
  const handleNavStepRef = useRef(handleNavStep);
  handleNavStepRef.current = handleNavStep;

  // Auto-walk step timer: steps count automatically, marker moves along route, and arrival shows details
  useEffect(() => {
    if (!isAutoWalking || !isNavigating || !activeRoute) return;
    const timer = setInterval(() => {
      // Step automatically along route
      simulateLiveStep(1);
    }, 280);
    return () => clearInterval(timer);
  }, [isAutoWalking, isNavigating, activeRoute, simulateLiveStep]);

  // Turn off auto-walk when navigation finishes
  useEffect(() => {
    if (!isNavigating && isAutoWalking) {
      setIsAutoWalking(false);
    }
  }, [isNavigating, isAutoWalking]);

  // Physical motion / accelerometer sensor detection (Devicemotion on Web & Mobile)
  useEffect(() => {
    if (!isNavigating || !activeRoute) return;
    if (typeof window !== 'undefined' && 'ondevicemotion' in window) {
      let lastStepTime = 0;
      const onDeviceMotion = (event: DeviceMotionEvent) => {
        const acc = event.accelerationIncludingGravity;
        if (!acc) return;
        const mag = Math.sqrt((acc.x || 0) ** 2 + (acc.y || 0) ** 2 + (acc.z || 0) ** 2);
        const now = Date.now();
        // Footstep impact detection threshold
        if (mag > 12.5 && now - lastStepTime > 380) {
          lastStepTime = now;
          simulateLiveStep(1);
        }
      };
      window.addEventListener('devicemotion', onDeviceMotion);
      return () => window.removeEventListener('devicemotion', onDeviceMotion);
    }
  }, [isNavigating, activeRoute, simulateLiveStep]);

  // Keyboard navigation for desktop testing (ArrowUp / W / Space takes a step forward)
  useEffect(() => {
    if (!isNavigating || !activeRoute) return;
    if (typeof window !== 'undefined') {
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
          simulateLiveStep(1);
        }
      };
      window.addEventListener('keydown', onKeyDown);
      return () => window.removeEventListener('keydown', onKeyDown);
    }
  }, [isNavigating, activeRoute, simulateLiveStep]);

  // Active navigation & real-time tracking location prioritizing live coordinates over initial startNode
  const currentNavLocation = useMemo(() => {
    if (liveCoordinates) return liveCoordinates;
    if (isNavigating) {
      if (navCurrentCoords) return navCurrentCoords;
      const step = activeRoute?.steps?.[currentStepIndex];
      if (step) {
        const stepFrom = step.fromCoords || localRouter.getNode(step.fromNode)?.coordinates;
        if (stepFrom) return stepFrom;
      }
    }
    return startNode?.coordinates;
  }, [isNavigating, liveCoordinates, navCurrentCoords, activeRoute, currentStepIndex, startNode]);

  const effectiveBearing = liveBearing || navBearing;

  // Quick action badges handler
  const handleQuickAction = async (category: string) => {
    let targetNode: StationNode | undefined;
    if (category === 'LIFT') {
      targetNode = localRouter.nodeDict.get('node_pf8_lift1') || localRouter.nodeDict.get('node_lift1');
    } else if (category === 'TOILET' || category === 'ACCESSIBLE_TOILET') {
      targetNode = localRouter.nodeDict.get('node_t1_toilet');
    } else if (category === 'METRO') {
      targetNode = localRouter.nodeDict.get('node_entry_t3_metro');
    } else if (category === 'TICKET_COUNTER') {
      targetNode = localRouter.nodeDict.get('node_t1_ticket');
    } else {
      targetNode = localRouter.nodeDict.get('node_entry_t1_main_east');
    }

    if (targetNode) {
      setDestinationNode(targetNode, 'FACILITY');
      if (!startNode) {
        const defaultStart = localRouter.nodeDict.get('node_entry_t1_main_east');
        if (defaultStart) {
          setStartNode(defaultStart, 'SEARCH');
        }
      }
      await calculateRoute();
    }
  };

  // Handle primary "GET ROUTE DIRECTIONS" action
  const handleFindRoute = async () => {
    if (!destinationNode) {
      handleOpenSearch('destination');
      return;
    }
    if (!startNode) {
      const defaultStart = localRouter.nodeDict.get('node_entry_t1_main_east');
      if (defaultStart) {
        setStartNode(defaultStart, 'SEARCH');
      } else {
        handleOpenSearch('source');
        return;
      }
    }
    await calculateRoute();
    scrollToResults();
  };

  return (
    <SafeAreaView style={[styles.safeArea, isFullscreenMap && styles.fullscreenSafeArea]}>
      <StatusBar barStyle="light-content" backgroundColor="#111418" />

      {!isFullscreenMap ? (
        <>
          {/* TOP TRANSIT APP BAR */}
      {isNavigating && activeRoute ? (
        <View style={styles.navHeader}>
          <TouchableOpacity
            style={styles.navHeaderBackBtn}
            onPress={stopNavigation}
            activeOpacity={0.8}
          >
            <Text style={styles.navHeaderBackText}>← Exit Guidance</Text>
          </TouchableOpacity>
          <View style={styles.navHeaderInfo}>
            <Text style={styles.navHeaderDest} numberOfLines={1}>
              Navigating to: {activeRoute.destination.name}
            </Text>
            <Text style={styles.navHeaderStats}>
              {activeRoute.estimatedTimeMinutes} min • {activeRoute.totalDistanceMeters}m • Step {currentStepIndex + 1}/{activeRoute.steps.length}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.navHeaderExitBtn}
            onPress={stopNavigation}
            activeOpacity={0.8}
          >
            <Text style={styles.navHeaderExitText}>Finish</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.header}>
            <View style={styles.headerInner}>
              {/* Left: Brand Identity */}
              <View style={styles.brandContainer}>
                <View style={styles.brandTitleCol}>
                  <Text style={styles.brandMainTitle}>
                    {language === 'kn' ? 'ಟರ್ನ್ ವೈಸ್ (Turn Wise)' : (language === 'hi' ? 'टर्न वाइज (Turn Wise)' : 'Turn Wise')}
                  </Text>
                  <Text style={styles.brandSubtitle}>
                    {(selectedStation?.name || selectedCity || 'KSR BENGALURU').toUpperCase()}
                  </Text>
                </View>
                <View style={styles.stationBadge}>
                  <Text style={styles.stationBadgeCode}>{selectedStation?.code || 'SBC'} HUB</Text>
                  <Text style={styles.stationBadgeName}>
                    Platforms 1-{selectedStation?.platforms?.length || (selectedStation?.code === 'MYS' ? 6 : 10)}
                  </Text>
                </View>
              </View>

              {/* Center Desktop Navigation Tabs */}
              {isDesktop && (
                <View style={styles.desktopNavTabs}>
                  <View style={[styles.desktopTabItem, styles.desktopTabItemActive]}>
                    <CompassIcon size={16} color="#059669" />
                    <Text style={[styles.desktopTabLabel, styles.desktopTabLabelActive]}>Navigation & Map</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.desktopTabItem}
                    onPress={onOpenFacilities}
                    activeOpacity={0.7}
                  >
                    <TrainIcon size={16} color="#94A3B8" />
                    <Text style={styles.desktopTabLabel}>Station Directory</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.desktopTabItem}
                    onPress={onOpenAssistant}
                    activeOpacity={0.7}
                  >
                    <SparkleIcon size={16} color="#94A3B8" />
                    <Text style={styles.desktopTabLabel}>AI Concierge</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.desktopTabItem}
                    onPress={onOpenQrScan}
                    activeOpacity={0.7}
                  >
                    <QrIcon size={16} color="#94A3B8" />
                    <Text style={styles.desktopTabLabel}>Indoor Nav (BLE/QR)</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Right: Engine Status, Language Switcher & Demo Alerts */}
              <View style={styles.headerRight}>
                <View style={styles.headerLangRow}>
                  {(['en', 'kn', 'hi'] as SupportedLanguage[]).map((l) => (
                    <TouchableOpacity
                      key={l}
                      style={[styles.headerLangPill, language === l && styles.headerLangPillActive]}
                      onPress={() => setLanguage(l)}
                    >
                      <Text style={[styles.headerLangText, language === l && styles.headerLangTextActive]}>
                        {l === 'en' ? 'EN' : (l === 'kn' ? 'ಕನ್ನಡ' : 'हिंदी')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={[styles.statusChip, isOnline ? styles.statusOnline : styles.statusOffline]}>
                  <View style={[styles.statusDot, { backgroundColor: isOnline ? '#10B981' : '#F59E0B' }]} />
                  <Text style={styles.statusText}>{isOnline ? 'Online' : 'Offline'}</Text>
                </View>

                <TouchableOpacity
                  style={styles.headerDownloadBtn}
                  onPress={() => setDownloadModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.headerDownloadBtnText}>📥 Install App</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.alertActionBtn}
                  onPress={() => setTruthModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <AlertIcon size={14} color="#D97706" />
                  <Text style={styles.alertActionText}>Truth Engine</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* AMBIENT SHADE OF TRAIN MOVING IN BACKGROUND ON TRACK */}
          <View style={styles.ambientTrackBanner}>
            <AnimatedTrainTrackBackground height={58} opacity={0.92} speedMs={20000} />
          </View>
        </>
      )}

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.mainContainer, isDesktop && styles.desktopGrid]}>
          {/* ======================================================== */}
          {/* LEFT COLUMN: ROUTE PLANNER, PLATFORMS, PROFILES, RESULTS */}
          {/* ======================================================== */}
          <View style={[styles.plannerColumn, isDesktop && styles.plannerColumnDesktop]}>
            {/* CITY & ALL-INDIA STATION SELECTOR BAR */}
            <TouchableOpacity
              style={styles.citySwitcherBar}
              onPress={() => setCityModalVisible(true)}
              activeOpacity={0.85}
            >
              <View style={styles.citySwitcherLeft}>
                <Text style={styles.citySwitcherPin}>📍</Text>
                <View>
                  <Text style={styles.citySwitcherLabel}>
                    {language === 'kn' ? 'ನಗರ ಮತ್ತು ನಿಲ್ದಾಣ:' : (language === 'hi' ? 'शहर एवं रेलवे स्टेशन:' : 'CURRENT CITY & STATION')}
                  </Text>
                  <Text style={styles.citySwitcherValue}>
                    {selectedStation?.city || 'Bengaluru'} • {selectedStation?.name || 'KSR Bengaluru'} ({selectedStation?.code || 'SBC'})
                  </Text>
                </View>
              </View>
              <View style={styles.cityChangePill}>
                <Text style={styles.cityChangeText}>
                  {language === 'kn' ? 'ಬದಲಾಯಿಸಿ ▾' : (language === 'hi' ? 'बदलें ▾' : 'Change ▾')}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Card 1: Journey Planner */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionMainTitle}>TRIP PLANNER</Text>
                <Text style={styles.sectionSubTitle}>{selectedStation?.name || 'KSR Bengaluru'} ({selectedStation?.code || 'SBC'})</Text>
              </View>

              <NavigationInputCard
                startNode={startNode}
                destinationNode={destinationNode}
                sourceMethod={sourceMethod}
                destinationMethod={destinationMethod}
                onOpenSourceSearch={() => handleOpenSearch('source')}
                onOpenDestinationSearch={() => handleOpenSearch('destination')}
                onSelectSourceOnMap={() => handleStartMapSelection('source')}
                onSelectDestinationOnMap={() => handleStartMapSelection('destination')}
                onOpenQrScan={onOpenQrScan}
                onSwap={swapSourceAndDestination}
                onClearSource={() => setStartNode(null)}
                onClearDestination={() => setDestinationNode(null)}
              />

              {/* Quick Platform Strip */}
              <View style={styles.platformSection}>
                <View style={styles.platformHeader}>
                  <Text style={styles.platformLabel}>PLATFORMS (1-TAP ROUTE)</Text>
                  <Text style={styles.platformTrackHint}>
                    Tracks 1 to {selectedStation?.platforms || 10}
                  </Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.platformChipsScroll}
                >
                  {Array.from({ length: selectedStation?.platforms || 10 }, (_, i) => i + 1).map((pfNum) => {
                    const isSelected = Boolean(
                      destinationNode?.name && (
                        destinationNode.name === `Platform ${pfNum}` ||
                        destinationNode.name.startsWith(`Platform ${pfNum} `) ||
                        destinationNode.name.startsWith(`Platform ${pfNum}(`) ||
                        destinationNode.name === `PF ${pfNum}`
                      )
                    );
                    return (
                      <TouchableOpacity
                        key={pfNum}
                        style={[styles.platformChip, isSelected && styles.platformChipActive]}
                        onPress={() => handleQuickPlatformSelect(pfNum)}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.platformChipText, isSelected && styles.platformChipTextActive]}>
                          PF {pfNum}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Accessibility & Travel Profiles */}
              <ProfilePicker
                selectedProfileId={selectedProfile}
                onSelectProfile={(p) => {
                  setProfile(p);
                  if (startNode && destinationNode) {
                    scrollToResults();
                  }
                }}
              />

              {/* Primary CTA: GET ROUTE DIRECTIONS */}
              <TouchableOpacity
                style={styles.getRouteBtn}
                onPress={handleFindRoute}
                activeOpacity={0.85}
              >
                <Text style={styles.getRouteBtnText}>
                  {destinationNode ? 'GET ROUTE DIRECTIONS' : 'FIND OPTIMAL ROUTE'}
                </Text>
                <ArrowRightIcon size={18} color="#FFFFFF" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            {/* Route Results & Turn Guidance Card */}
            {activeRoute && !isNavigating && (
              <View nativeID="route-results-section" style={styles.resultsCardWrapper}>
                <View style={styles.routeResultsHeaderRow}>
                  <Text style={styles.routeResultsTitle}>COMPUTED INDOOR ROUTE</Text>
                  <TouchableOpacity
                    style={styles.clearRouteBtn}
                    onPress={() => {
                      setStartNode(null);
                      setDestinationNode(null);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.clearRouteBtnText}>Clear Route</Text>
                  </TouchableOpacity>
                </View>

                <RoutePreviewCard
                  route={activeRoute}
                  selectedProfileId={selectedProfile}
                  onStartNavigation={() => {
                    startNavigation();
                    scrollToMap();
                  }}
                  onStartAndWalk={() => {
                    startNavigation();
                    setIsAutoWalking(true);
                    scrollToMap();
                  }}
                  onFitRoute={() => {}}
                  onClosePreview={() => {
                    setStartNode(null);
                    setDestinationNode(null);
                  }}
                />
              </View>
            )}

            {/* Essential Amenities Bar */}
            <View style={styles.sectionCard}>
              <QuickActionBadges onSelectAction={handleQuickAction} />
            </View>

            
            {/* SMART ASSISTIVE STATION UTILITIES (CLEAN 2-COLUMN TILES) */}
            <View style={{ marginTop: 4, marginBottom: 16 }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#64748B', letterSpacing: 0.6, marginBottom: 8, paddingHorizontal: 4 }}>
                {language === 'kn' ? 'ಸ್ಮಾರ್ಟ್ ನಿಲ್ದಾಣ ಸೌಲಭ್ಯಗಳು' : (language === 'hi' ? 'स्मार्ट स्टेशन सुविधाएं' : 'SMART STATION UTILITIES')}
              </Text>

              {/* Row 1: Live Train Board & BoardingSure */}
              <View style={styles.smartActionsRow}>
                <TouchableOpacity
                  style={styles.smartActionCard}
                  onPress={() => setLiveBoardModalVisible(true)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.smartActionIcon}>📋</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.smartActionTitle}>
                      {language === 'kn' ? 'ಲೈವ್ ರೈಲು ಬೋರ್ಡ್' : (language === 'hi' ? 'लाइव ट्रेन बोर्ड' : 'Live Train Board')}
                    </Text>
                    <Text style={styles.smartActionSub}>
                      {selectedStation?.code || 'SBC'} • Real-Time
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.smartActionCard}
                  onPress={() => setBoardingSureModalVisible(true)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.smartActionIcon}>🛡️</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.smartActionTitle}>BoardingSure AI</Text>
                    <Text style={styles.smartActionSub}>
                      {language === 'kn' ? 'ರೈಲು ಮುಟ್ಟುವ ಸಮಯ' : (language === 'hi' ? 'छूटने का जोखिम' : 'Missed-Train Risk')}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Row 2: AR / VR 3D View & Coach Navigation */}
              <View style={styles.smartActionsRow}>
                <TouchableOpacity
                  style={styles.smartActionCard}
                  onPress={() => setArVrModalVisible(true)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.smartActionIcon}>🥽</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.smartActionTitle}>AR / VR 3D View</Text>
                    <Text style={styles.smartActionSub}>
                      {language === 'kn' ? '360° ವರ್ಚುವಲ್' : (language === 'hi' ? '360° वर्चुअल' : '360° Concourse')}
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.smartActionCard}
                  onPress={() => setCoachModalVisible(true)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.smartActionIcon}>🚆</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.smartActionTitle}>
                      {language === 'kn' ? 'ಕೋಚ್ ಮಾರ್ಗದರ್ಶನ' : (language === 'hi' ? 'कोच बोर्डिंग' : 'Coach Finder')}
                    </Text>
                    <Text style={styles.smartActionSub}>
                      {language === 'kn' ? 'ನಿಖರ ಸ್ಥಳ' : (language === 'hi' ? 'सटीक स्थान' : 'Boarding Spots')}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Row 3: Lost Passenger Rescue & Truth Engine */}
              <View style={styles.smartActionsRow}>
                <TouchableOpacity
                  style={[styles.smartActionCard, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}
                  onPress={() => setRescueModalVisible(true)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.smartActionIcon}>🚨</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.smartActionTitle, { color: '#B91C1C' }]}>
                      {language === 'kn' ? 'ರಕ್ಷಣೆ' : (language === 'hi' ? 'सहायता' : "I'm Lost - Rescue")}
                    </Text>
                    <Text style={[styles.smartActionSub, { color: '#DC2626' }]}>
                      {language === 'kn' ? 'ತತ್ಕ್ಷಣ ಮಾರ್ಗ' : (language === 'hi' ? 'तुरंत सहायता' : '1-Tap Help Path')}
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.smartActionCard}
                  onPress={() => setTruthModalVisible(true)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.smartActionIcon}>⚙️</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.smartActionTitle}>Truth Engine</Text>
                    <Text style={styles.smartActionSub}>
                      {language === 'kn' ? 'ಸೌಲಭ್ಯ ಸ್ಥಿತಿ' : (language === 'hi' ? 'सुविधा स्थिति' : 'Amenity Status')}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* ======================================================== */}
          {/* RIGHT COLUMN: INTERACTIVE CAD MAP & LIVE STATION STATUS  */}
          {/* ======================================================== */}
          <View
            nativeID="map-card-section"
            style={[styles.mapColumn, isDesktop && styles.mapColumnDesktop]}
          >
            {/* Map Container Card */}
            <View style={styles.mapCard}>
              {/* Map Header */}
              <View style={styles.mapHeaderRow}>
                <View>
                  <Text style={styles.mapTitle}>STATION VECTOR BLUEPRINT</Text>
                  <Text style={styles.mapSub}>
                    Original CAD Geometry • {selectedStation?.code || 'SBC'} Blueprint
                  </Text>
                </View>
                <View style={styles.mapHeaderActions}>
                  <TouchableOpacity
                    style={[styles.trackMeToggleBtn, (isTrackingLocation || isNavigating) && styles.trackMeToggleBtnActive]}
                    onPress={() => {
                      if (isTrackingLocation) {
                        stopLocationTracking();
                      } else {
                        startLocationTracking();
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.trackMeIcon}>{(isTrackingLocation || isNavigating) ? '🟢' : '📍'}</Text>
                    <Text style={[styles.trackMeText, (isTrackingLocation || isNavigating) && styles.trackMeTextActive]}>
                      {(isTrackingLocation || isNavigating) ? 'Tracking' : 'Track Me'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.fullscreenToggleBtn}
                    onPress={handleEnterFullscreen}
                    activeOpacity={0.8}
                  >
                    <FullscreenIcon size={14} color="#2563EB" />
                    <Text style={styles.fullscreenToggleText}>Fullscreen</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Standalone Live Exploration Banner */}
              {isTrackingLocation && !isNavigating && (
                <View style={styles.liveTrackingBanner}>
                  <View style={styles.liveTrackingIndicator} />
                  <Text style={styles.liveTrackingText} numberOfLines={1}>
                    LIVE LOCATION: <Text style={{ fontWeight: '700', color: '#0F172A' }}>{nearestZoneName || 'Station Concourse'}</Text>
                    {' • '}
                    {motionActivity === 'RUNNING' ? '🏃 Running' : (motionActivity === 'WALKING' ? `🚶 Walking (${cadenceStepsPerMin || 96} spm)` : (motionActivity === 'TURNING' ? '🔄 Turning' : '🧍 Stationary'))}
                    {' • '}👟 {liveSteps} steps ({liveDistanceMeters}m moved)
                  </Text>
                  <TouchableOpacity
                    style={styles.stopTrackingPill}
                    onPress={stopLocationTracking}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.stopTrackingText}>Stop</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Interactive Vector Map */}
              <KsrMap
                stationCode={selectedStation?.code}
                routeCoordinates={activeRoute?.pathGeometry}
                activeStepCoordinates={isNavigating ? activeStepCoords : undefined}
                focusLocation={isNavigating ? currentNavLocation : undefined}
                autoPan={true}
                userBearing={effectiveBearing}
                currentLocation={currentNavLocation}
                destinationLocation={destinationNode?.coordinates}
                coachMarker={coachMarker}
                onSelectPlatform={handlePlatformTapped}
                onSelectFacility={handleFacilityTapped}
                onSelectMapCoordinate={handleMapCoordinateSelected}
                selectionMode={mapSelectionMode}
                onCancelSelection={() => setMapSelectionMode('none')}
                isFullscreen={false}
                onToggleFullscreen={handleEnterFullscreen}
                onOpenArVr={() => setArVrModalVisible(true)}
              />
            </View>

            {/* Station Concierge Quick Cards (Mobile & Desktop) */}
            <View style={styles.conciergeCardsRow}>
              <TouchableOpacity
                style={styles.conciergeCard}
                onPress={onOpenAssistant}
                activeOpacity={0.85}
              >
                <View style={styles.conciergeIconBox}>
                  <SparkleIcon size={20} color="#2563EB" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.conciergeTag}>GROUNDED AI</Text>
                  <Text style={styles.conciergeTitle}>Ask Station Assistant</Text>
                  <Text style={styles.conciergeSub}>Gates, lifts, trains & directions</Text>
                </View>
                <Text style={styles.conciergeArrow}>→</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.conciergeCard}
                onPress={onOpenFacilities}
                activeOpacity={0.85}
              >
                <View style={[styles.conciergeIconBox, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
                  <TrainIcon size={20} color="#059669" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.conciergeTag, { color: '#059669' }]}>42 AMENITIES</Text>
                  <Text style={styles.conciergeTitle}>Station Directory</Text>
                  <Text style={styles.conciergeSub}>Lifts, waiting halls & restrooms</Text>
                </View>
                <Text style={styles.conciergeArrow}>→</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={{ height: isNavigating ? 260 : 60 }} />
      </ScrollView>
      </>
    ) : (
      <View style={styles.fullscreenContainer}>
        {/* Fullscreen Map Header */}
        <View style={styles.fullscreenHeader}>
          <TouchableOpacity onPress={handleExitFullscreen} style={styles.backBtn} activeOpacity={0.8}>
            <Text style={styles.backBtnText}>← Return to Overview</Text>
          </TouchableOpacity>

          <View style={styles.fullscreenTitleCol}>
            <Text style={styles.fullscreenTitle} numberOfLines={1}>
              {selectedStation?.name || 'Station'} ({selectedStation?.code || 'SBC'})
            </Text>
            <Text style={styles.fullscreenSubtitle} numberOfLines={1}>
              📐 CAD Blueprint • {selectedStation?.city || 'Bengaluru'} • {selectedStation?.platforms || 10} Platforms • Scale 1:1
            </Text>
          </View>

          <View style={styles.fullscreenActionsRow}>
            <TouchableOpacity
              style={[styles.trackMeToggleBtn, (isTrackingLocation || isNavigating) && styles.trackMeToggleBtnActive]}
              onPress={() => {
                if (isTrackingLocation) {
                  stopLocationTracking();
                } else {
                  startLocationTracking();
                }
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.trackMeIcon}>{(isTrackingLocation || isNavigating) ? '🟢' : '📍'}</Text>
              <Text style={[styles.trackMeText, (isTrackingLocation || isNavigating) && styles.trackMeTextActive]}>
                {(isTrackingLocation || isNavigating) ? 'Tracking' : 'Track Me'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setDemoModalVisible(true)} style={styles.alertPill} activeOpacity={0.8}>
              <AlertIcon size={14} color="#D97706" />
              <Text style={styles.alertPillText}>Simulate Alerts</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleExitFullscreen} style={styles.fullscreenCloseIconBtn} activeOpacity={0.8}>
              <Text style={styles.fullscreenCloseIconText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Standalone Live Exploration Banner in Fullscreen */}
        {isTrackingLocation && !isNavigating && (
          <View style={[styles.liveTrackingBanner, { marginHorizontal: 16, marginTop: 10, marginBottom: 0 }]}>
            <View style={styles.liveTrackingIndicator} />
            <Text style={styles.liveTrackingText} numberOfLines={1}>
              LIVE LOCATION: <Text style={{ fontWeight: '700', color: '#0F172A' }}>{nearestZoneName || 'Station Concourse'}</Text>
              {' • '}
              {motionActivity === 'RUNNING' ? '🏃 Running' : (motionActivity === 'WALKING' ? `🚶 Walking (${cadenceStepsPerMin || 96} spm)` : (motionActivity === 'TURNING' ? '🔄 Turning' : '🧍 Stationary'))}
              {' • '}👟 {liveSteps} steps ({liveDistanceMeters}m moved)
            </Text>
            <TouchableOpacity
              style={styles.stopTrackingPill}
              onPress={stopLocationTracking}
              activeOpacity={0.8}
            >
              <Text style={styles.stopTrackingText}>Stop</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Fullscreen Map Viewport */}
        <KsrMap
          stationCode={selectedStation?.code}
          routeCoordinates={activeRoute?.pathGeometry}
          activeStepCoordinates={isNavigating ? activeStepCoords : undefined}
          focusLocation={isNavigating ? currentNavLocation : undefined}
          autoPan={true}
          userBearing={effectiveBearing}
          currentLocation={currentNavLocation}
          destinationLocation={destinationNode?.coordinates}
          coachMarker={coachMarker}
          onSelectPlatform={handlePlatformTapped}
          onSelectFacility={handleFacilityTapped}
          onSelectMapCoordinate={handleMapCoordinateSelected}
          selectionMode={mapSelectionMode}
          onCancelSelection={() => setMapSelectionMode('none')}
          isFullscreen={true}
          onToggleFullscreen={handleExitFullscreen}
          onOpenArVr={() => setArVrModalVisible(true)}
        />

        {/* Floating Route Preview Card if Route Exists and not navigating */}
        {activeRoute && !isNavigating && (
          <View style={styles.floatingRouteCard}>
            <RoutePreviewCard
              route={activeRoute}
              selectedProfileId={selectedProfile}
              onStartNavigation={() => {
                startNavigation();
              }}
              onStartAndWalk={() => {
                startNavigation();
                setIsAutoWalking(true);
              }}
              onFitRoute={() => {}}
            />
          </View>
        )}
      </View>
    )}

      {/* Turn-by-Turn Navigation Overlay Banner */}
      {isNavigating && activeRoute && (
        <View style={styles.bannerContainer}>
          <NavigationBanner
            route={activeRoute}
            currentStepIndex={currentStepIndex}
            voiceEnabled={voiceEnabled}
            blockageAlert={blockageAlert}
            onAdvanceStep={handleAdvanceStep}
            onPreviousStep={handlePreviousStep}
            onToggleVoice={toggleVoice}
            onStopNavigation={stopNavigation}
            onOpenArVr={() => setArVrModalVisible(true)}
            onSimulateStep={() => {
              simulateLiveStep(1);
            }}
            isAutoWalking={isAutoWalking}
            onToggleAutoWalk={() => setIsAutoWalking((prev) => !prev)}
            liveSteps={liveSteps}
            liveDistanceMeters={liveDistanceMeters}
            liveDistanceRemainingMeters={liveDistanceRemainingMeters}
            locationConfidence={locationConfidence}
            sensorStatus={sensorStatus}
            isOffRoute={isOffRoute}
            offRouteAlert={offRouteAlert}
            bearing={effectiveBearing}
            nearestZoneName={nearestZoneName}
            onOpenQrScanner={onOpenQrScan}
            motionActivity={motionActivity}
            cadenceStepsPerMin={cadenceStepsPerMin}
            sensorSourceDescription={sensorSourceDescription}
          />
        </View>
      )}

      {/* Destination Arrival Summary Modal */}
      <ArrivalSummaryModal
        visible={!!arrivalSummary}
        summary={arrivalSummary}
        onClose={clearArrivalSummary}
      />

      {/* Location Search Modal */}
      <LocationSearchModal
        visible={searchModalVisible}
        mode={searchMode}
        onClose={() => setSearchModalVisible(false)}
        onSelectNode={handleSelectLocation}
      />

      {/* Interactive Entity Details Bottom Sheet */}
      <MapEntityModal
        entity={tappedEntity}
        onClose={() => setTappedEntity(null)}
        onSetAsStart={async (node) => {
          setStartNode(node, 'PLATFORM');
          if (destinationNode) {
            await calculateRoute();
          }
          scrollRef.current?.scrollTo({ y: 0, animated: true });
        }}
        onSetAsDestination={async (node) => {
          setDestinationNode(node, 'PLATFORM');
          if (!startNode) {
            const defaultStart = localRouter.nodeDict.get('node_entry_t1_main_east');
            if (defaultStart) {
              setStartNode(defaultStart, 'SEARCH');
            }
          }
          await calculateRoute();
          scrollRef.current?.scrollTo({ y: 0, animated: true });
        }}
        onNavigateHere={async (node) => {
          setDestinationNode(node, 'PLATFORM');
          if (!startNode) {
            const defaultStart = localRouter.nodeDict.get('node_entry_t1_main_east');
            if (defaultStart) {
              setStartNode(defaultStart, 'SEARCH');
            }
          }
          const route = await calculateRoute();
          if (route) {
            startNavigation(route);
          }
        }}
      />

      {/* Station Conditions & Demo Sandbox Modal */}
      <BlockageModal
        visible={demoModalVisible}
        onClose={() => setDemoModalVisible(false)}
      />

      {/* SPECIFICATION 3: LOST PASSENGER RESCUE MODAL */}
      <RescueModeModal
        visible={rescueModalVisible}
        onClose={() => setRescueModalVisible(false)}
        onStartRescueNavigation={(r) => {
          startNavigation(r);
          scrollToResults();
        }}
      />

      {/* SPECIFICATION 4: TRAIN TO COACH NAVIGATION MODAL */}
      <CoachNavigationModal
        visible={coachModalVisible}
        onClose={() => setCoachModalVisible(false)}
        onStartCoachNavigation={(r) => {
          startNavigation(r);
          scrollToResults();
        }}
        onOpenBoardingSure={(tNo, cNo) => {
          handleOpenBoardingSure(tNo, cNo);
        }}
      />

      {/* SPECIFICATION 2: ACCESSIBILITY TRUTH ENGINE & INCIDENT REPORTING */}
      <AccessibilityTruthModal
        visible={truthModalVisible}
        onClose={() => setTruthModalVisible(false)}
      />

      {/* CITY & ALL-INDIA STATION SELECTOR MODAL */}
      <CityStationSelectorModal
        visible={cityModalVisible}
        onClose={() => setCityModalVisible(false)}
      />

      {/* REAL-TIME LIVE TRAIN BOARD & PLATFORMS MODAL */}
      <LiveTrainBoardModal
        visible={liveBoardModalVisible}
        onClose={() => setLiveBoardModalVisible(false)}
        onSelectCoachRoute={(tNo, cNo) => {
          setCoachModalVisible(true);
        }}
        onOpenBoardingSure={(tNo, cNo) => {
          handleOpenBoardingSure(tNo, cNo);
        }}
        onNavigateToPlatform={(pfNum) => {
          handleQuickPlatformSelect(pfNum);
        }}
      />

      {/* BOARDINGSURE: PROFILE-AWARE MISSED-TRAIN RISK PREDICTOR MODAL */}
      <BoardingSureModal
        visible={boardingSureModalVisible}
        onClose={() => setBoardingSureModalVisible(false)}
        onStartNavigation={(r) => {
          startNavigation(r);
          scrollToResults();
        }}
        onOpenRescueMode={() => setRescueModalVisible(true)}
      />

      {/* HACKATHON PITCH HIGHLIGHT: AR / VR SPATIAL STATION NAVIGATOR MODAL */}
      <SpatialArVrModal
        visible={arVrModalVisible}
        onClose={() => setArVrModalVisible(false)}
      />
      <AppDownloadModal
        visible={downloadModalVisible}
        onClose={() => setDownloadModalVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  header: {
    backgroundColor: '#111418',
    borderBottomWidth: 1,
    borderBottomColor: '#222831',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10
  },
  headerInner: {
    maxWidth: 1280,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  brandTitleCol: {
    justifyContent: 'center'
  },
  brandMainTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5
  },
  brandSubtitle: {
    fontSize: 9,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 1
  },
  brandLogo: {
    width: 104,
    height: 32
  },
  stationBadge: {
    borderLeftWidth: 1,
    borderLeftColor: '#2B313A',
    paddingLeft: 10
  },
  stationBadgeCode: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 0.5
  },
  stationBadgeName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#CBD5E1'
  },
  desktopNavTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#181C21',
    padding: 4,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: '#262C36'
  },
  desktopTabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.pill
  },
  desktopTabItemActive: {
    backgroundColor: '#262C36',
    ...Shadows.sm
  },
  desktopTabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8'
  },
  desktopTabLabelActive: {
    color: '#10B981',
    fontWeight: '700'
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  headerLangRow: {
    flexDirection: 'row',
    gap: 4,
    marginRight: 4
  },
  headerLangPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#1E242C',
    borderWidth: 1,
    borderColor: '#2D3748'
  },
  headerLangPillActive: {
    backgroundColor: '#165B33',
    borderColor: '#059669'
  },
  headerLangText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8'
  },
  headerLangTextActive: {
    color: '#FFFFFF'
  },
  ambientTrackBanner: {
    width: '100%',
    backgroundColor: '#111418',
    borderBottomWidth: 1,
    borderBottomColor: '#222831',
    overflow: 'hidden'
  },
  citySwitcherBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#165B33',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#165B33',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2
  },
  citySwitcherLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  citySwitcherPin: {
    fontSize: 22,
    marginRight: 10
  },
  citySwitcherLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#165B33',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  citySwitcherValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111418',
    marginTop: 1
  },
  cityChangePill: {
    backgroundColor: '#165B33',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8
  },
  cityChangeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700'
  },
  liveBoardSmartCard: {
    backgroundColor: '#111418',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#222831',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3
  },
  liveBoardInner: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  liveBoardIconCol: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#181C21',
    borderWidth: 1,
    borderColor: '#262C36',
    justifyContent: 'center',
    alignItems: 'center'
  },
  liveBoardTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800'
  },
  liveBadgePulse: {
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  liveBadgePulseText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800'
  },
  liveBoardSub: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2
  },
  liveBoardArrow: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8
  },
  headerDownloadBtn: {
    backgroundColor: '#165B33',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10B981',
    marginRight: 6
  },
  headerDownloadBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800'
  },
  downloadMobileAppCard: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4
  },
  downloadMobileAppInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  downloadIconCol: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  downloadMobileAppTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800'
  },
  downloadMobileAppBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  downloadMobileAppBadgeText: {
    color: '#0F172A',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  downloadMobileAppSub: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2
  },
  downloadMobileAppArrow: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8
  },
  arVrPitchCard: {
    backgroundColor: '#0B1120',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#0284C7',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4
  },
  arVrPitchInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  arVrIconCol: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(2, 132, 199, 0.2)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  arVrPitchTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800'
  },
  arVrPitchBadge: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  arVrPitchBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  arVrPitchSub: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2
  },
  arVrPitchArrow: {
    color: '#38BDF8',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8
  },
  boardingSureCard: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4
  },
  boardingSureInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  boardingSureIconCol: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  boardingSureTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800'
  },
  boardingSureBadge: {
    backgroundColor: '#38BDF8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  boardingSureBadgeText: {
    color: '#0F172A',
    fontSize: 9,
    fontWeight: '800'
  },
  boardingSureSub: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2
  },
  boardingSureArrow: {
    color: '#38BDF8',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8
  },
  rescueEmergencyBtn: {
    backgroundColor: '#C1121F',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#C1121F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4
  },
  rescueEmergencyInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  rescueEmergencyIcon: {
    fontSize: 24
  },
  rescueEmergencyTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  rescueEmergencySub: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    marginTop: 2
  },
  rescueEmergencyArrow: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900'
  },
  smartActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14
  },
  smartActionCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1
  },
  smartActionIcon: {
    fontSize: 22
  },
  smartActionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A'
  },
  smartActionSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.pill,
    backgroundColor: '#F1F5F9'
  },
  statusOnline: {
    backgroundColor: '#ECFDF5'
  },
  statusOffline: {
    backgroundColor: '#FFFBEB'
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155'
  },
  alertActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.pill,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A'
  },
  alertActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706'
  },
  scrollContent: {
    paddingVertical: 16,
    paddingHorizontal: Spacing.sm
  },
  mainContainer: {
    maxWidth: 1280,
    width: '100%',
    alignSelf: 'center'
  },
  desktopGrid: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 20
  },
  plannerColumn: {
    width: '100%'
  },
  plannerColumnDesktop: {
    width: 480
  },
  mapColumn: {
    width: '100%',
    marginTop: 16
  },
  mapColumnDesktop: {
    flex: 1,
    marginTop: 0
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    ...Shadows.sm
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  sectionMainTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8
  },
  sectionSubTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8'
  },
  platformSection: {
    marginTop: 12,
    marginBottom: 8
  },
  platformHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  platformLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5
  },
  platformTrackHint: {
    fontSize: 10,
    color: '#94A3B8'
  },
  platformChipsScroll: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 2
  },
  platformChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.sm,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  platformChipActive: {
    backgroundColor: '#165B33',
    borderColor: '#059669'
  },
  platformChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155'
  },
  platformChipTextActive: {
    color: '#FFFFFF'
  },
  getRouteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#165B33',
    borderRadius: Radii.md,
    paddingVertical: 14,
    marginTop: 12,
    ...Shadows.sm
  },
  getRouteBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  resultsCardWrapper: {
    marginBottom: 16
  },
  routeResultsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    paddingHorizontal: 4
  },
  routeResultsTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#165B33',
    letterSpacing: 0.6
  },
  clearRouteBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2
  },
  clearRouteBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B'
  },
  mapCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    ...Shadows.sm,
    marginBottom: 16
  },
  mapHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  mapTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#111418',
    letterSpacing: 0.6
  },
  mapSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1
  },
  mapHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  trackMeToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.sm,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE'
  },
  trackMeToggleBtnActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981'
  },
  trackMeIcon: {
    fontSize: 12
  },
  trackMeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E40AF'
  },
  trackMeTextActive: {
    color: '#065F46'
  },
  liveTrackingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radii.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#86EFAC'
  },
  liveTrackingIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 8
  },
  liveTrackingText: {
    flex: 1,
    fontSize: 12,
    color: '#166534'
  },
  stopTrackingPill: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  stopTrackingText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700'
  },
  fullscreenToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.sm,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#A7F3D0'
  },
  fullscreenToggleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#165B33'
  },
  conciergeCardsRow: {
    flexDirection: 'row',
    gap: 12
  },
  conciergeCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.sm
  },
  conciergeIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    alignItems: 'center',
    justifyContent: 'center'
  },
  conciergeTag: {
    fontSize: 9,
    fontWeight: '800',
    color: '#165B33',
    letterSpacing: 0.5
  },
  conciergeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 1
  },
  conciergeSub: {
    fontSize: 10,
    color: '#64748B'
  },
  conciergeArrow: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '700'
  },
  bannerContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999
  },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  navHeaderBackBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  navHeaderBackText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600'
  },
  navHeaderInfo: {
    flex: 1,
    alignItems: 'center'
  },
  navHeaderDest: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700'
  },
  navHeaderStats: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1
  },
  navHeaderExitBtn: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radii.sm
  },
  navHeaderExitText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700'
  },
  fullscreenSafeArea: {
    backgroundColor: '#0F172A'
  },
  fullscreenContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#0F172A',
    position: 'relative'
  },
  fullscreenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    backgroundColor: '#0F172A',
    gap: 12
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#1E293B',
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: '#334155'
  },
  backBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#60A5FA'
  },
  fullscreenTitleCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  fullscreenTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 0.4
  },
  fullscreenSubtitle: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 2
  },
  fullscreenActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  fullscreenCloseIconBtn: {
    width: 32,
    height: 32,
    borderRadius: Radii.sm,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center'
  },
  fullscreenCloseIconText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94A3B8'
  },
  alertPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.pill,
    backgroundColor: 'rgba(217, 119, 6, 0.15)',
    borderWidth: 1,
    borderColor: '#F59E0B'
  },
  alertPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FBBF24'
  },
  floatingRouteCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 20,
    zIndex: 99
  }
});
