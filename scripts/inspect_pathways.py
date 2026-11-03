import json
import accurate_coords

with open('ksr_map_data (1).json', 'r', encoding='utf-8') as f:
    map_data = json.load(f)

features = map_data.get('features', [])
pathway_feats = [f for f in features if f.get('layer') == 'PATHWAY']

print(f"Total PATHWAY features: {len(pathway_feats)}")

polygons = [f for f in pathway_feats if f.get('tag') == 'polygon']
lines = [f for f in pathway_feats if f.get('tag') == 'line']
uses = [f for f in pathway_feats if f.get('tag') == 'use']

print(f"Polygons: {len(polygons)}, Lines: {len(lines)}, Uses: {len(uses)}")

# Inspect first 10 lines
print("\nSample PATHWAY Lines:")
for l in lines[:10]:
    coords = accurate_coords.get_feature_coords(l)
    print(f"  Line: ({float(l['x1']):.1f}, {float(l['y1']):.1f}) -> ({float(l['x2']):.1f}, {float(l['y2']):.1f}) len={((float(l['x2'])-float(l['x1']))**2 + (float(l['y2'])-float(l['y1']))**2)**0.5:.1f}")

# Inspect sample polygons
print("\nSample PATHWAY Polygons:")
for p in polygons[:5]:
    coords = accurate_coords.get_feature_coords(p)
    print(f"  Polygon center: ({coords[4]:.1f}, {coords[5]:.1f}) bbox: [{coords[0]:.1f}..{coords[1]:.1f}, {coords[2]:.1f}..{coords[3]:.1f}]")
