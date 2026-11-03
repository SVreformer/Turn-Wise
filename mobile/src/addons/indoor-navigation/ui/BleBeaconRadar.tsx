import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Colors, Shadows, Radii, Spacing } from '../../../theme/tokens';
import { bleKalmanFilterEngine } from '../positioning/bleKalmanFilter';
import { BleSignalSample, StationBleBeacon } from '../types';
import { indoorNavigationEngine } from '../engine/indoorNavigationEngine';

interface BleBeaconRadarProps {
  onClose: () => void;
}

export const BleBeaconRadar: React.FC<BleBeaconRadarProps> = ({ onClose }) => {
  const [allBeacons, setAllBeacons] = useState<StationBleBeacon[]>([]);
  const [activeSamples, setActiveSamples] = useState<Record<string, BleSignalSample>>({});
  const [isSimulating, setIsSimulating] = useState<boolean>(true);

  useEffect(() => {
    const beacons = bleKalmanFilterEngine.getAllBeacons();
    setAllBeacons(beacons);

    // Initial simulated readings for nearby beacons
    const initialSamples: Record<string, BleSignalSample> = {};
    beacons.slice(0, 4).forEach((b, idx) => {
      const rawRssi = -60 - idx * 6 + (Math.random() * 4 - 2);
      const sample = bleKalmanFilterEngine.processSample(b.beaconId, rawRssi);
      if (sample) {
        initialSamples[b.beaconId] = sample;
        indoorNavigationEngine.processBleSample(b.beaconId, rawRssi);
      }
    });
    setActiveSamples(initialSamples);

    // Periodic simulation pulse to model physical RF fluctuations & Kalman smoothing
    const interval = setInterval(() => {
      if (!isSimulating) return;
      setActiveSamples((prev) => {
        const next = { ...prev };
        beacons.slice(0, 5).forEach((b, idx) => {
          // Add Gaussian-like noise to RSSI
          const noise = (Math.random() - 0.5) * 8.0;
          const baseRssi = -58 - idx * 5;
          const noisyRssi = Math.round(baseRssi + noise);
          const sample = bleKalmanFilterEngine.processSample(b.beaconId, noisyRssi);
          if (sample) {
            next[b.beaconId] = sample;
            indoorNavigationEngine.processBleSample(b.beaconId, noisyRssi);
          }
        });
        return next;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [isSimulating]);

  const handleTriggerBeaconPulse = (beacon: StationBleBeacon) => {
    // Generate a strong proximate RSSI burst (-54 dBm)
    const strongRssi = -54 + Math.round((Math.random() - 0.5) * 3);
    const sample = bleKalmanFilterEngine.processSample(beacon.beaconId, strongRssi);
    if (sample) {
      setActiveSamples(prev => ({ ...prev, [beacon.beaconId]: sample }));
      indoorNavigationEngine.processBleSample(beacon.beaconId, strongRssi);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.radarIcon}>📡</Text>
          <View>
            <Text style={styles.title}>BLE BEACON RADAR</Text>
            <Text style={styles.subtitle}>Kalman-Filtered Proximity Signals</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statusBar}>
        <Text style={styles.statusText}>
          Active Beacons: <Text style={styles.boldText}>{Object.keys(activeSamples).length}</Text>
        </Text>
        <TouchableOpacity
          style={[styles.simToggle, isSimulating && styles.simToggleActive]}
          onPress={() => setIsSimulating(!isSimulating)}
        >
          <Text style={[styles.simToggleText, isSimulating && styles.simToggleTextActive]}>
            {isSimulating ? '● Pulse Active' : '○ Paused'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.beaconList} showsVerticalScrollIndicator={false}>
        {allBeacons.map((beacon) => {
          const sample = activeSamples[beacon.beaconId];
          const isProximate = sample && sample.estimatedDistanceMeters <= 5.0;

          return (
            <TouchableOpacity
              key={beacon.beaconId}
              style={[styles.beaconRow, isProximate && styles.beaconRowProximate]}
              onPress={() => handleTriggerBeaconPulse(beacon)}
              activeOpacity={0.7}
            >
              <View style={styles.beaconInfo}>
                <View style={styles.beaconTitleRow}>
                  <Text style={styles.beaconName}>{beacon.name}</Text>
                  <Text style={styles.pillarTag}>{beacon.pillarId}</Text>
                </View>
                <Text style={styles.zoneName}>{beacon.zoneName}</Text>
                <Text style={styles.floorText}>
                  Floor: {beacon.level === -1 ? 'Level -1' : (beacon.level === 1 ? 'Level 1 FOB' : 'Level 0')}
                </Text>
              </View>

              {sample ? (
                <View style={styles.signalMetrics}>
                  <Text style={[styles.distanceText, isProximate && styles.distanceTextProximate]}>
                    ~{sample.estimatedDistanceMeters}m
                  </Text>
                  <Text style={styles.rssiText}>
                    Kalman: <Text style={styles.rssiVal}>{sample.filteredRssi} dBm</Text>
                  </Text>
                  <Text style={styles.rawRssiText}>Raw: {sample.rawRssi} dBm</Text>
                </View>
              ) : (
                <View style={styles.inactiveSignal}>
                  <Text style={styles.tapToSimulate}>Tap to ping</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    maxHeight: 380,
    ...Shadows.card
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  radarIcon: {
    fontSize: 22
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.5
  },
  subtitle: {
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
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: Radii.sm,
    marginBottom: Spacing.sm
  },
  statusText: {
    fontSize: 11,
    color: '#475569'
  },
  boldText: {
    fontWeight: '700',
    color: Colors.forestPrimary
  },
  simToggle: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: Radii.pill,
    backgroundColor: '#E2E8F0'
  },
  simToggleActive: {
    backgroundColor: '#DCFCE7'
  },
  simToggleText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B'
  },
  simToggleTextActive: {
    color: '#15803D'
  },
  beaconList: {
    maxHeight: 280
  },
  beaconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  beaconRowProximate: {
    backgroundColor: '#F0FDF4',
    borderRadius: Radii.md
  },
  beaconInfo: {
    flex: 1,
    marginRight: 8
  },
  beaconTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  beaconName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B'
  },
  pillarTag: {
    fontSize: 9,
    fontWeight: '700',
    color: '#0284C7',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 4,
    borderRadius: Radii.xs
  },
  zoneName: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2
  },
  floorText: {
    fontSize: 9,
    color: '#94A3B8'
  },
  signalMetrics: {
    alignItems: 'flex-end'
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155'
  },
  distanceTextProximate: {
    color: '#166534'
  },
  rssiText: {
    fontSize: 10,
    color: '#64748B'
  },
  rssiVal: {
    fontWeight: '700',
    color: '#0F172A'
  },
  rawRssiText: {
    fontSize: 8,
    color: '#94A3B8'
  },
  inactiveSignal: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Radii.sm,
    backgroundColor: '#F8FAFC'
  },
  tapToSimulate: {
    fontSize: 10,
    color: '#64748B'
  }
});
