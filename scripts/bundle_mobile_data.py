import shutil
import os

print("=== BUNDLING LOCAL STATION DATA FOR OFFLINE MOBILE OPERATION ===")

os.makedirs('mobile/src/data/station', exist_ok=True)
os.makedirs('mobile/src/data/accessibility', exist_ok=True)
os.makedirs('mobile/src/data/simulation', exist_ok=True)

files = [
    ('data/station/nodes.json', 'mobile/src/data/station/nodes.json'),
    ('data/station/edges.json', 'mobile/src/data/station/edges.json'),
    ('data/station/platforms.json', 'mobile/src/data/station/platforms.json'),
    ('data/station/facilities.json', 'mobile/src/data/station/facilities.json'),
    ('data/station/verticalConnections.json', 'mobile/src/data/station/verticalConnections.json'),
    ('data/accessibility/profiles.json', 'mobile/src/data/accessibility/profiles.json'),
    ('data/accessibility/routingConfig.json', 'mobile/src/data/accessibility/routingConfig.json'),
    ('data/simulation/checkpoints.json', 'mobile/src/data/simulation/checkpoints.json'),
    ('data/simulation/status.json', 'mobile/src/data/simulation/status.json'),
]

for src, dst in files:
    shutil.copyfile(src, dst)
    print(f"Copied {src} -> {dst}")

print("-> All offline station datasets bundled successfully!")
