import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { RouteResult } from '../services/localRouter';
import { Colors, Shadows, Radii, Spacing } from '../theme/tokens';
import {
  WalkIcon,
  WheelchairIcon,
  ElevatorIcon,
  RampIcon,
  ClockIcon,
  DistanceIcon,
  CheckIcon,
  CloseIcon,
  FullscreenIcon,
  ArrowRightIcon,
  AlertIcon
} from './Icons';

interface RoutePreviewCardProps {
  route: RouteResult;
  selectedProfileId: string;
  onStartNavigation: () => void;
  onStartAndWalk?: () => void;
  onFitRoute: () => void;
  onClosePreview?: () => void;
}

export const RoutePreviewCard: React.FC<RoutePreviewCardProps> = ({
  route,
  selectedProfileId,
  onStartNavigation,
  onStartAndWalk,
  onFitRoute,
  onClosePreview
}) => {
  const [showSteps, setShowSteps] = useState(true);
  const isStepFree = route.accessibility.stepFree;
  const isWheelchair = selectedProfileId === 'mobility_disabled';

  return (
    <View style={styles.card} nativeID="route-results-section">
      {/* Top Header Row */}
      <View style={styles.topRow}>
        <View style={styles.badgeRow}>
          <View style={styles.routePill}>
            <Text style={styles.routePillText}>OPTIMAL INDOOR PATH</Text>
          </View>
          {isStepFree ? (
            <View style={styles.accessibleBadge}>
              <CheckIcon size={12} color="#059669" strokeWidth={3} />
              <Text style={styles.accessibleBadgeText}>Step-Free Verified</Text>
            </View>
          ) : (
            <View style={styles.stairsBadge}>
              <AlertIcon size={12} color="#D97706" />
              <Text style={styles.stairsBadgeText}>Stairs Along Path</Text>
            </View>
          )}
        </View>

        <View style={styles.topActions}>
          <TouchableOpacity onPress={onFitRoute} style={styles.fitBtn} activeOpacity={0.8}>
            <FullscreenIcon size={14} color="#2563EB" />
            <Text style={styles.fitBtnText}>Fit Map</Text>
          </TouchableOpacity>
          {onClosePreview && (
            <TouchableOpacity onPress={onClosePreview} style={styles.closeBtn} activeOpacity={0.8}>
              <CloseIcon size={14} color="#64748B" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Destination & Concourse Info */}
      <View style={styles.destHeader}>
        <Text style={styles.destTitle} numberOfLines={1}>
          {route.destination?.name || 'Destination'}
        </Text>
        <Text style={styles.destSub}>
          Origin: {route.start?.name || 'Station Concourse'} • Deterministic A* Graph Path
        </Text>
      </View>

      {/* Core Metrics Banner */}
      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <View style={styles.metricHeader}>
            <ClockIcon size={14} color="#2563EB" />
            <Text style={styles.metricLabel}>Est. Walking Time</Text>
          </View>
          <Text style={styles.metricValue}>{route.estimatedTimeMinutes} min</Text>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricItem}>
          <View style={styles.metricHeader}>
            <DistanceIcon size={14} color="#2563EB" />
            <Text style={styles.metricLabel}>Total Distance</Text>
          </View>
          <Text style={styles.metricValue}>{route.totalDistanceMeters} m</Text>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricItem}>
          <View style={styles.metricHeader}>
            <WalkIcon size={14} color="#2563EB" />
            <Text style={styles.metricLabel}>Turn Cues</Text>
          </View>
          <Text style={styles.metricValue}>{route.steps.length} steps</Text>
        </View>
      </View>

      {/* Dynamic Edge-Cost Formula Box (Specification 1) */}
      {route.costBreakdown && (
        <View style={styles.formulaBox}>
          <View style={styles.formulaHeader}>
            <Text style={styles.formulaTitle}>SPATIAL COST CALCULATION ENGINE</Text>
            <Text style={styles.formulaEquation}>c(e) = d(e) + P_a(e) + P_s(e) + P_u(e)</Text>
          </View>
          <View style={styles.formulaGrid}>
            <View style={styles.formulaGridItem}>
              <Text style={styles.formulaValue}>{route.costBreakdown.totalDistance}m</Text>
              <Text style={styles.formulaLabel}>Distance d(e)</Text>
            </View>
            <View style={styles.formulaGridItem}>
              <Text style={[styles.formulaValue, { color: '#059669' }]}>
                {route.costBreakdown.totalAccessibilityPenalty >= 0 ? `+${route.costBreakdown.totalAccessibilityPenalty}` : route.costBreakdown.totalAccessibilityPenalty}
              </Text>
              <Text style={styles.formulaLabel}>Access P_a(e)</Text>
            </View>
            <View style={styles.formulaGridItem}>
              <Text style={[styles.formulaValue, { color: '#D97706' }]}>+{route.costBreakdown.totalSafetyPenalty}</Text>
              <Text style={styles.formulaLabel}>Safety P_s(e)</Text>
            </View>
            <View style={styles.formulaGridItem}>
              <Text style={[styles.formulaValue, { color: '#7C3AED' }]}>+{route.costBreakdown.totalUncertaintyPenalty}</Text>
              <Text style={styles.formulaLabel}>Uncertainty P_u(e)</Text>
            </View>
          </View>
          <View style={styles.totalCostRow}>
            <Text style={styles.totalCostLabel}>Total Calculated Route Cost:</Text>
            <Text style={styles.totalCostValue}>{route.costBreakdown.totalCost} units</Text>
          </View>
        </View>
      )}

      {/* Vertical Transitions Chips */}
      {(route.accessibility.liftsUsed.length > 0 ||
        route.accessibility.rampsUsed.length > 0 ||
        route.accessibility.stairsUsed.length > 0) && (
        <View style={styles.verticalTransitionsRow}>
          {route.accessibility.liftsUsed.length > 0 && (
            <View style={styles.facilityPill}>
              <ElevatorIcon size={13} color="#2563EB" />
              <Text style={styles.facilityPillText}>Lift: {route.accessibility.liftsUsed.join(', ')}</Text>
            </View>
          )}
          {route.accessibility.rampsUsed.length > 0 && (
            <View style={styles.facilityPill}>
              <RampIcon size={13} color="#059669" />
              <Text style={styles.facilityPillText}>Ramp: {route.accessibility.rampsUsed.join(', ')}</Text>
            </View>
          )}
          {route.accessibility.stairsUsed.length > 0 && (
            <View style={[styles.facilityPill, styles.stairPill]}>
              <AlertIcon size={13} color="#DC2626" />
              <Text style={[styles.facilityPillText, { color: '#DC2626' }]}>
                Stairs: {route.accessibility.stairsUsed.join(', ')}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Turn-by-Turn Steps Accordion */}
      <TouchableOpacity
        style={styles.stepsToggle}
        onPress={() => setShowSteps(!showSteps)}
        activeOpacity={0.7}
      >
        <Text style={styles.stepsToggleText}>
          {showSteps ? 'Hide Turn-by-Turn Guidance' : 'View Step-by-Step Directions'}
        </Text>
        <Text style={styles.stepsToggleArrow}>{showSteps ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {showSteps && (
        <View style={styles.stepsListContainer}>
          {route.steps.map((step, idx) => (
            <View key={idx} style={styles.stepItem}>
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumberText}>{idx + 1}</Text>
              </View>
              <View style={styles.stepTextCol}>
                <Text style={styles.stepInstruction}>{step.instruction}</Text>
                <View style={styles.stepMetaRow}>
                  <Text style={styles.stepDistance}>{step.distance}m</Text>
                  {step.pathType && (
                    <Text style={styles.stepTransitionBadge}>
                      {step.pathType.replace('_', ' ').toUpperCase()}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Start Navigation CTA */}
      <View style={styles.ctaRow}>
        <TouchableOpacity
          style={[styles.startNavBtn, onStartAndWalk ? { flex: 1.3 } : { width: '100%' }]}
          onPress={onStartNavigation}
          activeOpacity={0.85}
        >
          <Text style={styles.startNavText}>START GUIDANCE</Text>
          <ArrowRightIcon size={16} color="#FFFFFF" strokeWidth={2.5} />
        </TouchableOpacity>

        {onStartAndWalk && (
          <TouchableOpacity
            style={styles.walkRouteBtn}
            onPress={onStartAndWalk}
            activeOpacity={0.85}
          >
            <Text style={styles.walkRouteText}>▶ WALK ROUTE</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.lg,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: '#93C5FD',
    ...Shadows.floating,
    marginTop: 10
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  routePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: '#0F172A'
  },
  routePillText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  accessibleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.pill,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0'
  },
  accessibleBadgeText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '700'
  },
  stairsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.pill,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A'
  },
  stairsBadgeText: {
    color: '#D97706',
    fontSize: 10,
    fontWeight: '700'
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  fitBtn: {
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
  fitBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563EB'
  },
  closeBtn: {
    padding: 6,
    borderRadius: Radii.sm,
    backgroundColor: '#F1F5F9'
  },
  destHeader: {
    marginBottom: 12
  },
  destTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A'
  },
  destSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: Radii.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12
  },
  metricItem: {
    flex: 1,
    alignItems: 'center'
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2
  },
  metricLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600'
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A'
  },
  metricDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E2E8F0'
  },
  verticalTransitionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10
  },
  facilityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  facilityPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155'
  },
  stairPill: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA'
  },
  stepsToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginBottom: 6
  },
  stepsToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB'
  },
  stepsToggleArrow: {
    fontSize: 10,
    color: '#2563EB'
  },
  stepsListContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: Radii.md,
    padding: 10,
    gap: 8,
    marginBottom: 12,
    maxHeight: 220
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8
  },
  stepNumberBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800'
  },
  stepTextCol: {
    flex: 1
  },
  stepInstruction: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '500',
    lineHeight: 16
  },
  stepMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2
  },
  stepDistance: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600'
  },
  stepTransitionBadge: {
    fontSize: 9,
    color: '#2563EB',
    fontWeight: '700',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%'
  },
  startNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563EB',
    borderRadius: Radii.md,
    paddingVertical: 14,
    ...Shadows.sm
  },
  startNavText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  walkRouteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    borderRadius: Radii.md,
    paddingVertical: 14,
    ...Shadows.sm
  },
  walkRouteText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  formulaBox: {
    backgroundColor: '#F1F5F9',
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 10,
    marginTop: 10,
    marginBottom: 4
  },
  formulaHeader: {
    marginBottom: 6
  },
  formulaTitle: {
    fontSize: 9,
    fontWeight: '900',
    color: '#475569',
    letterSpacing: 0.8
  },
  formulaEquation: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 1
  },
  formulaGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    marginVertical: 4
  },
  formulaGridItem: {
    alignItems: 'center',
    flex: 1
  },
  formulaValue: {
    fontSize: 12,
    fontWeight: '900',
    color: '#1E293B'
  },
  formulaLabel: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 2
  },
  totalCostRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingHorizontal: 2
  },
  totalCostLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155'
  },
  totalCostValue: {
    fontSize: 12,
    fontWeight: '900',
    color: '#2563EB'
  }
});
