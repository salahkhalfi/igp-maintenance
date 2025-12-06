
import os

try:
    with open('public/tv.html', 'r', encoding='utf-8') as f:
        content = f.read()

    # Escape for TypeScript backtick string
    # 1. Backslashes first!
    content = content.replace('\\', '\\\\')
    # 2. Backticks
    content = content.replace('`', '\\`')
    # 3. Template variables
    content = content.replace('${', '\\${')

    with open('src/views/tv.ts', 'w', encoding='utf-8') as f:
        f.write('export const tvHTML = `' + content + '`;\n')

    print("Successfully generated src/views/tv.ts")
except Exception as e:
    print(f"Error: {e}")
