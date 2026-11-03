with open('mobile/src/data/station/ksrStationSvg.ts', 'r', encoding='utf-8') as f:
    text = f.read()

import re

# Find all <g id="..."> and their sizes
group_indices = [(m.start(), m.group(1)) for m in re.finditer(r'<g\s+id="([^"]+)"', text)]

print(f"Total top-level named groups: {len(group_indices)}")
for i in range(len(group_indices)):
    start_pos, name = group_indices[i]
    end_pos = group_indices[i+1][0] if i+1 < len(group_indices) else len(text)
    chunk = text[start_pos:end_pos]
    polys = len(re.findall(r'<polygon', chunk))
    paths = len(re.findall(r'<path', chunk))
    gtags = len(re.findall(r'<g', chunk))
    size_kb = len(chunk) / 1024
    if size_kb > 10 or gtags > 50:
        print(f"Group '{name}': {size_kb:.1f} KB, g_tags={gtags}, polygons={polys}, paths={paths}")
