import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Colors, Shadows, Radii, Spacing } from '../theme/tokens';
import {
  CompassIcon,
  TrainIcon,
  SparkleIcon,
  QrIcon
} from './Icons';

export type TabKey = 'home' | 'facilities' | 'assistant' | 'qrScan';

interface BottomNavBarProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
}

interface TabItem {
  key: TabKey;
  label: string;
  iconType: 'compass' | 'train' | 'ai' | 'qr';
  badge?: string;
}

const TABS: TabItem[] = [
  { key: 'home', label: 'Navigation', iconType: 'compass' },
  { key: 'facilities', label: 'Directory', iconType: 'train' },
  { key: 'assistant', label: 'AI Concierge', iconType: 'ai', badge: 'AI' },
  { key: 'qrScan', label: 'Indoor Nav', iconType: 'qr', badge: 'BLE' }
];

export const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeTab, onSelectTab }) => {
  const renderIcon = (type: string, isActive: boolean) => {
    const color = isActive ? Colors.forestPrimary : Colors.textSecondary;
    switch (type) {
      case 'compass': return <CompassIcon size={20} color={color} />;
      case 'train': return <TrainIcon size={20} color={color} />;
      case 'ai': return <SparkleIcon size={20} color={color} />;
      case 'qr': return <QrIcon size={20} color={color} />;
      default: return <CompassIcon size={20} color={color} />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.bar}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabButton, isActive && styles.tabButtonActive]}
              onPress={() => onSelectTab(tab.key)}
              activeOpacity={0.75}
            >
              <View style={styles.iconWrapper}>
                {renderIcon(tab.iconType, isActive)}
                {tab.badge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{tab.badge}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
              {isActive && <View style={styles.activeDot} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    ...Shadows.floating
  },
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: Spacing.sm
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 16,
    borderRadius: Radii.md,
    minWidth: 76
  },
  tabButtonActive: {
    backgroundColor: '#F0FDF4'
  },
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -12,
    backgroundColor: Colors.crimsonPrimary,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800'
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 0.1
  },
  tabLabelActive: {
    color: Colors.forestPrimary,
    fontWeight: '700'
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.forestPrimary,
    marginTop: 3
  }
});
