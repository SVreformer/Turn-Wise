from PIL import Image, ImageDraw, ImageFont
import os

os.makedirs('mobile/assets', exist_ok=True)

# 1. App Icon (1024x1024)
img = Image.new('RGBA', (1024, 1024), color=(15, 23, 42, 255)) # Dark slate #0F172A
draw = ImageDraw.Draw(img)

# Outer circle
draw.ellipse([80, 80, 944, 944], fill=(2, 132, 199, 255), outline=(56, 189, 248, 255), width=24)

# Draw stylized Train & Navigation Pin & Wheelchair emblem
# Horizontal platform track lines
draw.rounded_rectangle([250, 480, 774, 540], radius=15, fill=(245, 158, 11, 255))
draw.rounded_rectangle([250, 580, 774, 640], radius=15, fill=(255, 255, 255, 255))
draw.rounded_rectangle([250, 680, 774, 740], radius=15, fill=(16, 185, 129, 255))

# Navigation Pin top
draw.polygon([(512, 180), (400, 360), (624, 360)], fill=(0, 229, 255, 255))
draw.ellipse([462, 250, 562, 350], fill=(15, 23, 42, 255))

img.save('mobile/assets/icon.png')
img.save('mobile/assets/adaptive-icon.png')
print("Generated mobile/assets/icon.png & adaptive-icon.png")

# 2. Splash Screen (1284x2778 standard mobile splash)
splash = Image.new('RGBA', (1284, 2778), color=(15, 23, 42, 255))
s_draw = ImageDraw.Draw(splash)
# Center emblem
splash.paste(img.resize((512, 512)), (386, 1000), img.resize((512, 512)))
splash.save('mobile/assets/splash.png')
print("Generated mobile/assets/splash.png")
