
file_path = '/home/user/webapp/src/views/tv.ts'

with open(file_path, 'r') as f:
    lines = f.readlines()

# Fix Line 896
# el.className = \`... ${theme.border} ${theme.shadow}\`;
if '${theme.border}' in lines[895]:
    lines[895] = lines[895].replace('${theme.border}', '\\${theme.border}').replace('${theme.shadow}', '\\${theme.shadow}')

# Fix Line 898
# glow.className = ... ${theme.glow} ...
if '${theme.glow}' in lines[897]:
    lines[897] = lines[897].replace('${theme.glow}', '\\${theme.glow}')

# Fix Line 900
# iconContainer.className = ... ${theme.iconBg} ... ${theme.iconShadow} ...
if '${theme.iconBg}' in lines[899]:
    lines[899] = lines[899].replace('${theme.iconBg}', '\\${theme.iconBg}').replace('${theme.iconShadow}', '\\${theme.iconShadow}')

# Fix Line 904
# icon.className = ... ${theme.iconClass} ...
if '${theme.iconClass}' in lines[903]:
    lines[903] = lines[903].replace('${theme.iconClass}', '\\${theme.iconClass}')

# Fix Line 1065
# \``; -> \`;
if lines[1064].strip() == '\\``;':
    lines[1064] = lines[1064].replace('\\``;', '\\`;')

with open(file_path, 'w') as f:
    f.writelines(lines)

print("Applied fixes to tv.ts")
