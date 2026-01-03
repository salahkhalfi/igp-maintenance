-- Script d'insertion de la signature de Marc Bélanger
-- Cherche automatiquement l'ID par email
-- Usage: npx wrangler d1 execute maintenance-db --file=scripts/insert-marc-signature-by-email.sql

-- Créer une table temporaire pour stocker l'ID trouvé
-- et insérer la signature avec le bon userId dynamiquement

-- D'abord, on vérifie que l'utilisateur existe
SELECT id, full_name, email FROM users WHERE email = 'mbelanger@igpglass.com';
