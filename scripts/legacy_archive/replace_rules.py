
import os

file_path = '/home/user/webapp/src/routes/ai.ts'

with open(file_path, 'r') as f:
    content = f.read()

# Define the start and end of the block to remove
start_marker = "RÈGLES DE FORMATAGE (FORMAT WORD/HTML STRICT - ZÉRO MARKDOWN) :"
end_marker = "Si tu mets des \`\`\`, tu échoues."

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print("Could not find the block")
    # specific debug
    print(f"Start found: {start_idx}")
    print(f"End found: {end_idx}")
    exit(1)

# Calculate the full range to replace
full_end_idx = end_idx + len(end_marker)

new_content_block = """RÈGLES DE FORMATAGE (MARKDOWN STANDARD) :
1. **UTILISATION DU MARKDOWN** :
   - Utilise le Markdown standard pour enrichir tes réponses.
   - **Gras** : **Texte important**
   - **Listes** : - Item 1
   - **Titres** : ### Mon Titre (Utilise ### pour les sections)
   - **Tableaux** : Utilise la syntaxe Markdown standard.
   - **Liens** : [Texte](URL)

2. **INTERDICTION DU HTML** :
   - N'utilise **JAMAIS** de balises HTML brutes (<p>, <div>, <table>, etc.).
   - Le système convertira ton Markdown en HTML.

3. **CONTENU** :
   - Sois clair, professionnel et structuré."""

# Replace
new_file_content = content[:start_idx] + new_content_block + content[full_end_idx:]

with open(file_path, 'w') as f:
    f.write(new_file_content)

print("Successfully replaced content")
