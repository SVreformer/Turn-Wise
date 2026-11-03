import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Platform,
  ScrollView
} from 'react-native';
import { Colors, Shadows, Radii } from '../theme/tokens';
import { AppDownloadModal } from './AppDownloadModal';

export type DevicePreset = 'iphone15' | 'pixel8' | 'compact';
export type ViewMode = 'mobile' | 'desktop';

interface DeviceSpec {
  name: string;
  width: number;
  height: number;
  radius: number;
  hasDynamicIsland: boolean;
}

const DEVICE_SPECS: Record<DevicePreset, DeviceSpec> = {
  iphone15: {
    name: 'iPhone 15 Pro',
    width: 393,
    height: 852,
    radius: 48,
    hasDynamicIsland: true
  },
  pixel8: {
    name: 'Google Pixel 8',
    width: 412,
    height: 892,
    radius: 42,
    hasDynamicIsland: false
  },
  compact: {
    name: 'Standard Phone',
    width: 375,
    height: 812,
    radius: 40,
    hasDynamicIsland: false
  }
};

export interface MobileFrameContextType {
  isForceMobile: boolean;
  viewMode: ViewMode;
  toggleViewMode: () => void;
  devicePreset: DevicePreset;
  setDevicePreset: (preset: DevicePreset) => void;
  openDownloadModal: () => void;
}

export const MobileFrameContext = React.createContext<MobileFrameContextType>({
  isForceMobile: false,
  viewMode: 'mobile',
  toggleViewMode: () => {},
  devicePreset: 'iphone15',
  setDevicePreset: () => {},
  openDownloadModal: () => {}
});

interface MobileDeviceFrameProps {
  children: React.ReactNode;
}

export const MobileDeviceFrame: React.FC<MobileDeviceFrameProps> = ({ children }) => {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isPhysicalMobile = windowWidth < 640;

  const [viewMode, setViewMode] = useState<ViewMode>('mobile');
  const [devicePreset, setDevicePreset] = useState<DevicePreset>('iphone15');
  const [currentTime, setCurrentTime] = useState<string>('9:41 AM');
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  // Update clock every 30s
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const minStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
      setCurrentTime(`${hours}:${minStr} ${ampm}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const spec = DEVICE_SPECS[devicePreset];
  const isForceMobile = viewMode === 'mobile' && !isPhysicalMobile;

  // On actual physical phones or when user selects Desktop View on desktop:
  if (isPhysicalMobile || viewMode === 'desktop') {
    return (
      <MobileFrameContext.Provider
        value={{
          isForceMobile: false,
          viewMode,
          toggleViewMode: () => setViewMode(viewMode === 'mobile' ? 'desktop' : 'mobile'),
          devicePreset,
          setDevicePreset,
          openDownloadModal: () => setIsDownloadModalOpen(true)
        }}
      >
        <View style={styles.nativeContainer}>
          {!isPhysicalMobile && (
            <View style={styles.desktopFloatingToggle}>
              <TouchableOpacity
                style={[styles.floatingPillBtn, { backgroundColor: '#165B33', borderColor: '#10B981', marginBottom: 8 }]}
                onPress={() => setIsDownloadModalOpen(true)}
                activeOpacity={0.85}
              >
                <Text style={styles.floatingPillText}>📥 Download Mobile App</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.floatingPillBtn}
                onPress={() => setViewMode('mobile')}
                activeOpacity={0.85}
              >
                <Text style={styles.floatingPillText}>📱 Switch to Mobile Phone Frame</Text>
              </TouchableOpacity>
            </View>
          )}
          {children}
          <AppDownloadModal visible={isDownloadModalOpen} onClose={() => setIsDownloadModalOpen(false)} />
        </View>
      </MobileFrameContext.Provider>
    );
  }

  // Calculate scaled height to fit comfortable desktop browser viewport height
  const availableHeight = Math.max(680, windowHeight - 96);
  const frameHeight = Math.min(spec.height, availableHeight);
  const frameWidth = spec.width;

  return (
    <MobileFrameContext.Provider
      value={{
        isForceMobile,
        viewMode,
        toggleViewMode: () => setViewMode(viewMode === 'mobile' ? 'desktop' : 'mobile'),
        devicePreset,
        setDevicePreset,
        openDownloadModal: () => setIsDownloadModalOpen(true)
      }}
    >
      <View style={styles.outerStage}>
        {/* Top Control Bar for Simulator */}
        <View style={styles.simulatorToolbar}>
          <View style={styles.toolbarLeft}>
            <View style={styles.liveIndicatorDot} />
            <Text style={styles.toolbarBrand}>TURN WISE</Text>
            <View style={styles.mobileBadge}>
              <Text style={styles.mobileBadgeText}>📱 PHONE APP SIMULATOR</Text>
            </View>
          </View>

          <View style={styles.toolbarCenter}>
            {(['iphone15', 'pixel8', 'compact'] as DevicePreset[]).map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.presetBtn, devicePreset === p && styles.presetBtnActive]}
                onPress={() => setDevicePreset(p)}
                activeOpacity={0.8}
              >
                <Text style={[styles.presetBtnText, devicePreset === p && styles.presetBtnTextActive]}>
                  {DEVICE_SPECS[p].name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.toolbarRight}>
            <TouchableOpacity
              style={styles.downloadToolbarBtn}
              onPress={() => setIsDownloadModalOpen(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.downloadToolbarBtnText}>📥 Download App</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchModeBtn}
              onPress={() => setViewMode('desktop')}
              activeOpacity={0.85}
            >
              <Text style={styles.switchModeBtnText}>🖥️ Full Desktop</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Physical Smartphone Device Mockup Body */}
        <View style={styles.deviceStage}>
          {/* Left Buttons (Volume + Action) */}
          <View style={styles.sideButtonsLeft}>
            <View style={[styles.hardwareButton, { height: 26, marginBottom: 12 }]} />
            <View style={[styles.hardwareButton, { height: 45, marginBottom: 8 }]} />
            <View style={[styles.hardwareButton, { height: 45 }]} />
          </View>

          {/* Right Button (Power) */}
          <View style={styles.sideButtonsRight}>
            <View style={[styles.hardwareButton, { height: 60 }]} />
          </View>

          {/* Outer Phone Bezel */}
          <View
            style={[
              styles.phoneChassis,
              {
                width: frameWidth + 24,
                height: frameHeight + 24,
                borderRadius: spec.radius + 6
              }
            ]}
          >
            {/* Screen Glass */}
            <View
              style={[
                styles.screenGlass,
                {
                  width: frameWidth,
                  height: frameHeight,
                  borderRadius: spec.radius
                }
              ]}
            >
              {/* Smartphone Status Bar */}
              <View style={styles.statusBarContainer}>
                {/* Time */}
                <Text style={styles.statusTimeText}>{currentTime}</Text>

                {/* Dynamic Island / Notch */}
                {spec.hasDynamicIsland ? (
                  <View style={styles.dynamicIsland}>
                    <View style={styles.cameraLens} />
                    <View style={styles.sensorDot} />
                  </View>
                ) : (
                  <View style={styles.speakerSlot}>
                    <View style={styles.pinholeCamera} />
                  </View>
                )}

                {/* Telemetry Icons (5G, WiFi, Battery) */}
                <View style={styles.statusIconsRow}>
                  <Text style={styles.statusIconText}>5G</Text>
                  <Text style={styles.statusIconText}>📶</Text>
                  <View style={styles.batteryContainer}>
                    <View style={styles.batteryFill} />
                    <View style={styles.batteryCap} />
                  </View>
                </View>
              </View>

              {/* App Content Container */}
              <View style={styles.appViewport}>
                {children}
              </View>

              {/* Bottom Home Indicator Bar */}
              <View style={styles.homeIndicatorWrapper} pointerEvents="none">
                <View style={styles.homeIndicatorBar} />
              </View>
            </View>
          </View>
        </View>
        <AppDownloadModal visible={isDownloadModalOpen} onClose={() => setIsDownloadModalOpen(false)} />
      </View>
    </MobileFrameContext.Provider>
  );
};

const styles = StyleSheet.create({
  nativeContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    width: '100%',
    height: '100%'
  },
  desktopFloatingToggle: {
    position: 'absolute',
    top: 14,
    right: 18,
    zIndex: 9999
  },
  floatingPillBtn: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
    ...Shadows.floating
  },
  floatingPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700'
  },
  outerStage: {
    flex: 1,
    minHeight: '100%',
    backgroundColor: '#0B1120',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingBottom: 24
  },
  simulatorToolbar: {
    width: '100%',
    height: 52,
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16
  },
  toolbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  liveIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981'
  },
  toolbarBrand: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1
  },
  mobileBadge: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155'
  },
  mobileBadgeText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '800'
  },
  toolbarCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 8,
    padding: 3,
    gap: 4
  },
  presetBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6
  },
  presetBtnActive: {
    backgroundColor: '#2563EB'
  },
  presetBtnText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700'
  },
  presetBtnTextActive: {
    color: '#FFFFFF'
  },
  toolbarRight: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  downloadToolbarBtn: {
    backgroundColor: '#165B33',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10B981',
    marginRight: 8,
    ...Shadows.sm
  },
  downloadToolbarBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800'
  },
  switchModeBtn: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155'
  },
  switchModeBtnText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '700'
  },
  deviceStage: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center'
  },
  sideButtonsLeft: {
    position: 'absolute',
    left: -4,
    top: 110,
    zIndex: 1
  },
  sideButtonsRight: {
    position: 'absolute',
    right: -4,
    top: 135,
    zIndex: 1
  },
  hardwareButton: {
    width: 4,
    backgroundColor: '#334155',
    borderRadius: 2
  },
  phoneChassis: {
    backgroundColor: '#1E293B',
    borderWidth: 3,
    borderColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.65,
    shadowRadius: 36,
    elevation: 25
  },
  screenGlass: {
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    position: 'relative',
    flexDirection: 'column'
  },
  statusBarContainer: {
    height: 44,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 999
  },
  statusTimeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    width: 60
  },
  dynamicIsland: {
    width: 104,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: 10,
    gap: 6
  },
  cameraLens: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B'
  },
  sensorDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#1E3A8A'
  },
  speakerSlot: {
    width: 60,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center'
  },
  pinholeCamera: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#000000'
  },
  statusIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: 60,
    justifyContent: 'flex-end'
  },
  statusIconText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F172A'
  },
  batteryContainer: {
    width: 22,
    height: 11,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#0F172A',
    padding: 1,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative'
  },
  batteryFill: {
    width: '90%',
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 1.5
  },
  batteryCap: {
    position: 'absolute',
    right: -3,
    width: 2,
    height: 4,
    backgroundColor: '#0F172A',
    borderTopRightRadius: 1,
    borderBottomRightRadius: 1
  },
  appViewport: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    position: 'relative'
  },
  homeIndicatorWrapper: {
    height: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  homeIndicatorBar: {
    width: 130,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#0F172A'
  }
});

