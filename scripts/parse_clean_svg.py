import xml.etree.ElementTree as ET
import re

with open('ksrsvg.svg', 'r', encoding='utf-8') as f:
    text = f.read()

# Extract styles
style_match = re.search(r'<style[^>]*>(.*?)</style>', text, re.DOTALL)
classes = {}
if style_match:
    for cls, decl in re.findall(r'\.([a-zA-Z0-9_-]+)\s*\{([^}]+)\}', style_match.group(1)):
        props = {}
        for item in decl.strip().split(';'):
            if ':' in item:
                k, v = item.split(':', 1)
                props[k.strip()] = v.strip()
        classes[cls] = props

root = ET.fromstring(text)

print(f"SVG tag: {root.tag}, attribs: {root.attrib}")

layers = {}
for child in root:
    cid = child.attrib.get('id', '')
    if cid:
        layers[cid] = child

print("Available layers:", list(layers.keys()))
