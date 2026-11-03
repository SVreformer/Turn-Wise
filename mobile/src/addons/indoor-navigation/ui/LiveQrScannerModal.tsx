import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { Colors, Shadows, Radii, Spacing } from '../../../theme/tokens';
import { qrValidator } from '../positioning/qrValidator';
import { StationQrCheckpoint } from '../types';

interface LiveQrScannerModalProps {
  onScanSuccess: (rawCode: string, checkpoint: StationQrCheckpoint) => void;
  onClose: () => void;
}

export const LiveQrScannerModal: React.FC<LiveQrScannerModalProps> = ({
  onScanSuccess,
  onClose
}) => {
  const [manualInput, setManualInput] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const allCheckpoints = qrValidator.getAllCheckpoints();

  const handleProcessCode = (code: string) => {
    setValidationError(null);
    const res = qrValidator.validate(code);
    if (res.isValid) {
      onScanSuccess(code, res.checkpoint);
    } else {
      setValidationError(`[${res.errorCode}] ${res.errorMessage}`);
    }
  };

  const handleTestDamagedCode = () => {
    handleProcessCode('meteor://check?v=1&s=UNKNOWN&c=CORRUPT_SIG_9999');
  };

  return (
    <View style={styles.container}>
      <View style={styles.modalCard}>
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.cameraIcon}>📷</Text>
            <View>
              <Text style={styles.title}>INDOOR QR CHECKPOINT SCANNER</Text>
              <Text style={styles.subtitle}>Offline-First Station Pillar Ground Truth</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Viewfinder Preview Box */}
        <View style={styles.viewfinder}>
          <View style={styles.cornerTL} />
          <View style={styles.cornerTR} />
          <View style={styles.cornerBL} />
          <View style={styles.cornerBR} />
          <View style={styles.scanLaser} />
          <Text style={styles.viewfinderText}>Align station pillar QR plate within frame</Text>
        </View>

        <View style={styles.offlineShield}>
          <Text style={styles.shieldIcon}>🛡️</Text>
          <Text style={styles.shieldText}>100% Offline Cryptographic CRC32 Validation Active</Text>
        </View>

        {validationError && (
          <View style={styles.errorBox}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>{validationError}</Text>
          </View>
        )}

        {/* Manual Input or Code Entry */}
        <View style={styles.manualRow}>
          <TextInput
            style={styles.input}
            placeholder="Enter Checkpoint ID (e.g., CP-T1-MAIN)"
            placeholderTextColor="#94A3B8"
            value={manualInput}
            onChangeText={setManualInput}
            autoCapitalize="characters"
          />
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={() => handleProcessCode(manualInput)}
          >
            <Text style={styles.submitBtnText}>Verify</Text>
          </TouchableOpacity>
        </View>

        {/* Rapid Testing / Pillar Checklist */}
        <View style={styles.quickTitleRow}>
          <Text style={styles.quickTitle}>OR TAP PHYSICAL PILLAR CHECKPOINT:</Text>
          <TouchableOpacity onPress={handleTestDamagedCode}>
            <Text style={styles.testDamagedText}>Test Damaged Code</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.checkpointList} showsVerticalScrollIndicator={false}>
          {allCheckpoints.map((cp) => (
            <TouchableOpacity
              key={cp.checkpointId}
              style={styles.cpItem}
              onPress={() => handleProcessCode(cp.checkpointId)}
              activeOpacity={0.7}
            >
              <View style={styles.cpIconCol}>
                <Text style={styles.cpIcon}>📍</Text>
                <Text style={styles.cpLevelBadge}>L{cp.level}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cpItemName}>{cp.name}</Text>
                <Text style={styles.cpItemLandmark}>{cp.visualLandmark}</Text>
                <Text style={styles.cpItemCode}>Code: {cp.checkpointId} • CRC: {cp.checksum}</Text>
              </View>
              <View style={styles.tapToScanBtn}>
                <Text style={styles.tapToScanText}>Scan</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    padding: Spacing.md,
    borderRadius: Radii.lg
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.lg,
    padding: Spacing.md,
    maxHeight: 520,
    ...Shadows.card
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  cameraIcon: {
    fontSize: 20
  },
  title: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.4
  },
  subtitle: {
    fontSize: 10,
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
  viewfinder: {
    height: 110,
    backgroundColor: '#0F172A',
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    marginBottom: Spacing.xs
  },
  cornerTL: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 18,
    height: 18,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#22C55E'
  },
  cornerTR: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 18,
    height: 18,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: '#22C55E'
  },
  cornerBL: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    width: 18,
    height: 18,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#22C55E'
  },
  cornerBR: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 18,
    height: 18,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: '#22C55E'
  },
  scanLaser: {
    position: 'absolute',
    left: 15,
    right: 15,
    height: 2,
    backgroundColor: '#22C55E',
    shadowColor: '#22C55E',
    shadowOpacity: 0.8,
    shadowRadius: 6
  },
  viewfinderText: {
    color: '#E2E8F0',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 35
  },
  offlineShield: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Radii.sm,
    marginBottom: Spacing.sm,
    gap: 6
  },
  shieldIcon: {
    fontSize: 12
  },
  shieldText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#15803D'
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: Radii.sm,
    padding: 6,
    marginBottom: Spacing.xs,
    gap: 6
  },
  errorIcon: {
    fontSize: 12
  },
  errorText: {
    fontSize: 10,
    color: '#B91C1C',
    fontWeight: '600',
    flex: 1
  },
  manualRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: Spacing.sm
  },
  input: {
    flex: 1,
    height: 36,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: Radii.sm,
    paddingHorizontal: 10,
    fontSize: 11,
    color: '#0F172A',
    backgroundColor: '#F8FAFC'
  },
  submitBtn: {
    backgroundColor: Colors.forestPrimary,
    paddingHorizontal: 12,
    justifyContent: 'center',
    borderRadius: Radii.sm
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700'
  },
  quickTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  quickTitle: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.3
  },
  testDamagedText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#DC2626'
  },
  checkpointList: {
    maxHeight: 180
  },
  cpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 8
  },
  cpIconCol: {
    alignItems: 'center',
    width: 28
  },
  cpIcon: {
    fontSize: 14
  },
  cpLevelBadge: {
    fontSize: 8,
    fontWeight: '700',
    color: '#0284C7'
  },
  cpItemName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E293B'
  },
  cpItemLandmark: {
    fontSize: 9,
    color: '#64748B'
  },
  cpItemCode: {
    fontSize: 8,
    color: '#94A3B8'
  },
  tapToScanBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Radii.xs
  },
  tapToScanText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.forestPrimary
  }
});
