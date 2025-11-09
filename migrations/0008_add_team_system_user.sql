-- Migration 0008: Ajouter un utilisateur système pour "Toute l'équipe"
-- Cet utilisateur fictif (id=0) permet d'assigner des tickets à toute l'équipe
-- sans violer la contrainte de clé étrangère

-- Insérer l'utilisateur système avec id=0
INSERT OR IGNORE INTO users (id, email, password_hash, full_name, role) 
VALUES (
    0, 
    'system.team@igpglass.ca', 
    'SYSTEM_USER_NO_LOGIN', 
    '👥 Toute l''équipe', 
    'technician'
);

-- Réinitialiser l'auto-increment pour qu'il recommence à 1 pour les vrais utilisateurs
-- (SQLite utilisera max(id)+1, donc les prochains IDs seront >= 1)
