import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  SafeAreaView
} from 'react-native';
import { useNavigationStore } from '../store/navigationStore';
import { apiService } from '../services/apiService';
import { Colors, Shadows, Radii, Spacing, Typography } from '../theme/tokens';

interface CityStationSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectStation?: (station: any) => void;
}

export const CityStationSelectorModal: React.FC<CityStationSelectorModalProps> = ({
  visible,
  onClose,
  onSelectStation
}) => {
  const {
    selectedCity,
    selectedStation,
    setSelectedCity,
    setSelectedStation,
    language
  } = useNavigationStore();

  const [citiesList, setCitiesList] = useState<any[]>([]);
  const [stationsList, setStationsList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (visible) {
      loadInitialData();
    }
  }, [visible, selectedCity]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const cities = await apiService.getCities();
      setCitiesList(cities);
      const stations = await apiService.getStations(selectedCity);
      setStationsList(stations);
    } catch {}
    setLoading(false);
  };

  const handleCityChange = async (cityId: string) => {
    setLoading(true);
    await setSelectedCity(cityId);
    const stations = await apiService.getStations(cityId);
    setStationsList(stations);
    setSearchQuery('');
    setLoading(false);
  };

  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    if (!text.trim()) {
      const stations = await apiService.getStations(selectedCity);
      setStationsList(stations);
      return;
    }
    const results = await apiService.getStations(undefined, text);
    setStationsList(results);
  };

  const handleSelectStation = (st: any) => {
    setSelectedStation(st);
    if (onSelectStation) {
      onSelectStation(st);
    }
    onClose();
  };

  const getCityName = (city: any) => {
    if (!city) return '';
    if (language === 'kn') return city.nameKn || city.name;
    if (language === 'hi') return city.nameHi || city.name;
    return city.name;
  };

  const activeCityObj = citiesList.find(c => c.id === selectedCity);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>
                  {language === 'kn' ? 'ನಗರ ಮತ್ತು ನಿಲ್ದಾಣ ಆಯ್ಕೆ' : (language === 'hi' ? 'शहर एवं स्टेशन चयन' : 'Select City & Station')}
                </Text>
                <Text style={styles.subTitle}>
                  {language === 'kn'
                    ? 'ನೈಜ ಸಮಯದ ರೈಲ್ವೆ ಮಾಹಿತಿ ಮತ್ತು ಪ್ಲಾಟ್‌ಫಾರ್ಮ್‌ಗಳು'
                    : (language === 'hi'
                      ? 'वास्तविक समय रेलवे डेटा और प्लेटफॉर्म'
                      : 'Real-time Indian Railways Data & Platforms')}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* City Selector Pills Carousel */}
            <View style={styles.citySection}>
              <Text style={styles.sectionLabel}>
                {language === 'kn' ? 'ಪ್ರಮುಖ ನಗರಗಳು:' : (language === 'hi' ? 'प्रमुख शहर:' : 'Select City:')}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cityScroll}>
                {citiesList.map(c => {
                  const isSelected = c.id === selectedCity;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.cityPill, isSelected && styles.cityPillActive]}
                      onPress={() => handleCityChange(c.id)}
                    >
                      <Text style={[styles.cityPillText, isSelected && styles.cityPillTextActive]}>
                        {getCityName(c)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Search Input for All India Stations */}
            <View style={styles.searchBox}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder={
                  language === 'kn'
                    ? 'ನಿಲ್ದಾಣದ ಹೆಸರು ಅಥವಾ ಕೋಡ್ ಹುಡುಕಿ (ಉದಾ: SBC, YPR, NDLS)...'
                    : (language === 'hi'
                      ? 'स्टेशन का नाम या कोड खोजें (उदा: SBC, YPR, NDLS)...'
                      : 'Search station by name or code (e.g. SBC, YPR, NDLS)...')
                }
                value={searchQuery}
                onChangeText={handleSearch}
                placeholderTextColor={Colors.textSecondary}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => handleSearch('')}>
                  <Text style={styles.clearSearch}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Active Station Summary Badge */}
            {selectedStation && (
              <View style={styles.currentStationBadge}>
                <View style={styles.pinCircle}>
                  <Text style={{ fontSize: 18 }}>🚉</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.currentStationLabel}>
                    {language === 'kn' ? 'ಪ್ರಸ್ತುತ ಸಕ್ರಿಯ ನಿಲ್ದಾಣ:' : (language === 'hi' ? 'वर्तमान सक्रिय स्टेशन:' : 'Active Selected Station:')}
                  </Text>
                  <Text style={styles.currentStationName}>
                    {selectedStation.name} ({selectedStation.code})
                  </Text>
                </View>
                <View style={styles.platformPill}>
                  <Text style={styles.platformPillText}>{selectedStation.platforms || 10} Platforms</Text>
                </View>
              </View>
            )}

            {/* Stations List */}
            <View style={styles.listHeader}>
              <Text style={styles.listHeaderText}>
                {searchQuery
                  ? `Search Results (${stationsList.length})`
                  : `${getCityName(activeCityObj)} Railway Stations (${stationsList.length})`}
              </Text>
            </View>

            <ScrollView contentContainerStyle={styles.stationList}>
              {stationsList.map((st, idx) => {
                const isCurrent = selectedStation?.code === st.code;
                return (
                  <TouchableOpacity
                    key={`${st.code}_${idx}`}
                    style={[styles.stationCard, isCurrent && styles.stationCardActive]}
                    onPress={() => handleSelectStation(st)}
                  >
                    <View style={styles.stationCodeBadge}>
                      <Text style={styles.stationCodeText}>{st.code}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.stationNameText}>{st.name}</Text>
                      <Text style={styles.stationMetaText}>
                        {st.city || activeCityObj?.name || 'India'} • Zone: {st.zone || 'IR'} • Div: {st.division || 'DIV'}
                      </Text>
                    </View>
                    <View style={styles.stationRightCol}>
                      <View style={styles.platformCountBadge}>
                        <Text style={styles.platformCountText}>{st.platforms || 4} PF</Text>
                      </View>
                      {isCurrent ? (
                        <Text style={styles.selectedTick}>✓ Selected</Text>
                      ) : (
                        <Text style={styles.selectBtnText}>Select →</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}

              {stationsList.length === 0 && !loading && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No railway stations match your search.</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end'
  },
  safeArea: {
    maxHeight: '90%'
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    maxHeight: '100%'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A'
  },
  subTitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center'
  },
  closeBtnText: {
    fontSize: 16,
    color: '#475569',
    fontWeight: 'bold'
  },
  citySection: {
    marginTop: 12
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8
  },
  cityScroll: {
    paddingVertical: 4,
    gap: 8
  },
  cityPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 6
  },
  cityPillActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7'
  },
  cityPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155'
  },
  cityPillTextActive: {
    color: '#FFFFFF'
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    height: 44,
    marginTop: 12
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A'
  },
  clearSearch: {
    fontSize: 16,
    color: '#94A3B8',
    padding: 4
  },
  currentStationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    borderRadius: 12,
    padding: 12,
    marginTop: 12
  },
  pinCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center'
  },
  currentStationLabel: {
    fontSize: 11,
    color: '#0369A1',
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  currentStationName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A'
  },
  platformPill: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  platformPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700'
  },
  listHeader: {
    marginTop: 14,
    marginBottom: 8
  },
  listHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  stationList: {
    paddingBottom: 20
  },
  stationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8
  },
  stationCardActive: {
    borderColor: '#0284C7',
    backgroundColor: '#F0F9FF'
  },
  stationCodeBadge: {
    width: 52,
    height: 42,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center'
  },
  stationCodeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800'
  },
  stationNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A'
  },
  stationMetaText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2
  },
  stationRightCol: {
    alignItems: 'flex-end',
    marginLeft: 8
  },
  platformCountBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 4
  },
  platformCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569'
  },
  selectedTick: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7'
  },
  selectBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB'
  },
  emptyState: {
    padding: 24,
    alignItems: 'center'
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 14
  }
});

