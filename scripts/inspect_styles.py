import re

with open('ksrsvg.svg', 'r', encoding='utf-8') as f:
    text = f.read()

style_match = re.search(r'<style[^>]*>(.*?)</style>', text, re.DOTALL)
if style_match:
    style_content = style_match.group(1)
    # Parse CSS rules: .className { ... }
    rules = re.findall(r'\.([a-zA-Z0-9_-]+)\s*\{([^}]+)\}', style_content)
    print(f"Total CSS class rules: {len(rules)}")
    for name, decl in rules[:20]:
        print(f" .{name}: {decl.strip()}")
