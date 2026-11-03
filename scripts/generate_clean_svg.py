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
                if k in ('fill', 'stroke', 'stroke-width', 'opacity', 'display', 'stroke-dasharray', 'stroke-miterlimit'):
                    props[k] = v
        classes[cls] = props

# Register namespaces
ET.register_namespace('', 'http://www.w3.org/2000/svg')
ET.register_namespace('xlink', 'http://www.w3.org/1999/xlink')

root = ET.fromstring(text)

# Remove the <style> element since styles will be inlined
for child in list(root):
    if child.tag.endswith('style'):
        root.remove(child)

def inline_styles(node):
    cls = node.attrib.get('class', '')
    if cls and cls in classes:
        p = classes[cls]
        if p.get('display') == 'none':
            return False
        for k, v in p.items():
            if k != 'display' and k not in node.attrib:
                node.attrib[k] = v
        del node.attrib['class']

    if node.attrib.get('display') == 'none':
        return False

    if node.tag == 'image':
        return False

    surviving = []
    for c in list(node):
        if inline_styles(c):
            surviving.append(c)
    node[:] = surviving
    return True

inline_styles(root)

# Save to cleaned SVG
cleaned_xml = ET.tostring(root, encoding='utf-8').decode('utf-8')
# Ensure proper root attributes
cleaned_svg = f'<svg viewBox="0 0 3456 1728" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">\n{cleaned_xml[cleaned_xml.find(">")+1:]}'

with open('data/station/ksr_station_base.svg', 'w', encoding='utf-8') as f:
    f.write(cleaned_svg)

print(f"Generated data/station/ksr_station_base.svg: {len(cleaned_svg)} bytes")
