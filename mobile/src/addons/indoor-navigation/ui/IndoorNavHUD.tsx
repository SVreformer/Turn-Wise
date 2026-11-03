import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Shadows, Radii, Spacing } from '../../../theme/tokens';
import { HybridPositionEstimate, MultiFloorRouteStep } from '../types';
import { CrowdDensityBadge } from './CrowdDensityBadge';

interface IndoorNavHUDProps {
  estimate: HybridPositionEstimate;
  activeStep?: MultiFloorRouteStep;
  currentStepIndex: number;
  totalSteps: number;
  selectedFloor: number;
  remainingMeters?: number;
  isAutoWalking?: boolean;
  onSelectFloor: (floor: number) => void;
  onOpenQrScanner: () => void;
  onOpenBleRadar: () => void;
  onSimulateStep: () => void;
  onToggleAutoWalk?: () => void;
  onStopNavigation?: () => void;
  onTriggerRecoveryModal: () => void;
  onAdvanceStep?: () => void;
  onPreviousStep?: () => void;
}

export const IndoorNavHUD: React.FC<IndoorNavHUDProps> = ({
  estimate,
  activeStep,
  currentStepIndex,
  totalSteps,
  selectedFloor,
  remainingMeters,
  isAutoWalking = false,
  onSelectFloor,
  onOpenQrScanner,
  onOpenBleRadar,
  onSimulateStep,
  onToggleAutoWalk,
  onStopNavigation,
  onTriggerRecoveryModal,
  onAdvanceStep,
  onPreviousStep
}) => {
  const getConfidenceStyle = () => {
    switch (estimate.state) {
      case 'CONFIRMED':
        return {
          color: Colors.forestPrimary,
          bg: '#F0FDF4',
          border: '#BBF7D0',
          label: 'CONFIRMED (QR ANCHOR)',
          icon: '✓'
        };
      case 'TRACKING':
        return {
          color: '#D97706',
          bg: '#FFFBEB',
          border: '#FDE68A',
          label: 'TRACKING (BLE BEACONS)',
          icon: '●'
        };
      case 'UNCERTAIN':
        return {
          color: '#DC2626',
          bg: '#FEF2F2',
          border: '#FECACA',
          label: 'SIGNAL UNCERTAIN',
          icon: '⚠️'
        };
      case 'RECOVERY':
      default:
        return {
          color: Colors.crimsonPrimary,
          bg: '#FEE2E2',
          border: '#F87171',
          label: 'RECOVERY MODE',
          icon: '🚨'
        };
    }
  };

  const confStyle = getConfidenceStyle();

  return (
    <View style={styles.container}>
      {/* 1. Floor Level Switcher & Confidence Bar */}
      <View style={styles.topBar}>
        <View style={styles.floorTabs}>
          {[
            { level: -1, label: 'L-1 Subway' },
            { level: 0, label: 'L0 Ground' },
            { level: 1, label: 'L1 FOB' }
          ].map((fl) => {
            const isSelected = selectedFloor === fl.level;
            const isCurrent = estimate.level === fl.level;
            return (
              <TouchableOpacity
                key={fl.level}
                style={[
                  styles.floorTab,
                  isSelected && styles.floorTabActive,
                  isCurrent && styles.floorTabCurrent
                ]}
                onPress={() => onSelectFloor(fl.level)}
                activeOpacity={0.7}
              >
                <Text style={[styles.floorTabText, isSelected && styles.floorTabTextActive]}>
                  {fl.label}
                </Text>
                {isCurrent && <View style={styles.currentDot} />}
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.confidencePill, { backgroundColor: confStyle.bg, borderColor: confStyle.border }]}
          onPress={onTriggerRecoveryModal}
          activeOpacity={0.8}
        >
          <Text style={[styles.confIcon, { color: confStyle.color }]}>{confStyle.icon}</Text>
          <Text style={[styles.confScore, { color: confStyle.color }]}>{estimate.confidenceScore}%</Text>
          <Text style={[styles.confState, { color: confStyle.color }]}>{estimate.state}</Text>
        </TouchableOpacity>
      </View>

      {/* 2. Active Step Instruction Card (Maneuver HUD) */}
      {activeStep ? (
        <View style={styles.turnCard}>
          <View style={styles.turnCardHeader}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>
                Step {currentStepIndex + 1} of {totalSteps}
              </Text>
            </View>
            <CrowdDensityBadge status="MODERATE" density={1.8} />
          </View>

          <View style={styles.instructionRow}>
            <View style={styles.portalIconBox}>
              <Text style={styles.portalIcon}>
                {activeStep.pathType === 'LIFT' ? '🛗' :
                 activeStep.pathType === 'RAMP' ? '↗️' :
                 activeStep.pathType === 'STAIRS' ? '🪜' :
                 activeStep.pathType === 'SUBWAY' ? '🚇' :
                 activeStep.pathType === 'FOB' ? '🌉' : '⬆️'}
              </Text>
            </View>
            <View style={styles.instructionTextCol}>
              <Text style={styles.instructionEn}>{activeStep.instruction}</Text>
              <Text style={styles.instructionKn}>{activeStep.instructionKn}</Text>
            </View>
          </View>

          {activeStep.landmarkHint && (
            <View style={styles.landmarkBox}>
              <Text style={styles.landmarkIcon}>🏛️</Text>
              <Text style={styles.landmarkText}>Landmark: {activeStep.landmarkHint}</Text>
            </View>
          )}

          {/* Stepper controls */}
          <View style={styles.stepperRow}>
            <TouchableOpacity
              style={[styles.stepBtn, currentStepIndex === 0 && styles.stepBtnDisabled]}
              onPress={onPreviousStep}
              disabled={currentStepIndex === 0}
            >
              <Text style={styles.stepBtnText}>◀ Prev</Text>
            </TouchableOpacity>

            <View style={styles.distanceBadgeCol}>
              <Text style={styles.stepDistance}>
                {remainingMeters !== undefined && remainingMeters > 0 ? `${remainingMeters}m remaining` : `${activeStep.distance}m`}
              </Text>
              {isAutoWalking && (
                <Text style={styles.autoWalkLabel}>● Live Walking</Text>
              )}
            </View>

            <TouchableOpacity
              style={[styles.stepBtn, styles.stepBtnNext]}
              onPress={onAdvanceStep}
            >
              <Text style={[styles.stepBtnText, styles.stepBtnNextText]}>
                {currentStepIndex >= totalSteps - 1 ? 'Arrived ✓' : 'Next ▶'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.idleCard}>
          <Text style={styles.idleTitle}>INDOOR POSITIONING ACTIVE</Text>
          <Text style={styles.idleSub}>
            Location: {estimate.floorName} near node {estimate.nearestNodeId}.
          </Text>
        </View>
      )}

      {/* 3. Sensor & Simulation Quick Actions Bar */}
      <View style={styles.bottomActionsBar}>
        <TouchableOpacity
          style={styles.actionPill}
          onPress={onOpenQrScanner}
          activeOpacity={0.75}
        >
          <Text style={styles.actionIcon}>📷</Text>
          <Text style={styles.actionLabel}>Scan QR</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionPill}
          onPress={onOpenBleRadar}
          activeOpacity={0.75}
        >
          <Text style={styles.actionIcon}>📡</Text>
          <Text style={styles.actionLabel}>Radar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionPill}
          onPress={onSimulateStep}
          activeOpacity={0.75}
        >
          <Text style={styles.actionIcon}>👣</Text>
          <Text style={styles.actionLabel}>Step +1m</Text>
        </TouchableOpacity>

        {onToggleAutoWalk && (
          <TouchableOpacity
            style={[styles.actionPill, isAutoWalking && styles.actionPillWalking]}
            onPress={onToggleAutoWalk}
            activeOpacity={0.75}
          >
            <Text style={styles.actionIcon}>{isAutoWalking ? '⏸' : '▶'}</Text>
            <Text style={[styles.actionLabel, isAutoWalking && styles.actionLabelWalking]}>
              {isAutoWalking ? 'Pause' : 'Auto-Walk'}
            </Text>
          </TouchableOpacity>
        )}

        {onStopNavigation && (
          <TouchableOpacity
            style={[styles.actionPill, styles.actionPillStop]}
            onPress={onStopNavigation}
            activeOpacity={0.75}
          >
            <Text style={styles.actionIcon}>⏹</Text>
            <Text style={[styles.actionLabel, { color: Colors.crimsonPrimary }]}>Stop</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.lg,
    padding: Spacing.sm,
    ...Shadows.floating,
    marginHorizontal: Spacing.xs,
    marginVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs
  },
  floorTabs: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: Radii.pill,
    padding: 2
  },
  floorTab: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  floorTabActive: {
    backgroundColor: Colors.forestPrimary
  },
  floorTabCurrent: {
    borderWidth: 1,
    borderColor: '#15803D'
  },
  floorTabText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569'
  },
  floorTabTextActive: {
    color: '#FFFFFF'
  },
  currentDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#22C55E'
  },
  confidencePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Radii.pill,
    borderWidth: 1,
    gap: 4
  },
  confIcon: {
    fontSize: 10,
    fontWeight: '800'
  },
  confScore: {
    fontSize: 10,
    fontWeight: '800'
  },
  confState: {
    fontSize: 9,
    fontWeight: '700'
  },
  turnCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: Radii.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: Spacing.xs
  },
  turnCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  stepBadge: {
    backgroundColor: '#E2E8F0',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: Radii.xs
  },
  stepBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#334155'
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6
  },
  portalIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center'
  },
  portalIcon: {
    fontSize: 16
  },
  instructionTextCol: {
    flex: 1
  },
  instructionEn: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 16
  },
  instructionKn: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2
  },
  landmarkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: Radii.xs,
    marginBottom: 6,
    gap: 4
  },
  landmarkIcon: {
    fontSize: 11
  },
  landmarkText: {
    fontSize: 10,
    color: '#1D4ED8',
    fontWeight: '600'
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4
  },
  stepBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: Radii.xs
  },
  stepBtnDisabled: {
    opacity: 0.4
  },
  stepBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#334155'
  },
  stepBtnNext: {
    backgroundColor: Colors.forestPrimary
  },
  stepBtnNextText: {
    color: '#FFFFFF'
  },
  distanceBadgeCol: {
    alignItems: 'center'
  },
  autoWalkLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#059669',
    marginTop: 1
  },
  stepDistance: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A'
  },
  idleCard: {
    padding: Spacing.sm,
    backgroundColor: '#F8FAFC',
    borderRadius: Radii.md,
    marginBottom: Spacing.xs
  },
  idleTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.forestPrimary,
    letterSpacing: 0.3
  },
  idleSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2
  },
  bottomActionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6
  },
  actionPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: Radii.sm,
    backgroundColor: '#F1F5F9',
    gap: 4
  },
  actionPillWalking: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC'
  },
  actionLabelWalking: {
    color: '#15803D'
  },
  actionPillStop: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA'
  },
  actionPillHelp: {
    backgroundColor: '#FEE2E2'
  },
  actionIcon: {
    fontSize: 12
  },
  actionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#334155'
  }
});
