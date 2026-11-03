import xml.etree.ElementTree as ET

with open('ksrsvg.svg', 'r', encoding='utf-8') as f:
    text = f.read()

root = ET.fromstring(text)

def dump_layer_info(layer_id):
    for child in root:
        if child.attrib.get('id') == layer_id:
            print(f"=== LAYER {layer_id} ===")
            print(f"Direct children count: {len(child)}")
            for sub in child:
                stag = sub.tag.split('}')[-1]
                sid = sub.attrib.get('id', '')
                print(f"  <{stag} id='{sid}' attribs={list(sub.attrib.keys())}>")
                if stag == 'g':
                    for sub2 in sub[:5]:
                        s2tag = sub2.tag.split('}')[-1]
                        s2id = sub2.attrib.get('id', '')
                        print(f"    <{s2tag} id='{s2id}'>")

for lid in ['Platform', 'Terminals', 'FOB', 'Metro_FOB', 'Ramp', 'LIFT', 'Floor_n_subwy']:
    dump_layer_info(lid)
