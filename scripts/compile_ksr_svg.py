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
                k = k.strip()
                v = v.strip()
                if k == 'stroke-width':
                    props['strokeWidth'] = v
                elif k == 'stroke-miterlimit':
                    props['strokeMiterlimit'] = v
                elif k == 'stroke-dasharray':
                    props['strokeDasharray'] = v
                elif k in ('fill', 'stroke', 'opacity', 'display'):
                    props[k] = v
        classes[cls] = props

# Parse XML with ElementTree
root = ET.fromstring(text)

# Clean and inline attributes recursively
def clean_node(node):
    cls = node.attrib.get('class', '')
    if cls and cls in classes:
        p = classes[cls]
        if p.get('display') == 'none':
            return False
        for k, v in p.items():
            if k != 'display' and k not in node.attrib:
                node.attrib[k] = v
        del node.attrib['class']
    
    # Check if element has display none
    if node.attrib.get('display') == 'none':
        return False
        
    # Remove image elements referencing non-existent external bitmaps
    tag = node.tag.split('}')[-1]
    if tag == 'image':
        return False

    # Filter children
    surviving_children = []
    for c in list(node):
        if clean_node(c):
            surviving_children.append(c)
    node[:] = surviving_children
    return True

# Process each top layer
clean_layers = []
for child in list(root):
    tag = child.tag.split('}')[-1]
    cid = child.attrib.get('id', '')
    if tag == 'g' and cid:
        if clean_node(child):
            clean_layers.append((cid, child))

print(f"Compiled {len(clean_layers)} cleaned layers with inlined styles!")
for cid, lnode in clean_layers:
    elem_count = len(list(lnode.iter()))
    print(f" Layer '{cid}': {elem_count} elements")
