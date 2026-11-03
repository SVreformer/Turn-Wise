import xml.etree.ElementTree as ET
import re

with open('ksrsvg.svg', 'r', encoding='utf-8') as f:
    text = f.read()

# Extract styles
style_match = re.search(r'<style[^>]*>(.*?)</style>', text, re.DOTALL)
classes = {}
if style_match:
    for cls, decl in re.findall(r'\.([a-zA-Z0-9_-]+)\s*\{([^}]+)\}', style_match.group(1)):
        # Parse decl into dict
        props = {}
        for item in decl.strip().split(';'):
            if ':' in item:
                k, v = item.split(':', 1)
                props[k.strip()] = v.strip()
        classes[cls] = props

print(f"Parsed {len(classes)} CSS classes")

# Parse XML
root = ET.fromstring(text)

layer_stats = []
for child in root:
    tag = child.tag.split('}')[-1]
    cid = child.attrib.get('id', '')
    if tag == 'g' and cid:
        # Count all sub-elements
        sub_elements = list(child.iter())
        tag_counts = {}
        for s in sub_elements:
            stag = s.tag.split('}')[-1]
            tag_counts[stag] = tag_counts.get(stag, 0) + 1
        layer_stats.append((cid, len(sub_elements), tag_counts))

for cid, count, tags in layer_stats:
    print(f"Layer '{cid}': {count} total elements, tags: {tags}")
