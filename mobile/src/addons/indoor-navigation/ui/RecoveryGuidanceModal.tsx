import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Colors, Shadows, Radii, Spacing } from '../../../theme/tokens';
import { RecoveryActionPlan, StationQrCheckpoint } from '../types';

interface RecoveryGuidanceModalProps {
  plan: RecoveryActionPlan;
  onSelectCheckpoint: (checkpoint: StationQrCheckpoint) => void;
  onOpenQrScanner: () => void;
  onNavigateToHelpDesk: () => void;
  onClose: () => void;
}

export const RecoveryGuidanceModal: React.FC<RecoveryGuidanceModalProps> = ({
  plan,
  onSelectCheckpoint,
  onOpenQrScanner,
  onNavigateToHelpDesk,
  onClose
}) => {
  return (
    <View style={styles.overlay}>
      <View style={styles.modalCard}>
        <View style={styles.header}>
          <View style={styles.warningIconBox}>
            <Text style={styles.warningIcon}>⚠️</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>LOCATION SIGNAL UNCERTAIN</Text>
            <Text style={styles.headerSub}>Indoor self-healing recovery mode active</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.guidanceBox}>
          <Text style={styles.guidanceTitle}>HOW TO RE-ANCHOR YOUR POSITION:</Text>
          <Text style={styles.guidanceDesc}>{plan.recoveryGuidanceText.en}</Text>
          <Text style={styles.guidanceDescKn}>{plan.recoveryGuidanceText.kn}</Text>
        </View>

        <Text style={styles.sectionTitle}>NEAREST PILLAR QR CHECKPOINTS</Text>

        <ScrollView style={styles.checkpointsList} showsVerticalScrollIndicator={false}>
          {plan.nearestCheckpoints.map(({ checkpoint, walkingDistanceMeters, visualDirection }) => (
            <TouchableOpacity
              key={checkpoint.checkpointId}
              style={styles.checkpointCard}
              onPress={() => onSelectCheckpoint(checkpoint)}
              activeOpacity={0.75}
            >
              <View style={styles.qrBadge}>
                <Text style={styles.qrIcon}>📷</Text>
                <Text style={styles.distBadge}>{walkingDistanceMeters}m</Text>
              </View>
              <View style={styles.cpDetails}>
                <Text style={styles.cpName}>{checkpoint.name}</Text>
                <Text style={styles.cpLandmark}>{checkpoint.visualLandmark}</Text>
                <Text style={styles.cpDirection}>Direction: {visualDirection}</Text>
              </View>
              <View style={styles.verifyBtn}>
                <Text style={styles.verifyBtnText}>Anchor</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.scanCameraBtn}
            onPress={onOpenQrScanner}
            activeOpacity={0.8}
          >
            <Text style={styles.scanCameraIcon}>📷</Text>
            <Text style={styles.scanCameraText}>Open QR Scanner</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.helpDeskBtn}
            onPress={onNavigateToHelpDesk}
            activeOpacity={0.8}
          >
            <Text style={styles.helpDeskIcon}>ℹ️</Text>
            <Text style={styles.helpDeskText}>Route to Help Desk</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    padding: Spacing.md,
    borderRadius: Radii.lg,
    marginVertical: Spacing.sm
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.lg,
    padding: Spacing.md,
    ...Shadows.card
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: Spacing.sm
  },
  warningIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center'
  },
  warningIcon: {
    fontSize: 18
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.crimsonPrimary,
    letterSpacing: 0.3
  },
  headerSub: {
    fontSize: 11,
    color: '#64748B'
  },
  closeBtn: {
    padding: 6,
    borderRadius: Radii.pill,
    backgroundColor: '#F1F5F9'
  },
  closeText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '700'
  },
  guidanceBox: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: Radii.md,
    padding: Spacing.sm,
    marginBottom: Spacing.sm
  },
  guidanceTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#92400E',
    marginBottom: 2
  },
  guidanceDesc: {
    fontSize: 11,
    color: '#78350F',
    lineHeight: 16
  },
  guidanceDescKn: {
    fontSize: 10,
    color: '#92400E',
    marginTop: 4,
    lineHeight: 15
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 6
  },
  checkpointsList: {
    maxHeight: 190
  },
  checkpointCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: Radii.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 6,
    gap: 8
  },
  qrBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF3C7',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: Radii.sm
  },
  qrIcon: {
    fontSize: 14
  },
  distBadge: {
    fontSize: 9,
    fontWeight: '700',
    color: '#92400E'
  },
  cpDetails: {
    flex: 1
  },
  cpName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E293B'
  },
  cpLandmark: {
    fontSize: 10,
    color: '#64748B'
  },
  cpDirection: {
    fontSize: 9,
    color: '#0284C7',
    fontWeight: '600'
  },
  verifyBtn: {
    backgroundColor: Colors.forestPrimary,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: Radii.sm
  },
  verifyBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: Spacing.sm
  },
  scanCameraBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.forestPrimary,
    paddingVertical: 9,
    borderRadius: Radii.md,
    gap: 6
  },
  scanCameraIcon: {
    fontSize: 14
  },
  scanCameraText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700'
  },
  helpDeskBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 9,
    borderRadius: Radii.md,
    gap: 6
  },
  helpDeskIcon: {
    fontSize: 14
  },
  helpDeskText: {
    color: '#334155',
    fontSize: 11,
    fontWeight: '700'
  }
});
