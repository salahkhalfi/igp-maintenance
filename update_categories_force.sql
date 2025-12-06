-- Désactiver temporairement les contraintes de clé étrangère
PRAGMA foreign_keys = OFF;

-- Supprimer les anciennes catégories
DELETE FROM planning_categories;

-- Réinitialiser la séquence (optionnel)
DELETE FROM sqlite_sequence WHERE name='planning_categories';

-- Insérer les nouvelles catégories
INSERT INTO planning_categories (label, color, icon) VALUES 
('Production', '#3b82f6', 'fa-industry'),
('Maintenance', '#f97316', 'fa-tools'),
('Logistique', '#8b5cf6', 'fa-truck'),
('Qualité', '#10b981', 'fa-clipboard-check'),
('SST / Sécurité', '#ef4444', 'fa-hard-hat'),
('Admin / RH', '#64748b', 'fa-users');

-- Réactiver les contraintes
PRAGMA foreign_keys = ON;
