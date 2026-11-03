import React, { useState } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { HomeScreen } from './src/screens/HomeScreen';
import { AssistantChatScreen } from './src/screens/AssistantChatScreen';
import { FacilityFinderScreen } from './src/screens/FacilityFinderScreen';
import { PlatformDetailScreen } from './src/screens/PlatformDetailScreen';
import { QrScanScreen } from './src/screens/QrScanScreen';
import { IndoorNavigationScreen } from './src/addons/indoor-navigation';
import { BottomNavBar, TabKey } from './src/components/BottomNavBar';
import { MobileDeviceFrame, MobileFrameContext } from './src/components/MobileDeviceFrame';
import { useNavigationStore } from './src/store/navigationStore';
import { RouteResult } from './src/services/localRouter';

type ScreenName = 'home' | 'assistant' | 'facilities' | 'platformDetail' | 'qrScan';

function MainApp() {
  const { width } = useWindowDimensions();
  const { isForceMobile } = React.useContext(MobileFrameContext);
  const isDesktop = isForceMobile ? false : width >= 1024;
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('home');
  const [selectedPlatform, setSelectedPlatform] = useState<any>(null);

  const { startNavigation, setStartNode, setDestinationNode, isNavigating, isFullscreenMap } = useNavigationStore();

  const handleStartRouteFromAssistant = (route: RouteResult) => {
    if (route.start) {
      setStartNode(route.start, 'SEARCH');
    }
    if (route.destination) {
      setDestinationNode(route.destination, 'SEARCH');
    }
    startNavigation(route);
    setCurrentScreen('home');
  };

  const activeTab: TabKey =
    currentScreen === 'home'
      ? 'home'
      : currentScreen === 'facilities'
      ? 'facilities'
      : currentScreen === 'assistant'
      ? 'assistant'
      : currentScreen === 'qrScan'
      ? 'qrScan'
      : 'home';

  const handleSelectTab = (tab: TabKey) => {
    setCurrentScreen(tab);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'assistant':
        return (
          <AssistantChatScreen
            onBack={() => setCurrentScreen('home')}
            onStartRoute={handleStartRouteFromAssistant}
          />
        );
      case 'facilities':
        return (
          <FacilityFinderScreen
            onBack={() => setCurrentScreen('home')}
            onNavigateToFacility={() => setCurrentScreen('home')}
          />
        );
      case 'platformDetail':
        return (
          <PlatformDetailScreen
            platform={selectedPlatform}
            onBack={() => setCurrentScreen('home')}
            onStartNavigate={() => setCurrentScreen('home')}
            onAskAssistant={() => setCurrentScreen('assistant')}
          />
        );
      case 'qrScan':
        return (
          <IndoorNavigationScreen
            onBack={() => setCurrentScreen('home')}
          />
        );
      case 'home':
      default:
        return (
          <HomeScreen
            onOpenAssistant={() => setCurrentScreen('assistant')}
            onOpenFacilities={() => setCurrentScreen('facilities')}
            onOpenPlatformDetail={(platform) => {
              setSelectedPlatform(platform);
              setCurrentScreen('platformDetail');
            }}
            onOpenQrScan={() => setCurrentScreen('qrScan')}
          />
        );
    }
  };

  const showBottomBar = !isDesktop && !isNavigating && !isFullscreenMap && currentScreen !== 'platformDetail';

  return (
    <View style={styles.container}>
      <StatusBar style="dark" backgroundColor="#FFFFFF" />
      <View style={styles.screenContent}>
        {renderScreen()}
      </View>
      {showBottomBar && (
        <BottomNavBar
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
        />
      )}
    </View>
  );
}

export default function App() {
  return (
    <MobileDeviceFrame>
      <MainApp />
    </MobileDeviceFrame>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF'
  },
  screenContent: {
    flex: 1
  }
});
