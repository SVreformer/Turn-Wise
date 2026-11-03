import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Colors, Shadows, Radii, Spacing } from '../theme/tokens';
import {
  WalkIcon,
  WheelchairIcon,
  SeniorIcon,
  FamilyIcon,
  AudioTactileIcon,
  CheckIcon
} from './Icons';

export interface ProfileMeta {
  id: string;
  name: string;
  iconType: 'walk' | 'wheelchair' | 'senior' | 'family' | 'audio';
  description: string;
  badge: string;
}

export const PROFILES: ProfileMeta[] = [
  {
    id: 'first_time',
    name: 'Standard Walk',
    iconType: 'walk',
    description: 'Direct concourse corridors with landmarks',
    badge: 'Standard'
  },
  {
    id: 'mobility_disabled',
    name: 'Step-Free / ♿',
    iconType: 'wheelchair',
    description: '100% elevators, lifts & gentle ramps only',
    badge: 'Step-Free'
  },
  {
    id: 'elderly',
    name: 'Senior Citizen',
    iconType: 'senior',
    description: 'Gentle slopes, avoids stairs & long detours',
    badge: 'Low Fatigue'
  },
  {
    id: 'child',
    name: 'Family / Luggage',
    iconType: 'family',
    description: 'Wide walking lanes & safety rail corridors',
    badge: 'Safe Corridors'
  },
  {
    id: 'visually_impaired',
    name: 'Audio / Tactile',
    iconType: 'audio',
    description: 'Tactile paving corridors & voice alerts',
    badge: 'Tactile'
  }
];

interface ProfilePickerProps {
  selectedProfileId: string;
  onSelectProfile: (profileId: string) => void;
}

export const ProfilePicker: React.FC<ProfilePickerProps> = ({
  selectedProfileId,
  onSelectProfile
}) => {
  const renderProfileIcon = (type: string, isSelected: boolean) => {
    const color = isSelected ? '#2563EB' : '#475569';
    switch (type) {
      case 'walk': return <WalkIcon size={18} color={color} />;
      case 'wheelchair': return <WheelchairIcon size={18} color={color} />;
      case 'senior': return <SeniorIcon size={18} color={color} />;
      case 'family': return <FamilyIcon size={18} color={color} />;
      case 'audio': return <AudioTactileIcon size={18} color={color} />;
      default: return <WalkIcon size={18} color={color} />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>ACCESSIBILITY & ROUTING PREFERENCES</Text>
        <Text style={styles.subtext}>Personalized pathfinding</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {PROFILES.map((p) => {
          const isSelected = p.id === selectedProfileId;

          return (
            <TouchableOpacity
              key={p.id}
              style={[
                styles.card,
                isSelected ? styles.cardSelected : styles.cardUnselected
              ]}
              onPress={() => onSelectProfile(p.id)}
              activeOpacity={0.8}
            >
              <View style={styles.cardTopRow}>
                <View style={[styles.iconBox, isSelected && styles.iconBoxSelected]}>
                  {renderProfileIcon(p.iconType, isSelected)}
                </View>
                <View style={[styles.badge, isSelected && styles.badgeSelected]}>
                  {isSelected ? (
                    <View style={styles.activeBadgeContent}>
                      <CheckIcon size={11} color="#2563EB" strokeWidth={3} />
                      <Text style={styles.badgeTextSelected}>ACTIVE</Text>
                    </View>
                  ) : (
                    <Text style={styles.badgeText}>{p.badge}</Text>
                  )}
                </View>
              </View>

              <Text style={[styles.name, isSelected && styles.nameSelected]} numberOfLines={1}>
                {p.name}
              </Text>
              <Text style={styles.description} numberOfLines={2}>
                {p.description}
              </Text>
            </TouchableOpacity>
          );
        })}
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
  subtext: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500'
  },
  scrollContent: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2
  },
  card: {
    width: 154,
    borderRadius: Radii.md,
    padding: 12,
    ...Shadows.sm
  },
  cardUnselected: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  cardSelected: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#2563EB'
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  iconBoxSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#BFDBFE'
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: Radii.pill,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  badgeSelected: {
    backgroundColor: '#DBEAFE',
    borderColor: '#93C5FD'
  },
  activeBadgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B'
  },
  badgeTextSelected: {
    fontSize: 9,
    fontWeight: '800',
    color: '#1D4ED8'
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4
  },
  nameSelected: {
    color: '#1D4ED8'
  },
  description: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15
  }
});
