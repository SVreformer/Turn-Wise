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

# Parse XML
# Remove namespace prefixes for simplicity
text_no_ns = re.sub(r'\sxmlns(:\w+)?="[^"]+"', '', text)
root = ET.fromstring(text_no_ns)

# Collect elements by layer
layers_dict = {}

for child in root:
    cid = child.attrib.get('id', '')
    if not cid:
        continue
    
    # Process all descendants
    def process_element(elem):
        cls_name = elem.attrib.get('class', '')
        if cls_name and cls_name in classes:
            props = classes[cls_name]
            if props.get('display') == 'none':
                return None
            for k, v in props.items():
                if k not in elem.attrib and k not in ('display', 'clip-path'):
                    elem.attrib[k] = v
        # Also handle style attr if any
        if 'class' in elem.attrib:
            del elem.attrib['class']
        return elem

    layers_dict[cid] = child

print(f"Processed {len(layers_dict)} layers")
for k in list(layers_dict.keys())[:15]:
    print(f" Layer: {k}")
