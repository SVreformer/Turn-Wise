import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  SafeAreaView,
  TextInput,
  useWindowDimensions,
  Platform
} from 'react-native';
import { useBoardingSureStore } from '../store/boardingSureStore';
import { useNavigationStore } from '../store/navigationStore';
import { useBlockageStore } from '../store/blockageStore';
import { KSR_TRAIN_DATABASE, localRouter } from '../services/localRouter';
import { PROFILE_WALKING_SPEEDS, RiskLevel } from '../services/boardingSureService';
import { MobileFrameContext } from './MobileDeviceFrame';
import profilesData from '../data/accessibility/profiles.json';
import checkpointsData from '../data/simulation/checkpoints.json';
import { Colors, Shadows, Radii, Spacing, Typography } from '../theme/tokens';

interface BoardingSureModalProps {
  visible: boolean;
  onClose: () => void;
  onStartNavigation?: (route: any) => void;
  onOpenRescueMode?: () => void;
}

const COMMON_COACHES = ['B4', 'B1', 'B2', 'B3', 'S1', 'S2', 'S3', 'S4', 'A1', 'A2', 'H1', 'GEN'];

const POPULAR_CHECKPOINTS = [
  { id: 'node_entry_t1_main_east', label: 'Terminal 1 East Main Entry' },
  { id: 'node_t1_ticket', label: 'Terminal 1 Ticket Concourse' },
  { id: 'node_t1_lift2_l0', label: 'T1 Concourse Lift 2 Foyer' },
  { id: 'node_pf1_center', label: 'Platform 1 Central Concourse' },
  { id: 'node_entry_t2_east', label: 'Terminal 2 East Foyer' }
];

export const BoardingSureModal: React.FC<BoardingSureModalProps> = ({
  visible,
  onClose,
  onStartNavigation,
  onOpenRescueMode
}) => {
  const { width } = useWindowDimensions();
  const { isForceMobile } = React.useContext(MobileFrameContext);
  const isDesktop = isForceMobile ? false : width >= 768;

  const {
    trainNumber,
    trainName,
    platformNumber,
    coachNumber,
    startNodeId,
    profileId,
    availableMinutesOverride,
    isSimulatingTime,
    departureTime,
    bufferMinutes,
    assessment,
    isEvaluating,
    setTrain,
    setCoach,
    setStartNode,
    setProfile,
    setAvailableMinutes,
    setDepartureTime,
    setBufferMinutes,
    recalculateRisk,
    applyAssessmentToNavigation
  } = useBoardingSureStore();

  const { language } = useNavigationStore();
  const { statuses, toggleBlockage, isBlocked } = useBlockageStore();

  const [activeTab, setActiveTab] = useState<'ASSESSMENT' | 'COMPARISON' | 'SIMULATION'>('ASSESSMENT');
  const [customTrainInput, setCustomTrainInput] = useState('');
  const [showTransparencyModal, setShowTransparencyModal] = useState(false);

  useEffect(() => {
    if (visible) {
      recalculateRisk();
    }
  }, [visible]);

  const currentProfile = useMemo(() => {
    return profilesData.find(p => p.id === profileId) || profilesData[0];
  }, [profileId]);

  const riskBadgeStyle = useMemo(() => {
    if (!assessment) return { bg: '#E2E8F0', text: '#475569', label: 'CALCULATING' };
    switch (assessment.riskLevel) {
      case 'COMFORTABLE':
        return { bg: '#DCFCE7', text: '#15803D', border: '#86EFAC', label: 'COMFORTABLE' };
      case 'HURRY':
        return { bg: '#FEF3C7', text: '#B45309', border: '#FCD34D', label: 'HURRY — TIGHT BUFFER' };
      case 'HIGH_RISK':
      default:
        return { bg: '#FEE2E2', text: '#B91C1C', border: '#FCA5A5', label: 'HIGH RISK OF MISSED TRAIN' };
    }
  }, [assessment?.riskLevel]);

  const handleStartRoute = () => {
    if (assessment?.route) {
      if (onStartNavigation) {
        onStartNavigation(assessment.route);
      } else {
        applyAssessmentToNavigation();
      }
      onClose();
    }
  };

  const handleActivateRescue = () => {
    onClose();
    if (onOpenRescueMode) {
      onOpenRescueMode();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <SafeAreaView style={styles.modalOverlay}>
        <View style={[styles.modalCard, isDesktop && styles.modalCardDesktop]}>
          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.headerTitleContainer}>
              <View style={styles.headerBadgeRow}>
                <Text style={styles.headerBadge}>BOARDINGSURE</Text>
                <Text style={styles.headerSubBadge}>PROFILE-AWARE TIME BUDGET</Text>
              </View>
              <Text style={styles.headerTitle}>
                {language === 'kn'
                  ? '🛡️ ರೈಲು ತಪ್ಪುವ ಅಪಾಯ ಮುನ್ಸೂಚಕ'
                  : language === 'hi'
                  ? '🛡️ ट्रेन छूटने का जोखिम विश्लेषक'
                  : '🛡️ Missed-Train Risk Predictor'}
              </Text>
              <Text style={styles.stationSubtitle}>
                KSR Bengaluru City Station (SBC) • Ground-Truth Spatial CAD Routing
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.8}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* TAB BAR */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'ASSESSMENT' && styles.tabButtonActive]}
              onPress={() => setActiveTab('ASSESSMENT')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabButtonText, activeTab === 'ASSESSMENT' && styles.tabButtonTextActive]}>
                📊 Risk Status
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'COMPARISON' && styles.tabButtonActive]}
              onPress={() => setActiveTab('COMPARISON')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabButtonText, activeTab === 'COMPARISON' && styles.tabButtonTextActive]}>
                🔀 Route Comparison
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'SIMULATION' && styles.tabButtonActive]}
              onPress={() => setActiveTab('SIMULATION')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabButtonText, activeTab === 'SIMULATION' && styles.tabButtonTextActive]}>
                🧪 Test Scenarios & Lifts
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* TRAIN & COACH SELECTOR BAR */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionHeading}>1. SELECT TRAIN & COACH</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.trainList}>
                {Object.values(KSR_TRAIN_DATABASE).map((t) => {
                  const isSelected = trainNumber === t.trainNumber;
                  return (
                    <TouchableOpacity
                      key={t.trainNumber}
                      style={[styles.trainChip, isSelected && styles.trainChipActive]}
                      onPress={() => setTrain(t.trainNumber)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.trainChipNo, isSelected && styles.trainChipNoActive]}>
                        {t.trainNumber}
                      </Text>
                      <Text style={[styles.trainChipName, isSelected && styles.trainChipNameActive]}>
                        PF {t.platformNumber} • {t.trainName.split(' ')[0]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Coach Selector */}
              <View style={styles.coachRow}>
                <Text style={styles.subLabel}>Coach Position on PF {platformNumber}:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.coachList}>
                  {COMMON_COACHES.map((c) => {
                    const isSelected = coachNumber === c;
                    return (
                      <TouchableOpacity
                        key={c}
                        style={[styles.coachPill, isSelected && styles.coachPillActive]}
                        onPress={() => setCoach(c)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.coachPillText, isSelected && styles.coachPillTextActive]}>
                          {c}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </View>

            {/* ACCESSIBILITY PROFILE & STARTING POINT */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionHeading}>2. PASSENGER ACCESSIBILITY & ORIGIN</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.profileList}>
                {profilesData.map((p) => {
                  const isSelected = profileId === p.id;
                  const speed = PROFILE_WALKING_SPEEDS[p.id] || 1.0;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={[styles.profileCard, isSelected && styles.profileCardActive]}
                      onPress={() => setProfile(p.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.profileIcon}>{p.id === 'mobility_disabled' ? '♿' : p.id === 'elderly' ? '🦯' : p.id === 'visually_impaired' ? '👁️' : p.id === 'luggage_heavy' ? '🧳' : p.id === 'child' ? '👶' : '🚶'}</Text>
                      <Text style={[styles.profileName, isSelected && styles.profileNameActive]}>
                        {p.name.split('/')[0].trim()}
                      </Text>
                      <Text style={[styles.profileSpeed, isSelected && styles.profileSpeedActive]}>
                        {speed} m/s
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Checkpoint / Origin selector */}
              <View style={styles.checkpointContainer}>
                <Text style={styles.subLabel}>Current Station Checkpoint (Origin):</Text>
                <View style={styles.checkpointChipsWrap}>
                  {POPULAR_CHECKPOINTS.map((cp) => {
                    const isSelected = startNodeId === cp.id;
                    return (
                      <TouchableOpacity
                        key={cp.id}
                        style={[styles.checkpointChip, isSelected && styles.checkpointChipActive]}
                        onPress={() => setStartNode(cp.id)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.checkpointChipText, isSelected && styles.checkpointChipTextActive]}>
                          📍 {cp.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* TIME TO DEPARTURE / SIMULATION CONTROLS */}
            <View style={styles.sectionContainer}>
              <View style={styles.timeSectionHeader}>
                <Text style={styles.sectionHeading}>3. TIME TO DEPARTURE (T_AVAILABLE)</Text>
                <Text style={styles.timeDisplayValue}>
                  {assessment?.timeBreakdown.tAvailableMinutes ?? availableMinutesOverride} min
                </Text>
              </View>

              <View style={styles.quickTimeChipsRow}>
                {[
                  { label: '5m (High Risk)', val: 5 },
                  { label: '10m (Hurry)', val: 10 },
                  { label: '15m (Moderate)', val: 15 },
                  { label: '25m (Comfortable)', val: 25 },
                  { label: '40m (Safe)', val: 40 }
                ].map((item) => {
                  const isSelected = availableMinutesOverride === item.val;
                  return (
                    <TouchableOpacity
                      key={item.val}
                      style={[styles.quickTimeChip, isSelected && styles.quickTimeChipActive]}
                      onPress={() => setAvailableMinutes(item.val)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.quickTimeChipText, isSelected && styles.quickTimeChipTextActive]}>
                        ⏱️ {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* ======================================================== */}
            {/* TAB 1: ASSESSMENT */}
            {/* ======================================================== */}
            {activeTab === 'ASSESSMENT' && (
              <>
                {/* PROMINENT RISK STATUS CARD */}
                <View style={[styles.riskHeroCard, { backgroundColor: riskBadgeStyle.bg, borderColor: riskBadgeStyle.border }]}>
                  <View style={styles.riskHeroHeader}>
                    <View style={styles.riskIconWrap}>
                      <Text style={styles.riskHeroIcon}>
                        {assessment?.riskLevel === 'COMFORTABLE'
                          ? '✅'
                          : assessment?.riskLevel === 'HURRY'
                          ? '⚠️'
                          : '🚨'}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.riskHeroBadge, { color: riskBadgeStyle.text }]}>
                        {riskBadgeStyle.label}
                      </Text>
                      <Text style={[styles.riskHeroHeadline, { color: riskBadgeStyle.text }]}>
                        {assessment?.headline || 'Evaluating Boarding Feasibility...'}
                      </Text>
                    </View>
                  </View>

                  {/* Deficit / Margin Stat */}
                  <View style={styles.marginStatRow}>
                    <View style={styles.marginStatBox}>
                      <Text style={styles.marginStatLabel}>Available Window</Text>
                      <Text style={styles.marginStatVal}>
                        {assessment?.timeBreakdown.tAvailableMinutes ?? availableMinutesOverride} min
                      </Text>
                    </View>

                    <Text style={styles.marginStatVs}>vs</Text>

                    <View style={styles.marginStatBox}>
                      <Text style={styles.marginStatLabel}>Required Time</Text>
                      <Text style={styles.marginStatVal}>
                        {assessment?.timeBreakdown.tRequiredMinutes ?? '--'} min
                      </Text>
                    </View>

                    <Text style={styles.marginStatVs}>=</Text>

                    <View style={styles.marginStatBox}>
                      <Text style={styles.marginStatLabel}>Safety Margin (M)</Text>
                      <Text
                        style={[
                          styles.marginStatVal,
                          {
                            color:
                              (assessment?.timeBreakdown.marginMinutes ?? 0) >= 0
                                ? '#15803D'
                                : '#B91C1C'
                          }
                        ]}
                      >
                        {(assessment?.timeBreakdown.marginMinutes ?? 0) >= 0
                          ? `+${assessment?.timeBreakdown.marginMinutes}m`
                          : `-${assessment?.timeBreakdown.deficitMinutes}m`}
                      </Text>
                    </View>
                  </View>

                  {/* Mathematical Risk Score Bar */}
                  <View style={styles.riskBarContainer}>
                    <View style={styles.riskBarHeader}>
                      <Text style={styles.riskBarLabel}>Time-Deficit Risk Score (R):</Text>
                      <Text style={[styles.riskBarValue, { color: riskBadgeStyle.text }]}>
                        {assessment?.riskScore ?? 0}%
                      </Text>
                    </View>
                    <View style={styles.riskBarTrack}>
                      <View
                        style={[
                          styles.riskBarFill,
                          {
                            width: `${Math.min(100, assessment?.riskScore ?? 0)}%`,
                            backgroundColor:
                              (assessment?.riskScore ?? 0) < 30
                                ? '#22C55E'
                                : (assessment?.riskScore ?? 0) < 70
                                ? '#F59E0B'
                                : '#EF4444'
                          }
                        ]}
                      />
                    </View>
                    <Text style={styles.riskScoreDisclaimer}>
                      * Mathematical time-deficit index: clamp(((T_req - T_avail) / T_req) × 100, 0, 100). Not statistical probability.
                    </Text>
                  </View>

                  {/* Recommendation message */}
                  <View style={styles.recommendationBox}>
                    <Text style={styles.recommendationText}>
                      💡 {assessment?.recommendationMessage}
                    </Text>
                  </View>

                  {/* HIGH RISK RESCUE ACTION */}
                  {assessment?.riskLevel === 'HIGH_RISK' && (
                    <TouchableOpacity
                      style={styles.emergencyRescueCta}
                      onPress={handleActivateRescue}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.emergencyRescueCtaIcon}>🚨</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.emergencyRescueCtaTitle}>
                          ACTIVATE LOST PASSENGER RESCUE MODE
                        </Text>
                        <Text style={styles.emergencyRescueCtaSub}>
                          Navigate instantly to nearest assistance desk: {assessment.nearestAssistance?.name || 'Help Desk'} ({assessment.nearestAssistance?.distanceMeters}m away)
                        </Text>
                      </View>
                      <Text style={styles.emergencyRescueCtaArrow}>➔</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* DETAILED TIME BUDGET BREAKDOWN CARD */}
                <View style={styles.breakdownCard}>
                  <Text style={styles.breakdownTitle}>📐 PROFILE-AWARE TIME BUDGET BREAKDOWN</Text>
                  <Text style={styles.breakdownFormula}>
                    T_required = T_walking + T_turns + T_level_changes + T_obstruction + T_buffer
                  </Text>

                  <View style={styles.breakdownItem}>
                    <View style={styles.breakdownItemLeft}>
                      <Text style={styles.breakdownItemName}>🚶 Pure Walking Time (T_walking)</Text>
                      <Text style={styles.breakdownItemSub}>
                        {assessment?.timeBreakdown.distanceMeters ?? 0}m @ {assessment?.timeBreakdown.walkingSpeedMps ?? 1.0} m/s
                      </Text>
                    </View>
                    <Text style={styles.breakdownItemVal}>
                      {assessment?.timeBreakdown.tWalkingMinutes ?? 0} min
                    </Text>
                  </View>

                  <View style={styles.breakdownItem}>
                    <View style={styles.breakdownItemLeft}>
                      <Text style={styles.breakdownItemName}>↩️ Turn Penalties (T_turns)</Text>
                      <Text style={styles.breakdownItemSub}>
                        {assessment?.timeBreakdown.turnCount ?? 0} turns @ 5 sec each
                      </Text>
                    </View>
                    <Text style={styles.breakdownItemVal}>
                      +{assessment?.timeBreakdown.tTurnsMinutes ?? 0} min
                    </Text>
                  </View>

                  <View style={styles.breakdownItem}>
                    <View style={styles.breakdownItemLeft}>
                      <Text style={styles.breakdownItemName}>🛗 Vertical Transitions (T_level_changes)</Text>
                      <Text style={styles.breakdownItemSub}>
                        {assessment?.timeBreakdown.liftCount ?? 0} Lifts (30s), {assessment?.timeBreakdown.rampCount ?? 0} Ramps (15s), {assessment?.timeBreakdown.stairsCount ?? 0} Stairs (20s)
                      </Text>
                    </View>
                    <Text style={styles.breakdownItemVal}>
                      +{assessment?.timeBreakdown.tLevelChangesMinutes ?? 0} min
                    </Text>
                  </View>

                  <View style={styles.breakdownItem}>
                    <View style={styles.breakdownItemLeft}>
                      <Text style={styles.breakdownItemName}>🛡️ Boarding Safety Buffer (T_buffer)</Text>
                      <Text style={styles.breakdownItemSub}>
                        Platform clearance & coach queue margin before doors close
                      </Text>
                    </View>
                    <Text style={styles.breakdownItemVal}>
                      +{assessment?.timeBreakdown.tBufferMinutes ?? 3.0} min
                    </Text>
                  </View>

                  <View style={[styles.breakdownItem, styles.breakdownItemTotal]}>
                    <View style={styles.breakdownItemLeft}>
                      <Text style={styles.breakdownTotalLabel}>Total Required Time (T_required)</Text>
                      <Text style={styles.breakdownItemSub}>
                        Estimated arrival: ~{assessment?.estimatedArrivalTime || '--:--'}
                      </Text>
                    </View>
                    <Text style={styles.breakdownTotalVal}>
                      {assessment?.timeBreakdown.tRequiredMinutes ?? 0} min
                    </Text>
                  </View>
                </View>
              </>
            )}

            {/* ======================================================== */}
            {/* TAB 2: ROUTE COMPARISON */}
            {/* ======================================================== */}
            {activeTab === 'COMPARISON' && (
              <View style={styles.comparisonContainer}>
                <Text style={styles.sectionHeading}>🔀 MULTI-ROUTE ARCHITECTURAL COMPARISON</Text>
                <Text style={styles.comparisonSub}>
                  Compare route options derived from KSR Bengaluru's verified indoor CAD graph:
                </Text>

                {assessment?.alternativeRoutes && assessment.alternativeRoutes.length > 0 ? (
                  assessment.alternativeRoutes.map((alt) => {
                    const isCurrent = alt.id === 'profile';
                    return (
                      <View
                        key={alt.id}
                        style={[
                          styles.altRouteCard,
                          isCurrent && styles.altRouteCardCurrent
                        ]}
                      >
                        <View style={styles.altRouteHeader}>
                          <View>
                            <Text style={styles.altRouteLabel}>{alt.label}</Text>
                            <Text style={styles.altRouteBadge}>
                              {alt.wheelchairAccessible ? '♿ 100% Step-Free' : '🚶 Standard Corridors'}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.altRiskPill,
                              {
                                backgroundColor:
                                  alt.riskLevel === 'COMFORTABLE'
                                    ? '#DCFCE7'
                                    : alt.riskLevel === 'HURRY'
                                    ? '#FEF3C7'
                                    : '#FEE2E2'
                              }
                            ]}
                          >
                            <Text
                              style={[
                                styles.altRiskPillText,
                                {
                                  color:
                                    alt.riskLevel === 'COMFORTABLE'
                                      ? '#15803D'
                                      : alt.riskLevel === 'HURRY'
                                      ? '#B45309'
                                      : '#B91C1C'
                                }
                              ]}
                            >
                              {alt.riskLevel} ({alt.riskScore}%)
                            </Text>
                          </View>
                        </View>

                        <View style={styles.altRouteGrid}>
                          <View style={styles.altGridBox}>
                            <Text style={styles.altGridLabel}>Distance</Text>
                            <Text style={styles.altGridVal}>{alt.distanceMeters}m</Text>
                          </View>
                          <View style={styles.altGridBox}>
                            <Text style={styles.altGridLabel}>Walking Time</Text>
                            <Text style={styles.altGridVal}>{alt.walkingTimeMinutes}m</Text>
                          </View>
                          <View style={styles.altGridBox}>
                            <Text style={styles.altGridLabel}>Required Time</Text>
                            <Text style={styles.altGridVal}>{alt.requiredTimeMinutes}m</Text>
                          </View>
                          <View style={styles.altGridBox}>
                            <Text style={styles.altGridLabel}>Safety Margin</Text>
                            <Text
                              style={[
                                styles.altGridVal,
                                { color: alt.safetyMarginMinutes >= 0 ? '#15803D' : '#B91C1C' }
                              ]}
                            >
                              {alt.safetyMarginMinutes >= 0 ? `+${alt.safetyMarginMinutes}m` : `${alt.safetyMarginMinutes}m`}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.altRouteFooter}>
                          <Text style={styles.altRouteDetails}>
                            Turns: {alt.turnCount} • Level Changes: {alt.levelChangesCount}
                          </Text>
                        </View>
                      </View>
                    );
                  })
                ) : (
                  <Text style={styles.emptyText}>No alternative routes found.</Text>
                )}
              </View>
            )}

            {/* ======================================================== */}
            {/* TAB 3: TEST SCENARIOS & DYNAMIC BLOCKAGES */}
            {/* ======================================================== */}
            {activeTab === 'SIMULATION' && (
              <View style={styles.simulationContainer}>
                <Text style={styles.sectionHeading}>🧪 7 MASTER TEST SCENARIOS</Text>
                <Text style={styles.comparisonSub}>
                  Execute deterministic test cases to verify the mathematical model:
                </Text>

                {/* Scenario 1 */}
                <TouchableOpacity
                  style={styles.scenarioCard}
                  onPress={() => {
                    setProfile('regular');
                    setAvailableMinutes(40);
                    setStartNode('node_entry_t1_main_east');
                    setTrain('12658');
                    setActiveTab('ASSESSMENT');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.scenarioNum}>Scenario 1: Comfortable</Text>
                  <Text style={styles.scenarioDesc}>
                    Departure in 40 min • 300m route • Regular passenger (1.0 m/s) ➔ Expected: COMFORTABLE
                  </Text>
                </TouchableOpacity>

                {/* Scenario 2 */}
                <TouchableOpacity
                  style={styles.scenarioCard}
                  onPress={() => {
                    setProfile('regular');
                    setAvailableMinutes(10);
                    setStartNode('node_entry_t1_main_east');
                    setTrain('12658');
                    setActiveTab('ASSESSMENT');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.scenarioNum}>Scenario 2: Hurry (Tight Buffer)</Text>
                  <Text style={styles.scenarioDesc}>
                    Departure in 10 min • 300m route • 3m buffer ➔ Expected: HURRY (0-5 min margin)
                  </Text>
                </TouchableOpacity>

                {/* Scenario 3 */}
                <TouchableOpacity
                  style={styles.scenarioCard}
                  onPress={() => {
                    setProfile('mobility_disabled');
                    setAvailableMinutes(5);
                    setStartNode('node_entry_t1_main_east');
                    setTrain('16589'); // Platform 8 (~700m away)
                    setActiveTab('ASSESSMENT');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.scenarioNum}>Scenario 3: High Risk (Wheelchair + 700m)</Text>
                  <Text style={styles.scenarioDesc}>
                    Departure in 5 min • 700m route to PF 8 • Wheelchair passenger (0.6 m/s) ➔ Expected: HIGH RISK
                  </Text>
                </TouchableOpacity>

                {/* Scenario 4: Lift Blockage */}
                <View style={styles.blockageTestCard}>
                  <Text style={styles.scenarioNum}>Scenario 4: Live Lift Blockage & Dynamic Reroute</Text>
                  <Text style={styles.scenarioDesc}>
                    Toggle Lift 1 or Lift 2 to test how blockage dynamically recalculates walking distance and risk:
                  </Text>
                  <View style={styles.blockageBtnRow}>
                    <TouchableOpacity
                      style={[
                        styles.blockageToggleBtn,
                        isBlocked('lift_1') && styles.blockageToggleBtnBlocked
                      ]}
                      onPress={() => toggleBlockage('lift_1')}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.blockageToggleText}>
                        🛗 Lift 1 (PF 8): {isBlocked('lift_1') ? '🔴 BLOCKED' : '🟢 OPEN'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.blockageToggleBtn,
                        isBlocked('lift_2') && styles.blockageToggleBtnBlocked
                      ]}
                      onPress={() => toggleBlockage('lift_2')}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.blockageToggleText}>
                        🛗 Lift 2 (T1): {isBlocked('lift_2') ? '🔴 BLOCKED' : '🟢 OPEN'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Scenario 5: Profile Change */}
                <TouchableOpacity
                  style={styles.scenarioCard}
                  onPress={() => {
                    setProfile('elderly');
                    setAvailableMinutes(15);
                    setActiveTab('ASSESSMENT');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.scenarioNum}>Scenario 5: Profile Switch to Elderly</Text>
                  <Text style={styles.scenarioDesc}>
                    Switches to Elderly profile (0.7 m/s, heavy stair penalty) ➔ Recalculates ETA and risk
                  </Text>
                </TouchableOpacity>

                {/* Scenario 6: Train Departure Change */}
                <TouchableOpacity
                  style={styles.scenarioCard}
                  onPress={() => {
                    setAvailableMinutes(7);
                    setActiveTab('ASSESSMENT');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.scenarioNum}>Scenario 6: Sudden Departure Reschedule</Text>
                  <Text style={styles.scenarioDesc}>
                    Simulates train departure advancing to 7 minutes remaining ➔ Instant reassessment
                  </Text>
                </TouchableOpacity>

                {/* Scenario 7: Invalid Data Handling */}
                <TouchableOpacity
                  style={styles.scenarioCard}
                  onPress={() => {
                    setAvailableMinutes(0);
                    setActiveTab('ASSESSMENT');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.scenarioNum}>Scenario 7: Zero Available Time / Doors Closed</Text>
                  <Text style={styles.scenarioDesc}>
                    0 minutes remaining ➔ Clamped safely to 100% risk without crash or NaN
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* TRANSPARENCY & DATA CITATION NOTE */}
            <View style={styles.transparencyBox}>
              <Text style={styles.transparencyTitle}>⚖️ DATA ACCURACY & ASSUMPTIONS DISCLOSURE</Text>
              <Text style={styles.transparencyBody}>
                {assessment?.transparencyNote}
              </Text>
              <Text style={styles.transparencySub}>
                • Station distances & topology: Ground-truth CAD model of KSR Bengaluru station.
                {'\n'}• Walking speeds & safety margins: Configurable prototype assumptions (not official IRCTC rules).
              </Text>
            </View>
          </ScrollView>

          {/* ACTION BUTTONS FOOTER */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.closeFooterBtn}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.closeFooterBtnText}>Close</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.navigateFooterBtn,
                !assessment?.canMakeTrain && assessment?.riskLevel === 'HIGH_RISK' && styles.navigateFooterBtnUrgent
              ]}
              onPress={handleStartRoute}
              activeOpacity={0.85}
            >
              <Text style={styles.navigateFooterBtnText}>
                🗺️ Navigate to Coach {coachNumber} (PF {platformNumber})
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 20, 24, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10
  },
  modalCard: {
    backgroundColor: Colors.bgSurface,
    width: '100%',
    height: '92%',
    borderRadius: 16,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    ...Shadows.floating
  },
  modalCardDesktop: {
    maxWidth: 820,
    height: '88%'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: '#FAFAF9'
  },
  headerTitleContainer: {
    flex: 1
  },
  headerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4
  },
  headerBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.forestPrimary,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    marginRight: 6
  },
  headerSubBadge: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary
  },
  stationSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.bgHover,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textSecondary
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    padding: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 12
  },
  tabButtonActive: {
    backgroundColor: Colors.bgSurface,
    ...Shadows.card
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary
  },
  tabButtonTextActive: {
    color: Colors.forestPrimary,
    fontWeight: '800'
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24
  },
  sectionContainer: {
    marginBottom: 16
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 8
  },
  trainList: {
    flexDirection: 'row',
    marginBottom: 8
  },
  trainChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  trainChipActive: {
    backgroundColor: '#1E293B',
    borderColor: '#0F172A'
  },
  trainChipNo: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary
  },
  trainChipNoActive: {
    color: '#FFFFFF'
  },
  trainChipName: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2
  },
  trainChipNameActive: {
    color: '#94A3B8'
  },
  coachRow: {
    marginTop: 4
  },
  subLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 6
  },
  coachList: {
    flexDirection: 'row'
  },
  coachPill: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginRight: 6
  },
  coachPillActive: {
    backgroundColor: Colors.forestPrimary,
    borderColor: Colors.forestPrimary
  },
  coachPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary
  },
  coachPillTextActive: {
    color: '#FFFFFF'
  },
  profileList: {
    flexDirection: 'row',
    marginBottom: 8
  },
  profileCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 8,
    alignItems: 'center',
    minWidth: 84
  },
  profileCardActive: {
    backgroundColor: '#F0FDF4',
    borderColor: Colors.forestPrimary,
    borderWidth: 1.5
  },
  profileIcon: {
    fontSize: 18,
    marginBottom: 2
  },
  profileName: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textPrimary
  },
  profileNameActive: {
    color: Colors.forestPrimary
  },
  profileSpeed: {
    fontSize: 9,
    color: Colors.textSecondary,
    marginTop: 2
  },
  profileSpeedActive: {
    color: Colors.forestPrimary,
    fontWeight: '700'
  },
  checkpointContainer: {
    marginTop: 4
  },
  checkpointChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  checkpointChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  checkpointChipActive: {
    backgroundColor: '#E0E7FF',
    borderColor: '#6366F1'
  },
  checkpointChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textPrimary
  },
  checkpointChipTextActive: {
    color: '#4338CA',
    fontWeight: '700'
  },
  timeSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  timeDisplayValue: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.forestPrimary
  },
  quickTimeChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  quickTimeChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  quickTimeChipActive: {
    backgroundColor: Colors.forestPrimary,
    borderColor: Colors.forestPrimary
  },
  quickTimeChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textPrimary
  },
  quickTimeChipTextActive: {
    color: '#FFFFFF'
  },
  riskHeroCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 16,
    ...Shadows.card
  },
  riskHeroHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10
  },
  riskIconWrap: {
    marginRight: 10
  },
  riskHeroIcon: {
    fontSize: 26
  },
  riskHeroBadge: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8
  },
  riskHeroHeadline: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2
  },
  marginStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    marginVertical: 10
  },
  marginStatBox: {
    alignItems: 'center',
    flex: 1
  },
  marginStatLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase'
  },
  marginStatVal: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 2
  },
  marginStatVs: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94A3B8'
  },
  riskBarContainer: {
    marginTop: 4,
    marginBottom: 10
  },
  riskBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  riskBarLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textPrimary
  },
  riskBarValue: {
    fontSize: 14,
    fontWeight: '800'
  },
  riskBarTrack: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden'
  },
  riskBarFill: {
    height: '100%',
    borderRadius: 4
  },
  riskScoreDisclaimer: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 4,
    fontStyle: 'italic'
  },
  recommendationBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    marginTop: 4
  },
  recommendationText: {
    fontSize: 12,
    color: Colors.textPrimary,
    lineHeight: 18
  },
  emergencyRescueCta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#991B1B',
    borderRadius: 12,
    padding: 10,
    marginTop: 10
  },
  emergencyRescueCtaIcon: {
    fontSize: 22,
    marginRight: 8
  },
  emergencyRescueCtaTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF'
  },
  emergencyRescueCtaSub: {
    fontSize: 10,
    color: '#FEE2E2',
    marginTop: 2
  },
  emergencyRescueCtaArrow: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '800',
    marginLeft: 6
  },
  breakdownCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 16
  },
  breakdownTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 4
  },
  breakdownFormula: {
    fontSize: 10,
    color: '#64748B',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 10
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F6'
  },
  breakdownItemLeft: {
    flex: 1
  },
  breakdownItemName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary
  },
  breakdownItemSub: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2
  },
  breakdownItemVal: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginLeft: 8
  },
  breakdownItemTotal: {
    borderBottomWidth: 0,
    paddingTop: 10,
    marginTop: 4,
    borderTopWidth: 1.5,
    borderTopColor: '#CBD5E1'
  },
  breakdownTotalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary
  },
  breakdownTotalVal: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.forestPrimary
  },
  comparisonContainer: {
    marginBottom: 16
  },
  comparisonSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 10
  },
  altRouteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 10,
    ...Shadows.card
  },
  altRouteCardCurrent: {
    borderColor: Colors.forestPrimary,
    borderWidth: 1.5,
    backgroundColor: '#F0FDF4'
  },
  altRouteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  altRouteLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary
  },
  altRouteBadge: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2
  },
  altRiskPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999
  },
  altRiskPillText: {
    fontSize: 10,
    fontWeight: '800'
  },
  altRouteGrid: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 8,
    marginVertical: 6
  },
  altGridBox: {
    flex: 1,
    alignItems: 'center'
  },
  altGridLabel: {
    fontSize: 9,
    color: Colors.textSecondary,
    textTransform: 'uppercase'
  },
  altGridVal: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 2
  },
  altRouteFooter: {
    marginTop: 4
  },
  altRouteDetails: {
    fontSize: 10,
    color: '#64748B'
  },
  simulationContainer: {
    marginBottom: 16
  },
  scenarioCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8
  },
  scenarioNum: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textPrimary
  },
  scenarioDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2
  },
  blockageTestCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8
  },
  blockageBtnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8
  },
  blockageToggleBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignItems: 'center'
  },
  blockageToggleBtnBlocked: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444'
  },
  blockageToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textPrimary
  },
  emptyText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginVertical: 12
  },
  transparencyBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 10,
    marginTop: 10
  },
  transparencyTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
    marginBottom: 4
  },
  transparencyBody: {
    fontSize: 10,
    color: '#64748B',
    lineHeight: 14,
    marginBottom: 4
  },
  transparencySub: {
    fontSize: 9,
    color: '#94A3B8',
    lineHeight: 13
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.bgSurface,
    alignItems: 'center',
    gap: 10
  },
  closeFooterBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: Colors.bgHover
  },
  closeFooterBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary
  },
  navigateFooterBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: Colors.forestPrimary,
    alignItems: 'center',
    ...Shadows.card
  },
  navigateFooterBtnUrgent: {
    backgroundColor: '#C1121F'
  },
  navigateFooterBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF'
  }
});
