-- Migration: Ajouter opérateur et contexte IA aux machines
-- Date: 2025-12-27
-- Description: Enrichit les données machines pour améliorer le contexte IA
-- Impact: FAIBLE - Ajout de 2 colonnes nullable

-- Ajouter la colonne operator_id (référence vers users)
-- L'opérateur principal assigné à cette machine
ALTER TABLE machines ADD COLUMN operator_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- Ajouter la colonne ai_context pour stocker des informations supplémentaires
-- utilisées par l'IA pour mieux comprendre la machine
-- Exemples: historique de pannes, particularités, procédures spéciales, etc.
ALTER TABLE machines ADD COLUMN ai_context TEXT;

-- Index pour améliorer les performances des requêtes par opérateur
CREATE INDEX IF NOT EXISTS idx_machines_operator_id ON machines(operator_id);

-- Commentaire: Ces champs enrichissent le contexte IA lors des interactions
-- - operator_id: Permet d'identifier qui connaît le mieux cette machine
-- - ai_context: Informations libres (historique, spécificités, procédures)
