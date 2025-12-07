
import re

file_path = '/home/user/webapp/src/views/tv.ts'

with open(file_path, 'r') as f:
    content = f.read()

# content should start with export const tvHTML = `
# and end with `;

# We want to find any ` that is not preceded by \ (and not preceded by \\ which means escaped backslash)
# A backtick is unescaped if it has an EVEN number of backslashes before it.
# 0 backslashes: ` -> Unescaped
# 1 backslash: \` -> Escaped
# 2 backslashes: \\` -> Backslash + Unescaped `
# 3 backslashes: \\\` -> Backslash + Escaped `

def find_unescaped_chars(text, char, name):
    # Regex for unescaped char:
    # (?<!\\)(?:\\\\)*char
    # Negative lookbehind for \, then any number of double backslashes, then char.
    # Python re module doesn't support variable length lookbehind.
    
    # We'll iterate manually.
    lines = text.split('\n')
    for i, line in enumerate(lines):
        # We ignore the very first backtick (start of string) and very last (end of string).
        # But determining "very last" is hard if we have errors.
        
        # Simple scan
        idx = 0
        while idx < len(line):
            c = line[idx]
            if c == char:
                # Count backslashes before it
                bs_count = 0
                prev = idx - 1
                while prev >= 0 and line[prev] == '\\':
                    bs_count += 1
                    prev -= 1
                
                if bs_count % 2 == 0:
                    # Unescaped!
                    # Check if it's the start or end of the file main string
                    # Line 1 usually has export const tvHTML = `
                    # Last line has `;
                    
                    is_start = (i < 5 and 'export const tvHTML' in line)
                    is_end = (i > len(lines) - 5 and line.strip() == '`;')
                    
                    if not is_start and not is_end:
                        print(f"Found unescaped {name} at Line {i+1}, Col {idx+1}: {line.strip()}")
            idx += 1

print("Scanning for unescaped backticks...")
find_unescaped_chars(content, '`', 'backtick')

print("\nScanning for unescaped ${...")
# Scan for ${
lines = content.split('\n')
for i, line in enumerate(lines):
    idx = 0
    while idx < len(line) - 1:
        if line[idx] == '$' and line[idx+1] == '{':
            # Check backslashes
            bs_count = 0
            prev = idx - 1
            while prev >= 0 and line[prev] == '\\':
                bs_count += 1
                prev -= 1
            
            if bs_count % 2 == 0:
                print(f"Found unescaped ${{ at Line {i+1}, Col {idx+1}: {line.strip()}")
        idx += 1
