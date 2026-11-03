import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Colors, Shadows, Radii, Spacing } from '../theme/tokens';
import {
  ElevatorIcon,
  RestroomIcon,
  WheelchairIcon,
  MetroIcon,
  TicketIcon,
  MapPinIcon
} from './Icons';

interface QuickActionBadgesProps {
  onSelectAction: (category: string) => void;
}

interface ActionCategory {
  id: string;
  label: string;
  sub: string;
  iconType: 'lift' | 'restroom' | 'accessible_wc' | 'metro' | 'tickets' | 'entrance';
  tintBg: string;
  tintBorder: string;
}

const CATEGORIES: ActionCategory[] = [
  { id: 'LIFT', label: 'Lifts & Elevators', sub: 'Step-Free', iconType: 'lift', tintBg: '#EFF6FF', tintBorder: '#BFDBFE' },
  { id: 'TOILET', label: 'Restrooms', sub: 'All Concourses', iconType: 'restroom', tintBg: '#ECFDF5', tintBorder: '#A7F3D0' },
  { id: 'ACCESSIBLE_TOILET', label: 'Divyangjan WC', sub: 'Wheelchair Spec', iconType: 'accessible_wc', tintBg: '#EFF6FF', tintBorder: '#BFDBFE' },
  { id: 'METRO', label: 'Metro FOB Link', sub: 'Terminal 3', iconType: 'metro', tintBg: '#F5F3FF', tintBorder: '#DDD6FE' },
  { id: 'TICKET_COUNTER', label: 'Tickets / PRS', sub: 'UTS & Booking', iconType: 'tickets', tintBg: '#FFFBEB', tintBorder: '#FDE68A' },
  { id: 'ENTRANCE', label: 'Station Gates', sub: 'T1 / T2 / T3', iconType: 'entrance', tintBg: '#F8FAFC', tintBorder: '#E2E8F0' }
];

export const QuickActionBadges: React.FC<QuickActionBadgesProps> = ({ onSelectAction }) => {
  const renderIcon = (type: string) => {
    switch (type) {
      case 'lift': return <ElevatorIcon size={18} color="#2563EB" />;
      case 'restroom': return <RestroomIcon size={18} color="#059669" />;
      case 'accessible_wc': return <WheelchairIcon size={18} color="#2563EB" />;
      case 'metro': return <MetroIcon size={18} color="#7C3AED" />;
      case 'tickets': return <TicketIcon size={18} color="#D97706" />;
      case 'entrance': return <MapPinIcon size={18} color="#334155" />;
      default: return <MapPinIcon size={18} color="#2563EB" />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>ESSENTIAL STATION AMENITIES</Text>
        <Text style={styles.subtitle}>Direct 1-tap navigation</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollList}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={styles.card}
            onPress={() => onSelectAction(cat.id)}
            activeOpacity={0.75}
          >
            <View style={[styles.iconBox, { backgroundColor: cat.tintBg, borderColor: cat.tintBorder }]}>
              {renderIcon(cat.iconType)}
            </View>
            <Text style={styles.label}>{cat.label}</Text>
            <Text style={styles.subText}>{cat.sub}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.xs,
    width: '100%'
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    paddingHorizontal: 2
  },
  title: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase'
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500'
  },
  scrollList: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
    minWidth: 100,
    ...Shadows.sm
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
    textAlign: 'center'
  },
  subText: {
    fontSize: 10,
    color: '#64748B',
    textAlign: 'center'
  }
});
