import re

with open('mobile/src/data/station/ksrStationSvg.ts', 'r', encoding='utf-8') as f:
    text = f.read()

groups = re.findall(r'<g\s+id="([^"]+)"', text)
print('Groups found:', len(groups), groups[:20])
polygons = len(re.findall(r'<polygon', text))
paths = len(re.findall(r'<path', text))
rects = len(re.findall(r'<rect', text))
lines = len(re.findall(r'<line', text))
g_tags = len(re.findall(r'<g', text))
print(f'G tags: {g_tags}, Polygons: {polygons}, Paths: {paths}, Rects: {rects}, Lines: {lines}')
