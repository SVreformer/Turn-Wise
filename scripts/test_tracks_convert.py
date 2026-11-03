import re

with open('mobile/src/data/station/ksrStationSvg.ts', 'r', encoding='utf-8') as f:
    text = f.read()

start_idx = text.find('<g id="Tracks"')
next_g_idx = text.find('<g id="ROAD_1_"', start_idx)
tracks_content = text[start_idx:next_g_idx]

polygons = re.findall(r'<polygon\s+points="([^"]+)"', tracks_content)
print(f"Extracted {len(polygons)} polygons")

d_parts = []
for p_str in polygons:
    # clean whitespace and split
    pts = p_str.strip().split()
    if not pts:
        continue
    # Each pt is "x,y"
    first = pts[0].replace(',', ' ')
    rest = " ".join([pt.replace(',', ' ') for pt in pts[1:]])
    d_parts.append(f"M {first} L {rest} Z")

compound_d = " ".join(d_parts)
print(f"Compound d length: {len(compound_d)} chars")

new_tracks = f'''<g id="Tracks" opacity="0.35">
\t<g>
\t\t<defs>
\t\t\t<rect id="SVGID_3_" x="863.6" y="-863.6" transform="matrix(-1.836970e-16 1 -1 -1.836970e-16 2591.5798 -863.5796)" width="1728" height="3455.3" />
\t\t</defs>
\t\t<clipPath id="SVGID_4_">
\t\t\t<use href="#SVGID_3_" style="overflow:visible;" />
\t\t</clipPath>
\t\t<path clip-path="url(#SVGID_4_)" d="{compound_d}" fill="#000000" />
\t</g>
</g>
'''

print(f"Old tracks length: {len(tracks_content)} chars")
print(f"New tracks length: {len(new_tracks)} chars")
print(f"Saved: {len(tracks_content) - len(new_tracks)} chars ({(len(tracks_content) - len(new_tracks))/1024:.1f} KB)")
