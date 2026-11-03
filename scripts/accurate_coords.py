import re
import json

def parse_svg_path(d_str):
    """Accurately parse an SVG path string into min_x, max_x, min_y, max_y, cx, cy."""
    tokens = re.findall(r'([a-zA-Z])|([-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?)', d_str)
    cur_x, cur_y = 0.0, 0.0
    start_x, start_y = 0.0, 0.0
    cmd = 'M'
    xs, ys = [], []
    
    i = 0
    while i < len(tokens):
        t_cmd, t_val = tokens[i]
        if t_cmd:
            cmd = t_cmd
            i += 1
            continue
        
        # We have coordinates for cmd
        if cmd == 'M':
            cur_x = float(t_val)
            i += 1
            if i < len(tokens) and not tokens[i][0]:
                cur_y = float(tokens[i][1])
                i += 1
            start_x, start_y = cur_x, cur_y
            xs.append(cur_x); ys.append(cur_y)
            cmd = 'L'
        elif cmd == 'm':
            cur_x += float(t_val)
            i += 1
            if i < len(tokens) and not tokens[i][0]:
                cur_y += float(tokens[i][1])
                i += 1
            start_x, start_y = cur_x, cur_y
            xs.append(cur_x); ys.append(cur_y)
            cmd = 'l'
        elif cmd == 'L':
            cur_x = float(t_val)
            i += 1
            if i < len(tokens) and not tokens[i][0]:
                cur_y = float(tokens[i][1])
                i += 1
            xs.append(cur_x); ys.append(cur_y)
        elif cmd == 'l':
            cur_x += float(t_val)
            i += 1
            if i < len(tokens) and not tokens[i][0]:
                cur_y += float(tokens[i][1])
                i += 1
            xs.append(cur_x); ys.append(cur_y)
        elif cmd == 'H':
            cur_x = float(t_val)
            i += 1
            xs.append(cur_x); ys.append(cur_y)
        elif cmd == 'h':
            cur_x += float(t_val)
            i += 1
            xs.append(cur_x); ys.append(cur_y)
        elif cmd == 'V':
            cur_y = float(t_val)
            i += 1
            xs.append(cur_x); ys.append(cur_y)
        elif cmd == 'v':
            cur_y += float(t_val)
            i += 1
            xs.append(cur_x); ys.append(cur_y)
        elif cmd == 'C':
            # 6 parameters: x1, y1, x2, y2, x, y
            vals = [float(t_val)]
            i += 1
            for _ in range(5):
                if i < len(tokens) and not tokens[i][0]:
                    vals.append(float(tokens[i][1]))
                    i += 1
            if len(vals) == 6:
                cur_x, cur_y = vals[4], vals[5]
                xs.append(cur_x); ys.append(cur_y)
        elif cmd == 'c':
            vals = [float(t_val)]
            i += 1
            for _ in range(5):
                if i < len(tokens) and not tokens[i][0]:
                    vals.append(float(tokens[i][1]))
                    i += 1
            if len(vals) == 6:
                cur_x += vals[4]; cur_y += vals[5]
                xs.append(cur_x); ys.append(cur_y)
        elif cmd == 'S':
            vals = [float(t_val)]
            i += 1
            for _ in range(3):
                if i < len(tokens) and not tokens[i][0]:
                    vals.append(float(tokens[i][1]))
                    i += 1
            if len(vals) == 4:
                cur_x, cur_y = vals[2], vals[3]
                xs.append(cur_x); ys.append(cur_y)
        elif cmd == 's':
            vals = [float(t_val)]
            i += 1
            for _ in range(3):
                if i < len(tokens) and not tokens[i][0]:
                    vals.append(float(tokens[i][1]))
                    i += 1
            if len(vals) == 4:
                cur_x += vals[2]; cur_y += vals[3]
                xs.append(cur_x); ys.append(cur_y)
        elif cmd in ('Z', 'z'):
            cur_x, cur_y = start_x, start_y
            xs.append(cur_x); ys.append(cur_y)
            i += 1
        else:
            i += 1

    if xs and ys:
        return min(xs), max(xs), min(ys), max(ys), (min(xs) + max(xs))/2, (min(ys) + max(ys))/2
    return None

def get_feature_coords(f):
    tag = f.get('tag')
    if tag == 'rect':
        x = float(f.get('x', 0) or 0)
        y = float(f.get('y', 0) or 0)
        w = float(f.get('width', 0) or 0)
        h = float(f.get('height', 0) or 0)
        return x, x + w, y, y + h, x + w/2, y + h/2
    elif tag == 'circle':
        cx = float(f.get('cx', 0) or 0)
        cy = float(f.get('cy', 0) or 0)
        r = float(f.get('r', 0) or 0)
        return cx - r, cx + r, cy - r, cy + r, cx, cy
    elif tag in ('polygon', 'polyline'):
        points = f.get('points', '')
        if points:
            pts = [p for p in re.split(r'[\s,]+', points.strip()) if p]
            xs, ys = [], []
            for j in range(0, len(pts)-1, 2):
                try:
                    xs.append(float(pts[j]))
                    ys.append(float(pts[j+1]))
                except:
                    pass
            if xs and ys:
                return min(xs), max(xs), min(ys), max(ys), (min(xs) + max(xs))/2, (min(ys) + max(ys))/2
    elif tag == 'line':
        try:
            x1, y1 = float(f['x1']), float(f['y1'])
            x2, y2 = float(f['x2']), float(f['y2'])
            return min(x1, x2), max(x1, x2), min(y1, y2), max(y1, y2), (x1 + x2)/2, (y1 + y2)/2
        except:
            pass
    elif tag == 'path':
        d = f.get('d', '')
        if d:
            return parse_svg_path(d)
    return None

if __name__ == '__main__':
    with open('ksr_map_data (1).json', 'r', encoding='utf-8') as f:
        map_data = json.load(f)

    features = map_data.get('features', [])
    
    # 1. Platform elements
    print("=== PLATFORM ELEMENTS WITH ACCURATE COORDS ===")
    plat_feats = [f for f in features if f.get('layer') == 'Platform']
    for idx, p in enumerate(plat_feats):
        coords = get_feature_coords(p)
        if coords:
            tag = p.get('tag')
            if tag == 'circle':
                print(f"Platform circle #{idx}: cx={coords[4]:.1f}, cy={coords[5]:.1f}, r={(coords[1]-coords[0])/2:.1f}")
            elif tag == 'path' and (coords[1]-coords[0] > 100 or coords[3]-coords[2] > 100):
                print(f"Platform large path #{idx}: X=[{coords[0]:.1f}..{coords[1]:.1f}], Y=[{coords[2]:.1f}..{coords[3]:.1f}], center=({coords[4]:.1f}, {coords[5]:.1f})")

    # 2. Lifts
    print("\n=== LIFTS WITH ACCURATE COORDS ===")
    lift_layers = ['LIFT', '_x31__lift_1_', '_x31__lift_2_', '_x31__lift_3_', 'Lift_sign']
    for ll in lift_layers:
        l_feats = [f for f in features if f.get('layer') == ll]
        print(f"Layer {ll} ({len(l_feats)} items):")
        for idx, lf in enumerate(l_feats[:5]):
            coords = get_feature_coords(lf)
            if coords:
                print(f"   item #{idx} tag={lf.get('tag')}: center=({coords[4]:.1f}, {coords[5]:.1f}), bbox=[{coords[0]:.1f}..{coords[1]:.1f}, {coords[2]:.1f}..{coords[3]:.1f}]")

    # 3. Stairs
    print("\n=== STAIRS WITH ACCURATE COORDS ===")
    stair_layers = ['Stair', '_x31__Stair_1_', 'ESCALTR_2_']
    for sl in stair_layers:
        s_feats = [f for f in features if f.get('layer') == sl]
        print(f"Layer {sl} ({len(s_feats)} items):")
        # Find spatial clusters of centers
        centers = []
        for sf in s_feats:
            coords = get_feature_coords(sf)
            if coords:
                centers.append((coords[4], coords[5]))
        if centers:
            # cluster roughly within 50px
            print(f"   Total valid features: {len(centers)}. Sample centers: {centers[:5]}")

    # 4. Ramps
    print("\n=== RAMPS WITH ACCURATE COORDS ===")
    ramp_layers = ['Ramp', 'Ramp_1_', 'Ramp_2_', 'Ramp_3_', 'Ramp_5_', 'Ramp_6_', 'Ramp_7_', 'RAMP', '_x31__RAMP_2_']
    for rl in ramp_layers:
        r_feats = [f for f in features if f.get('layer') == rl]
        centers = []
        for rf in r_feats:
            coords = get_feature_coords(rf)
            if coords:
                centers.append((coords[4], coords[5]))
        if centers:
            avg_x = sum(c[0] for c in centers) / len(centers)
            avg_y = sum(c[1] for c in centers) / len(centers)
            print(f"Layer {rl} ({len(r_feats)} items) -> Centroid: ({avg_x:.1f}, {avg_y:.1f})")

    # 5. Entrances
    print("\n=== ENTRANCES WITH ACCURATE COORDS ===")
    entry_layers = ['Entry', 'Entry_1_', 'Entry_2_', 'Entry_3_', 'Entry_4_', 'Entry_5_', 'Entry_Ext']
    for el in entry_layers:
        e_feats = [f for f in features if f.get('layer') == el]
        centers = []
        for ef in e_feats:
            coords = get_feature_coords(ef)
            if coords:
                centers.append((coords[4], coords[5]))
        if centers:
            avg_x = sum(c[0] for c in centers) / len(centers)
            avg_y = sum(c[1] for c in centers) / len(centers)
            print(f"Layer {el} ({len(e_feats)} items) -> Centroid: ({avg_x:.1f}, {avg_y:.1f})")

    # 6. Toilets
    print("\n=== TOILETS WITH ACCURATE COORDS ===")
    toilet_layers = ['TOILET', '_x39__TOILET_1_', '_x39__TOILET_2_', '_x39__TOILET_3_', '_x39__TOILET_4_', '_x39__TOILET_5_', '_x38__TOILET_1_', '_x38__TOILET_2_', 'Toilet_2_']
    for tl in toilet_layers:
        t_feats = [f for f in features if f.get('layer') == tl]
        centers = []
        for tf in t_feats:
            coords = get_feature_coords(tf)
            if coords:
                centers.append((coords[4], coords[5]))
        if centers:
            avg_x = sum(c[0] for c in centers) / len(centers)
            avg_y = sum(c[1] for c in centers) / len(centers)
            print(f"Layer {tl} ({len(t_feats)} items) -> Centroid: ({avg_x:.1f}, {avg_y:.1f})")

    # 7. FOBs
    print("\n=== FOBS WITH ACCURATE COORDS ===")
    fob_layers = ['FOB', 'FOB_1', 'FOB_2', 'Fob1', 'Metro_FOB']
    for fl in fob_layers:
        f_feats = [f for f in features if f.get('layer') == fl]
        centers = []
        for ff in f_feats:
            coords = get_feature_coords(ff)
            if coords:
                centers.append((coords[4], coords[5]))
        if centers:
            min_x = min(c[0] for c in centers)
            max_x = max(c[0] for c in centers)
            min_y = min(c[1] for c in centers)
            max_y = max(c[1] for c in centers)
            print(f"Layer {fl} ({len(f_feats)} items) -> X: [{min_x:.1f}..{max_x:.1f}], Y: [{min_y:.1f}..{max_y:.1f}]")
