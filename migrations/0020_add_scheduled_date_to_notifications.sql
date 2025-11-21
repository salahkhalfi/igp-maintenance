-- Migration pour ajouter scheduled_date_notified à webhook_notifications
-- Date: 2025-11-21
-- Purpose: Permettre la détection de changements de date planifiée
-- 
-- Problème résolu: Quand un utilisateur change scheduled_date d'un ticket,
-- le système doit envoyer une nouvelle notification pour la nouvelle date,
-- même si une notification a déjà été envoyée pour l'ancienne date.

-- Ajouter la colonne scheduled_date_notified pour tracer quelle date a été notifiée
ALTER TABLE webhook_notifications 
ADD COLUMN scheduled_date_notified TEXT;

-- Index composite pour recherche rapide: ticket + date planifiée + type
-- Cet index permet de vérifier rapidement si une notification a déjà été
-- envoyée pour ce ticket AVEC cette date planifiée spécifique
CREATE INDEX IF NOT EXISTS idx_webhook_ticket_scheduled_type 
ON webhook_notifications(ticket_id, scheduled_date_notified, notification_type);

-- Note: Les enregistrements existants auront scheduled_date_notified = NULL
-- Le code gère ce cas gracieusement - les anciens enregistrements ne bloqueront
-- pas les nouvelles notifications car NULL != 'date_value' en SQL
