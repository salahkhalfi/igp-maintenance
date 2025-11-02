-- Données de test pour l'application de maintenance

-- Utilisateurs de test (mot de passe: "password123" hashé avec SHA-256)
-- Hash SHA-256 de "password123": ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f
INSERT OR IGNORE INTO users (email, password_hash, full_name, role) VALUES 
  ('admin@maintenance.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'Admin Principal', 'admin'),
  ('tech1@maintenance.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'Technicien Martin', 'technician'),
  ('tech2@maintenance.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'Technicien Sophie', 'technician'),
  ('operator@maintenance.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'Opérateur Jean', 'operator');

-- Machines réelles
INSERT OR IGNORE INTO machines (machine_type, model, serial_number, location, status) VALUES 
  ('Polisseuse', 'Double Edger', 'PDE-001', 'Atelier Polissage', 'operational'),
  ('Polisseuse', 'Bavelloni', 'BAV-001', 'Atelier Polissage', 'operational'),
  ('CNC', 'Machine CNC', 'CNC-001', 'Atelier Usinage', 'operational'),
  ('WaterJet', 'Machine WaterJet', 'WJ-001', 'Atelier Découpe', 'operational'),
  ('Four', 'Four de trempe', 'FOUR-001', 'Atelier Traitement', 'operational'),
  ('Thermos', 'Thermos', 'THERM-001', 'Atelier Assemblage', 'operational'),
  ('Découpe', 'Découpe', 'DEC-001', 'Atelier Découpe', 'operational'),
  ('Laminé', 'Laminé', 'LAM-001', 'Atelier Laminage', 'operational'),
  ('Autre', 'Autre', 'AUT-001', 'Divers', 'operational');

-- Tickets de test
INSERT OR IGNORE INTO tickets (ticket_id, title, description, machine_id, status, priority, reported_by, assigned_to) VALUES 
  ('IGP-POLISSEUSE-DOUBLEEDGER-20231025-001', 'Bruit anormal sur la Polisseuse Double Edger', 'Un bruit métallique se produit lors du démarrage de la machine. Nécessite un diagnostic urgent.', 1, 'diagnostic', 'high', 4, 2),
  ('IGP-CNC-MACHINECNC-20231024-002', 'Fuite d''huile détectée sur CNC', 'Fuite d''huile hydraulique au niveau du vérin principal. Intervention rapide nécessaire.', 3, 'in_progress', 'critical', 4, 2),
  ('IGP-WATERJET-MACHINEWATERJET-20231023-003', 'Problème de pression WaterJet', 'La machine WaterJet ne maintient pas la pression nécessaire. Vérification en cours.', 4, 'waiting_parts', 'high', 1, 3),
  ('IGP-FOUR-FOURDETREMPE-20231020-004', 'Maintenance préventive programmée', 'Contrôle trimestriel du four de trempe selon planning.', 5, 'received', 'medium', 1, NULL),
  ('IGP-POLISSEUSE-BAVELLONI-20231015-005', 'Calibration terminée avec succès', 'Recalibration de la Polisseuse Bavelloni après maintenance. Tests validés.', 2, 'completed', 'medium', 2, 2);

-- Historique des tickets (timeline)
INSERT OR IGNORE INTO ticket_timeline (ticket_id, user_id, action, old_status, new_status, comment) VALUES 
  (1, 4, 'Ticket créé', NULL, 'received', 'Bruit anormal signalé par l''opérateur'),
  (1, 2, 'Changement de statut', 'received', 'diagnostic', 'Prise en charge par le technicien Martin'),
  (2, 4, 'Ticket créé', NULL, 'received', 'Fuite détectée lors de l''inspection'),
  (2, 2, 'Changement de statut', 'received', 'diagnostic', 'Diagnostic en cours'),
  (2, 2, 'Changement de statut', 'diagnostic', 'in_progress', 'Pièces disponibles, intervention commencée'),
  (3, 1, 'Ticket créé', NULL, 'received', 'Panne signalée par le système de supervision'),
  (3, 3, 'Changement de statut', 'received', 'diagnostic', 'Diagnostic effectué: carte électronique HS'),
  (3, 3, 'Changement de statut', 'diagnostic', 'waiting_parts', 'En attente de la nouvelle carte (délai 5 jours)'),
  (4, 1, 'Ticket créé', NULL, 'received', 'Maintenance préventive planifiée Q4'),
  (5, 2, 'Ticket créé', NULL, 'received', 'Demande de calibration post-maintenance'),
  (5, 2, 'Changement de statut', 'received', 'in_progress', 'Calibration en cours'),
  (5, 2, 'Changement de statut', 'in_progress', 'completed', 'Calibration terminée et validée');

-- Note: Les médias seront ajoutés dynamiquement lors de l'upload via l'API R2
