import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  SafeAreaView,
  Alert
} from 'react-native';
import { useNavigationStore } from '../store/navigationStore';
import checkpointsData from '../data/simulation/checkpoints.json';
import { localRouter } from '../services/localRouter';
import { voiceService } from '../services/voiceService';
import { Colors, Shadows, Radii, Spacing, Typography } from '../theme/tokens';

interface QrScanScreenProps {
  onBack: () => void;
  onLocationUpdated: () => void;
}

export const QrScanScreen: React.FC<QrScanScreenProps> = ({
  onBack,
  onLocationUpdated
}) => {
  const { setStartNode, calculateRoute, isNavigating, voiceEnabled, anchorViaQr } = useNavigationStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelectCheckpoint = async (cp: any) => {
    setSelectedId(cp.id);
    const node = localRouter.nodeDict.get(cp.nodeId);
    if (node) {
      if (isNavigating) {
        anchorViaQr(cp.nodeId, cp.name);
      } else {
        setStartNode(node, 'QR');
        if (voiceEnabled) {
          voiceService.speak(`Indoor location updated to ${cp.name}.`);
        }
      }
      Alert.alert(
        "✓ Checkpoint Verified",
        `Your position is anchored to:\n${cp.name}\nFloor: ${cp.level === -1 ? 'Level -1 (Subway)' : (cp.level === 1 ? 'Level 1 (FOB)' : 'Level 0 (Platform)')}`,
        [{ text: "Continue Navigation", onPress: onLocationUpdated }]
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SCAN CHECKPOINT</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>INDOOR POSITIONING CHECKPOINTS</Text>
        <Text style={styles.bannerSub}>
          GPS is unreliable inside covered railway platforms. Scan a Turn Wise QR checkpoint or tap any pillar checkpoint below to update your location.
        </Text>
      </View>

      <FlatList
        data={checkpointsData}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }: { item: any }) => {
          const isSelected = selectedId === item.id;
          return (
            <TouchableOpacity
              style={[styles.checkpointCard, isSelected && styles.checkpointCardActive]}
              onPress={() => handleSelectCheckpoint(item)}
              activeOpacity={0.75}
            >
              <View style={styles.qrIconBox}>
                <Text style={styles.qrIcon}>📷</Text>
                <Text style={styles.qrCodeText}>{item.id}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cpName}>{item.name}</Text>
                <Text style={styles.cpDesc}>{item.description}</Text>
                <Text style={styles.cpLevel}>
                  Floor: {item.level === -1 ? 'Level -1 (Subway)' : (item.level === 1 ? 'Level 1 (FOB)' : 'Level 0 (Platform)')}
                </Text>
              </View>
              <View style={styles.scanBtn}>
                <Text style={styles.scanBtnText}>Verify</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bgSecondary
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    backgroundColor: Colors.bgPrimary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border
  },
  backBtn: {
    paddingVertical: 4
  },
  backBtnText: {
    color: Colors.textPrimary,
    fontWeight: '600',
    fontSize: 13
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8
  },
  banner: {
    backgroundColor: Colors.bgPrimary,
    padding: Spacing.md,
    marginHorizontal: Spacing.sm,
    marginTop: Spacing.sm,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 4,
    borderLeftColor: Colors.goldPrimary,
    ...Shadows.sm
  },
  bannerTitle: {
    color: Colors.goldDark,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8
  },
  bannerSub: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
    lineHeight: 17
  },
  list: {
    padding: Spacing.sm,
    gap: Spacing.xs + 2
  },
  checkpointCard: {
    backgroundColor: Colors.bgPrimary,
    borderRadius: Radii.md,
    padding: Spacing.sm + 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm
  },
  checkpointCardActive: {
    borderColor: Colors.goldPrimary,
    backgroundColor: Colors.goldTintSolid
  },
  qrIconBox: {
    width: 44,
    height: 44,
    borderRadius: Radii.sm,
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center'
  },
  qrIcon: {
    fontSize: 18
  },
  qrCodeText: {
    color: Colors.textTertiary,
    fontSize: 8,
    fontWeight: '700',
    marginTop: 1
  },
  cpName: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700'
  },
  cpDesc: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 1
  },
  cpLevel: {
    color: Colors.goldDark,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2
  },
  scanBtn: {
    backgroundColor: Colors.goldPrimary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 7,
    borderRadius: Radii.sm
  },
  scanBtnText: {
    color: Colors.charcoalPrimary,
    fontWeight: '700',
    fontSize: 12
  }
});
