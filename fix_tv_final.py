
file_path = '/home/user/webapp/src/views/tv.ts'

with open(file_path, 'r') as f:
    lines = f.readlines()

new_lines = []
for i, line in enumerate(lines):
    # Fix Line 1065: remove double backtick if present
    # Looking for \``; or similar.
    # We want ends with `;
    # We want \`;
    
    # Check for unescaped ${
    # But only inside the big string.
    # The file is mostly the big string.
    
    # Fix unescaped ${
    if '${' in line and '\\${' not in line:
        # Check if it's already escaped (simple check failed above, let's be more careful)
        # We replace ${ with \${ but need to avoid \\${
        # Use regex or simple replacement if we know the context
        
        # Context: lines 896, 898, 900, 904 have ${theme...}
        if 'theme.' in line:
            line = line.replace('${', '\\${')
            
    # Fix Line 1065 (approx)
    if 'broadcastEl.innerHTML' in lines[i-10:i]: # Context check, maybe not needed
        pass
        
    # Specifically fix the double backtick at the end of renderBroadcast innerHTML
    # The debug script identified line 1065.
    # It contains \``;
    if i == 1064 or i == 1065 or i == 1066: # around 1065
        if line.strip().endswith('\\``;'):
            line = line.replace('\\``;', '\\`;')
        elif line.strip() == '\\``;':
             line = line.replace('\\``;', '\\`;')

    # Also check for other double backticks like ``; that might have been introduced
    
    new_lines.append(line)

with open(file_path, 'w') as f:
    f.writelines(new_lines)
    
print("Fixed unescaped ${ and double backticks.")
