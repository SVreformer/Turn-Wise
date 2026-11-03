with open('mobile/src/data/station/ksrStationSvg.ts', 'r', encoding='utf-8') as f:
    text = f.read()

start_idx = text.find('<g id="Tracks"')
print("Start idx:", start_idx)

# Find where the next top-level group starts
# In analyze_svg_groups.py, we saw next group is ROAD_1_ or similar
next_g_idx = text.find('<g id="ROAD_1_"', start_idx)
print("Next top group idx:", next_g_idx)

tracks_content = text[start_idx:next_g_idx]
print("Tracks length:", len(tracks_content))

import re
polygons = re.findall(r'<polygon points="([^"]+)"', tracks_content)
paths = re.findall(r'<path', tracks_content)
lines = re.findall(r'<line', tracks_content)
rects = re.findall(r'<rect', tracks_content)
g_tags = re.findall(r'<g', tracks_content)
print(f"In Tracks: g_tags={len(g_tags)}, polygons={len(polygons)}, paths={len(paths)}, lines={len(lines)}, rects={len(rects)}")
