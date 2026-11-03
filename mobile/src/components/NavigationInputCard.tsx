import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { StationNode } from '../services/localRouter';
import { SourceMethod, DestinationMethod } from '../store/navigationStore';
import { Colors, Shadows, Radii, Spacing } from '../theme/tokens';
import {
  MapPinIcon,
  QrIcon,
  SearchIcon,
  SwapIcon,
  TrainIcon,
  CloseIcon,
  CheckIcon
} from './Icons';

interface NavigationInputCardProps {
  startNode: StationNode | null;
  destinationNode: StationNode | null;
  sourceMethod: SourceMethod;
  destinationMethod: DestinationMethod;
  onOpenSourceSearch: () => void;
  onOpenDestinationSearch: () => void;
  onSelectSourceOnMap: () => void;
  onSelectDestinationOnMap: () => void;
  onOpenQrScan: () => void;
  onSwap: () => void;
  onClearSource?: () => void;
  onClearDestination?: () => void;
}

export const NavigationInputCard: React.FC<NavigationInputCardProps> = ({
  startNode,
  destinationNode,
  sourceMethod,
  destinationMethod,
  onOpenSourceSearch,
  onOpenDestinationSearch,
  onSelectSourceOnMap,
  onSelectDestinationOnMap,
  onOpenQrScan,
  onSwap,
  onClearSource,
  onClearDestination
}) => {
  const getMethodBadgeText = (method: SourceMethod | DestinationMethod) => {
    switch (method) {
      case 'MAP': return 'Map Pin';
      case 'QR': return 'QR Verified';
      case 'SEARCH': return 'Selected';
      case 'PLATFORM': return 'Platform';
      case 'FACILITY': return 'Facility';
      case 'GPS': return 'Live Anchor';
      default: return null;
    }
  };

  return (
    <View style={styles.card}>
      {/* Route Inputs Wrapper */}
      <View style={styles.inputsRow}>
        {/* Left Transit Track Indicator */}
        <View style={styles.timelineCol}>
          <View style={styles.startDotOuter}>
            <View style={styles.startDotInner} />
          </View>
          <View style={styles.trackLine} />
          <View style={styles.destDotOuter}>
            <View style={styles.destDotInner} />
          </View>
        </View>

        {/* Input Fields Column */}
        <View style={styles.fieldsCol}>
          {/* FROM / ORIGIN FIELD */}
          <View style={styles.fieldWrapper}>
            <View style={styles.fieldHeader}>
              <Text style={styles.fieldLabel}>STARTING POINT / GATE</Text>
              {startNode && sourceMethod && (
                <View style={styles.methodBadge}>
                  <CheckIcon size={10} color="#059669" strokeWidth={3} />
                  <Text style={styles.methodBadgeText}>{getMethodBadgeText(sourceMethod)}</Text>
                </View>
              )}
            </View>

            {startNode ? (
              <View style={[styles.selectedLocationBox, styles.startSelectedBox]}>
                <TouchableOpacity
                  style={styles.selectedLocationTouchable}
                  onPress={onOpenSourceSearch}
                  activeOpacity={0.8}
                >
                  <Text style={styles.locationTitle} numberOfLines={1}>{startNode.name}</Text>
                  <Text style={styles.locationSub}>
                    {startNode.level === -1 ? 'Subway • Level -1' : (startNode.level === 1 ? 'FOB • Level 1' : 'Concourse • Level 0')}
                    {startNode.wheelchairAccessible ? ' • Step-Free' : ''}
                  </Text>
                </TouchableOpacity>
                {onClearSource && (
                  <TouchableOpacity
                    onPress={onClearSource}
                    style={styles.clearBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <CloseIcon size={16} color="#64748B" />
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.emptyPromptRow}>
                <TouchableOpacity
                  style={styles.emptyPromptBtn}
                  onPress={onOpenSourceSearch}
                  activeOpacity={0.7}
                >
                  <Text style={styles.placeholderText}>Choose departure gate, entrance or current location</Text>
                </TouchableOpacity>
                <View style={styles.quickSourceActions}>
                  <TouchableOpacity style={styles.actionChip} onPress={onSelectSourceOnMap} activeOpacity={0.75}>
                    <MapPinIcon size={14} color="#2563EB" />
                    <Text style={styles.actionChipText}>Map</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionChip} onPress={onOpenQrScan} activeOpacity={0.75}>
                    <QrIcon size={14} color="#2563EB" />
                    <Text style={styles.actionChipText}>QR</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Divider with Center Swap Button */}
          <View style={styles.dividerRow}>
            <View style={styles.hairlineDivider} />
            <TouchableOpacity
              style={[
                styles.swapBtn,
                (!startNode && !destinationNode) && styles.swapBtnDisabled
              ]}
              onPress={onSwap}
              activeOpacity={0.8}
              disabled={!startNode && !destinationNode}
            >
              <SwapIcon size={16} color={(!startNode && !destinationNode) ? '#CBD5E1' : '#2563EB'} />
            </TouchableOpacity>
          </View>

          {/* TO / DESTINATION FIELD */}
          <View style={styles.fieldWrapper}>
            <View style={styles.fieldHeader}>
              <Text style={styles.fieldLabel}>DESTINATION</Text>
              {destinationNode && destinationMethod && (
                <View style={styles.methodBadge}>
                  <CheckIcon size={10} color="#059669" strokeWidth={3} />
                  <Text style={styles.methodBadgeText}>{getMethodBadgeText(destinationMethod)}</Text>
                </View>
              )}
            </View>

            {destinationNode ? (
              <View style={[styles.selectedLocationBox, styles.destSelectedBox]}>
                <TouchableOpacity
                  style={styles.selectedLocationTouchable}
                  onPress={onOpenDestinationSearch}
                  activeOpacity={0.8}
                >
                  <Text style={styles.locationTitle} numberOfLines={1}>{destinationNode.name}</Text>
                  <Text style={styles.locationSub}>
                    {destinationNode.level === -1 ? 'Subway • Level -1' : (destinationNode.level === 1 ? 'FOB • Level 1' : 'Concourse • Level 0')}
                    {destinationNode.wheelchairAccessible ? ' • Step-Free' : ''}
                  </Text>
                </TouchableOpacity>
                {onClearDestination && (
                  <TouchableOpacity
                    onPress={onClearDestination}
                    style={styles.clearBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <CloseIcon size={16} color="#64748B" />
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.emptyPromptRow}>
                <TouchableOpacity
                  style={styles.emptyPromptBtn}
                  onPress={onOpenDestinationSearch}
                  activeOpacity={0.7}
                >
                  <Text style={styles.placeholderText}>Where to? (e.g. Platform 8, Waiting Room, Lift 2)</Text>
                </TouchableOpacity>
                <View style={styles.quickSourceActions}>
                  <TouchableOpacity style={styles.actionChip} onPress={onSelectDestinationOnMap} activeOpacity={0.75}>
                    <MapPinIcon size={14} color="#2563EB" />
                    <Text style={styles.actionChipText}>Map</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.sm
  },
  inputsRow: {
    flexDirection: 'row',
    alignItems: 'stretch'
  },
  timelineCol: {
    width: 24,
    alignItems: 'center',
    paddingVertical: 14,
    marginRight: 10
  },
  startDotOuter: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.forestPrimary,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center'
  },
  startDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.forestPrimary
  },
  trackLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#CBD5E1',
    marginVertical: 4
  },
  destDotOuter: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.crimsonPrimary,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center'
  },
  destDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.crimsonPrimary
  },
  fieldsCol: {
    flex: 1
  },
  fieldWrapper: {
    minHeight: 56
  },
  fieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.6,
    textTransform: 'uppercase'
  },
  methodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0'
  },
  methodBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#059669'
  },
  selectedLocationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: Radii.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: '#E2E8F0'
  },
  startSelectedBox: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC'
  },
  destSelectedBox: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FCD34D'
  },
  selectedLocationTouchable: {
    flex: 1
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A'
  },
  locationSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2
  },
  clearBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#F1F5F9'
  },
  emptyPromptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 8
  },
  emptyPromptBtn: {
    flex: 1,
    paddingVertical: 4
  },
  placeholderText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '400'
  },
  quickSourceActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1'
  },
  actionChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1E293B'
  },
  dividerRow: {
    position: 'relative',
    height: 24,
    justifyContent: 'center',
    alignItems: 'center'
  },
  hairlineDivider: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#E2E8F0'
  },
  swapBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm
  },
  swapBtnDisabled: {
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC'
  }
});
