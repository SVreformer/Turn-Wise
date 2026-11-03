import csv
import json
import xml.etree.ElementTree as ET
import os

print("=== STEP 1: INSPECTING ALL SOURCE DATA ===")

# 1. ksr_map_features.csv
csv_path = 'ksr_map_features.csv'
if os.path.exists(csv_path):
    with open(csv_path, mode='r', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader)
        print(f"ksr_map_features.csv header ({len(header)} cols): {header}")
    
    with open(csv_path, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        print(f"Total rows in ksr_map_features.csv: {len(rows)}")
        print("\nSample row 0:")
        for k, v in rows[0].items():
            print(f"  {k}: {str(v)[:100]}")
        
        # Check unique layers and feature types
        layers = set(r.get('layer', '') for r in rows)
        print(f"\nUnique layers in CSV ({len(layers)}): {sorted(list(layers))[:20]}...")
        types = set(r.get('type', '') or r.get('feature_type', '') for r in rows)
        print(f"Types in CSV: {types}")

# 2. ksr_map_data (1).json
json_path = 'ksr_map_data (1).json'
if os.path.exists(json_path):
    with open(json_path, mode='r', encoding='utf-8') as f:
        data = json.load(f)
    print(f"\nksr_map_data (1).json top-level type: {type(data)}")
    if isinstance(data, dict):
        print(f"Keys ({len(data)}): {list(data.keys())}")
        for k in list(data.keys())[:10]:
            v = data[k]
            if isinstance(v, list):
                print(f"  {k}: list of len {len(v)}, item 0 type {type(v[0]) if v else 'empty'}")
            elif isinstance(v, dict):
                print(f"  {k}: dict with keys {list(v.keys())[:5]}")
            else:
                print(f"  {k}: {v}")
    elif isinstance(data, list):
        print(f"List with {len(data)} elements. Sample 0 keys: {list(data[0].keys()) if data else 'empty'}")

# 3. SVG Inspection
svg_path = 'ksrsvg.svg'
if os.path.exists(svg_path):
    print(f"\nSVG File size: {os.path.getsize(svg_path):,} bytes")
    # Quick header read for viewBox
    with open(svg_path, mode='r', encoding='utf-8', errors='ignore') as f:
        head = f.read(2048)
        print("SVG header excerpt:")
        print(head[:500])
