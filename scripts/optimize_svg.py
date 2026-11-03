import re

with open('mobile/src/data/station/ksrStationSvg.ts', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Convert Tracks
start_tracks = text.find('<g id="Tracks"')
next_after_tracks = text.find('<g id="ROAD_1_"', start_tracks)
tracks_content = text[start_tracks:next_after_tracks]

polygons_tracks = re.findall(r'<polygon\s+points="([^"]+)"', tracks_content)
d_parts_tracks = []
for p_str in polygons_tracks:
    pts = p_str.strip().split()
    if not pts:
        continue
    first = pts[0].replace(',', ' ')
    rest = " ".join([pt.replace(',', ' ') for pt in pts[1:]])
    d_parts_tracks.append(f"M {first} L {rest} Z")

compound_d_tracks = " ".join(d_parts_tracks)

new_tracks = f'''<g id="Tracks" opacity="0.35">
\t<g>
\t\t<defs>
\t\t\t<rect id="SVGID_3_" x="863.6" y="-863.6" transform="matrix(-1.836970e-16 1 -1 -1.836970e-16 2591.5798 -863.5796)" width="1728" height="3455.3" />
\t\t</defs>
\t\t<clipPath id="SVGID_4_">
\t\t\t<use href="#SVGID_3_" style="overflow:visible;" />
\t\t</clipPath>
\t\t<path clip-path="url(#SVGID_4_)" d="{compound_d_tracks}" fill="#000000" />
\t</g>
</g>
'''

# 2. Convert Patway
start_patway = text.find('<g id="Patway"')
next_after_patway = text.find('<g id="LABLE_2_"', start_patway)
patway_content = text[start_patway:next_after_patway]

polygons_patway = re.findall(r'<polygon\s+(?:id="[^"]*"\s+)?points="([^"]+)"(?:\s+fill="([^"]*)")?', patway_content)
print(f"Patway polygons found: {len(polygons_patway)}")

# Check fills
d_by_fill = {}
for pts_str, fill in polygons_patway:
    fill_color = fill if fill else "#6D2716"
    pts = pts_str.strip().split()
    if not pts:
        continue
    first = pts[0].replace(',', ' ')
    rest = " ".join([pt.replace(',', ' ') for pt in pts[1:]])
    d_by_fill.setdefault(fill_color, []).append(f"M {first} L {rest} Z")

patway_paths = []
for fill_color, d_list in d_by_fill.items():
    patway_paths.append(f'\t<path d="{" ".join(d_list)}" fill="{fill_color}" />')

new_patway = '<g id="Patway">\n' + '\n'.join(patway_paths) + '\n</g>\n'

# Apply replacements
optimized_text = text[:start_tracks] + new_tracks + text[next_after_tracks:start_patway] + new_patway + text[next_after_patway:]

print(f"Original text length: {len(text)} chars")
print(f"Optimized text length: {len(optimized_text)} chars")

with open('mobile/src/data/station/ksrStationSvg.ts', 'w', encoding='utf-8') as f:
    f.write(optimized_text)

print("Saved optimized ksrStationSvg.ts successfully!")
