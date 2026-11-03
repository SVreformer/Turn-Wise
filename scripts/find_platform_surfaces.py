import json
import accurate_coords

with open('ksr_map_data (1).json', 'r', encoding='utf-8') as f:
    map_data = json.load(f)

features = map_data.get('features', [])
plat_feats = [f for f in features if f.get('layer') == 'Platform']

print(f"Platform features total: {len(plat_feats)}")
tags = {}
for idx, f in enumerate(plat_feats):
    t = f.get('tag')
    tags[t] = tags.get(t, 0) + 1
    coords = accurate_coords.get_feature_coords(f)
    if coords and t != 'circle':
        min_x, max_x, min_y, max_y, cx, cy = coords
        print(f"Plat feat #{idx} tag={t} id={f.get('element_id')} w={max_x-min_x:.1f} h={max_y-min_y:.1f} cx={cx:.1f} cy={cy:.1f}")

# Now let's check which layer has horizontal geometries spanning the whole station
print("\nSearching across ALL layers for platform surfaces (width > 500, height between 15 and 150)...")
for idx, f in enumerate(features):
    tag = f.get('tag')
    if tag in ('rect', 'polygon', 'path'):
        coords = accurate_coords.get_feature_coords(f)
        if coords:
            w = coords[1] - coords[0]
            h = coords[3] - coords[2]
            if w > 800 and 10 < h < 180:
                print(f"Found in layer '{f.get('layer')}': tag={tag} w={w:.1f} h={h:.1f} Y=[{coords[2]:.1f}..{coords[3]:.1f}] cx={coords[4]:.1f}")
