import os
from PIL import Image

src_path = r'C:/Users/Sumukh V/.gemini/antigravity/brain/da6aa4bd-f0e5-4737-828d-c380f4258cc5/.user_uploaded/media_1793690469555_f18dd752.jpg'
assets_dir = os.path.join(os.path.dirname(__file__), '..', 'mobile', 'assets')
dist_dir = os.path.join(os.path.dirname(__file__), '..', 'mobile', 'dist')

img = Image.open(src_path).convert('RGBA')

# 1. 1024x1024 main app icon
img.save(os.path.join(assets_dir, 'icon.png'), 'PNG')
img.save(os.path.join(assets_dir, 'adaptive-icon.png'), 'PNG')
img.save(os.path.join(assets_dir, 'logo.png'), 'PNG')
img.save(os.path.join(assets_dir, 'railmarga-logo.png'), 'PNG')
print('Saved icon.png, adaptive-icon.png, logo.png, railmarga-logo.png')

# 2. Splash screen (centered on dark or transparent background)
splash = Image.new('RGBA', (1284, 2778), (17, 20, 24, 255))
# Resize logo to 500x500 for splash
splash_logo = img.resize((500, 500), Image.Resampling.LANCZOS)
x = (1284 - 500) // 2
y = (2778 - 500) // 2
splash.paste(splash_logo, (x, y), splash_logo)
splash.save(os.path.join(assets_dir, 'splash.png'), 'PNG')
print('Saved splash.png')

# 3. Web dist icons
if os.path.exists(dist_dir):
    fav = img.resize((192, 192), Image.Resampling.LANCZOS)
    fav.save(os.path.join(dist_dir, 'favicon.png'), 'PNG')
    
    icon_dist = img.resize((512, 512), Image.Resampling.LANCZOS)
    icon_dist.save(os.path.join(dist_dir, 'icon.png'), 'PNG')
    print('Saved dist/favicon.png and dist/icon.png')

print('All app logo assets successfully updated to TurnWise logo!')
