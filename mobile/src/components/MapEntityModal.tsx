import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { StationNode } from '../services/localRouter';
import { useBlockageStore } from '../store/blockageStore';
import { Colors, Shadows, Radii, Spacing, Typography } from '../theme/tokens';

export interface TappedEntity {
  type: 'PLATFORM' | 'FACILITY' | 'NODE';
  id: string;
  name: string;
  details?: string;
  status?: string;
  level?: number;
  wheelchairAccessible?: boolean;
  node: StationNode;
}

interface MapEntityModalProps {
  entity: TappedEntity | null;
  onClose: () => void;
  onSetAsStart: (node: StationNode) => void;
  onSetAsDestination: (node: StationNode) => void;
  onNavigateHere: (node: StationNode) => void;
}

export const MapEntityModal: React.FC<MapEntityModalProps> = ({
  entity,
  onClose,
  onSetAsStart,
  onSetAsDestination,
  onNavigateHere
}) => {
  const statuses = useBlockageStore((state) => state.statuses);

  if (!entity) return null;

  const currentStatus = (entity.id && statuses[entity.id]) || entity.status || 'OPEN';
  const isBlocked = currentStatus === 'BLOCKED';
  const isCaution = currentStatus === 'LIMITED';

  const statusColor = isBlocked ? Colors.error : (isCaution ? Colors.warning : Colors.success);
  const statusLabel = isBlocked ? '● BLOCKED / MAINTENANCE' : (isCaution ? '● LIMITED ACCESS' : '● OPERATIONAL');

  return (
    <Modal visible={!!entity} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheetContainer}>
          {/* Bottom Sheet Handle */}
          <View style={styles.handleRow}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.titleGroup}>
              <Text style={styles.entityTypeLabel}>
                {entity.type === 'PLATFORM' ? 'STATION PLATFORM' : (entity.type === 'FACILITY' ? 'STATION FACILITY' : 'NAVIGATION ANCHOR')}
              </Text>
              <Text style={styles.entityName}>{entity.name}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <TouchableOpacity onPress={onClose} style={styles.backBtn} activeOpacity={0.8}>
                <Text style={styles.backBtnText}>← Back</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.8}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Status & Accessibility Tags */}
          <View style={styles.tagsRow}>
            <View style={[styles.statusPill, { borderColor: statusColor, backgroundColor: `${statusColor}15` }]}>
              <Text style={[styles.statusPillText, { color: statusColor }]}>{statusLabel}</Text>
            </View>

            <View style={styles.levelPill}>
              <Text style={styles.levelPillText}>
                {entity.level === -1 ? 'Level -1 (Subway)' : (entity.level === 1 ? 'Level 1 (FOB)' : 'Level 0 (Platform)')}
              </Text>
            </View>

            {entity.wheelchairAccessible && (
              <View style={styles.accessiblePill}>
                <Text style={styles.accessiblePillText}>♿ Accessible</Text>
              </View>
            )}
          </View>

          {entity.details && (
            <Text style={styles.detailsText}>{entity.details}</Text>
          )}

          {isBlocked && (
            <View style={styles.blockedAlertBox}>
              <Text style={styles.blockedAlertTitle}>⚠ Incident Alert Active</Text>
              <Text style={styles.blockedAlertDesc}>This location is currently blocked for maintenance. Routing will automatically seek alternate paths.</Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.setStartBtn}
              onPress={() => {
                onSetAsStart(entity.node);
                onClose();
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.setStartBtnText}>📍 Set as Start</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.setDestBtn}
              onPress={() => {
                onSetAsDestination(entity.node);
                onClose();
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.setDestBtnText}>🎯 Set as Destination</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.navigateNowBtn}
            onPress={() => {
              onNavigateHere(entity.node);
              onClose();
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.navigateNowText}>START NAVIGATION</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end'
  },
  sheetContainer: {
    backgroundColor: Colors.bgPrimary,
    borderTopLeftRadius: Radii.hero,
    borderTopRightRadius: Radii.hero,
    padding: Spacing.lg,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    ...Shadows.floating
  },
  handleRow: {
    alignItems: 'center',
    paddingBottom: 10
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1'
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm
  },
  titleGroup: {
    flex: 1
  },
  entityTypeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 2
  },
  entityName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary
  },
  backBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: Colors.bgSecondary,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.border
  },
  backBtnText: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '600'
  },
  closeBtn: {
    padding: 6
  },
  closeText: {
    fontSize: 18,
    color: Colors.textTertiary,
    fontWeight: '700'
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.sm
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.sm,
    borderWidth: 1
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700'
  },
  levelPill: {
    backgroundColor: Colors.bgSecondary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.border
  },
  levelPillText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600'
  },
  accessiblePill: {
    backgroundColor: Colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.success
  },
  accessiblePillText: {
    color: Colors.success,
    fontSize: 11,
    fontWeight: '700'
  },
  detailsText: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: Spacing.md
  },
  blockedAlertBox: {
    backgroundColor: Colors.errorLight,
    borderRadius: Radii.md,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.error
  },
  blockedAlertTitle: {
    color: Colors.error,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2
  },
  blockedAlertDesc: {
    color: Colors.textPrimary,
    fontSize: 11
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm
  },
  setStartBtn: {
    flex: 1,
    backgroundColor: Colors.bgSecondary,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.button,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border
  },
  setStartBtnText: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '600'
  },
  setDestBtn: {
    flex: 1,
    backgroundColor: Colors.bgSecondary,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.button,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border
  },
  setDestBtnText: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '600'
  },
  navigateNowBtn: {
    backgroundColor: Colors.goldPrimary,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radii.button,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.floating
  },
  navigateNowText: {
    color: Colors.charcoalPrimary,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.6
  }
});
