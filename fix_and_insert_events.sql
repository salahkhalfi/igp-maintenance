-- Fix IDs in categories table
UPDATE planning_categories SET id = rowid WHERE id IS NULL;

-- Disable FK constraints
PRAGMA foreign_keys = OFF;

-- Clean up future test events
DELETE FROM planning_events WHERE date >= date('now');

-- Insert new test events
INSERT INTO planning_events (date, type, status, title, details) VALUES 
(date('now'), 1, 'confirmed', 'Production: Commande Hilton', 'Découpe et assemblage vitrage 12mm - 45 unités'),
(date('now'), 3, 'confirmed', 'Expédition: Chantier Stade', '3 chevalets à préparer avant 14h - Camion T.L.S.'),
(date('now'), 5, 'confirmed', 'Audit Sécurité Ligne 2', 'Inspection des carters de protection et arrêts d''urgence'),
(date('now', '+1 day'), 2, 'confirmed', 'Maintenance Four Trempe', 'Arrêt complet de 8h à 12h pour nettoyage filtres et calibration'),
(date('now', '+1 day'), 6, 'confirmed', 'Visite Client: Vitres.com', 'Tour de l''usine avec M. Dupont à 10h00'),
(date('now', '+1 day'), 1, 'confirmed', 'Production: Façade Tour B', 'Lancement série spéciale - Verre feuilleté - Priorité 1'),
(date('now', '+2 days'), 4, 'confirmed', 'Audit Qualité Interne', 'Vérification conformité ligne assemblage 3 - Norme ISO'),
(date('now', '+2 days'), 3, 'confirmed', 'Réception Verre Brut', 'Livraison Saint-Gobain - 2 camions à décharger quai 4'),
(date('now', '+3 days'), 1, 'confirmed', 'Production: Commande Urgente', 'Remplacement casse client - 10 vitrages à couper'),
(date('now', '+4 days'), 5, 'confirmed', 'Formation SST', 'Formation Travail en Hauteur - Salle de réunion principale - 13h'),
(date('now', '+5 days'), 2, 'tentative', 'Changement Pompe Hydraulique', 'Table de découpe 1 - En attente de la pièce de rechange'),
(date('now', '+7 days'), 6, 'confirmed', 'Réunion Direction', 'Revue des objectifs Q3 - Salle du conseil'),
(date('now', '+8 days'), 4, 'confirmed', 'Inspection Lots Sortants', 'Contrôle final commande export USA'),
(date('now', '+10 days'), 6, 'confirmed', 'Inventaire Mensuel', 'Arrêt des expéditions à 16h pour comptage stock');

PRAGMA foreign_keys = ON;
