import json
import xml.etree.ElementTree as ET
import csv
from collections import Counter

print("=== DEEP ANALYSIS OF LAYERS AND GEOMETRY ===")

# Check ksr_map_data (1).json
with open('ksr_map_data (1).json', 'r', encoding='utf-8') as f:
    map_data = json.load(f)

metadata = map_data.get('metadata', {})
print("Metadata:", metadata)

layers = map_data.get('layers', [])
print(f"\nTotal layers: {len(layers)}")
for l in layers:
    print(f"Layer: {l.get('layer_id', l.get('id', ''))} | count: {l.get('element_count', '')} | types: {l.get('geometry_counts', '')}")

features = map_data.get('features', [])
print(f"\nTotal features: {len(features)}")

# Group features by layer
features_by_layer = {}
for feat in features:
    lay = feat.get('layer', 'UNKNOWN')
    features_by_layer.setdefault(lay, []).append(feat)

print("\n--- SAMPLE FEATURES PER CRITICAL LAYER ---")
critical_layers = [
    'Platform', 'Terminals', 'T2_Booking', 'PATHWAY', 'FOB', 'FOB_1', 'FOB_2', 'Fob1', 'Metro_FOB',
    'LIFT', '_x31__lift_1_', '_x31__lift_2_', '_x31__lift_3_', 'Lift_sign',
    'Stair', '_x31__Stair_1_', 'ESCALTR_2_',
    'Ramp', 'Ramp_1_', 'Ramp_2_', 'Ramp_3_', 'Ramp_5_', 'Ramp_6_', 'Ramp_7_', 'RAMP', '_x31__RAMP_2_',
    'Entry', 'Entry_1_', 'Entry_2_', 'Entry_3_', 'Entry_4_', 'Entry_5_', 'Entry_Ext',
    'TOILET', '_x39__TOILET_1_', '_x39__TOILET_2_', '_x39__TOILET_3_', '_x39__TOILET_4_', '_x39__TOILET_5_',
    '_x38__TOILET_1_', '_x38__TOILET_2_', 'Toilet_2_',
    'Floor_n_subwy', 'Water_VM'
]

for cl in critical_layers:
    feats = features_by_layer.get(cl, [])
    print(f"Layer '{cl}': {len(feats)} features. Tags: {Counter(f.get('tag') for f in feats)}")
    if feats:
        sample = feats[0]
        # show keys with non-empty values
        non_empty = {k: v for k, v in sample.items() if v}
        print(f"   Sample non-empty: {list(non_empty.keys())}")
        if 'points' in sample and sample['points']:
            print(f"   Sample points: {sample['points'][:80]}...")
        if 'd' in sample and sample['d']:
            print(f"   Sample d: {sample['d'][:80]}...")
        if 'element_id' in sample and sample['element_id']:
            print(f"   Sample id: {sample['element_id']}")
