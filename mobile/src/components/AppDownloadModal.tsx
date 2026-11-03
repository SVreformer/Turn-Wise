import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  SafeAreaView,
  ScrollView,
  Image,
  Platform,
  useWindowDimensions,
  Linking
} from 'react-native';
import { Colors, Shadows, Radii, Spacing } from '../theme/tokens';
import { useNavigationStore } from '../store/navigationStore';

interface AppDownloadModalProps {
  visible: boolean;
  onClose: () => void;
}

type InstallTab = 'instant' | 'apk' | 'ios';

export const AppDownloadModal: React.FC<AppDownloadModalProps> = ({ visible, onClose }) => {
  const { width: windowWidth } = useWindowDimensions();
  const isDesktop = windowWidth >= 768;
  const { language } = useNavigationStore();

  const [activeTab, setActiveTab] = useState<InstallTab>('instant');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installSuccess, setInstallSuccess] = useState<boolean>(false);

  // Capture native browser PWA install prompt
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstallSuccess(true);
      }
      setDeferredPrompt(null);
    } else {
      // Fallback instructions if native prompt isn't supported or already installed
      setActiveTab('instant');
    }
  };

  const handleDownloadApk = () => {
    const apkUrl = 'https://github.com/SVreformer/Turn-Wise/releases/download/v1.0.0/TurnWise-v1.0.0.apk';
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(apkUrl, '_blank');
    } else {
      Linking.openURL(apkUrl).catch(() => {});
    }
  };

  const websiteUrl = 'https://svreformer.github.io/Turn-Wise/';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(websiteUrl)}&margin=10`;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <SafeAreaView style={styles.modalOverlay}>
        <View style={[styles.container, isDesktop && styles.containerDesktop]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.badgeRow}>
                <View style={styles.appBadge}>
                  <Text style={styles.appBadgeText}>📱 OFFICIAL MOBILE APP</Text>
                </View>
                <View style={styles.versionBadge}>
                  <Text style={styles.versionBadgeText}>v1.0.0 RELEASE</Text>
                </View>
              </View>
              <Text style={styles.headerTitle}>
                {language === 'kn'
                  ? 'ಟರ್ನ್ ವೈಸ್ ಮೊಬೈಲ್ ಆ್ಯಪ್ ಡೌನ್‌ಲೋಡ್'
                  : language === 'hi'
                  ? 'टर्न वाइज मोबाइल ऐप डाउनलोड'
                  : 'Get the Turn Wise Mobile App'}
              </Text>
              <Text style={styles.headerSub}>
                {language === 'kn'
                  ? 'ನಿಮ್ಮ ಫೋನ್‌ನಲ್ಲಿ ಸ್ಥಾಪಿಸಿ ಮತ್ತು ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿ ನಿಲ್ದಾಣ ನ್ಯಾವಿಗೇಷನ್ ಬಳಸಿ'
                  : language === 'hi'
                  ? 'अपने फोन में इंस्टॉल करें और ऑफलाइन स्टेशन नेविगेशन का उपयोग करें'
                  : 'Install directly on your smartphone for offline indoor station navigation'}
              </Text>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.8}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Platform Switcher Tabs */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'instant' && styles.tabBtnActive]}
              onPress={() => setActiveTab('instant')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabBtnText, activeTab === 'instant' && styles.tabBtnTextActive]}>
                ⚡ Instant Install (Android / Web)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'apk' && styles.tabBtnActive]}
              onPress={() => setActiveTab('apk')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabBtnText, activeTab === 'apk' && styles.tabBtnTextActive]}>
                🤖 Android APK File
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'ios' && styles.tabBtnActive]}
              onPress={() => setActiveTab('ios')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabBtnText, activeTab === 'ios' && styles.tabBtnTextActive]}>
                🍏 iPhone / iOS
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.bodyScroll} contentContainerStyle={styles.bodyContent}>
            {/* TAB 1: INSTANT INSTALL (PWA WebAPK) */}
            {activeTab === 'instant' && (
              <View style={styles.tabContent}>
                <View style={styles.highlightCard}>
                  <View style={styles.highlightIconCol}>
                    <Text style={{ fontSize: 32 }}>📲</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.highlightTitle}>Install on Phone (1-Tap WebAPK)</Text>
                    <Text style={styles.highlightDesc}>
                      No Google Play Store needed! Installs directly onto your phone’s home screen and app drawer as a native standalone app.
                    </Text>
                  </View>
                </View>

                {deferredPrompt ? (
                  <TouchableOpacity
                    style={styles.primaryActionBtn}
                    onPress={handleInstallClick}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.primaryActionBtnText}>
                      📲 Click to Install Turn Wise on This Device
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.stepsCard}>
                    <Text style={styles.stepsCardTitle}>How to Install in 3 Seconds:</Text>
                    <View style={styles.stepItem}>
                      <View style={styles.stepNum}>
                        <Text style={styles.stepNumText}>1</Text>
                      </View>
                      <Text style={styles.stepText}>
                        On your Android phone, tap the <Text style={{ fontWeight: '800' }}>three dots (⋮)</Text> menu in the top right corner of Chrome.
                      </Text>
                    </View>
                    <View style={styles.stepItem}>
                      <View style={styles.stepNum}>
                        <Text style={styles.stepNumText}>2</Text>
                      </View>
                      <Text style={styles.stepText}>
                        Tap <Text style={{ fontWeight: '800', color: Colors.forestPrimary }}>"Install app"</Text> or <Text style={{ fontWeight: '800' }}>"Add to Home screen"</Text>.
                      </Text>
                    </View>
                    <View style={styles.stepItem}>
                      <View style={styles.stepNum}>
                        <Text style={styles.stepNumText}>3</Text>
                      </View>
                      <Text style={styles.stepText}>
                        Tap <Text style={{ fontWeight: '800' }}>Install</Text>. The Turn Wise app icon will appear on your home screen and open in full-screen native mode!
                      </Text>
                    </View>
                  </View>
                )}

                {/* QR Code for PC Viewers */}
                <View style={styles.qrSection}>
                  <Text style={styles.qrTitle}>Viewing on a Computer or Laptop?</Text>
                  <Text style={styles.qrSub}>
                    Point your phone’s camera at the QR code below to immediately open and install on your smartphone:
                  </Text>
                  <View style={styles.qrWrapper}>
                    <Image source={{ uri: qrCodeUrl }} style={styles.qrImage} resizeMode="contain" />
                  </View>
                  <Text style={styles.qrUrlText}>{websiteUrl}</Text>
                </View>
              </View>
            )}

            {/* TAB 2: ANDROID APK DIRECT DOWNLOAD */}
            {activeTab === 'apk' && (
              <View style={styles.tabContent}>
                <View style={[styles.highlightCard, { backgroundColor: '#F0FDF4', borderColor: '#86EFAC' }]}>
                  <View style={styles.highlightIconCol}>
                    <Text style={{ fontSize: 32 }}>🤖</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.highlightTitle, { color: '#166534' }]}>Standalone Android APK Package</Text>
                    <Text style={[styles.highlightDesc, { color: '#15803D' }]}>
                      Direct binary installer (`.apk`) for physical Android devices. Includes complete offline KSR CAD maps, BoardingSure, and sensory dead reckoning.
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.primaryActionBtn, { backgroundColor: '#165B33' }]}
                  onPress={handleDownloadApk}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryActionBtnText}>
                    📥 Download TurnWise-v1.0.0.apk (Direct File)
                  </Text>
                </TouchableOpacity>

                <View style={styles.stepsCard}>
                  <Text style={styles.stepsCardTitle}>Installation Instructions for Android APK:</Text>
                  <View style={styles.stepItem}>
                    <View style={styles.stepNum}>
                      <Text style={styles.stepNumText}>1</Text>
                    </View>
                    <Text style={styles.stepText}>
                      Tap the download button above or open the download link on your Android device.
                    </Text>
                  </View>
                  <View style={styles.stepItem}>
                    <View style={styles.stepNum}>
                      <Text style={styles.stepNumText}>2</Text>
                    </View>
                    <Text style={styles.stepText}>
                      When downloaded, tap the notification or open your phone's <Text style={{ fontWeight: '800' }}>Downloads</Text> folder.
                    </Text>
                  </View>
                  <View style={styles.stepItem}>
                    <View style={styles.stepNum}>
                      <Text style={styles.stepNumText}>3</Text>
                    </View>
                    <Text style={styles.stepText}>
                      Tap <Text style={{ fontWeight: '800' }}>Install</Text> (if prompted, enable <Text style={{ fontWeight: '700' }}>"Allow from this source"</Text> in Settings).
                    </Text>
                  </View>
                </View>

                {/* Cloud Build with EAS */}
                <View style={styles.devCard}>
                  <Text style={styles.devCardTitle}>Need to build your own custom APK with EAS?</Text>
                  <Text style={styles.devCardCode}>eas build -p android --profile preview</Text>
                </View>
              </View>
            )}

            {/* TAB 3: IPHONE / IOS (SAFARI) */}
            {activeTab === 'ios' && (
              <View style={styles.tabContent}>
                <View style={[styles.highlightCard, { backgroundColor: '#F8FAFC', borderColor: '#CBD5E1' }]}>
                  <View style={styles.highlightIconCol}>
                    <Text style={{ fontSize: 32 }}>🍏</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.highlightTitle}>Install on iPhone & iPad</Text>
                    <Text style={styles.highlightDesc}>
                      Apple iOS supports Progressive Web Apps directly via Safari with full offline caching and native edge-to-edge full-screen display.
                    </Text>
                  </View>
                </View>

                <View style={styles.stepsCard}>
                  <Text style={styles.stepsCardTitle}>How to Install on iPhone:</Text>
                  <View style={styles.stepItem}>
                    <View style={styles.stepNum}>
                      <Text style={styles.stepNumText}>1</Text>
                    </View>
                    <Text style={styles.stepText}>
                      Open <Text style={{ fontWeight: '800', color: '#2563EB' }}>{websiteUrl}</Text> in the <Text style={{ fontWeight: '800' }}>Safari</Text> browser on your iPhone.
                    </Text>
                  </View>
                  <View style={styles.stepItem}>
                    <View style={styles.stepNum}>
                      <Text style={styles.stepNumText}>2</Text>
                    </View>
                    <Text style={styles.stepText}>
                      Tap the <Text style={{ fontWeight: '800' }}>Share</Text> button at the bottom of the screen (the square box with an arrow pointing up 📤).
                    </Text>
                  </View>
                  <View style={styles.stepItem}>
                    <View style={styles.stepNum}>
                      <Text style={styles.stepNumText}>3</Text>
                    </View>
                    <Text style={styles.stepText}>
                      Scroll down and tap <Text style={{ fontWeight: '800', color: Colors.forestPrimary }}>"Add to Home Screen"</Text>.
                    </Text>
                  </View>
                  <View style={styles.stepItem}>
                    <View style={styles.stepNum}>
                      <Text style={styles.stepNumText}>4</Text>
                    </View>
                    <Text style={styles.stepText}>
                      Tap <Text style={{ fontWeight: '800' }}>Add</Text> in the top right. Turn Wise is now installed on your home screen!
                    </Text>
                  </View>
                </View>

                {/* QR Code for PC Viewers */}
                <View style={styles.qrSection}>
                  <Text style={styles.qrTitle}>Scan with iPhone Camera:</Text>
                  <View style={styles.qrWrapper}>
                    <Image source={{ uri: qrCodeUrl }} style={styles.qrImage} resizeMode="contain" />
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={onClose} style={styles.closeFooterBtn} activeOpacity={0.8}>
              <Text style={styles.closeFooterBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.sm
  },
  container: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxHeight: '92%',
    borderRadius: 20,
    overflow: 'hidden',
    ...Shadows.floating
  },
  containerDesktop: {
    maxWidth: 680
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#F8FAFC'
  },
  headerLeft: {
    flex: 1
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6
  },
  appBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#86EFAC'
  },
  appBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#166534'
  },
  versionBadge: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#C7D2FE'
  },
  versionBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#3730A3'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A'
  },
  headerSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
    lineHeight: 16
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569'
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F1F5F9',
    gap: 6
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#E2E8F0'
  },
  tabBtnActive: {
    backgroundColor: '#165B33'
  },
  tabBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    textAlign: 'center'
  },
  tabBtnTextActive: {
    color: '#FFFFFF'
  },
  bodyScroll: {
    flexGrow: 1
  },
  bodyContent: {
    padding: 20
  },
  tabContent: {
    gap: 16
  },
  highlightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    borderRadius: 14,
    padding: 14
  },
  highlightIconCol: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm
  },
  highlightTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E3A8A'
  },
  highlightDesc: {
    fontSize: 12,
    color: '#1E40AF',
    marginTop: 3,
    lineHeight: 16
  },
  primaryActionBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    ...Shadows.card
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800'
  },
  stepsCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 16,
    gap: 12
  },
  stepsCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10
  },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#165B33',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1
  },
  stepNumText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800'
  },
  stepText: {
    flex: 1,
    fontSize: 12,
    color: '#334155',
    lineHeight: 17
  },
  qrSection: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 18,
    marginTop: 8
  },
  qrTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center'
  },
  qrSub: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 12,
    maxWidth: 420
  },
  qrWrapper: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    ...Shadows.card
  },
  qrImage: {
    width: 170,
    height: 170
  },
  qrUrlText: {
    fontSize: 11,
    color: '#2563EB',
    fontWeight: '700',
    marginTop: 10
  },
  devCard: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 12,
    marginTop: 6
  },
  devCardTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 6
  },
  devCardCode: {
    fontSize: 12,
    fontWeight: '800',
    color: '#38BDF8',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    alignItems: 'flex-end'
  },
  closeFooterBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#E2E8F0'
  },
  closeFooterBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569'
  }
});
