import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { useBlockageStore } from '../store/blockageStore';
import { useNavigationStore } from '../store/navigationStore';
import { localRouter } from '../services/localRouter';
import { Colors, Shadows, Radii, Spacing, Typography } from '../theme/tokens';

interface BlockageModalProps {
  visible: boolean;
  onClose: () => void;
}

export const BlockageModal: React.FC<BlockageModalProps> = ({ visible, onClose }) => {
  const { statuses, toggleBlockage, resetAll, isBlocked } = useBlockageStore();
  const { setProfile, setDestinationNode, calculateRoute, startNavigation } = useNavigationStore();

  const facilities = [
    { id: 'lift_1', name: 'Lift 1 (Platform 7/8)', desc: 'Serves Platform 7/8 to FOB 2' },
    { id: 'lift_2', name: 'Lift 2 (Terminal 1 Concourse)', desc: 'Serves Concourse to Subway' },
    { id: 'lift_3', name: 'Lift 3 (Platform 1 East)', desc: 'Serves PF 1 to FOB 2' },
    { id: 'ramp_1', name: 'Ramp 1 (Platform 7/8)', desc: 'Accessible Ramp to FOB 2' },
    { id: 'ramp_2', name: 'Ramp 2 (Platform 4/5)', desc: 'Accessible Ramp to FOB 2' }
  ];

  // Quick Hackathon Demo Scenario Launchers
  const runScenario = async (scenarioNumber: number) => {
    await resetAll();
    const p8Node = localRouter.nodeDict.get('node_pf8_center')!;
    const p5Node = localRouter.nodeDict.get('node_pf5_center')!;

    switch (scenarioNumber) {
      case 1:
        // Scenario 1: First-Time Traveller to Platform 8
        setProfile('first_time');
        setDestinationNode(p8Node);
        break;
      case 2:
        // Scenario 2: Wheelchair user to Platform 8
        setProfile('mobility_disabled');
        setDestinationNode(p8Node);
        break;
      case 3:
        // Scenario 3: Elderly person to Platform 5
        setProfile('elderly');
        setDestinationNode(p5Node);
        break;
      case 4:
        // Scenario 4: Visually Impaired to Platform 8
        setProfile('visually_impaired');
        setDestinationNode(p8Node);
        break;
      case 5:
        // Scenario 5: Dynamic Blockage Simulation
        setProfile('mobility_disabled');
        setDestinationNode(p8Node);
        const route = await calculateRoute();
        if (route) {
          startNavigation(route);
          // Trigger blockage after 1.5s delay to demonstrate dynamic reroute
          setTimeout(() => {
            toggleBlockage('lift_1');
          }, 1500);
        }
        break;
    }

    if (scenarioNumber !== 5) {
      const r = await calculateRoute();
      if (r) startNavigation(r);
    }

    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          {/* Bottom Sheet Handle */}
          <View style={styles.handleRow}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.badge}>STATION CONDITIONS & SCENARIOS</Text>
              <Text style={styles.title}>Incident Simulation</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <TouchableOpacity onPress={onClose} style={styles.backBtn} activeOpacity={0.8}>
                <Text style={styles.backBtnText}>← Back</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.8}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* 1-Tap Demo Scenarios */}
            <Text style={styles.sectionTitle}>Quick Test Scenarios</Text>
            <View style={styles.scenarioGrid}>
              <TouchableOpacity
                style={styles.scenarioBtn}
                onPress={() => runScenario(1)}
                activeOpacity={0.8}
              >
                <Text style={styles.scenarioIcon}>🧭</Text>
                <Text style={styles.scenarioTitle}>1. First-Time</Text>
                <Text style={styles.scenarioSub}>PF 8 with landmarks</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.scenarioBtn}
                onPress={() => runScenario(2)}
                activeOpacity={0.8}
              >
                <Text style={styles.scenarioIcon}>♿</Text>
                <Text style={styles.scenarioTitle}>2. Wheelchair</Text>
                <Text style={styles.scenarioSub}>PF 8 step-free route</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.scenarioBtn}
                onPress={() => runScenario(3)}
                activeOpacity={0.8}
              >
                <Text style={styles.scenarioIcon}>👴</Text>
                <Text style={styles.scenarioTitle}>3. Elderly</Text>
                <Text style={styles.scenarioSub}>PF 5 avoids stairs</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.scenarioBtn}
                onPress={() => runScenario(4)}
                activeOpacity={0.8}
              >
                <Text style={styles.scenarioIcon}>👁️</Text>
                <Text style={styles.scenarioTitle}>4. Visually Impaired</Text>
                <Text style={styles.scenarioSub}>Audio & tactile guidance</Text>
              </TouchableOpacity>
            </View>

            {/* Critical Scenario 5: Dynamic Rerouting */}
            <TouchableOpacity
              style={styles.rerouteHeroBtn}
              onPress={() => runScenario(5)}
              activeOpacity={0.8}
            >
              <Text style={styles.rerouteHeroIcon}>⚡</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.rerouteHeroTitle}>5. Dynamic Blockage & Reroute</Text>
                <Text style={styles.rerouteHeroSub}>
                  Starts wheelchair navigation to PF 8, then blocks Lift 1 after 1.5s to trigger automatic reroute.
                </Text>
              </View>
            </TouchableOpacity>

            {/* Interactive Facility Condition Toggles */}
            <Text style={styles.sectionTitle}>Current Station Facility Status</Text>
            <Text style={styles.sectionSub}>Tap any facility below to toggle real-time blockage:</Text>

            {facilities.map((fac) => {
              const blocked = isBlocked(fac.id);
              return (
                <TouchableOpacity
                  key={fac.id}
                  style={[styles.facilityRow, blocked && styles.facilityRowBlocked]}
                  onPress={() => toggleBlockage(fac.id)}
                  activeOpacity={0.75}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.facilityName}>{fac.name}</Text>
                    <Text style={styles.facilityDesc}>{fac.desc}</Text>
                  </View>
                  <View style={[styles.statusBadge, blocked ? styles.statusBlocked : styles.statusOpen]}>
                    <Text style={[styles.statusBadgeText, blocked && styles.statusBlockedText]}>
                      {blocked ? '🚧 BLOCKED' : '✓ OPEN'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Reset All Button */}
            <TouchableOpacity
              style={styles.resetBtn}
              onPress={async () => {
                await resetAll();
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.resetBtnText}>↺ Reset All Blockages to Open</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end'
  },
  modalCard: {
    backgroundColor: Colors.bgPrimary,
    borderTopLeftRadius: Radii.hero,
    borderTopRightRadius: Radii.hero,
    padding: Spacing.lg,
    paddingTop: 10,
    maxHeight: '85%',
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md
  },
  badge: {
    color: Colors.goldDark,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    marginTop: 2
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
  closeBtnText: {
    color: Colors.textTertiary,
    fontSize: 18,
    fontWeight: '700'
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs
  },
  sectionSub: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginBottom: Spacing.sm
  },
  scenarioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs + 2,
    marginBottom: Spacing.sm
  },
  scenarioBtn: {
    width: '48%',
    backgroundColor: Colors.bgSecondary,
    borderRadius: Radii.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm
  },
  scenarioIcon: {
    fontSize: 20,
    marginBottom: 4
  },
  scenarioTitle: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '600'
  },
  scenarioSub: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 2
  },
  rerouteHeroBtn: {
    backgroundColor: Colors.goldTintSolid,
    borderRadius: Radii.md,
    padding: Spacing.sm + 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.goldPrimary,
    ...Shadows.sm
  },
  rerouteHeroIcon: {
    fontSize: 24
  },
  rerouteHeroTitle: {
    color: Colors.charcoalPrimary,
    fontSize: 14,
    fontWeight: '700'
  },
  rerouteHeroSub: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15
  },
  facilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.bgSecondary,
    padding: Spacing.sm,
    borderRadius: Radii.md,
    marginBottom: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border
  },
  facilityRowBlocked: {
    borderColor: Colors.error,
    backgroundColor: Colors.errorLight
  },
  facilityName: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '600'
  },
  facilityDesc: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 2
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.sm,
    borderWidth: 1
  },
  statusOpen: {
    backgroundColor: Colors.successLight,
    borderColor: Colors.success
  },
  statusBlocked: {
    backgroundColor: Colors.errorLight,
    borderColor: Colors.error
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.success
  },
  statusBlockedText: {
    color: Colors.error
  },
  resetBtn: {
    backgroundColor: Colors.bgSecondary,
    borderRadius: Radii.button,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border
  },
  resetBtnText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600'
  }
});
