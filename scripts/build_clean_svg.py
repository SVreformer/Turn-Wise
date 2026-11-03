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
                    props['stroke-width'] = v
                elif k == 'stroke-miterlimit':
                    props['stroke-miterlimit'] = v
                elif k == 'stroke-dasharray':
                    props['stroke-dasharray'] = v
                elif k in ('fill', 'stroke', 'opacity', 'display'):
                    props[k] = v
        classes[cls] = props

# Register namespaces
ET.register_namespace('', 'http://www.w3.org/2000/svg')
ET.register_namespace('xlink', 'http://www.w3.org/1999/xlink')

root = ET.fromstring(text)

# Remove the <style> element
for child in list(root):
    tag = child.tag.split('}')[-1]
    if tag == 'style':
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

    tag = node.tag.split('}')[-1]
    if tag == 'image':
        return False

    surviving = []
    for c in list(node):
        if inline_styles(c):
            surviving.append(c)
    node[:] = surviving
    return True

inline_styles(root)

# Convert xlink:href to href for universal SVG support
xml_str = ET.tostring(root, encoding='utf-8').decode('utf-8')
# Replace xlink:href with href if needed, or keep xlink
xml_clean = xml_str.replace('xlink:href', 'href')

# Write to file
with open('mobile/src/data/station/ksr_station_base.svg', 'w', encoding='utf-8') as f:
    f.write(xml_clean)

# Also create TypeScript export
# Escape backticks and dollars in template string
escaped = xml_clean.replace('`', '\\`').replace('${', '\\${')
with open('mobile/src/data/station/ksrStationSvg.ts', 'w', encoding='utf-8') as f:
    f.write(f'export const KSR_STATION_SVG_STRING = `{escaped}`;\n')

print(f"Generated clean SVG ({len(xml_clean)} bytes) and TypeScript module ({len(escaped)} bytes)")
