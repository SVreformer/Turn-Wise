import json
import re
from collections import defaultdict

with open('ksr_map_data (1).json', 'r', encoding='utf-8') as f:
    map_data = json.load(f)

features = map_data.get('features', [])

def parse_bbox_from_feature(f):
    tag = f.get('tag')
    xs, ys = [], []
    if tag == 'rect':
        try:
            x = float(f.get('x', 0) or 0)
            y = float(f.get('y', 0) or 0)
            w = float(f.get('width', 0) or 0)
            h = float(f.get('height', 0) or 0)
            xs = [x, x + w]
            ys = [y, y + h]
        except:
            pass
    elif tag == 'circle':
        try:
            cx = float(f.get('cx', 0) or 0)
            cy = float(f.get('cy', 0) or 0)
            r = float(f.get('r', 0) or 0)
            xs = [cx - r, cx + r]
            ys = [cy - r, cy + r]
        except:
            pass
    elif tag in ('polygon', 'polyline', 'line'):
        points = f.get('points', '')
        if points:
            pts = [p for p in re.split(r'[\s,]+', points.strip()) if p]
            for i in range(0, len(pts)-1, 2):
                try:
                    xs.append(float(pts[i]))
                    ys.append(float(pts[i+1]))
                except:
                    pass
        if tag == 'line':
            try:
                xs.extend([float(f['x1']), float(f['x2'])])
                ys.extend([float(f['y1']), float(f['y2'])])
            except:
                pass
    elif tag == 'path':
        d = f.get('d', '')
        nums = [float(n) for n in re.findall(r'[-+]?(?:\d*\.\d+|\d+)', d)]
        for i in range(0, len(nums)-1, 2):
            if -500 <= nums[i] <= 4500 and -500 <= nums[i+1] <= 2500:
                xs.append(nums[i])
                ys.append(nums[i+1])
    
    if xs and ys:
        return min(xs), max(xs), min(ys), max(ys), (min(xs) + max(xs))/2, (min(ys) + max(ys))/2
    return None

layer_summary = defaultdict(lambda: {'count': 0, 'bboxes': [], 'tags': set()})

for f in features:
    layer = f.get('layer', 'UNKNOWN')
    layer_summary[layer]['count'] += 1
    layer_summary[layer]['tags'].add(f.get('tag'))
    bbox = parse_bbox_from_feature(f)
    if bbox:
        layer_summary[layer]['bboxes'].append(bbox)

print("=== LAYER SPATIAL EXTENTS ===")
for layer, info in sorted(layer_summary.items()):
    bboxes = info['bboxes']
    if bboxes:
        all_min_x = min(b[0] for b in bboxes)
        all_max_x = max(b[1] for b in bboxes)
        all_min_y = min(b[2] for b in bboxes)
        all_max_y = max(b[3] for b in bboxes)
        center_x = (all_min_x + all_max_x) / 2
        center_y = (all_min_y + all_max_y) / 2
        print(f"[{layer:20}] count={info['count']:4} | X: {all_min_x:6.1f}..{all_max_x:6.1f} | Y: {all_min_y:6.1f}..{all_max_y:6.1f} | Center: ({center_x:6.1f}, {center_y:6.1f})")
    else:
        print(f"[{layer:20}] count={info['count']:4} | No valid bboxes")
