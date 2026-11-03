import re

with open('ksrsvg.svg', 'r', encoding='utf-8') as f:
    text = f.read()

g_ids = re.findall(r'<g\s+id="([^"]+)"', text)
print(f"Total <g id=...>: {len(g_ids)}")
for gid in g_ids:
    print(" -", gid)
