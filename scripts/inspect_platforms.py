import json
import re

with open('ksr_map_data (1).json', 'r', encoding='utf-8') as f:
    map_data = json.load(f)

features = map_data.get('features', [])
platform_feats = [f for f in features if f.get('layer') == 'Platform']

print(f"Total Platform features: {len(platform_feats)}")

def parse_bbox_from_feature(f):
    tag = f.get('tag')
    xs, ys = [], []
    if tag == 'rect':
        x = float(f.get('x', 0) or 0)
        y = float(f.get('y', 0) or 0)
        w = float(f.get('width', 0) or 0)
        h = float(f.get('height', 0) or 0)
        xs = [x, x + w]
        ys = [y, y + h]
    elif tag == 'circle':
        cx = float(f.get('cx', 0) or 0)
        cy = float(f.get('cy', 0) or 0)
        r = float(f.get('r', 0) or 0)
        xs = [cx - r, cx + r]
        ys = [cy - r, cy + r]
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
        # extract all coordinate pairs using regex
        nums = [float(n) for n in re.findall(r'[-+]?(?:\d*\.\d+|\d+)', d)]
        # Take pairs roughly (approximate bounding box of path commands)
        for i in range(0, len(nums)-1, 2):
            # heuristic: SVG coordinates are within 0..4000
            if 0 <= nums[i] <= 3600 and 0 <= nums[i+1] <= 2000:
                xs.append(nums[i])
                ys.append(nums[i+1])
    
    if xs and ys:
        return min(xs), max(xs), min(ys), max(ys), (min(xs) + max(xs))/2, (min(ys) + max(ys))/2
    return None

# Let's inspect circles in Platform layer
circles = [f for f in platform_feats if f.get('tag') == 'circle']
print(f"Circles in Platform layer: {len(circles)}")
for c in circles:
    print(f"Circle: cx={c.get('cx')}, cy={c.get('cy')}, r={c.get('r')}, class={c.get('class')}, id={c.get('element_id')}")

# Let's inspect all elements with IDs in Platform layer
with_id = [f for f in platform_feats if f.get('element_id')]
print(f"Platform features with ID: {len(with_id)}")
for w in with_id:
    print(f"ID: {w.get('element_id')}, tag: {w.get('tag')}")

# Let's check Terminals layer
terminal_feats = [f for f in features if f.get('layer') == 'Terminals']
print(f"\nTerminal features: {len(terminal_feats)}")
for t in terminal_feats[:10]:
    bbox = parse_bbox_from_feature(t)
    print(f"Terminal feat: tag={t.get('tag')}, id={t.get('element_id')}, bbox={bbox}")
