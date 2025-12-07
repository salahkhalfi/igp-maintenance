
file_path = '/home/user/webapp/src/views/tv.ts'

with open(file_path, 'r') as f:
    lines = f.readlines()

# Check the last non-empty line
last_idx = -1
while not lines[last_idx].strip():
    last_idx -= 1

last_line = lines[last_idx]
print(f"Last line was: {last_line.strip()}")

if last_line.strip() == '\\`;':
    lines[last_idx] = '`;\n'
    print("Fixed last line to unescaped backtick.")
elif last_line.strip() == '\\`':
    lines[last_idx] = '`;\n'
    print("Fixed last line (missing semicolon?) to unescaped backtick.")

with open(file_path, 'w') as f:
    f.writelines(lines)
