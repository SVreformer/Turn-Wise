import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  Alert,
  SafeAreaView
} from 'react-native';
import { useBlockageStore } from '../store/blockageStore';
import { useNavigationStore } from '../store/navigationStore';
import { localRouter } from '../services/localRouter';
import { Colors, Shadows, Radii, Spacing, Typography } from '../theme/tokens';

interface AccessibilityTruthModalProps {
  visible: boolean;
  onClose: () => void;
}

const AMENITIES_LIST = [
  { id: 'lift_1', name: 'Lift 1 (Platform 7/8)', type: 'LIFT', desc: 'Serves Platform 7/8 to FOB 2' },
  { id: 'lift_2', name: 'Lift 2 (Terminal 1 Concourse)', type: 'LIFT', desc: 'Serves Concourse to Subway' },
  { id: 'lift_3', name: 'Lift 3 (Platform 1 East)', type: 'LIFT', desc: 'Serves PF 1 to FOB 2' },
  { id: 'ramp_1', name: 'Ramp 1 (Platform 7/8)', type: 'RAMP', desc: 'Accessible Ramp to FOB 2' },
  { id: 'ramp_2', name: 'Ramp 2 (Platform 4/5)', type: 'RAMP', desc: 'Accessible Ramp to FOB 2' },
  { id: 'ramp_3', name: 'Ramp 3 (Platform 1/2)', type: 'RAMP', desc: 'Wheelchair Ramp to Subway' },
  { id: 'vc_edge_lift1', name: 'Lift 1 Shaft Link', type: 'VERTICAL_SHAFT', desc: 'Vertical transition link' },
  { id: 'vc_edge_lift2', name: 'Lift 2 Shaft Link', type: 'VERTICAL_SHAFT', desc: 'Vertical transition link' }
];

export const AccessibilityTruthModal: React.FC<AccessibilityTruthModalProps> = ({
  visible,
  onClose
}) => {
  const { statuses, incidentReports, toggleBlockage, reportIncident, resetAll } = useBlockageStore();
  const { language, setProfile, setDestinationNode, calculateRoute, startNavigation } = useNavigationStore();

  const [activeTab, setActiveTab] = useState<'STATUS' | 'REPORT' | 'SCENARIOS'>('STATUS');
  const [selectedAmenityId, setSelectedAmenityId] = useState<string>('lift_1');
  const [incidentType, setIncidentType] = useState<'OUT_OF_SERVICE' | 'OVERCROWDED' | 'MAINTENANCE' | 'SLIPPERY'>('OUT_OF_SERVICE');
  const [reporterRole, setReporterRole] = useState<'STAFF' | 'PASSENGER'>('STAFF');
  const [reportNotes, setReportNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleSubmitReport = async () => {
    setSubmitting(true);
    await reportIncident(selectedAmenityId, incidentType, reporterRole, reportNotes || undefined);
    setSubmitting(false);
    setReportNotes('');
    Alert.alert(
      "✓ Report Logged & Verified",
      `Facility ${selectedAmenityId} status updated. Routing graph weights have been dynamically re-calculated across all profiles.`,
      [{ text: "OK", onPress: () => setActiveTab('STATUS') }]
    );
  };

  const runScenario = async (scenarioNumber: number) => {
    await resetAll();
    const p8Node = localRouter.nodeDict.get('node_pf8_center')!;
    const p5Node = localRouter.nodeDict.get('node_pf5_center')!;

    switch (scenarioNumber) {
      case 1:
        setProfile('first_time');
        setDestinationNode(p8Node);
        break;
      case 2:
        setProfile('mobility_disabled');
        setDestinationNode(p8Node);
        break;
      case 3:
        setProfile('elderly');
        setDestinationNode(p5Node);
        break;
      case 4:
        setProfile('visually_impaired');
        setDestinationNode(p8Node);
        break;
      case 5:
        setProfile('mobility_disabled');
        setDestinationNode(p8Node);
        const route = await calculateRoute();
        if (route) {
          startNavigation(route);
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
      <SafeAreaView style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.badge}>ACCESSIBILITY TRUTH ENGINE</Text>
              <Text style={styles.title}>
                {language === 'kn' ? '🛡️ ಪ್ರವೇಶ್ಯತಾ ಸ್ಥಿತಿ ಮತ್ತು ವರದಿ' : (language === 'hi' ? '🛡️ सुगम्यता स्थिति एवं रिपोर्टिंग' : '🛡️ Amenity Status & Reporting')}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.8}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Navigation Tabs */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'STATUS' && styles.tabBtnActive]}
              onPress={() => setActiveTab('STATUS')}
            >
              <Text style={[styles.tabBtnText, activeTab === 'STATUS' && styles.tabBtnTextActive]}>
                Live Amenities
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'REPORT' && styles.tabBtnActive]}
              onPress={() => setActiveTab('REPORT')}
            >
              <Text style={[styles.tabBtnText, activeTab === 'REPORT' && styles.tabBtnTextActive]}>
                Report Issue
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'SCENARIOS' && styles.tabBtnActive]}
              onPress={() => setActiveTab('SCENARIOS')}
            >
              <Text style={[styles.tabBtnText, activeTab === 'SCENARIOS' && styles.tabBtnTextActive]}>
                Demo Sandbox
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* TAB 1: LIVE AMENITIES STATUS */}
            {activeTab === 'STATUS' && (
              <View>
                <View style={styles.infoBanner}>
                  <Text style={styles.infoBannerTitle}>STATION ACCESSIBILITY TRUTH GRAPH</Text>
                  <Text style={styles.infoBannerText}>
                    Real-time operational status for KSR Bengaluru station elevators, wheelchair ramps, and footover bridges. Tap any amenity to toggle status.
                  </Text>
                </View>

                <View style={styles.amenityList}>
                  {AMENITIES_LIST.map((item) => {
                    const isBlocked = statuses[item.id] === 'BLOCKED';
                    return (
                      <View key={item.id} style={styles.amenityCard}>
                        <View style={{ flex: 1 }}>
                          <View style={styles.amenityCardHeader}>
                            <Text style={styles.amenityName}>{item.name}</Text>
                            <View style={[styles.statusPill, isBlocked ? styles.statusPillBlocked : styles.statusPillOpen]}>
                              <Text style={[styles.statusPillText, isBlocked ? styles.statusPillTextBlocked : styles.statusPillTextOpen]}>
                                {isBlocked ? '🔴 BLOCKED' : '🟢 OPERATIONAL'}
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.amenityDesc}>{item.desc}</Text>
                        </View>

                        <TouchableOpacity
                          style={[styles.toggleBtn, isBlocked ? styles.toggleBtnRestore : styles.toggleBtnBlock]}
                          onPress={() => toggleBlockage(item.id)}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.toggleBtnText}>
                            {isBlocked ? 'Restore' : 'Block'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>

                {incidentReports.length > 0 && (
                  <View style={styles.recentReportsSection}>
                    <Text style={styles.recentReportsTitle}>Recent Incident Reports ({incidentReports.length})</Text>
                    {incidentReports.map((rep) => (
                      <View key={rep.id} style={styles.reportItem}>
                        <Text style={styles.reportTypeBadge}>{rep.type}</Text>
                        <Text style={styles.reportItemText}>
                          {rep.facilityOrLocationId} • Reported by {rep.reporterRole} ({rep.verified ? 'Verified' : 'Pending'})
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* TAB 2: INCIDENT REPORTING */}
            {activeTab === 'REPORT' && (
              <View>
                <Text style={styles.formTitle}>Report Damaged or Blocked Amenity</Text>
                <Text style={styles.formSub}>
                  Reporting immediately updates routing penalties across the station graph to protect wheelchair and elderly passengers.
                </Text>

                <Text style={styles.inputLabel}>Select Facility / Walkway:</Text>
                <View style={styles.amenityPickerGrid}>
                  {AMENITIES_LIST.slice(0, 6).map((am) => {
                    const isSel = selectedAmenityId === am.id;
                    return (
                      <TouchableOpacity
                        key={am.id}
                        style={[styles.pickerPill, isSel && styles.pickerPillActive]}
                        onPress={() => setSelectedAmenityId(am.id)}
                      >
                        <Text style={[styles.pickerPillText, isSel && styles.pickerPillTextActive]}>
                          {am.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.inputLabel}>Incident Category:</Text>
                <View style={styles.categoryGrid}>
                  {[
                    { key: 'OUT_OF_SERVICE', label: 'Out of Service / Breakdown' },
                    { key: 'OVERCROWDED', label: 'Heavy Overcrowding / Jam' },
                    { key: 'MAINTENANCE', label: 'Maintenance / Repair Work' },
                    { key: 'SLIPPERY', label: 'Wet Floor / Slippage Hazard' }
                  ].map((cat: any) => {
                    const isSel = incidentType === cat.key;
                    return (
                      <TouchableOpacity
                        key={cat.key}
                        style={[styles.catCard, isSel && styles.catCardActive]}
                        onPress={() => setIncidentType(cat.key)}
                      >
                        <Text style={[styles.catCardText, isSel && styles.catCardTextActive]}>
                          {cat.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.inputLabel}>Reporter Verification Role:</Text>
                <View style={styles.roleRow}>
                  <TouchableOpacity
                    style={[styles.roleBtn, reporterRole === 'STAFF' && styles.roleBtnActive]}
                    onPress={() => setReporterRole('STAFF')}
                  >
                    <Text style={[styles.roleBtnText, reporterRole === 'STAFF' && styles.roleBtnTextActive]}>
                      🛡️ Station Staff (Instant Verify)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.roleBtn, reporterRole === 'PASSENGER' && styles.roleBtnActive]}
                    onPress={() => setReporterRole('PASSENGER')}
                  >
                    <Text style={[styles.roleBtnText, reporterRole === 'PASSENGER' && styles.roleBtnTextActive]}>
                      👤 Passenger Report
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.inputLabel}>Additional Notes (Optional):</Text>
                <TextInput
                  style={styles.textArea}
                  value={reportNotes}
                  onChangeText={setReportNotes}
                  placeholder="e.g. Lift doors not opening, technician called."
                  multiline
                />

                <TouchableOpacity
                  style={styles.submitReportBtn}
                  onPress={handleSubmitReport}
                  activeOpacity={0.85}
                  disabled={submitting}
                >
                  <Text style={styles.submitReportBtnText}>
                    {submitting ? 'UPDATING ROUTING ENGINE...' : '🚀 SUBMIT REPORT & UPDATE GRAPH WEIGHTS'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* TAB 3: DEMO SCENARIOS */}
            {activeTab === 'SCENARIOS' && (
              <View>
                <Text style={styles.formTitle}>Hackathon Judge Simulation Scenarios</Text>
                <Text style={styles.formSub}>
                  One-tap execution to verify accessibility profiles, dynamic blockage penalties, and automated rerouting.
                </Text>

                <View style={styles.scenariosGrid}>
                  <TouchableOpacity style={styles.scenarioCard} onPress={() => runScenario(1)} activeOpacity={0.85}>
                    <Text style={styles.scenarioBadge}>SCENARIO 1</Text>
                    <Text style={styles.scenarioTitle}>First-Time Traveller to Platform 8</Text>
                    <Text style={styles.scenarioDesc}>Visual landmark navigation with minimal turn count.</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.scenarioCard} onPress={() => runScenario(2)} activeOpacity={0.85}>
                    <Text style={styles.scenarioBadge}>SCENARIO 2</Text>
                    <Text style={styles.scenarioTitle}>Wheelchair User to Platform 8</Text>
                    <Text style={styles.scenarioDesc}>100% Step-free via Lift 2, FOB 2, Lift 1 (Stairs = ∞ cost).</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.scenarioCard} onPress={() => runScenario(3)} activeOpacity={0.85}>
                    <Text style={styles.scenarioBadge}>SCENARIO 3</Text>
                    <Text style={styles.scenarioTitle}>Elderly Passenger to Platform 5</Text>
                    <Text style={styles.scenarioDesc}>Minimizes walking fatigue (+5x penalty on stairs).</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.scenarioCard} onPress={() => runScenario(4)} activeOpacity={0.85}>
                    <Text style={styles.scenarioBadge}>SCENARIO 4</Text>
                    <Text style={styles.scenarioTitle}>Visually Impaired to Platform 8</Text>
                    <Text style={styles.scenarioDesc}>Continuous audio prompts along tactile corridors.</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.scenarioCard, styles.scenarioCardHot]} onPress={() => runScenario(5)} activeOpacity={0.85}>
                    <Text style={[styles.scenarioBadge, { color: '#DC2626' }]}>SCENARIO 5 (STAR FEATURE)</Text>
                    <Text style={styles.scenarioTitle}>Dynamic Blockage & Live Rerouting</Text>
                    <Text style={styles.scenarioDesc}>
                      Starts wheelchair route $\to$ Lift 1 blocks mid-route $\to$ Audio alert $\to$ Instant reroute via Accessible Ramp!
                    </Text>
                  </TouchableOpacity>
                </View>
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
    backgroundColor: '#0F172A',
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
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center'
  },
  tabBtnActive: {
    borderBottomWidth: 3,
    borderBottomColor: '#2563EB',
    backgroundColor: '#FFFFFF'
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B'
  },
  tabBtnTextActive: {
    color: '#2563EB'
  },
  scrollContent: {
    padding: 20
  },
  infoBanner: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16
  },
  infoBannerTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#475569',
    letterSpacing: 1
  },
  infoBannerText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 16
  },
  amenityList: {
    gap: 10
  },
  amenityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    gap: 12
  },
  amenityCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2
  },
  amenityName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B'
  },
  amenityDesc: {
    fontSize: 11,
    color: '#64748B'
  },
  statusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  statusPillOpen: {
    backgroundColor: '#ECFDF5'
  },
  statusPillBlocked: {
    backgroundColor: '#FEF2F2'
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800'
  },
  statusPillTextOpen: {
    color: '#059669'
  },
  statusPillTextBlocked: {
    color: '#DC2626'
  },
  toggleBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8
  },
  toggleBtnBlock: {
    backgroundColor: '#FEE2E2'
  },
  toggleBtnRestore: {
    backgroundColor: '#D1FAE5'
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1F2937'
  },
  recentReportsSection: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 14
  },
  recentReportsTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#374151',
    marginBottom: 8
  },
  reportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6
  },
  reportTypeBadge: {
    backgroundColor: '#FEF3C7',
    color: '#B45309',
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  reportItemText: {
    fontSize: 12,
    color: '#4B5563'
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 4
  },
  formSub: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 16
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 6,
    marginTop: 8
  },
  amenityPickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12
  },
  pickerPill: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1'
  },
  pickerPillActive: {
    backgroundColor: '#2563EB',
    borderColor: '#1D4ED8'
  },
  pickerPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155'
  },
  pickerPillTextActive: {
    color: '#FFFFFF'
  },
  categoryGrid: {
    gap: 6,
    marginBottom: 12
  },
  catCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 10
  },
  catCardActive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444'
  },
  catCardText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155'
  },
  catCardTextActive: {
    color: '#DC2626'
  },
  roleRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12
  },
  roleBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center'
  },
  roleBtnActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6'
  },
  roleBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569'
  },
  roleBtnTextActive: {
    color: '#2563EB'
  },
  textArea: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    color: '#1E293B',
    minHeight: 60,
    marginBottom: 16
  },
  submitReportBtn: {
    backgroundColor: '#DC2626',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center'
  },
  submitReportBtnText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.5
  },
  scenariosGrid: {
    gap: 10
  },
  scenarioCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14
  },
  scenarioCardHot: {
    backgroundColor: '#FFF7ED',
    borderColor: '#F97316'
  },
  scenarioBadge: {
    fontSize: 10,
    fontWeight: '900',
    color: '#2563EB',
    letterSpacing: 1
  },
  scenarioTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginVertical: 4
  },
  scenarioDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16
  }
});

