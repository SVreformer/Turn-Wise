import re

with open('mobile/src/data/station/ksrStationSvg.ts', 'r', encoding='utf-8') as f:
    text = f.read()

start_idx = text.find('<g id="Patway"')
next_g_idx = text.find('<g id="LABLE_2_"', start_idx)
chunk = text[start_idx:next_g_idx]

poly_tags = re.findall(r'<polygon([^>]+)>', chunk)
print(f"Patway polygons: {len(poly_tags)}")
for p in poly_tags[:3]:
    print("Patway poly:", p[:80])
has_fill = [p for p in poly_tags if 'fill' in p]
print(f"Patway has fill: {len(has_fill)}")
