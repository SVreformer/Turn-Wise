import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  SafeAreaView
} from 'react-native';
import { useNavigationStore } from '../store/navigationStore';
import { localRouter, StationNode } from '../services/localRouter';
import { apiService } from '../services/apiService';
import { voiceService } from '../services/voiceService';
import { Colors, Shadows, Radii, Spacing, Typography } from '../theme/tokens';
import checkpointsData from '../data/simulation/checkpoints.json';

interface RescueModeModalProps {
  visible: boolean;
  onClose: () => void;
  onStartRescueNavigation: (route: any) => void;
}

const STATION_CLUES = [
  { id: 'node_entry_t1_main_east', label: 'Main Entrance & Ticket Counter (T1)', floor: 'Level 0' },
  { id: 'node_subway_pf7_8', label: 'Underground Subway Tunnel (Near PF 7/8)', floor: 'Level -1' },
  { id: 'node_fob2_pf1', label: 'Footover Bridge 2 (FOB 2 Stairs)', floor: 'Level 1' },
  { id: 'node_pf1_center', label: 'Platform 1 Center Waiting Hall', floor: 'Level 0' },
  { id: 'node_pf8_center', label: 'Platform 8 North Concourse', floor: 'Level 0' }
];

export const RescueModeModal: React.FC<RescueModeModalProps> = ({
  visible,
  onClose,
  onStartRescueNavigation
}) => {
  const { setStartNode, language, voiceEnabled } = useNavigationStore();
  const [selectedClueNodeId, setSelectedClueNodeId] = useState<string>('node_subway_pf7_8');
  const [targetType, setTargetType] = useState<'HELP_DESK' | 'EXIT' | 'TOILET' | 'PLATFORM'>('HELP_DESK');
  const [rescueResult, setRescueResult] = useState<any>(null);
  const [sosActive, setSosActive] = useState<boolean>(false);

  const handleExecuteRescue = async (type: 'HELP_DESK' | 'EXIT' | 'TOILET' | 'PLATFORM') => {
    setTargetType(type);
    const startNode = localRouter.nodeDict.get(selectedClueNodeId) || localRouter.nodes[0];
    setStartNode(startNode, 'QR');

    const res = await apiService.getRescueRoute(startNode.id, type, 'first_time');
    if (res && res.route) {
      setRescueResult(res);

      if (voiceEnabled) {
        const spoken = language === 'kn'
          ? (res.rescueMessage.kn || res.route.steps[0]?.voiceTextKn)
          : (language === 'hi'
            ? (res.rescueMessage.hi || res.route.steps[0]?.voiceTextHi)
            : (res.rescueMessage.en || res.route.steps[0]?.voiceText));
        voiceService.speak(spoken, { language });
      }
    }
  };

  const handleStartPath = () => {
    if (rescueResult && rescueResult.route) {
      onStartRescueNavigation(rescueResult.route);
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <SafeAreaView style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          {/* Emergency Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.emergencyBadge}>
                <Text style={styles.emergencyBadgeText}>EMERGENCY RESCUE</Text>
              </View>
              <Text style={styles.title}>
                {language === 'kn' ? '🚨 ನಾನು ದಾರಿ ತಪ್ಪಿದ್ದೇನೆ (ಸಹಾಯ)' : (language === 'hi' ? '🚨 मैं भटक गया हूँ (सहायता)' : "🚨 I'M LOST - RESCUE ME")}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.8}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Step 1: Where are you? (Clue / QR point) */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {language === 'kn' ? 'ಹಂತ 1: ನೀವು ಈಗ ಎಲ್ಲಿದ್ದೀರಿ? (ಹತ್ತಿರದ ಗುರುತು)' : (language === 'hi' ? 'चरण 1: आप अभी कहाँ हैं? (निकटतम पहचान)' : 'STEP 1: WHERE ARE YOU RIGHT NOW?')}
              </Text>
              <Text style={styles.sectionSubtitle}>
                Select what you see around you or tap a pillar checkpoint:
              </Text>

              <View style={styles.clueList}>
                {STATION_CLUES.map((clue) => {
                  const isSelected = selectedClueNodeId === clue.id;
                  return (
                    <TouchableOpacity
                      key={clue.id}
                      style={[styles.clueCard, isSelected && styles.clueCardSelected]}
                      onPress={() => {
                        setSelectedClueNodeId(clue.id);
                        setRescueResult(null);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.clueIcon}>{isSelected ? '📍' : '⚪'}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.clueLabel, isSelected && styles.clueLabelSelected]}>
                          {clue.label}
                        </Text>
                        <Text style={styles.clueFloor}>{clue.floor}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Step 2: Immediate Rescue Destinations */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {language === 'kn' ? 'ಹಂತ 2: ನೀವು ಎಲ್ಲಿಗೆ ಸುರಕ್ಷಿತವಾಗಿ ತಲುಪಬೇಕು?' : (language === 'hi' ? 'चरण 2: आप सुरक्षित कहाँ पहुँचना चाहते हैं?' : 'STEP 2: WHERE DO YOU WANT TO GO SAFELY?')}
              </Text>

              <View style={styles.rescueActionsGrid}>
                <TouchableOpacity
                  style={[styles.actionBtn, targetType === 'HELP_DESK' && styles.actionBtnActive]}
                  onPress={() => handleExecuteRescue('HELP_DESK')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.actionBtnIcon}>🆘</Text>
                  <Text style={styles.actionBtnTitle}>Help Desk</Text>
                  <Text style={styles.actionBtnSub}>Station Master & Staff</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, targetType === 'EXIT' && styles.actionBtnActive]}
                  onPress={() => handleExecuteRescue('EXIT')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.actionBtnIcon}>🚪</Text>
                  <Text style={styles.actionBtnTitle}>Main Exit</Text>
                  <Text style={styles.actionBtnSub}>Terminal 1 Street Gate</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, targetType === 'TOILET' && styles.actionBtnActive]}
                  onPress={() => handleExecuteRescue('TOILET')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.actionBtnIcon}>🚻</Text>
                  <Text style={styles.actionBtnTitle}>Restroom</Text>
                  <Text style={styles.actionBtnSub}>Nearest Accessible Toilet</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, targetType === 'PLATFORM' && styles.actionBtnActive]}
                  onPress={() => handleExecuteRescue('PLATFORM')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.actionBtnIcon}>🚉</Text>
                  <Text style={styles.actionBtnTitle}>Platform 1</Text>
                  <Text style={styles.actionBtnSub}>Main Concourse</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Step 3: Generated Rescue Instructions */}
            {rescueResult && rescueResult.route && (
              <View style={styles.resultContainer}>
                <View style={styles.resultHeader}>
                  <Text style={styles.resultBadge}>SAFE RESCUE ROUTE READY</Text>
                  <Text style={styles.resultTarget}>{rescueResult.targetName}</Text>
                  <Text style={styles.resultMetrics}>
                    {rescueResult.route.totalDistanceMeters}m • ~{rescueResult.route.estimatedTimeMinutes} min walk
                  </Text>
                </View>

                {/* Rescue message */}
                <View style={styles.messageBox}>
                  <Text style={styles.messageText}>
                    {language === 'kn'
                      ? rescueResult.rescueMessage?.kn
                      : (language === 'hi'
                        ? rescueResult.rescueMessage?.hi
                        : rescueResult.rescueMessage?.en)}
                  </Text>
                </View>

                {/* Simplified Steps */}
                <View style={styles.stepsList}>
                  {rescueResult.route.steps.map((st: any, idx: number) => (
                    <View key={idx} style={styles.stepRow}>
                      <View style={styles.stepNumBubble}>
                        <Text style={styles.stepNumText}>{idx + 1}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.stepInst}>
                          {language === 'kn' ? (st.instructionKn || st.instruction) : (language === 'hi' ? (st.instructionHi || st.instruction) : st.instruction)}
                        </Text>
                        <Text style={styles.stepDist}>{Math.round(st.distance)} meters</Text>
                      </View>
                    </View>
                  ))}
                </View>

                <View style={styles.resultButtons}>
                  <TouchableOpacity
                    style={styles.navigateBtn}
                    onPress={handleStartPath}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.navigateBtnText}>▶ START RESCUE NAVIGATION</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.voiceBtn}
                    onPress={() => {
                      const spoken = language === 'kn'
                        ? rescueResult.rescueMessage?.kn
                        : (language === 'hi' ? rescueResult.rescueMessage?.hi : rescueResult.rescueMessage?.en);
                      voiceService.speak(spoken, { language });
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.voiceBtnText}>🔊 Read Aloud</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* SOS Beacon Screen Toggle */}
            <View style={styles.beaconSection}>
              <TouchableOpacity
                style={[styles.beaconBtn, sosActive && styles.beaconBtnActive]}
                onPress={() => setSosActive(!sosActive)}
                activeOpacity={0.85}
              >
                <Text style={styles.beaconBtnText}>
                  {sosActive ? '🚨 SOS BEACON ACTIVE (TAP TO STOP)' : '💡 SHOW SOS IDENTIFIER TO STATION STAFF'}
                </Text>
              </TouchableOpacity>

              {sosActive && (
                <View style={styles.sosCard}>
                  <Text style={styles.sosTitle}>PASSENGER NEEDS ASSISTANCE</Text>
                  <Text style={styles.sosPillar}>PILLAR CODE: SBC-CLUE-{selectedClueNodeId.replace('node_', '').toUpperCase()}</Text>
                  <Text style={styles.sosSub}>Please show this screen to any Railway Police (RPF) or Station Staff.</Text>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 620,
    maxHeight: '92%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12
  },
  header: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  headerLeft: {
    flex: 1
  },
  emergencyBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4
  },
  emergencyBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1
  },
  title: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '900'
  },
  closeBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center'
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold'
  },
  scrollContent: {
    padding: 20
  },
  section: {
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 4,
    letterSpacing: 0.5
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 10
  },
  clueList: {
    gap: 8
  },
  clueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    gap: 12
  },
  clueCardSelected: {
    backgroundColor: '#FEF2F2',
    borderColor: '#DC2626'
  },
  clueIcon: {
    fontSize: 18
  },
  clueLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151'
  },
  clueLabelSelected: {
    color: '#DC2626',
    fontWeight: '700'
  },
  clueFloor: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2
  },
  rescueActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  actionBtn: {
    flexBasis: '48%',
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center'
  },
  actionBtnActive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#DC2626'
  },
  actionBtnIcon: {
    fontSize: 26,
    marginBottom: 4
  },
  actionBtnTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827'
  },
  actionBtnSub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
    textAlign: 'center'
  },
  resultContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#3B82F6',
    padding: 16,
    marginBottom: 20
  },
  resultHeader: {
    marginBottom: 10
  },
  resultBadge: {
    fontSize: 10,
    fontWeight: '900',
    color: '#2563EB',
    letterSpacing: 1
  },
  resultTarget: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1E293B',
    marginTop: 2
  },
  resultMetrics: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2
  },
  messageBox: {
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12
  },
  messageText: {
    fontSize: 13,
    color: '#1E40AF',
    fontWeight: '600',
    lineHeight: 18
  },
  stepsList: {
    gap: 8,
    marginBottom: 16
  },
  stepRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start'
  },
  stepNumBubble: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2
  },
  stepNumText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold'
  },
  stepInst: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B'
  },
  stepDist: {
    fontSize: 11,
    color: '#94A3B8'
  },
  resultButtons: {
    flexDirection: 'row',
    gap: 10
  },
  navigateBtn: {
    flex: 2,
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center'
  },
  navigateBtnText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 13
  },
  voiceBtn: {
    flex: 1,
    backgroundColor: '#E0E7FF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center'
  },
  voiceBtnText: {
    color: '#3730A3',
    fontWeight: '700',
    fontSize: 13
  },
  beaconSection: {
    marginTop: 10
  },
  beaconBtn: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center'
  },
  beaconBtnActive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#DC2626'
  },
  beaconBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#374151'
  },
  sosCard: {
    marginTop: 12,
    backgroundColor: '#FEF2F2',
    borderWidth: 2,
    borderColor: '#DC2626',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center'
  },
  sosTitle: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '900'
  },
  sosPillar: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '900',
    marginVertical: 8,
    letterSpacing: 1
  },
  sosSub: {
    color: '#6B7280',
    fontSize: 12,
    textAlign: 'center'
  }
});

