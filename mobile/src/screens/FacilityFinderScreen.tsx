import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  SafeAreaView
} from 'react-native';
import { useNavigationStore } from '../store/navigationStore';
import { apiService } from '../services/apiService';
import { localRouter } from '../services/localRouter';
import { Colors, Shadows, Radii, Spacing, Typography } from '../theme/tokens';

interface FacilityFinderScreenProps {
  onBack: () => void;
  onNavigateToFacility: () => void;
}

export const FacilityFinderScreen: React.FC<FacilityFinderScreenProps> = ({
  onBack,
  onNavigateToFacility
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [wheelchairOnly, setWheelchairOnly] = useState<boolean>(false);
  const [facilities, setFacilities] = useState<any[]>([]);

  const { startNode, selectedProfile, setDestinationNode, calculateRoute } = useNavigationStore();

  useEffect(() => {
    loadFacilities();
  }, [selectedCategory, wheelchairOnly]);

  const loadFacilities = async () => {
    const cat = selectedCategory === 'ALL' ? undefined : selectedCategory;
    const list = await apiService.getFacilities(cat, wheelchairOnly);
    setFacilities(list);
  };

  const handleNavigate = async (facility: any) => {
    const destNode = localRouter.getFacilityNode(facility);
    const { startNode, setStartNode, setDestinationNode, calculateRoute } = useNavigationStore.getState();
    setDestinationNode(destNode, 'FACILITY');
    if (!startNode) {
      const defaultStartId = destNode.id === 'node_entry_t1_main_east' ? 'node_entry_t1_main_west' : 'node_entry_t1_main_east';
      const defaultStart = localRouter.nodeDict.get(defaultStartId);
      if (defaultStart) {
        setStartNode(defaultStart, 'SEARCH');
      }
    }
    await calculateRoute();
    onNavigateToFacility();
  };

  const handleSetStart = async (facility: any) => {
    const stNode = localRouter.getFacilityNode(facility);
    const { destinationNode, setStartNode, calculateRoute } = useNavigationStore.getState();
    setStartNode(stNode, 'FACILITY');
    if (destinationNode) {
      await calculateRoute();
    }
    onBack();
  };

  const handleSetDestination = async (facility: any) => {
    const destNode = localRouter.getFacilityNode(facility);
    const { startNode, setStartNode, setDestinationNode, calculateRoute } = useNavigationStore.getState();
    setDestinationNode(destNode, 'FACILITY');
    if (!startNode) {
      const defaultStartId = destNode.id === 'node_entry_t1_main_east' ? 'node_entry_t1_main_west' : 'node_entry_t1_main_east';
      const defaultStart = localRouter.nodeDict.get(defaultStartId);
      if (defaultStart) {
        setStartNode(defaultStart, 'SEARCH');
      }
    }
    await calculateRoute();
    onBack();
  };

  const categories = [
    { id: 'ALL', label: 'All' },
    { id: 'TOILET', label: 'Restrooms' },
    { id: 'LIFT', label: 'Lifts' },
    { id: 'RAMP', label: 'Ramps' },
    { id: 'TICKET_COUNTER', label: 'Tickets' },
    { id: 'METRO', label: 'Metro' }
  ];

  const renderFacility = ({ item }: { item: any }) => {
    const isBlocked = item.status === 'BLOCKED';
    return (
      <View style={styles.facilityCard}>
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => handleSetDestination(item)}
          style={{ width: '100%' }}
        >
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.facilityTitle}>{item.name}</Text>
              <Text style={styles.facilityType}>{item.type}</Text>
            </View>
            <View style={[styles.statusBadge, isBlocked ? styles.statusBlocked : styles.statusOpen]}>
              <Text style={[styles.statusText, isBlocked && styles.statusBlockedText]}>
                {isBlocked ? '● BLOCKED' : '● OPEN'}
              </Text>
            </View>
          </View>

          <Text style={styles.descText}>{item.description}</Text>
        </TouchableOpacity>

        <View style={styles.footerRow}>
          <Text style={styles.accessText}>
            {item.accessibility?.wheelchairAccessible ? '✓ Wheelchair accessible' : 'Standard facility'}
          </Text>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <TouchableOpacity
              style={styles.auxBtn}
              onPress={() => handleSetStart(item)}
              activeOpacity={0.8}
            >
              <Text style={styles.auxBtnText}>📍 Start</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.auxBtn}
              onPress={() => handleSetDestination(item)}
              activeOpacity={0.8}
            >
              <Text style={styles.auxBtnText}>🎯 Dest</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navBtn}
              onPress={() => handleNavigate(item)}
              activeOpacity={0.85}
            >
              <Text style={styles.navBtnText}>🧭 Go →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Station Directory</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: Spacing.md, gap: Spacing.xs }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterTab,
                selectedCategory === item.id && styles.filterTabActive
              ]}
              onPress={() => setSelectedCategory(item.id)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  selectedCategory === item.id && styles.filterTabTextActive
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={facilities}
        keyExtractor={(item) => item.id}
        renderItem={renderFacility}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bgSecondary
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    backgroundColor: Colors.bgPrimary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border
  },
  backBtn: {
    paddingVertical: 4
  },
  backBtnText: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '600'
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700'
  },
  filterRow: {
    backgroundColor: Colors.bgPrimary,
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border
  },
  filterTab: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radii.pill,
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.border
  },
  filterTabActive: {
    backgroundColor: Colors.goldTintSolid,
    borderColor: Colors.goldPrimary
  },
  filterTabText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '500'
  },
  filterTabTextActive: {
    color: Colors.goldDark,
    fontWeight: '700'
  },
  listContent: {
    padding: Spacing.sm,
    gap: Spacing.xs + 2
  },
  facilityCard: {
    backgroundColor: Colors.bgPrimary,
    borderRadius: Radii.md,
    padding: Spacing.sm + 2,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6
  },
  facilityTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700'
  },
  facilityType: {
    color: Colors.textSecondary,
    fontSize: 10,
    marginTop: 1,
    fontWeight: '600'
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.sm,
    borderWidth: 1
  },
  statusOpen: {
    backgroundColor: Colors.successLight,
    borderColor: Colors.success
  },
  statusBlocked: {
    backgroundColor: Colors.errorLight,
    borderColor: Colors.error
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.success
  },
  statusBlockedText: {
    color: Colors.error
  },
  descText: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: Spacing.sm
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  accessText: {
    color: Colors.success,
    fontSize: 11,
    fontWeight: '600'
  },
  auxBtn: {
    backgroundColor: Colors.bgSecondary,
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical: 6,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.border
  },
  auxBtnText: {
    color: Colors.textPrimary,
    fontSize: 11,
    fontWeight: '600'
  },
  navBtn: {
    backgroundColor: Colors.goldPrimary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radii.sm
  },
  navBtnText: {
    color: Colors.charcoalPrimary,
    fontSize: 11,
    fontWeight: '700'
  }
});
