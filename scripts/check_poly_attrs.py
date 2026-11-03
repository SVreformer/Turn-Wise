import re

with open('mobile/src/data/station/ksrStationSvg.ts', 'r', encoding='utf-8') as f:
    text = f.read()

start_idx = text.find('<g id="Tracks"')
next_g_idx = text.find('<g id="ROAD_1_"', start_idx)
tracks_content = text[start_idx:next_g_idx]

# Check polygon attributes
poly_tags = re.findall(r'<polygon([^>]+)>', tracks_content)
print(f"Total polygon tags: {len(poly_tags)}")

# Sample first 5
for p in poly_tags[:5]:
    print("Poly attr:", p[:100])

# Check if any have fill or stroke or id
has_fill = [p for p in poly_tags if 'fill' in p]
has_stroke = [p for p in poly_tags if 'stroke' in p]
has_id = [p for p in poly_tags if 'id' in p]
print(f"Has fill: {len(has_fill)}, Has stroke: {len(has_stroke)}, Has id: {len(has_id)}")
