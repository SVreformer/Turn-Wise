import re

with open('mobile/src/data/station/ksrStationSvg.ts', 'r', encoding='utf-8') as f:
    text = f.read()

lines = text.split('\n')
print("Total lines:", len(lines))

current_group = "HEADER"
group_line_counts = {}
for line in lines:
    m = re.match(r'<g\s+id="([^"]+)"', line.strip())
    if m:
        current_group = m.group(1)
        group_line_counts[current_group] = group_line_counts.get(current_group, 0) + 1
    else:
        group_line_counts[current_group] = group_line_counts.get(current_group, 0) + 1

sorted_groups = sorted(group_line_counts.items(), key=lambda x: x[1], reverse=True)
for g, count in sorted_groups[:20]:
    print(f"Group {g}: {count} lines")
