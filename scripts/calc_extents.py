import json
import re

with open('ksr_map_data (1).json', 'r', encoding='utf-8') as f:
    data = json.load(f)

features = data.get('features', [])
print(f"Total features in ksr_map_data: {len(features)}")

all_xs = []
all_ys = []

layer_extents = {}

for feat in features:
    layer = feat.get('layer', 'unknown')
    tag = feat.get('tag')
    xs, ys = [], []
    if tag == 'rect':
        try:
            x = float(feat.get('x', 0) or 0)
            y = float(feat.get('y', 0) or 0)
            w = float(feat.get('width', 0) or 0)
            h = float(feat.get('height', 0) or 0)
            xs = [x, x + w]
            ys = [y, y + h]
        except:
            pass
    elif tag == 'circle':
        try:
            cx = float(feat.get('cx', 0) or 0)
            cy = float(feat.get('cy', 0) or 0)
            r = float(feat.get('r', 0) or 0)
            xs = [cx - r, cx + r]
            ys = [cy - r, cy + r]
        except:
            pass
    elif tag in ('polygon', 'polyline', 'line'):
        points = feat.get('points', '')
        if points:
            pts = [p for p in re.split(r'[\s,]+', points.strip()) if p]
            for i in range(0, len(pts)-1, 2):
                try:
                    xs.append(float(pts[i]))
                    ys.append(float(pts[i+1]))
                except:
                    pass
    elif tag == 'path':
        d = feat.get('d', '')
        nums = [float(n) for n in re.findall(r'[-+]?(?:\d*\.\d+|\d+)', d)]
        for i in range(0, len(nums)-1, 2):
            if -100 <= nums[i] <= 3600 and -100 <= nums[i+1] <= 2000:
                xs.append(nums[i])
                ys.append(nums[i+1])

    if xs and ys:
        minx, maxx = min(xs), max(xs)
        miny, maxy = min(ys), max(ys)
        all_xs.extend([minx, maxx])
        all_ys.extend([miny, maxy])
        if layer not in layer_extents:
            layer_extents[layer] = {'minx': minx, 'maxx': maxx, 'miny': miny, 'maxy': maxy, 'count': 0}
        else:
            layer_extents[layer]['minx'] = min(layer_extents[layer]['minx'], minx)
            layer_extents[layer]['maxx'] = max(layer_extents[layer]['maxx'], maxx)
            layer_extents[layer]['miny'] = min(layer_extents[layer]['miny'], miny)
            layer_extents[layer]['maxy'] = max(layer_extents[layer]['maxy'], maxy)
        layer_extents[layer]['count'] += 1

print(f"Overall bounding box: X=[{min(all_xs):.1f}, {max(all_xs):.1f}], Y=[{min(all_ys):.1f}, {max(all_ys):.1f}]")
print("\nKey layers extents:")
for l in ['Tracks', 'Platform', 'Floor_n_subwy', 'PATHWAY', 'FOB', 'Metro_FOB', 'LIFT', 'Ramp', 'TOILET', 'Terminals', 'ROAD_1_']:
    if l in layer_extents:
        ext = layer_extents[l]
        print(f" {l} ({ext['count']} feats): X=[{ext['minx']:.1f}, {ext['maxx']:.1f}], Y=[{ext['miny']:.1f}, {ext['maxy']:.1f}]")
