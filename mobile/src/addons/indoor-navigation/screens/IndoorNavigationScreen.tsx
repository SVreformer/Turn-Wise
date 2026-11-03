import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Platform,
  Alert
} from 'react-native';
import { Colors, Shadows, Radii, Spacing, Typography } from '../../../theme/tokens';
import { KsrMap } from '../../../components/KsrMap';
import { localRouter, StationNode, Coordinates } from '../../../services/localRouter';
import { useNavigationStore } from '../../../store/navigationStore';
import { voiceService } from '../../../services/voiceService';
import { indoorNavigationEngine } from '../engine/indoorNavigationEngine';
import {
  HybridPositionEstimate,
  MultiFloorRouteResult,
  MultiFloorRouteStep,
  StationQrCheckpoint,
  RecoveryActionPlan
} from '../types';
import { IndoorNavHUD } from '../ui/IndoorNavHUD';
import { BleBeaconRadar } from '../ui/BleBeaconRadar';
import { LiveQrScannerModal } from '../ui/LiveQrScannerModal';
import { RecoveryGuidanceModal } from '../ui/RecoveryGuidanceModal';
import { LocationSearchModal } from '../../../components/LocationSearchModal';

interface IndoorNavigationScreenProps {
  onBack: () => void;
}

export const IndoorNavigationScreen: React.FC<IndoorNavigationScreenProps> = ({ onBack }) => {
  const { selectedProfile, setStartNode, voiceEnabled, language } = useNavigationStore();

  const [estimate, setEstimate] = useState<HybridPositionEstimate>(indoorNavigationEngine.estimate);
  const [selectedFloor, setSelectedFloor] = useState<number>(estimate.level);
  const [activeRoute, setActiveRoute] = useState<MultiFloorRouteResult | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [focusLocation, setFocusLocation] = useState<Coordinates | undefined>(undefined);
  const [remainingMeters, setRemainingMeters] = useState<number | undefined>(undefined);
  const [isAutoWalking, setIsAutoWalking] = useState<boolean>(false);

  // Modals
  const [showDestSearch, setShowDestSearch] = useState<boolean>(false);
  const [showQrScanner, setShowQrScanner] = useState<boolean>(false);
  const [showBleRadar, setShowBleRadar] = useState<boolean>(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState<boolean>(false);
  const [recoveryPlan, setRecoveryPlan] = useState<RecoveryActionPlan | null>(null);

  // Subscribe to engine state updates
  useEffect(() => {
    const unsubscribe = indoorNavigationEngine.subscribe((newEstimate) => {
      setEstimate(newEstimate);
      // Auto-switch floor view if level changed via vertical transition
      setSelectedFloor(newEstimate.level);

      // Auto-trigger recovery guidance if state drops to RECOVERY
      if (newEstimate.state === 'RECOVERY') {
        const plan = indoorNavigationEngine.generateRecoveryPlan();
        setRecoveryPlan(plan);
        setShowRecoveryModal(true);
      }
    });

    // Default route: From Terminal 1 Main Entrance to Platform 4 Concourse
    const initialRoute = indoorNavigationEngine.planMultiFloorRoute('node_pf4_center', selectedProfile);
    if (initialRoute) {
      setActiveRoute(initialRoute);
      if (initialRoute.steps[0]) {
        setRemainingMeters(initialRoute.steps[0].distance);
        const fromN = localRouter.nodeDict.get(initialRoute.steps[0].fromNode);
        if (fromN) {
          setFocusLocation({ ...fromN.coordinates });
        }
      }
    }

    return () => {
      unsubscribe();
    };
  }, [selectedProfile]);

  // Handle QR Checkpoint Confirmation
  const handleQrSuccess = (rawCode: string, checkpoint: StationQrCheckpoint) => {
    setShowQrScanner(false);
    const res = indoorNavigationEngine.confirmCheckpoint(rawCode);
    if (res.success) {
      const node = localRouter.nodeDict.get(checkpoint.associatedNodeId);
      if (node) {
        setStartNode(node, 'QR');
        setFocusLocation({ ...node.coordinates });
      }
      // Recalculate route from confirmed location to current destination
      const destId = activeRoute?.destination.id || 'node_pf4_center';
      const newRoute = indoorNavigationEngine.planMultiFloorRoute(destId, selectedProfile);
      if (newRoute) {
        setActiveRoute(newRoute);
        setCurrentStepIndex(0);
        if (newRoute.steps[0]) {
          setRemainingMeters(newRoute.steps[0].distance);
        }
      }

      Alert.alert(
        '✓ Location Confirmed',
        `Anchored to: ${checkpoint.name}\nFloor: ${checkpoint.level === -1 ? 'Level -1 (Subway)' : (checkpoint.level === 1 ? 'Level 1 (FOB)' : 'Level 0 (Platform)')}\nConfidence: 100%`,
        [{ text: 'Continue Route' }]
      );
    }
  };

  // Stop Navigation
  const handleStopNavigation = () => {
    setIsAutoWalking(false);
    indoorNavigationEngine.stopNavigation();
    setActiveRoute(null);
    setCurrentStepIndex(0);
    setRemainingMeters(undefined);
    setFocusLocation(undefined);
  };

  // Turn step navigation controls: Advance Step
  const handleAdvanceStep = () => {
    if (!activeRoute) return;
    if (currentStepIndex < activeRoute.steps.length - 1) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      indoorNavigationEngine.advanceToStep(nextIdx);

      const step = activeRoute.steps[nextIdx];
      if (step) {
        setSelectedFloor(step.fromLevel);
        const fromN = localRouter.nodeDict.get(step.fromNode);
        if (fromN) {
          setFocusLocation({ ...fromN.coordinates });
        }
        setRemainingMeters(step.distance);
        if (voiceEnabled) {
          const vText = language === 'kn' ? (step.voiceTextKn || step.instructionKn) : (language === 'hi' ? (step.voiceTextHi || step.instructionHi) : step.voiceText);
          voiceService.speak(vText, { language });
        }
      }
    } else {
      // Arrived at destination!
      setIsAutoWalking(false);
      Alert.alert(
        '🏁 Destination Arrived!',
        `You have successfully reached ${activeRoute.destination.name}.\nFloor: ${indoorNavigationEngine.getFloorLabel(activeRoute.destination.level ?? 0)}`,
        [
          { text: 'Finish Navigation', onPress: handleStopNavigation },
          { text: 'Review Map', style: 'cancel' }
        ]
      );
    }
  };

  // Turn step navigation controls: Previous Step
  const handlePreviousStep = () => {
    if (!activeRoute || currentStepIndex === 0) return;
    const prevIdx = currentStepIndex - 1;
    setCurrentStepIndex(prevIdx);
    indoorNavigationEngine.advanceToStep(prevIdx);

    const step = activeRoute.steps[prevIdx];
    if (step) {
      setSelectedFloor(step.fromLevel);
      const fromN = localRouter.nodeDict.get(step.fromNode);
      if (fromN) {
        setFocusLocation({ ...fromN.coordinates });
      }
      setRemainingMeters(step.distance);
    }
  };

  // Handle live movement step (1 step or continuous stream)
  const handleStepMovement = (stepMeters: number = 1.0) => {
    if (!activeRoute) return;
    const res = indoorNavigationEngine.stepAlongRoute(stepMeters);
    const updated = indoorNavigationEngine.estimate;
    setEstimate(updated);
    setFocusLocation({ ...updated.coordinates });
    setRemainingMeters(res.remainingDistanceMeters);

    if (res.completed) {
      if (res.reachedDestination) {
        setIsAutoWalking(false);
        Alert.alert(
          '🏁 Destination Arrived!',
          `You have reached ${activeRoute.destination.name}.`,
          [{ text: 'Stop Navigation', onPress: handleStopNavigation }]
        );
      } else if (res.nextStepIndex !== undefined) {
        setCurrentStepIndex(res.nextStepIndex);
        const nextStep = activeRoute.steps[res.nextStepIndex];
        if (nextStep) {
          setSelectedFloor(nextStep.fromLevel);
          setRemainingMeters(nextStep.distance);
          if (voiceEnabled) {
            const vText = language === 'kn' ? (nextStep.voiceTextKn || nextStep.instructionKn) : (language === 'hi' ? (nextStep.voiceTextHi || nextStep.instructionHi) : nextStep.voiceText);
            voiceService.speak(vText, { language });
          }
        }
      }
    }
  };

  // Toggle Auto-Walking Mode (Pacing along route)
  const handleToggleAutoWalk = () => {
    setIsAutoWalking(prev => !prev);
  };

  // Auto-walk step timer
  useEffect(() => {
    if (!isAutoWalking || !activeRoute) return;
    const timer = setInterval(() => {
      handleStepMovement(1.4);
    }, 550);
    return () => clearInterval(timer);
  }, [isAutoWalking, activeRoute, currentStepIndex]);

  // Physical motion / accelerometer sensor detection (Devicemotion on Web & Mobile)
  useEffect(() => {
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
          handleStepMovement(0.75);
        }
      };
      window.addEventListener('devicemotion', onDeviceMotion);
      return () => window.removeEventListener('devicemotion', onDeviceMotion);
    }
  }, [activeRoute, currentStepIndex]);

  // Desktop keyboard step simulation for fast testing (ArrowUp / W / Space)
  useEffect(() => {
    if (!activeRoute) return;
    if (typeof window !== 'undefined') {
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
          handleStepMovement(1.2);
        }
      };
      window.addEventListener('keydown', onKeyDown);
      return () => window.removeEventListener('keydown', onKeyDown);
    }
  }, [activeRoute, currentStepIndex]);

  const handleTriggerRecovery = () => {
    const plan = indoorNavigationEngine.generateRecoveryPlan();
    setRecoveryPlan(plan);
    setShowRecoveryModal(true);
  };

  // Active step segment coordinates for prominent map highlight
  const activeStepCoordinates = useMemo(() => {
    if (!activeRoute || !activeRoute.steps[currentStepIndex]) return [];
    const step = activeRoute.steps[currentStepIndex];
    const nFrom = localRouter.nodeDict.get(step.fromNode);
    const nTo = localRouter.nodeDict.get(step.toNode);
    if (!nFrom || !nTo) return [];
    return [nFrom.coordinates, nTo.coordinates];
  }, [activeRoute, currentStepIndex]);

  // Route coordinates for the active floor level
  const routeCoordsOnActiveFloor = useMemo(() => {
    if (!activeRoute) return [];
    const coords: Coordinates[] = [];
    activeRoute.path.forEach((nodeId) => {
      const node = localRouter.nodeDict.get(nodeId);
      if (node && (node.level ?? 0) === selectedFloor) {
        coords.push(node.coordinates);
      }
    });
    return coords;
  }, [activeRoute, selectedFloor]);

  const activeStep: MultiFloorRouteStep | undefined = activeRoute?.steps[currentStepIndex];

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.75}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.titleColumn}>
          <Text style={styles.headerTitle}>INDOOR NAVIGATION</Text>
          <Text style={styles.headerSubtitle}>Hybrid QR + BLE Positioning • KSR SBC</Text>
        </View>
        <TouchableOpacity
          style={styles.qrHeaderBtn}
          onPress={() => setShowQrScanner(true)}
          activeOpacity={0.75}
        >
          <Text style={styles.qrHeaderIcon}>📷</Text>
        </TouchableOpacity>
      </View>

      {/* Destination Indicator / Selector Pill */}
      <View style={styles.destBar}>
        <View style={styles.destBarLeft}>
          <Text style={styles.destIcon}>🎯</Text>
          <View>
            <Text style={styles.destLabel}>DESTINATION</Text>
            <Text style={styles.destTitle} numberOfLines={1}>
              {activeRoute?.destination.name || 'Platform 4 Center'}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.changeDestBtn}
          onPress={() => setShowDestSearch(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.changeDestBtnText}>Change ▾</Text>
        </TouchableOpacity>
      </View>

      {/* Main Map Viewport */}
      <View style={styles.mapContainer}>
        <KsrMap
          stationCode="SBC"
          currentLocation={estimate.level === selectedFloor ? estimate.coordinates : undefined}
          destinationLocation={activeRoute?.destination && (activeRoute.destination.level ?? 0) === selectedFloor ? activeRoute.destination.coordinates : undefined}
          routeCoordinates={routeCoordsOnActiveFloor}
          activeStepCoordinates={selectedFloor === activeStep?.fromLevel ? activeStepCoordinates : undefined}
          focusLocation={focusLocation}
          autoPan={true}
          showFacilities={true}
        />

        {/* Floor Level Overlay Indicator on Map */}
        <View style={styles.floorWatermark}>
          <Text style={styles.floorWatermarkText}>
            VIEWING: {selectedFloor === -1 ? 'SUBWAY TUNNEL (LEVEL -1)' : (selectedFloor === 1 ? 'FOOT-OVER-BRIDGE (LEVEL 1)' : 'PLATFORMS & CONCOURSE (LEVEL 0)')}
          </Text>
        </View>
      </View>

      {/* Interactive HUD Overlay */}
      <View style={styles.hudOverlay}>
        <IndoorNavHUD
          estimate={estimate}
          activeStep={activeStep}
          currentStepIndex={currentStepIndex}
          totalSteps={activeRoute?.steps.length || 0}
          selectedFloor={selectedFloor}
          remainingMeters={remainingMeters}
          isAutoWalking={isAutoWalking}
          onSelectFloor={setSelectedFloor}
          onOpenQrScanner={() => setShowQrScanner(true)}
          onOpenBleRadar={() => setShowBleRadar(true)}
          onSimulateStep={() => handleStepMovement(1.2)}
          onToggleAutoWalk={handleToggleAutoWalk}
          onStopNavigation={handleStopNavigation}
          onTriggerRecoveryModal={handleTriggerRecovery}
          onAdvanceStep={handleAdvanceStep}
          onPreviousStep={handlePreviousStep}
        />
      </View>

      {/* Sub-modals */}
      {showQrScanner && (
        <View style={StyleSheet.absoluteFill}>
          <LiveQrScannerModal
            onScanSuccess={handleQrSuccess}
            onClose={() => setShowQrScanner(false)}
          />
        </View>
      )}

      {showBleRadar && (
        <View style={styles.floatingModalOverlay}>
          <BleBeaconRadar onClose={() => setShowBleRadar(false)} />
        </View>
      )}

      {showRecoveryModal && recoveryPlan && (
        <View style={StyleSheet.absoluteFill}>
          <RecoveryGuidanceModal
            plan={recoveryPlan}
            onSelectCheckpoint={(cp) => handleQrSuccess(cp.checkpointId, cp)}
            onOpenQrScanner={() => {
              setShowRecoveryModal(false);
              setShowQrScanner(true);
            }}
            onNavigateToHelpDesk={() => {
              setShowRecoveryModal(false);
              const helpRoute = indoorNavigationEngine.planMultiFloorRoute('node_t1_main_concourse', selectedProfile);
              if (helpRoute) {
                setActiveRoute(helpRoute);
                setCurrentStepIndex(0);
              }
            }}
            onClose={() => setShowRecoveryModal(false)}
          />
        </View>
      )}

      {/* Destination Location Search Modal */}
      <LocationSearchModal
        visible={showDestSearch}
        mode="destination"
        onClose={() => setShowDestSearch(false)}
        onSelectNode={(node) => {
          setShowDestSearch(false);
          const newRoute = indoorNavigationEngine.planMultiFloorRoute(node.id, selectedProfile);
          if (newRoute) {
            setActiveRoute(newRoute);
            setCurrentStepIndex(0);
            if (newRoute.steps[0]) {
              setSelectedFloor(newRoute.steps[0].fromLevel);
              setRemainingMeters(newRoute.steps[0].distance);
              const fromN = localRouter.nodeDict.get(newRoute.steps[0].fromNode);
              if (fromN) {
                setFocusLocation({ ...fromN.coordinates });
              }
            }
          }
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    ...Shadows.card
  },
  destBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    backgroundColor: '#FFFBEB',
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A'
  },
  destBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1
  },
  destIcon: {
    fontSize: 18
  },
  destLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#D97706',
    letterSpacing: 0.5
  },
  destTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B'
  },
  changeDestBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FCD34D'
  },
  changeDestBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309'
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: Radii.sm
  },
  backBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155'
  },
  titleColumn: {
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.5
  },
  headerSubtitle: {
    fontSize: 10,
    color: '#64748B'
  },
  qrHeaderBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
    alignItems: 'center',
    justifyContent: 'center'
  },
  qrHeaderIcon: {
    fontSize: 16
  },
  mapContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    position: 'relative'
  },
  floorWatermark: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radii.xs
  },
  floorWatermarkText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3
  },
  hudOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0
  },
  floatingModalOverlay: {
    position: 'absolute',
    top: 60,
    left: 12,
    right: 12,
    zIndex: 99
  }
});

