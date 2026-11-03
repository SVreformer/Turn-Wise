import xml.etree.ElementTree as ET

with open('ksrsvg.svg', 'r', encoding='utf-8') as f:
    text = f.read()

# Parse the SVG root
root = ET.fromstring(text)
print("Root tag:", root.tag, "attrib:", root.attrib)

layers = []
for child in root:
    tag = child.tag.split('}')[-1]
    cid = child.attrib.get('id', '')
    if tag == 'g' and cid:
        layers.append((cid, len(child), [sub.tag.split('}')[-1] for sub in child][:5]))

print(f"Top-level <g> count: {len(layers)}")
for cid, child_count, sub_tags in layers[:35]:
    print(f"Layer id='{cid}', children={child_count}, sample_tags={sub_tags}")
