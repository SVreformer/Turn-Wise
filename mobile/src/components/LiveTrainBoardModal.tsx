import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import { useNavigationStore } from '../store/navigationStore';
import { apiService } from '../services/apiService';
import { localRouter } from '../services/localRouter';
import { Colors, Shadows, Radii, Spacing, Typography } from '../theme/tokens';

interface LiveTrainBoardModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectCoachRoute?: (trainNumber: string, coachNumber: string) => void;
  onNavigateToPlatform?: (platformNumber: number) => void;
  onOpenBoardingSure?: (trainNumber: string, coachNumber?: string) => void;
}

export const LiveTrainBoardModal: React.FC<LiveTrainBoardModalProps> = ({
  visible,
  onClose,
  onSelectCoachRoute,
  onNavigateToPlatform,
  onOpenBoardingSure
}) => {
  const { selectedStation, language, setDestinationNode, calculateRoute } = useNavigationStore();
  const [activeTab, setActiveTab] = useState<'TRAINS' | 'PLATFORMS'>('TRAINS');
  const [filterType, setFilterType] = useState<'ALL' | 'DEPARTURE' | 'ARRIVAL'>('ALL');
  const [trains, setTrains] = useState<any[]>([]);
  const [platforms, setPlatforms] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [expandedTrainNo, setExpandedTrainNo] = useState<string | null>(null);

  useEffect(() => {
    if (visible && selectedStation) {
      loadData();
    }
  }, [visible, selectedStation]);

  const loadData = async () => {
    if (!selectedStation) return;
    setLoading(true);
    try {
      const tr = await apiService.getStationTrains(selectedStation.code);
      setTrains(tr);
      const pl = await apiService.getStationPlatforms(selectedStation.code);
      setPlatforms(pl);
    } catch {}
    setLoading(false);
  };

  const filteredTrains = trains.filter(t => {
    if (filterType === 'ALL') return true;
    return t.direction === filterType;
  });

  const handlePlatformNavigate = async (pfNum: number) => {
    const dest = localRouter.nodeDict.get(`node_pf${pfNum}_center`);
    if (dest) {
      setDestinationNode(dest, 'PLATFORM');
      await calculateRoute();
    }
    if (onNavigateToPlatform) onNavigateToPlatform(pfNum);
    onClose();
  };

  const getStatusBadge = (t: any) => {
    if (t.status === 'ON_TIME') {
      return (
        <View style={[styles.statusBadge, { backgroundColor: '#DCFCE7' }]}>
          <Text style={[styles.statusText, { color: '#15803D' }]}>● ON TIME</Text>
        </View>
      );
    }
    if (t.status === 'DELAYED') {
      return (
        <View style={[styles.statusBadge, { backgroundColor: '#FEE2E2' }]}>
          <Text style={[styles.statusText, { color: '#B91C1C' }]}>⚠️ DELAYED {t.delayMinutes}m</Text>
        </View>
      );
    }
    return (
      <View style={[styles.statusBadge, { backgroundColor: '#FEF3C7' }]}>
        <Text style={[styles.statusText, { color: '#B45309' }]}>⏱ +{t.delayMinutes || 5}m</Text>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <View style={styles.headerTitleRow}>
                  <Text style={styles.stationCodeTag}>{selectedStation?.code || 'SBC'}</Text>
                  <Text style={styles.title}>
                    {language === 'kn' ? 'ಲೈವ್ ರೈಲು ಮತ್ತು ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ಬೋರ್ಡ್' : (language === 'hi' ? 'लाइव ट्रेन और प्लेटफॉर्म बोर्ड' : 'Live Trains & Platform Board')}
                  </Text>
                </View>
                <Text style={styles.subTitle}>
                  {selectedStation?.name || 'KSR Bengaluru'} • Real-time Timetable & Halts
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Top Tab Switcher (TRAINS vs PLATFORMS) */}
            <View style={styles.tabBar}>
              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'TRAINS' && styles.tabBtnActive]}
                onPress={() => setActiveTab('TRAINS')}
              >
                <Text style={[styles.tabText, activeTab === 'TRAINS' && styles.tabTextActive]}>
                  🚆 {language === 'kn' ? 'ರೈಲುಗಳು ಮತ್ತು ಸಮಯ' : (language === 'hi' ? 'ट्रेनें और समय' : 'Live Trains & Timings')} ({trains.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'PLATFORMS' && styles.tabBtnActive]}
                onPress={() => setActiveTab('PLATFORMS')}
              >
                <Text style={[styles.tabText, activeTab === 'PLATFORMS' && styles.tabTextActive]}>
                  🚉 {language === 'kn' ? 'ಪ್ಲಾಟ್‌ಫಾರ್ಮ್‌ಗಳು' : (language === 'hi' ? 'प्लेटफॉर्म' : 'Platforms List')} ({platforms.length})
                </Text>
              </TouchableOpacity>
            </View>

            {/* Filter Pills for Trains (Departures / Arrivals) */}
            {activeTab === 'TRAINS' && (
              <View style={styles.filterRow}>
                {(['ALL', 'DEPARTURE', 'ARRIVAL'] as const).map(ft => (
                  <TouchableOpacity
                    key={ft}
                    style={[styles.filterPill, filterType === ft && styles.filterPillActive]}
                    onPress={() => setFilterType(ft)}
                  >
                    <Text style={[styles.filterPillText, filterType === ft && styles.filterPillTextActive]}>
                      {ft === 'ALL'
                        ? 'All Trains'
                        : ft === 'DEPARTURE'
                          ? '↗ Departures'
                          : '↘ Arrivals'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0284C7" />
                <Text style={{ marginTop: 10, color: '#64748B' }}>Fetching real-time railway data...</Text>
              </View>
            ) : (
              <ScrollView contentContainerStyle={styles.listContent}>
                {/* 1. TRAINS TAB CONTENT */}
                {activeTab === 'TRAINS' && (
                  <>
                    {filteredTrains.map((t, idx) => {
                      const isExpanded = expandedTrainNo === t.trainNumber;
                      return (
                        <View key={`${t.trainNumber}_${idx}`} style={styles.trainCard}>
                          <View style={styles.trainMainRow}>
                            <View style={styles.platformBadge}>
                              <Text style={styles.platformBadgeLabel}>PF</Text>
                              <Text style={styles.platformBadgeNumber}>{t.platform}</Text>
                            </View>

                            <View style={{ flex: 1, marginLeft: 12 }}>
                              <View style={styles.trainNameRow}>
                                <Text style={styles.trainNumberText}>{t.trainNumber}</Text>
                                <Text style={styles.trainTypeText}>{t.type}</Text>
                              </View>
                              <Text style={styles.trainNameText}>{t.trainName}</Text>
                              <Text style={styles.routeText}>
                                {t.originName || t.originCode} ➔ {t.destinationName || t.destinationCode}
                              </Text>
                            </View>

                            <View style={styles.timingCol}>
                              <Text style={styles.timeText}>{t.scheduledTime}</Text>
                              {getStatusBadge(t)}
                            </View>
                          </View>

                          {/* Action Buttons Row */}
                          <View style={styles.cardActionsRow}>
                            <TouchableOpacity
                              style={styles.expandCoachBtn}
                              onPress={() => setExpandedTrainNo(isExpanded ? null : t.trainNumber)}
                            >
                              <Text style={styles.expandCoachBtnText}>
                                {isExpanded ? 'Hide Coaches ▲' : 'View Coaches ▼'}
                              </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={styles.findCoachActionBtn}
                              onPress={() => {
                                if (onSelectCoachRoute) onSelectCoachRoute(t.trainNumber, 'B4');
                                onClose();
                              }}
                            >
                              <Text style={styles.findCoachActionBtnText}>
                                🎯 Coach B4 →
                              </Text>
                            </TouchableOpacity>

                            {onOpenBoardingSure && (
                              <TouchableOpacity
                                style={styles.boardingSureActionBtn}
                                onPress={() => {
                                  onOpenBoardingSure(t.trainNumber, 'B4');
                                  onClose();
                                }}
                              >
                                <Text style={styles.boardingSureActionBtnText}>
                                  🛡️ Risk
                                </Text>
                              </TouchableOpacity>
                            )}

                            <TouchableOpacity
                              style={styles.navPlatformBtn}
                              onPress={() => handlePlatformNavigate(t.platform)}
                            >
                              <Text style={styles.navPlatformBtnText}>
                                🚶 PF {t.platform}
                              </Text>
                            </TouchableOpacity>
                          </View>

                          {/* Coach Layout Visualizer */}
                          {isExpanded && t.coaches && (
                            <View style={styles.coachVisualizer}>
                              <Text style={styles.coachVisualizerTitle}>
                                Coach Composition ({t.coaches.length} Coaches):
                              </Text>
                              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.coachesRow}>
                                {t.coaches.map((c: string, cIdx: number) => {
                                  const isAC = c.startsWith('B') || c.startsWith('A') || c.startsWith('H') || c.startsWith('C') || c.startsWith('E');
                                  return (
                                    <View
                                      key={`${c}_${cIdx}`}
                                      style={[styles.coachBox, isAC && styles.coachBoxAC]}
                                    >
                                      <Text style={[styles.coachBoxText, isAC && styles.coachBoxTextAC]}>
                                        {c}
                                      </Text>
                                      <Text style={styles.coachIndexText}>{cIdx + 1}</Text>
                                    </View>
                                  );
                                })}
                              </ScrollView>
                            </View>
                          )}
                        </View>
                      );
                    })}

                    {filteredTrains.length === 0 && (
                      <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No trains scheduled in this category right now.</Text>
                      </View>
                    )}
                  </>
                )}

                {/* 2. PLATFORMS TAB CONTENT */}
                {activeTab === 'PLATFORMS' && (
                  <>
                    {platforms.map((p, idx) => (
                      <View key={`${p.number}_${idx}`} style={styles.platformCard}>
                        <View style={styles.platformCardHeader}>
                          <View style={styles.pfCircle}>
                            <Text style={styles.pfCircleNumber}>{p.number}</Text>
                          </View>
                          <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={styles.pfTitle}>{p.name}</Text>
                            <Text style={styles.pfSub}>Length: {p.lengthMeters}m • High-level Broad Gauge</Text>
                          </View>
                          <TouchableOpacity
                            style={styles.pfNavBtn}
                            onPress={() => handlePlatformNavigate(p.number)}
                          >
                            <Text style={styles.pfNavBtnText}>Navigate →</Text>
                          </TouchableOpacity>
                        </View>

                        {/* Accessibility Features Matrix */}
                        <View style={styles.amenityRow}>
                          <View style={[styles.amenityPill, p.stepFree && styles.amenityPillGreen]}>
                            <Text style={styles.amenityPillText}>
                              {p.stepFree ? '✓ Step-Free Access' : '⚠️ Multi-level'}
                            </Text>
                          </View>
                          <View style={[styles.amenityPill, p.hasLift && styles.amenityPillGreen]}>
                            <Text style={styles.amenityPillText}>
                              {p.hasLift ? '🛗 Lift Connected' : 'No Lift'}
                            </Text>
                          </View>
                          <View style={[styles.amenityPill, p.hasEscalator && styles.amenityPillGreen]}>
                            <Text style={styles.amenityPillText}>
                              {p.hasEscalator ? '⚡ Escalator' : 'Stairs Only'}
                            </Text>
                          </View>
                          <View style={[styles.amenityPill, p.tactilePaving && styles.amenityPillGreen]}>
                            <Text style={styles.amenityPillText}>
                              {p.tactilePaving ? '🦯 Tactile Paving' : 'Standard'}
                            </Text>
                          </View>
                        </View>

                        {/* Current Active Train on Platform */}
                        {p.currentTrain && (
                          <View style={styles.currentTrainPill}>
                            <Text style={styles.currentTrainPillText}>
                              Currently Halting: {p.currentTrain.trainName} ({p.currentTrain.trainNumber}) • Status: {p.currentTrain.status}
                            </Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </>
                )}
              </ScrollView>
            )}
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end'
  },
  safeArea: {
    maxHeight: '92%'
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    maxHeight: '100%'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  stationCodeTag: {
    backgroundColor: '#0284C7',
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A'
  },
  subTitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center'
  },
  closeBtnText: {
    fontSize: 16,
    color: '#475569',
    fontWeight: 'bold'
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    marginTop: 12
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B'
  },
  tabTextActive: {
    color: '#0284C7',
    fontWeight: '800'
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  filterPillActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A'
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569'
  },
  filterPillTextActive: {
    color: '#FFFFFF'
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center'
  },
  listContent: {
    paddingVertical: 12,
    paddingBottom: 24
  },
  trainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1
  },
  trainMainRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  platformBadge: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#0284C7',
    justifyContent: 'center',
    alignItems: 'center'
  },
  platformBadgeLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#BAE6FD'
  },
  platformBadgeNumber: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF'
  },
  trainNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  trainNumberText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A'
  },
  trainTypeText: {
    fontSize: 10,
    fontWeight: '700',
    backgroundColor: '#F1F5F9',
    color: '#475569',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  trainNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 2
  },
  routeText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2
  },
  timingCol: {
    alignItems: 'flex-end',
    marginLeft: 8
  },
  timeText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800'
  },
  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 6
  },
  expandCoachBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8
  },
  expandCoachBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B'
  },
  findCoachActionBtn: {
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD'
  },
  findCoachActionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7'
  },
  boardingSureActionBtn: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#86EFAC'
  },
  boardingSureActionBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D'
  },
  navPlatformBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8
  },
  navPlatformBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  coachVisualizer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  coachVisualizerTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6
  },
  coachesRow: {
    gap: 6,
    paddingVertical: 4
  },
  coachBox: {
    width: 44,
    height: 38,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1'
  },
  coachBoxAC: {
    backgroundColor: '#0284C7',
    borderColor: '#0369A1'
  },
  coachBoxText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#334155'
  },
  coachBoxTextAC: {
    color: '#FFFFFF'
  },
  coachIndexText: {
    fontSize: 8,
    color: '#94A3B8'
  },
  platformCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 10
  },
  platformCardHeader: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  pfCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center'
  },
  pfCircleNumber: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900'
  },
  pfTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A'
  },
  pfSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2
  },
  pfNavBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8
  },
  pfNavBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700'
  },
  amenityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10
  },
  amenityPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  amenityPillGreen: {
    backgroundColor: '#ECFDF5'
  },
  amenityPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#334155'
  },
  currentTrainPill: {
    marginTop: 10,
    backgroundColor: '#FEF3C7',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A'
  },
  currentTrainPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E'
  },
  emptyState: {
    padding: 30,
    alignItems: 'center'
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 14
  }
});

