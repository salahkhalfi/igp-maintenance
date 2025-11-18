-- Seed test data for local development

-- Insert test users (password: test123)
INSERT OR IGNORE INTO users (id, email, password_hash, full_name, role, is_super_admin) VALUES
(2, 'tech1@igpglass.ca', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'Jean Tremblay', 'technician', 0),
(3, 'tech2@igpglass.ca', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'Marie Dubois', 'technician', 0),
(4, 'super@igpglass.ca', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'Pierre Gagnon', 'supervisor', 0),
(5, 'admin2@igpglass.ca', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'Sophie Martin', 'admin', 0),
(6, 'tech3@igpglass.ca', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'Luc Bergeron', 'technician', 0),
(7, 'tech4@igpglass.ca', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'Julie Lavoie', 'technician', 0),
(8, 'viewer@igpglass.ca', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'Marc Fortin', 'viewer', 0),
(9, 'tech5@igpglass.ca', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'Isabelle Roy', 'technician', 0);

-- Insert test machines
INSERT OR IGNORE INTO machines (id, machine_type, model, serial_number, location, status) VALUES
(1, 'Four de trempe #1', 'FC500', 'GT-2019-001', 'Atelier A', 'operational'),
(2, 'Ligne de coupe automatique', 'Master Cut', 'IM-2020-045', 'Atelier B', 'operational'),
(3, 'Presse à laminer', 'TurboLam', 'BY-2018-032', 'Atelier C', 'maintenance');

-- Insert test tickets (status: received, diagnostic, in_progress, waiting_parts, completed, archived)
-- (priority: low, medium, high, critical)
INSERT OR IGNORE INTO tickets (ticket_id, title, description, priority, status, machine_id, reported_by, assigned_to, created_at) VALUES
('TKT-001', 'Fuite huile hydraulique', 'Détection fuite importante système hydraulique', 'high', 'in_progress', 1, 1, 2, datetime('now', '-2 days')),
('TKT-002', 'Remplacement courroie', 'Courroie usée à remplacer avant rupture', 'medium', 'received', 2, 4, 3, datetime('now', '-1 day')),
('TKT-003', 'Calibration capteurs', 'Calibration annuelle capteurs température', 'low', 'received', 1, 1, 2, datetime('now', '-5 hours')),
('TKT-004', 'Panne électrique', 'Disjoncteur déclenche régulièrement', 'critical', 'in_progress', 3, 5, 1, datetime('now', '-8 hours')),
('TKT-005', 'Nettoyage filtres', 'Entretien préventif filtres air', 'low', 'completed', 2, 4, 6, datetime('now', '-10 days')),
('TKT-006', 'Vibrations anormales', 'Vibrations détectées moteur principal', 'high', 'diagnostic', 1, 1, 2, datetime('now', '-3 hours')),
('TKT-007', 'Mise à jour firmware', 'Mise à jour logiciel contrôleur', 'low', 'received', 2, 5, 3, datetime('now', '-1 hour')),
('TKT-008', 'Remplacement joint', 'Joint porte usé - perte étanchéité', 'medium', 'waiting_parts', 3, 4, 7, datetime('now', '-6 hours')),
('TKT-009', 'Inspection annuelle', 'Inspection sécurité annuelle obligatoire', 'medium', 'archived', 1, 1, 2, datetime('now', '-30 days')),
('TKT-010', 'Fissure vitre observation', 'Vitre observation présente fissure', 'medium', 'received', 1, 5, 2, datetime('now', '-2 hours')),
('TKT-011', 'Bruit anormal ventilateur', 'Ventilateur refroidissement bruyant', 'low', 'received', 2, 4, 3, datetime('now', '-4 hours')),
('TKT-012', 'Alarme température', 'Alarme haute température déclenchée', 'critical', 'in_progress', 3, 1, 1, datetime('now', '-1 hour'));

SELECT '✅ Seed data inserted successfully';
SELECT (SELECT COUNT(*) FROM users) || ' users' as result;
SELECT (SELECT COUNT(*) FROM machines) || ' machines' as result;
SELECT (SELECT COUNT(*) FROM tickets) || ' tickets' as result;
