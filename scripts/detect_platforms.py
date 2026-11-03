import json
import accurate_coords

with open('ksr_map_data (1).json', 'r', encoding='utf-8') as f:
    map_data = json.load(f)

features = map_data.get('features', [])
plat_feats = [f for f in features if f.get('layer') == 'Platform']

# Find all platform rects or paths that span horizontally
platforms_detected = []
for idx, f in enumerate(plat_feats):
    coords = accurate_coords.get_feature_coords(f)
    if not coords:
        continue
    min_x, max_x, min_y, max_y, cx, cy = coords
    width = max_x - min_x
    height = max_y - min_y
    tag = f.get('tag')
    # Platforms in KSR are long horizontal structures (width typically > 500, height < 120)
    if width > 400 and height < 150:
        platforms_detected.append({
            'idx': idx,
            'tag': tag,
            'min_x': min_x, 'max_x': max_x,
            'min_y': min_y, 'max_y': max_y,
            'width': width, 'height': height,
            'cx': cx, 'cy': cy
        })

print(f"Detected {len(platforms_detected)} horizontal platform bodies:")
# Sort by cy (Y coordinate from top to bottom)
platforms_detected.sort(key=lambda p: p['cy'])
for i, p in enumerate(platforms_detected):
    print(f"  #{i+1}: Y=[{p['min_y']:.1f}..{p['max_y']:.1f}] center=({p['cx']:.1f}, {p['cy']:.1f}) width={p['width']:.1f} height={p['height']:.1f}")

# Also check circles
circles = [f for f in plat_feats if f.get('tag') == 'circle']
circle_coords = []
for c in circles:
    coords = accurate_coords.get_feature_coords(c)
    circle_coords.append(coords)

circle_coords.sort(key=lambda c: (c[4] > 1500, c[5])) # group left then right, sort by cy
print("\nSorted Circles:")
for c in circle_coords:
    print(f"  Circle: center=({c[4]:.1f}, {c[5]:.1f})")
