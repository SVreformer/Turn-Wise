import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView
} from 'react-native';
import { StationNode, localRouter } from '../services/localRouter';
import platformsData from '../data/station/platforms.json';
import facilitiesData from '../data/station/facilities.json';
import { Colors, Shadows, Radii, Spacing } from '../theme/tokens';
import {
  SearchIcon,
  TrainIcon,
  ElevatorIcon,
  RestroomIcon,
  WheelchairIcon,
  MetroIcon,
  TicketIcon,
  MapPinIcon,
  CloseIcon,
  ArrowRightIcon
} from './Icons';

interface LocationSearchModalProps {
  visible: boolean;
  mode: 'source' | 'destination';
  onClose: () => void;
  onSelectNode: (node: StationNode) => void;
}

export const LocationSearchModal: React.FC<LocationSearchModalProps> = ({
  visible,
  mode,
  onClose,
  onSelectNode
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'PLATFORMS' | 'FACILITIES' | 'ENTRANCES'>('ALL');

  // Search items list
  const searchResults = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    let candidates: {
      node: StationNode;
      category: 'PLATFORMS' | 'FACILITIES' | 'ENTRANCES';
      badgeText: string;
      iconType: 'train' | 'lift' | 'restroom' | 'accessible_wc' | 'metro' | 'ticket' | 'entrance';
    }[] = [];

    // 1. Platforms
    for (const p of platformsData) {
      const node = localRouter.nodeDict.get(`node_pf${p.number}_center`) || localRouter.nodeDict.get(`node_pf${p.number}_west`);
      if (node) {
        candidates.push({
          node: { ...node, name: `Platform ${p.number}` },
          category: 'PLATFORMS',
          badgeText: `Platform Level 0 • Boarding tracks`,
          iconType: 'train'
        });
      }
    }

    // 2. Facilities
    for (const f of facilitiesData) {
      const node = localRouter.getFacilityNode(f);
      if (node) {
        let iconType: 'train' | 'lift' | 'restroom' | 'accessible_wc' | 'metro' | 'ticket' | 'entrance' = 'entrance';
        if (f.type === 'LIFT') iconType = 'lift';
        else if (f.type === 'TOILET') iconType = 'restroom';
        else if (f.type === 'ACCESSIBLE_TOILET') iconType = 'accessible_wc';
        else if (f.type === 'METRO' || f.type === 'METRO_LINK') iconType = 'metro';
        else if (f.type === 'TICKET_COUNTER') iconType = 'ticket';

        candidates.push({
          node: { ...node, name: f.name },
          category: 'FACILITIES',
          badgeText: `${f.level === -1 ? 'Subway' : (f.level === 1 ? 'FOB Level 1' : 'Concourse Level 0')} • ${f.accessibility?.wheelchairAccessible ? 'Step-Free' : 'Standard'}`,
          iconType
        });
      }
    }

    // 3. Entrances & Terminals
    const entranceNodes = [
      { id: 'node_entry_t1_main_east', name: 'Main Entrance (Terminal 1 - East Concourse)' },
      { id: 'node_entry_t1_main_west', name: 'Main Entrance (Terminal 1 - West Concourse)' },
      { id: 'node_entry_t1_center', name: 'Terminal 1 Center Concourse Gate' },
      { id: 'node_entry_t2_east', name: 'Terminal 2 Entrance (Okkalpuram East)' },
      { id: 'node_entry_t2_okklapura', name: 'Terminal 2 Okkalpuram Gate' },
      { id: 'node_entry_t3_metro', name: 'Terminal 3 / Metro Link Concourse' },
      { id: 'node_t1_ramp_subway_l0', name: 'Majestic Passenger Subway Entrance (Ramp)' },
      { id: 'node_t1_stair_subway_l0', name: 'Majestic Passenger Subway Entrance (Stairs)' },
      { id: 'node_fob2_central_bridge', name: 'FOB 2 Okkalpuram Accessible Bridge' }
    ];

    for (const ent of entranceNodes) {
      const node = localRouter.nodeDict.get(ent.id);
      if (node) {
        candidates.push({
          node: { ...node, name: ent.name },
          category: 'ENTRANCES',
          badgeText: `${node.level === -1 ? 'Subway' : (node.level === 1 ? 'FOB Level 1' : 'Ground Concourse')}`,
          iconType: 'entrance'
        });
      }
    }

    // Filter by category
    if (selectedCategory !== 'ALL') {
      candidates = candidates.filter((c) => c.category === selectedCategory);
    }

    // Filter by query
    if (q) {
      const pfNumMatch = q.match(/(?:platform|plat|pf)\s*(\d{1,2})/i) || q.match(/^(\d{1,2})$/);
      if (pfNumMatch) {
        const num = parseInt(pfNumMatch[1], 10);
        return candidates.filter((c) => c.node.name.toLowerCase().includes(`platform ${num}`));
      }

      return candidates.filter((c) =>
        c.node.name.toLowerCase().includes(q) ||
        c.badgeText.toLowerCase().includes(q) ||
        (c.node.visualLandmark || '').toLowerCase().includes(q)
      );
    }

    return candidates;
  }, [searchQuery, selectedCategory]);

  const renderCandidateIcon = (type: string) => {
    switch (type) {
      case 'train': return <TrainIcon size={18} color="#2563EB" />;
      case 'lift': return <ElevatorIcon size={18} color="#2563EB" />;
      case 'restroom': return <RestroomIcon size={18} color="#059669" />;
      case 'accessible_wc': return <WheelchairIcon size={18} color="#2563EB" />;
      case 'metro': return <MetroIcon size={18} color="#7C3AED" />;
      case 'ticket': return <TicketIcon size={18} color="#D97706" />;
      case 'entrance': return <MapPinIcon size={18} color="#0F172A" />;
      default: return <MapPinIcon size={18} color="#2563EB" />;
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.backBtn} activeOpacity={0.8}>
              <Text style={styles.backBtnText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>
              {mode === 'source' ? 'Select Starting Location' : 'Select Destination'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.8}>
              <CloseIcon size={16} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          <View style={styles.searchBar}>
            <SearchIcon size={18} color="#64748B" />
            <TextInput
              style={styles.searchInput}
              placeholder={mode === 'source' ? "Search gate, platform or concourse" : "Search platform 1-10, lift, restroom, or FOB"}
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
                <CloseIcon size={14} color="#64748B" />
              </TouchableOpacity>
            )}
          </View>

          {/* Filter Categories Bar */}
          <View style={styles.categoriesRow}>
            {(['ALL', 'PLATFORMS', 'FACILITIES', 'ENTRANCES'] as const).map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryTab,
                  selectedCategory === cat && styles.categoryTabSelected
                ]}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.75}
              >
                <Text style={[
                  styles.categoryTabText,
                  selectedCategory === cat && styles.categoryTabTextSelected
                ]}>
                  {cat === 'ALL' ? 'All' : (cat === 'PLATFORMS' ? 'Platforms' : (cat === 'FACILITIES' ? 'Lifts & WC' : 'Gates & FOB'))}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* List of Results */}
          <FlatList
            data={searchResults}
            keyExtractor={(item, index) => `${item.category}_${item.node.id}_${index}`}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.resultItem}
                onPress={() => {
                  onSelectNode(item.node);
                  onClose();
                }}
                activeOpacity={0.7}
              >
                <View style={styles.itemIconContainer}>
                  {renderCandidateIcon(item.iconType)}
                </View>
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName}>{item.node.name}</Text>
                  <Text style={styles.itemBadge}>{item.badgeText}</Text>
                </View>
                <View style={styles.selectArrowBox}>
                  <ArrowRightIcon size={14} color="#94A3B8" />
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MapPinIcon size={28} color="#94A3B8" />
                <Text style={styles.emptyText}>No verified location found for "{searchQuery}"</Text>
                <Text style={styles.emptySub}>Try searching: Platform 8, Lift 1, Ramp, Restroom, or Main Entrance</Text>
              </View>
            }
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  modalContent: {
    flex: 1,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#E2E8F0'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  backBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: Radii.sm
  },
  backBtnText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700'
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A'
  },
  closeBtn: {
    padding: 6,
    borderRadius: Radii.sm,
    backgroundColor: '#F1F5F9'
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginHorizontal: Spacing.md,
    marginTop: 12,
    paddingHorizontal: 12,
    gap: 8
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0F172A'
  },
  clearBtn: {
    padding: 6
  },
  categoriesRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  categoryTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.pill,
    backgroundColor: '#F1F5F9'
  },
  categoryTabSelected: {
    backgroundColor: '#2563EB'
  },
  categoryTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B'
  },
  categoryTabTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700'
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 12
  },
  itemIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center'
  },
  itemDetails: {
    flex: 1
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A'
  },
  itemBadge: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2
  },
  selectArrowBox: {
    padding: 4
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 8
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'center'
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 320
  }
});
