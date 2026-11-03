import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radii, Spacing } from '../../../theme/tokens';

interface CrowdDensityBadgeProps {
  status: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' | 'UNAVAILABLE';
  density?: number;
}

export const CrowdDensityBadge: React.FC<CrowdDensityBadgeProps> = ({ status, density }) => {
  const getBadgeStyle = () => {
    switch (status) {
      case 'LOW':
        return {
          bg: '#ECFDF5',
          border: '#A7F3D0',
          textColor: '#065F46',
          label: 'Low Crowd Density',
          sub: density ? `${density.toFixed(1)} pax/m²` : 'Smooth flow'
        };
      case 'MODERATE':
        return {
          bg: '#FFFBEB',
          border: '#FDE68A',
          textColor: '#92400E',
          label: 'Moderate Crowd',
          sub: density ? `${density.toFixed(1)} pax/m²` : 'Steady movement'
        };
      case 'HIGH':
        return {
          bg: '#FEF2F2',
          border: '#FECACA',
          textColor: '#991B1B',
          label: 'High Congestion',
          sub: density ? `${density.toFixed(1)} pax/m²` : 'Choke point alert'
        };
      case 'CRITICAL':
        return {
          bg: '#450A0A',
          border: '#DC2626',
          textColor: '#FFFFFF',
          label: 'Severe Choke Point',
          sub: 'Alternative route recommended'
        };
      case 'UNAVAILABLE':
      default:
        return {
          bg: '#F8FAFC',
          border: '#E2E8F0',
          textColor: '#64748B',
          label: 'Crowd Data Unavailable',
          sub: 'Shortest path active'
        };
    }
  };

  const badge = getBadgeStyle();

  return (
    <View style={[styles.badge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
      <View style={styles.dot} />
      <View style={styles.textColumn}>
        <Text style={[styles.label, { color: badge.textColor }]}>{badge.label}</Text>
        <Text style={styles.subText}>{badge.sub}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radii.pill,
    borderWidth: 1,
    gap: 6
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.forestEmerald
  },
  textColumn: {
    flexDirection: 'column'
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2
  },
  subText: {
    fontSize: 9,
    color: '#64748B'
  }
});
