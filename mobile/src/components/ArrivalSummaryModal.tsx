import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { ArrivalSummaryData } from '../services/liveNavigationService';
import { Colors, Shadows, Radii, Spacing, Typography } from '../theme/tokens';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ArrivalSummaryModalProps {
  summary: ArrivalSummaryData | null;
  visible: boolean;
  onClose: () => void;
}

export const ArrivalSummaryModal: React.FC<ArrivalSummaryModalProps> = ({
  summary,
  visible,
  onClose
}) => {
  if (!summary || !visible) return null;

  const minutes = Math.floor(summary.durationSeconds / 60);
  const seconds = summary.durationSeconds % 60;
  const durationLabel = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Header Badge */}
          <View style={styles.trophyBox}>
            <Text style={styles.trophyIcon}>🎉</Text>
          </View>

          <Text style={styles.title}>You Have Arrived!</Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            {summary.destinationName}
          </Text>

          <View style={styles.divider} />

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>👟 {summary.totalSteps}</Text>
              <Text style={styles.statLabel}>STEPS COUNTED</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statValue}>📏 {summary.distanceMeters}m</Text>
              <Text style={styles.statLabel}>TOTAL DISTANCE</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statValue}>⏱️ {durationLabel}</Text>
              <Text style={styles.statLabel}>JOURNEY TIME</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statValue}>⚡ {summary.averageSpeedMps} m/s</Text>
              <Text style={styles.statLabel}>WALKING SPEED</Text>
            </View>
          </View>

          {/* Accessibility Info Pill */}
          <View style={styles.profileBadge}>
            <Text style={styles.profileIcon}>♿</Text>
            <Text style={styles.profileText}>
              Accessibility Profile: <Text style={{ fontWeight: '700' }}>{summary.profileId.replace('_', ' ').toUpperCase()}</Text>
            </Text>
          </View>

          {/* Close / Done Button */}
          <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.85}>
            <Text style={styles.doneBtnText}>COMPLETE JOURNEY</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.lg,
    padding: 24,
    width: Math.min(SCREEN_WIDTH - 32, 420),
    alignItems: 'center',
    ...Shadows.floating
  },
  trophyBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ECFDF5',
    borderWidth: 2,
    borderColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14
  },
  trophyIcon: {
    fontSize: 32
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    width: '100%',
    marginBottom: 16
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16
  },
  statBox: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: Radii.md,
    padding: 12,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5
  },
  profileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE'
  },
  profileIcon: {
    fontSize: 14,
    marginRight: 6
  },
  profileText: {
    fontSize: 12,
    color: '#1E40AF'
  },
  doneBtn: {
    backgroundColor: Colors.forestPrimary,
    width: '100%',
    paddingVertical: 14,
    borderRadius: Radii.md,
    alignItems: 'center',
    ...Shadows.sm
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5
  }
});
