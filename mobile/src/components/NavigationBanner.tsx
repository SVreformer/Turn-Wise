import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { RouteResult, RouteStep } from '../services/localRouter';
import { LocationConfidence, SensorStatus } from '../services/liveNavigationService';
import { MotionActivityType } from '../services/inbuiltMotionDetector';
import { Colors, Shadows, Radii, Spacing } from '../theme/tokens';

interface NavigationBannerProps {
  route: RouteResult;
  currentStepIndex: number;
  voiceEnabled: boolean;
  blockageAlert: string | null;
  onAdvanceStep: () => void;
  onPreviousStep: () => void;
  onToggleVoice: () => void;
  onStopNavigation: () => void;
  onSimulateStep?: () => void;
  isAutoWalking?: boolean;
  onToggleAutoWalk?: () => void;
  onOpenArVr?: () => void;

  // Real live indoor navigation props
  liveSteps?: number;
  liveDistanceMeters?: number;
  liveDistanceRemainingMeters?: number;
  locationConfidence?: LocationConfidence;
  sensorStatus?: SensorStatus;
  isOffRoute?: boolean;
  offRouteAlert?: string | null;
  bearing?: number;
  headingDirection?: string;
  nearestZoneName?: string;
  onOpenQrScanner?: () => void;
  motionActivity?: MotionActivityType;
  cadenceStepsPerMin?: number;
  sensorSourceDescription?: string;
}

export const NavigationBanner: React.FC<NavigationBannerProps> = ({
  route,
  currentStepIndex,
  voiceEnabled,
  blockageAlert,
  onAdvanceStep,
  onPreviousStep,
  onToggleVoice,
  onStopNavigation,
  onSimulateStep,
  isAutoWalking = false,
  onToggleAutoWalk,
  onOpenArVr,
  liveSteps = 0,
  liveDistanceMeters = 0,
  liveDistanceRemainingMeters,
  locationConfidence = 'HIGH',
  sensorStatus = 'UNAVAILABLE',
  isOffRoute = false,
  offRouteAlert,
  bearing = 0,
  headingDirection = 'N',
  nearestZoneName,
  onOpenQrScanner,
  motionActivity = 'STATIONARY',
  cadenceStepsPerMin = 0,
  sensorSourceDescription
}) => {
  const steps = route?.steps || [];
  const currentStep: RouteStep | undefined = steps[currentStepIndex];
  const isLast = steps.length > 0 ? currentStepIndex >= steps.length - 1 : true;
  const isFirst = currentStepIndex === 0;

  const remainingMeters = liveDistanceRemainingMeters !== undefined
    ? liveDistanceRemainingMeters
    : route.totalDistanceMeters;

  const getStepIcon = (instruction: string, pathType: string) => {
    const text = (instruction + ' ' + pathType).toLowerCase();
    if (text.includes('lift') || text.includes('elevator')) return '🛗';
    if (text.includes('ramp')) return '↗️';
    if (text.includes('stair') || text.includes('steps')) return '🪜';
    if (text.includes('left')) return '↖️';
    if (text.includes('right')) return '↗️';
    if (text.includes('arrive') || text.includes('platform')) return '🏁';
    return '⬆️';
  };

  const getConfidenceBadge = () => {
    switch (locationConfidence) {
      case 'HIGH':
        return {
          bg: '#ECFDF5',
          border: '#10B981',
          text: '#065F46',
          label: 'HIGH CONFIDENCE (QR ANCHOR)'
        };
      case 'MEDIUM':
        return {
          bg: '#FFFBEB',
          border: '#F59E0B',
          text: '#92400E',
          label: 'MEDIUM (PEDOMETER ESTIMATE)'
        };
      case 'LOW':
      default:
        return {
          bg: '#FEF2F2',
          border: '#EF4444',
          text: '#991B1B',
          label: 'LOW CONFIDENCE (SCAN QR TO RE-ANCHOR)'
        };
    }
  };

  const getMotionBadge = () => {
    switch (motionActivity) {
      case 'RUNNING':
        return {
          icon: '🏃',
          text: `Run (${cadenceStepsPerMin || 140} spm)`,
          bg: '#FEF2F2',
          border: '#F87171',
          color: '#991B1B'
        };
      case 'WALKING':
        return {
          icon: '🚶',
          text: `Walking (${cadenceStepsPerMin || 98} spm)`,
          bg: '#ECFDF5',
          border: '#34D399',
          color: '#065F46'
        };
      case 'TURNING':
        return {
          icon: '🔄',
          text: 'Turning',
          bg: '#EFF6FF',
          border: '#60A5FA',
          color: '#1E40AF'
        };
      case 'STATIONARY':
      default:
        return {
          icon: '🧍',
          text: 'Stationary',
          bg: '#F1F5F9',
          border: '#CBD5E1',
          color: '#475569'
        };
    }
  };

  const confBadge = getConfidenceBadge();
  const motionBadge = getMotionBadge();

  return (
    <View style={styles.container}>
      {/* 1. Off-Route / Wrong Turn Alert Banner */}
      {(isOffRoute || offRouteAlert) && (
        <View style={styles.offRouteAlertBox}>
          <Text style={styles.offRouteIcon}>⚠️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.offRouteTitle}>OFF ROUTE DETECTED</Text>
            <Text style={styles.offRouteSub}>
              {offRouteAlert || 'Deviation over 8m detected. A* dynamic reroute active.'}
            </Text>
          </View>
          {onOpenQrScanner && (
            <TouchableOpacity style={styles.qrAnchorBtn} onPress={onOpenQrScanner} activeOpacity={0.8}>
              <Text style={styles.qrAnchorBtnText}>📷 QR Anchor</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* 2. Blockage Alert Banner if active */}
      {blockageAlert && (
        <View style={styles.blockageAlertBox}>
          <Text style={styles.blockageAlertIcon}>🚧</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.blockageAlertTitle}>Live Route Re-routing</Text>
            <Text style={styles.blockageAlertText}>{blockageAlert}</Text>
          </View>
        </View>
      )}

      {/* 3. Live Positioning Status, Motion & Sensor Bar */}
      <View style={styles.statusTelemetryRow}>
        <View style={styles.statusLeftRow}>
          <View style={[styles.confidencePill, { backgroundColor: confBadge.bg, borderColor: confBadge.border }]}>
            <View style={[styles.confidenceDot, { backgroundColor: confBadge.border }]} />
            <Text style={[styles.confidenceText, { color: confBadge.text }]}>{confBadge.label}</Text>
          </View>

          <View style={[styles.motionPill, { backgroundColor: motionBadge.bg, borderColor: motionBadge.border }]}>
            <Text style={styles.motionIconText}>{motionBadge.icon}</Text>
            <Text style={[styles.motionText, { color: motionBadge.color }]}>{motionBadge.text}</Text>
          </View>
        </View>

        <View style={styles.telemetryRight}>
          <View style={styles.sensorPill}>
            <Text style={styles.sensorPillText}>
              {sensorSourceDescription || (sensorStatus === 'ACTIVE'
                ? '📱 Inbuilt Motion + Compass'
                : sensorStatus === 'PERMISSION_DENIED'
                ? '🔒 Permission Denied'
                : '💻 Web / Test Fallback')}
            </Text>
          </View>
          {onOpenQrScanner && (
            <TouchableOpacity style={styles.scanQrIconBtn} onPress={onOpenQrScanner} activeOpacity={0.8}>
              <Text style={styles.scanQrIconText}>📷 Checkpoint</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 4. Main Turn-by-Turn Maneuver Card */}
      {currentStep && (
        <View style={styles.hudCard}>
          <View style={styles.hudTopRow}>
            <View style={styles.maneuverIconBox}>
              <Text style={styles.maneuverIcon}>{getStepIcon(currentStep.instruction, currentStep.pathType)}</Text>
            </View>
            <View style={styles.hudInstructionCol}>
              <View style={styles.distanceBadgeRow}>
                <Text style={styles.distanceText}>
                  {currentStep.distance > 0 ? `In ${currentStep.distance}m` : 'At location'}
                </Text>
                <View style={styles.stepProgressPill}>
                  <Text style={styles.stepProgressText}>
                    Step {currentStepIndex + 1} of {steps.length}
                  </Text>
                </View>
              </View>
              <Text style={styles.instructionText} numberOfLines={2}>
                {currentStep.instruction}
              </Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.round(((currentStepIndex + 1) / Math.max(steps.length, 1)) * 100)}%` }
              ]}
            />
          </View>

          {/* Live Zone / Landmark info */}
          <View style={styles.landmarkRow}>
            <Text style={styles.landmarkIcon}>📍</Text>
            <Text style={styles.landmarkText} numberOfLines={1}>
              {nearestZoneName ? `Current Zone: ${nearestZoneName}` : (currentStep.landmark ? `Landmark: ${currentStep.landmark}` : 'KSR Station Concourse')}
            </Text>
            <Text style={styles.headingBadge}>
              🧭 {bearing}° {headingDirection}
            </Text>
          </View>
        </View>
      )}

      {/* 5. Bottom Floating Live Stats & Controls */}
      <View style={styles.bottomBar}>
        <View style={styles.tripStats}>
          <View style={styles.liveStepsBadge}>
            <Text style={styles.liveStepsText}>👟 {liveSteps} steps</Text>
          </View>
          <Text style={styles.remainingText}>
            {liveDistanceMeters}m walked • {remainingMeters}m left
          </Text>
        </View>

        <View style={styles.actionsGroup}>
          {onOpenArVr && (
            <TouchableOpacity
              style={styles.arNavBtn}
              onPress={onOpenArVr}
              activeOpacity={0.8}
            >
              <Text style={styles.arNavBtnText}>🥽 AR</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionBtn, voiceEnabled && styles.actionBtnActive]}
            onPress={onToggleVoice}
            activeOpacity={0.8}
          >
            <Text style={styles.actionBtnIcon}>{voiceEnabled ? '🔊' : '🔇'}</Text>
          </TouchableOpacity>

          {onSimulateStep && (
            <TouchableOpacity
              style={styles.stepSimBtn}
              onPress={onSimulateStep}
              activeOpacity={0.8}
            >
              <Text style={styles.stepSimBtnText}>👣 Step</Text>
            </TouchableOpacity>
          )}

          {onToggleAutoWalk && (
            <TouchableOpacity
              style={[
                styles.stepSimBtn,
                {
                  backgroundColor: isAutoWalking ? '#DC2626' : '#059669',
                  borderColor: isAutoWalking ? '#EF4444' : '#10B981',
                  paddingHorizontal: 12
                }
              ]}
              onPress={onToggleAutoWalk}
              activeOpacity={0.8}
            >
              <Text style={[styles.stepSimBtnText, { color: '#FFFFFF', fontWeight: '800' }]}>
                {isAutoWalking ? '⏸ Pause' : '▶ Walk'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.stepBtn, isFirst && styles.stepBtnDisabled]}
            onPress={onPreviousStep}
            disabled={isFirst}
            activeOpacity={0.8}
          >
            <Text style={styles.stepBtnText}>◀</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.stepBtn, styles.nextStepBtn]}
            onPress={onAdvanceStep}
            activeOpacity={0.8}
          >
            <Text style={styles.nextStepBtnText}>
              {isLast ? 'Arrived ✓' : 'Next ▶'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.exitBtn}
            onPress={onStopNavigation}
            activeOpacity={0.8}
          >
            <Text style={styles.exitBtnText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing.xs
  },
  offRouteAlertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: Radii.md,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: '#EF4444'
  },
  offRouteIcon: {
    fontSize: 20,
    marginRight: 8
  },
  offRouteTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#991B1B'
  },
  offRouteSub: {
    fontSize: 11,
    color: '#7F1D1D'
  },
  qrAnchorBtn: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  qrAnchorBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700'
  },
  blockageAlertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: Radii.md,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F59E0B'
  },
  blockageAlertIcon: {
    fontSize: 18,
    marginRight: 8
  },
  blockageAlertTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E'
  },
  blockageAlertText: {
    fontSize: 11,
    color: '#78350F'
  },
  statusTelemetryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  confidencePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1
  },
  confidenceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5
  },
  confidenceText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3
  },
  statusLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  motionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1
  },
  motionIconText: {
    fontSize: 10,
    marginRight: 4
  },
  motionText: {
    fontSize: 10,
    fontWeight: '700'
  },
  telemetryRight: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  sensorPill: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 4
  },
  sensorPillText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600'
  },
  scanQrIconBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6
  },
  scanQrIconText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700'
  },
  hudCard: {
    backgroundColor: '#1E293B',
    borderRadius: Radii.lg,
    padding: 14,
    ...Shadows.floating
  },
  hudTopRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  maneuverIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#334155'
  },
  maneuverIcon: {
    fontSize: 24
  },
  hudInstructionCol: {
    flex: 1
  },
  distanceBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2
  },
  distanceText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 0.3
  },
  stepProgressPill: {
    backgroundColor: '#334155',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  stepProgressText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600'
  },
  instructionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 18
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: '#334155',
    borderRadius: 2,
    marginTop: 10,
    marginBottom: 8,
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 2
  },
  landmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2
  },
  landmarkIcon: {
    fontSize: 12,
    marginRight: 4
  },
  landmarkText: {
    fontSize: 11,
    color: '#94A3B8',
    flex: 1
  },
  headingBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#38BDF8',
    backgroundColor: '#0F172A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    borderRadius: Radii.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
    ...Shadows.card
  },
  tripStats: {
    justifyContent: 'center'
  },
  liveStepsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2
  },
  liveStepsText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#38BDF8'
  },
  remainingText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500'
  },
  actionsGroup: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  arNavBtn: {
    backgroundColor: '#0F172A',
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 6
  },
  arNavBtnText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '800'
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6
  },
  actionBtnActive: {
    backgroundColor: '#2563EB'
  },
  actionBtnIcon: {
    fontSize: 16
  },
  stepSimBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: 8,
    marginRight: 6
  },
  stepSimBtnActive: {
    backgroundColor: '#10B981'
  },
  stepSimBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700'
  },
  stepSimBtnActiveText: {
    color: '#FFFFFF'
  },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6
  },
  stepBtnDisabled: {
    opacity: 0.35
  },
  stepBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700'
  },
  nextStepBtn: {
    width: 'auto',
    paddingHorizontal: 10,
    backgroundColor: Colors.forestPrimary
  },
  nextStepBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800'
  },
  exitBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center'
  },
  exitBtnText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '800'
  }
});
