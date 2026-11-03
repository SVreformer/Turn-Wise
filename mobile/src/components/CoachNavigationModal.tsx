import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  SafeAreaView
} from 'react-native';
import { useNavigationStore } from '../store/navigationStore';
import { KSR_TRAIN_DATABASE } from '../services/localRouter';
import { Colors, Shadows, Radii, Spacing, Typography } from '../theme/tokens';

interface CoachNavigationModalProps {
  visible: boolean;
  onClose: () => void;
  onStartCoachNavigation: (route: any) => void;
  onOpenBoardingSure?: (trainNumber: string, coachNumber: string) => void;
}

const COMMON_COACHES = ['B4', 'B1', 'B2', 'B3', 'S1', 'S2', 'S3', 'S4', 'A1', 'A2', 'H1', 'GEN'];

export const CoachNavigationModal: React.FC<CoachNavigationModalProps> = ({
  visible,
  onClose,
  onStartCoachNavigation,
  onOpenBoardingSure
}) => {
  const { calculateCoachRoute, language } = useNavigationStore();
  const [trainNumber, setTrainNumber] = useState<string>('12658');
  const [coachNumber, setCoachNumber] = useState<string>('B4');
  const [computedRoute, setComputedRoute] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const selectedTrainData = KSR_TRAIN_DATABASE[trainNumber] || {
    trainNumber,
    trainName: `Train ${trainNumber}`,
    platformNumber: 1,
    rakeDirection: 'ENGINE_EAST',
    totalCoaches: 24,
    coaches: []
  };

  const handleCalculate = async () => {
    if (!trainNumber || !coachNumber) return;
    setLoading(true);
    const r = await calculateCoachRoute(trainNumber, coachNumber);
    setLoading(false);
    if (r) {
      setComputedRoute(r);
    }
  };

  const handleStart = () => {
    if (computedRoute) {
      onStartCoachNavigation(computedRoute);
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <SafeAreaView style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.badge}>TRAIN & COACH BOARDING LOCATOR</Text>
              <Text style={styles.title}>
                {language === 'kn' ? '🚆 ರೈಲು ಮತ್ತು ಕೋಚ್ ಮಾರ್ಗದರ್ಶನ' : (language === 'hi' ? '🚆 ट्रेन एवं कोच नेविगेशन' : '🚆 Train to Coach Navigation')}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.8}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Quick Train Selector */}
            <Text style={styles.inputLabel}>
              {language === 'kn' ? 'ಜನಪ್ರಿಯ ರೈಲು ಆಯ್ಕೆಮಾಡಿ:' : (language === 'hi' ? 'प्रमुख ट्रेन चुनें:' : 'SELECT POPULAR KSR TRAIN:')}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.trainList}>
              {Object.values(KSR_TRAIN_DATABASE).map((t) => {
                const isSelected = trainNumber === t.trainNumber;
                return (
                  <TouchableOpacity
                    key={t.trainNumber}
                    style={[styles.trainPill, isSelected && styles.trainPillActive]}
                    onPress={() => {
                      setTrainNumber(t.trainNumber);
                      setComputedRoute(null);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.trainPillNo, isSelected && styles.trainPillNoActive]}>
                      {t.trainNumber}
                    </Text>
                    <Text style={[styles.trainPillName, isSelected && styles.trainPillNameActive]}>
                      PF {t.platformNumber} • {t.trainName.split(' ')[0]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Inputs Row */}
            <View style={styles.inputsRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>
                  {language === 'kn' ? 'ರೈಲು ಸಂಖ್ಯೆ:' : (language === 'hi' ? 'ट्रेन नंबर:' : 'Train Number:')}
                </Text>
                <TextInput
                  style={styles.textInput}
                  value={trainNumber}
                  onChangeText={(val) => {
                    setTrainNumber(val);
                    setComputedRoute(null);
                  }}
                  placeholder="e.g. 12658"
                  keyboardType="number-pad"
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>
                  {language === 'kn' ? 'ಕೋಚ್ ಸಂಖ್ಯೆ:' : (language === 'hi' ? 'कोच नंबर:' : 'Coach Number:')}
                </Text>
                <TextInput
                  style={styles.textInput}
                  value={coachNumber}
                  onChangeText={(val) => {
                    setCoachNumber(val);
                    setComputedRoute(null);
                  }}
                  placeholder="e.g. B4"
                  autoCapitalize="characters"
                />
              </View>
            </View>

            {/* Quick Coach Selector Pills */}
            <Text style={styles.inputLabel}>
              {language === 'kn' ? 'ತ್ವರಿತ ಕೋಚ್ ಆಯ್ಕೆ:' : (language === 'hi' ? 'त्वरित कोच चयन:' : 'Quick Coach Selection:')}
            </Text>
            <View style={styles.coachPillsGrid}>
              {COMMON_COACHES.map((c) => {
                const isSelected = coachNumber.toUpperCase() === c;
                return (
                  <TouchableOpacity
                    key={c}
                    style={[styles.coachPill, isSelected && styles.coachPillActive]}
                    onPress={() => {
                      setCoachNumber(c);
                      setComputedRoute(null);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.coachPillText, isSelected && styles.coachPillTextActive]}>
                      {c}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Train & Platform Overview Card */}
            <View style={styles.trainCard}>
              <View style={styles.trainCardHeader}>
                <Text style={styles.trainCardName}>{selectedTrainData.trainName}</Text>
                <View style={styles.pfBadge}>
                  <Text style={styles.pfBadgeText}>PLATFORM {selectedTrainData.platformNumber}</Text>
                </View>
              </View>
              <Text style={styles.trainCardDetails}>
                Rake: {selectedTrainData.totalCoaches} Coaches • Direction: {selectedTrainData.rakeDirection === 'ENGINE_EAST' ? 'Engine towards East (Chennai/Howrah)' : 'Engine towards West (Mysuru/Hubballi)'}
              </Text>
            </View>

            {/* Find Route Button */}
            <TouchableOpacity
              style={styles.calculateBtn}
              onPress={handleCalculate}
              activeOpacity={0.85}
              disabled={loading}
            >
              <Text style={styles.calculateBtnText}>
                {loading ? 'CALCULATING COACH POSITION...' : '📍 LOCATE COACH & COMPUTE ROUTE'}
              </Text>
            </TouchableOpacity>

            {/* Calculated Result Card */}
            {computedRoute && computedRoute.coachInfo && (
              <View style={styles.resultBox}>
                <View style={styles.resultHeaderRow}>
                  <View>
                    <Text style={styles.resultBadge}>COACH HALTING POSITION FOUND</Text>
                    <Text style={styles.resultTitle}>
                      Platform {computedRoute.coachInfo.platformNumber} • Coach {computedRoute.coachInfo.coachNumber}
                    </Text>
                  </View>
                  <View style={styles.coachMarkerBubble}>
                    <Text style={styles.coachMarkerBubbleText}>{computedRoute.coachInfo.coachNumber}</Text>
                  </View>
                </View>

                <Text style={styles.resultMetricText}>
                  Walking Distance: {computedRoute.totalDistanceMeters}m (~{computedRoute.estimatedTimeMinutes} min)
                </Text>

                <View style={styles.previewStep}>
                  <Text style={styles.previewStepTitle}>Boarding Guidance:</Text>
                  <Text style={styles.previewStepText}>
                    {computedRoute.steps[computedRoute.steps.length - 1]?.instruction}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.startNavBtn}
                  onPress={handleStart}
                  activeOpacity={0.85}
                >
                  <Text style={styles.startNavBtnText}>▶ START NAVIGATION TO COACH</Text>
                </TouchableOpacity>

                {onOpenBoardingSure && (
                  <TouchableOpacity
                    style={styles.boardingSureBtn}
                    onPress={() => {
                      onOpenBoardingSure(trainNumber, coachNumber);
                      onClose();
                    }}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.boardingSureBtnText}>
                      🛡️ PREDICT MISSED-TRAIN RISK (BOARDINGSURE)
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
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
    maxWidth: 600,
    maxHeight: '90%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12
  },
  header: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  badge: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2
  },
  closeBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    width: 34,
    height: 34,
    borderRadius: 17,
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
  inputLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#374151',
    marginBottom: 6,
    marginTop: 4
  },
  trainList: {
    flexDirection: 'row',
    marginBottom: 16
  },
  trainPill: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8
  },
  trainPillActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6'
  },
  trainPillNo: {
    fontSize: 14,
    fontWeight: '900',
    color: '#1F2937'
  },
  trainPillNoActive: {
    color: '#2563EB'
  },
  trainPillName: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2
  },
  trainPillNameActive: {
    color: '#3B82F6',
    fontWeight: '600'
  },
  inputsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    fontWeight: '700',
    color: '#111827'
  },
  coachPillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16
  },
  coachPill: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  coachPillActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#2563EB'
  },
  coachPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563'
  },
  coachPillTextActive: {
    color: '#FFFFFF'
  },
  trainCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16
  },
  trainCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  trainCardName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A'
  },
  pfBadge: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  pfBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#3730A3'
  },
  trainCardDetails: {
    fontSize: 12,
    color: '#64748B'
  },
  calculateBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16
  },
  calculateBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  resultBox: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#3B82F6',
    borderRadius: 14,
    padding: 16
  },
  resultHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  resultBadge: {
    fontSize: 10,
    fontWeight: '900',
    color: '#2563EB',
    letterSpacing: 1
  },
  resultTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#1E3A8A',
    marginTop: 2
  },
  coachMarkerBubble: {
    backgroundColor: '#2563EB',
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center'
  },
  coachMarkerBubbleText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14
  },
  resultMetricText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3B82F6',
    marginBottom: 10
  },
  previewStep: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14
  },
  previewStepTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B'
  },
  previewStepText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 2
  },
  startNavBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center'
  },
  startNavBtnText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 13
  },
  boardingSureBtn: {
    backgroundColor: '#1E293B',
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#334155'
  },
  boardingSureBtnText: {
    color: '#F8FAFC',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.5
  }
});

