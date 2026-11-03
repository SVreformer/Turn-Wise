import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { useNavigationStore } from '../store/navigationStore';
import { localRouter } from '../services/localRouter';
import { Colors, Shadows, Radii, Spacing, Typography } from '../theme/tokens';

interface PlatformDetailScreenProps {
  platform: any;
  onBack: () => void;
  onStartNavigate: () => void;
  onAskAssistant: () => void;
}

export const PlatformDetailScreen: React.FC<PlatformDetailScreenProps> = ({
  platform,
  onBack,
  onStartNavigate,
  onAskAssistant
}) => {
  const { setDestinationNode, calculateRoute } = useNavigationStore();

  const handleNavigate = async () => {
    const rawNode = localRouter.nodeDict.get(`node_pf${platform.number}_center`) || localRouter.nodeDict.get(`node_pf${platform.number}_main`);
    if (rawNode) {
      const destNode = {
        ...rawNode,
        name: `Platform ${platform.number} (${platform.name || 'Center'})`
      };
      const { startNode, setStartNode, setDestinationNode, calculateRoute } = useNavigationStore.getState();
      setDestinationNode(destNode, 'PLATFORM');
      if (!startNode) {
        const defaultStart = localRouter.nodeDict.get('node_entry_t1_main_east');
        if (defaultStart) setStartNode(defaultStart, 'SEARCH');
      }
      await calculateRoute();
      onStartNavigate();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Platform {platform.number}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Main Badge Card */}
        <View style={styles.heroCard}>
          <View style={styles.badgeCircle}>
            <Text style={styles.badgeNumber}>{platform.number}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.platformTitle}>{platform.name}</Text>
            <Text style={styles.platformSub}>{platform.description}</Text>
          </View>
        </View>

        {/* Accessibility Status Card */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Accessibility Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Wheelchair Accessible:</Text>
            <Text style={[styles.infoVal, { color: Colors.success }]}>
              {platform.accessibility?.wheelchairAccessible ? '✓ Yes (Step-free)' : '✗ Limited'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tactile Paving:</Text>
            <Text style={styles.infoVal}>✓ Installed along platform edge</Text>
          </View>
          <Text style={styles.accessNotes}>{platform.accessibility?.notes}</Text>
        </View>

        {/* Nearby Facilities Matrix */}
        <Text style={styles.groupTitle}>Nearby Connected Facilities</Text>

        <View style={styles.facilityItem}>
          <Text style={styles.facilityIcon}>🛗</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.facilityName}>Nearest Lift</Text>
            <Text style={styles.facilityDetail}>
              {platform.nearestLifts?.join(', ') || 'Connected via FOB 2'}
            </Text>
          </View>
        </View>

        <View style={styles.facilityItem}>
          <Text style={styles.facilityIcon}>♿</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.facilityName}>Nearest Ramp</Text>
            <Text style={styles.facilityDetail}>
              {platform.nearestRamps?.join(', ') || '1:12 Ramp to FOB 2'}
            </Text>
          </View>
        </View>

        <View style={styles.facilityItem}>
          <Text style={styles.facilityIcon}>🚻</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.facilityName}>Nearest Restroom</Text>
            <Text style={styles.facilityDetail}>
              {platform.nearestToilets?.join(', ') || 'On-platform Restroom'}
            </Text>
          </View>
        </View>

        <View style={styles.facilityItem}>
          <Text style={styles.facilityIcon}>🌉</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.facilityName}>Footover Bridges</Text>
            <Text style={styles.facilityDetail}>
              FOB 1 (Mysuru End) & FOB 2 (Okkalpuram End - Lifts/Ramps)
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.btnRow}>
          <View style={{ flexDirection: 'row', gap: Spacing.xs, width: '100%', marginBottom: Spacing.xs }}>
            <TouchableOpacity
              style={[styles.auxBtn, { flex: 1 }]}
              onPress={async () => {
                const rawNode = localRouter.nodeDict.get(`node_pf${platform.number}_center`) || localRouter.nodeDict.get(`node_pf${platform.number}_main`);
                if (rawNode) {
                  const node = {
                    ...rawNode,
                    name: `Platform ${platform.number} (${platform.name || 'Center'})`
                  };
                  const { destinationNode, setStartNode, calculateRoute } = useNavigationStore.getState();
                  setStartNode(node, 'PLATFORM');
                  if (destinationNode) {
                    await calculateRoute();
                  }
                  onBack();
                }
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.auxBtnText}>📍 Set as Start</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.auxBtn, { flex: 1 }]}
              onPress={async () => {
                const rawNode = localRouter.nodeDict.get(`node_pf${platform.number}_center`) || localRouter.nodeDict.get(`node_pf${platform.number}_main`);
                if (rawNode) {
                  const node = {
                    ...rawNode,
                    name: `Platform ${platform.number} (${platform.name || 'Center'})`
                  };
                  const { startNode, setStartNode, setDestinationNode, calculateRoute } = useNavigationStore.getState();
                  setDestinationNode(node, 'PLATFORM');
                  if (!startNode) {
                    const defaultStart = localRouter.nodeDict.get('node_entry_t1_main_east');
                    if (defaultStart) setStartNode(defaultStart, 'SEARCH');
                  }
                  await calculateRoute();
                  onBack();
                }
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.auxBtnText}>🎯 Set as Dest</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.navigateBtn}
            onPress={handleNavigate}
            activeOpacity={0.85}
          >
            <Text style={styles.navigateBtnText}>START NAVIGATION</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.assistantBtn}
            onPress={onAskAssistant}
            activeOpacity={0.8}
          >
            <Text style={styles.assistantBtnText}>💬 Ask AI about Platform {platform.number}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
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
    fontSize: 13,
    fontWeight: '600'
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700'
  },
  content: {
    padding: Spacing.md,
    gap: Spacing.sm
  },
  heroCard: {
    backgroundColor: Colors.bgPrimary,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm
  },
  badgeCircle: {
    width: 50,
    height: 50,
    borderRadius: Radii.pill,
    backgroundColor: Colors.goldTintSolid,
    borderWidth: 1.5,
    borderColor: Colors.goldPrimary,
    justifyContent: 'center',
    alignItems: 'center'
  },
  badgeNumber: {
    color: Colors.goldDark,
    fontSize: 22,
    fontWeight: '800'
  },
  platformTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700'
  },
  platformSub: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2
  },
  sectionCard: {
    backgroundColor: Colors.bgPrimary,
    borderRadius: Radii.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm
  },
  sectionHeader: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: Spacing.xs
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4
  },
  infoLabel: {
    color: Colors.textSecondary,
    fontSize: 12
  },
  infoVal: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '600'
  },
  accessNotes: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 6,
    fontStyle: 'italic'
  },
  groupTitle: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 4
  },
  facilityItem: {
    backgroundColor: Colors.bgPrimary,
    borderRadius: Radii.md,
    padding: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border
  },
  facilityIcon: {
    fontSize: 20
  },
  facilityName: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '600'
  },
  facilityDetail: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 1
  },
  btnRow: {
    marginTop: Spacing.xs,
    gap: Spacing.xs
  },
  auxBtn: {
    backgroundColor: Colors.bgPrimary,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.button,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border
  },
  auxBtnText: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '600'
  },
  navigateBtn: {
    backgroundColor: Colors.goldPrimary,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radii.button,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.floating
  },
  navigateBtnText: {
    color: Colors.charcoalPrimary,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.6
  },
  assistantBtn: {
    backgroundColor: Colors.bgPrimary,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.button,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border
  },
  assistantBtnText: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '600'
  }
});
