-- Ajouter le champ scheduled_date pour planifier les tâches
-- Ce champ sera utilisé par les superviseurs et admins pour céduler les tickets

ALTER TABLE tickets ADD COLUMN scheduled_date DATETIME;

-- Index pour améliorer les performances des requêtes par date planifiée
CREATE INDEX IF NOT EXISTS idx_tickets_scheduled ON tickets(scheduled_date);
