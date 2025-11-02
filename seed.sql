-- Données de test pour l'application de maintenance

-- Utilisateurs de test (mot de passe: "password123" hashé avec SHA-256)
-- Hash SHA-256 de "password123": ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f
INSERT OR IGNORE INTO users (email, password_hash, full_name, role) VALUES 
  ('admin@maintenance.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'Admin Principal', 'admin'),
  ('tech1@maintenance.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'Technicien Martin', 'technician'),
  ('tech2@maintenance.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'Technicien Sophie', 'technician'),
  ('operator@maintenance.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'Opérateur Jean', 'operator');

-- Machines de test
INSERT OR IGNORE INTO machines (machine_type, model, serial_number, location, status) VALUES 
  ('PDE', '7500', 'IGP-PDE-7500-2023', 'Atelier A - Zone 1', 'operational'),
  ('PDE', '8000', 'IGP-PDE-8000-2023', 'Atelier A - Zone 2', 'operational'),
  ('CNC', 'X-500', 'IGP-CNC-X500-2022', 'Atelier B - Zone 1', 'operational'),
  ('Presse', 'HP-200', 'IGP-PRESSE-HP200-2021', 'Atelier C', 'maintenance'),
  ('Robot', 'ABB-IRB', 'IGP-ROBOT-IRB-2024', 'Atelier B - Zone 2', 'operational');

-- Tickets de test
INSERT OR IGNORE INTO tickets (ticket_id, title, description, machine_id, status, priority, reported_by, assigned_to) VALUES 
  ('IGP-PDE-7500-20231025-001', 'Bruit anormal sur la machine PDE-7500', 'Un bruit métallique se produit lors du démarrage de la machine. Nécessite un diagnostic urgent.', 1, 'diagnostic', 'high', 4, 2),
  ('IGP-CNC-X500-20231024-002', 'Fuite d''huile détectée', 'Fuite d''huile hydraulique au niveau du vérin principal. Intervention rapide nécessaire.', 3, 'in_progress', 'critical', 4, 2),
  ('IGP-PRESSE-HP200-20231023-003', 'Panne électrique', 'La presse ne démarre plus. Vérification du système électrique en cours.', 4, 'waiting_parts', 'high', 1, 3),
  ('IGP-PDE-8000-20231020-004', 'Maintenance préventive programmée', 'Contrôle trimestriel et remplacement des filtres selon planning.', 2, 'received', 'medium', 1, NULL),
  ('IGP-ROBOT-IRB-20231015-005', 'Calibration terminée avec succès', 'Recalibration du bras robotique après maintenance. Tests validés.', 5, 'completed', 'medium', 2, 2);

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
