import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { AppDownloadModal } from './AppDownloadModal';

export type DevicePreset = 'iphone15' | 'pixel8' | 'compact';
export type ViewMode = 'mobile' | 'desktop';

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
  viewMode: 'desktop',
  toggleViewMode: () => {},
  devicePreset: 'compact',
  setDevicePreset: () => {},
  openDownloadModal: () => {}
});

interface MobileDeviceFrameProps {
  children: React.ReactNode;
}

/**
 * Clean, modern responsive container for Turn Wise.
 * Allows the website to fill the browser viewport naturally without
 * artificial phone frames, notches, or clumsy simulator bezels.
 */
export const MobileDeviceFrame: React.FC<MobileDeviceFrameProps> = ({ children }) => {
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  return (
    <MobileFrameContext.Provider
      value={{
        isForceMobile: false,
        viewMode: 'desktop',
        toggleViewMode: () => {},
        devicePreset: 'compact',
        setDevicePreset: () => {},
        openDownloadModal: () => setIsDownloadModalOpen(true)
      }}
    >
      <View style={styles.nativeContainer}>
        {children}
        <AppDownloadModal visible={isDownloadModalOpen} onClose={() => setIsDownloadModalOpen(false)} />
      </View>
    </MobileFrameContext.Provider>
  );
};

const styles = StyleSheet.create({
  nativeContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#F8FAFC'
  }
});
