-- Migration: Ajouter un index sur ticket_id pour améliorer les performances de recherche
-- Format de ticket ID simplifié: IGP-YYYY-NNNN (ex: IGP-2024-0001)
-- Date: 2024-11-26

-- Créer un index sur la colonne ticket_id pour accélérer les requêtes COUNT
-- Cet index améliore les performances de la fonction generateTicketId()
-- qui compte les tickets créés dans l'année en cours
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_id ON tickets(ticket_id);

-- Note: Les anciens tickets avec le format IGP-XXX-XXX-YYYYMMDD-NNN restent valides
-- Le nouveau format IGP-YYYY-NNNN sera utilisé pour tous les nouveaux tickets
-- La fonction isValidTicketId() supporte les deux formats pour la compatibilité
