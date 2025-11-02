-- Supprimer les anciennes machines
DELETE FROM machines;

-- Ajouter les vraies machines
INSERT INTO machines (machine_type, model, serial_number, location, status) VALUES 
  ('Polisseuse', 'Double Edger', 'PDE-001', 'Atelier Polissage', 'operational'),
  ('Polisseuse', 'Bavelloni', 'BAV-001', 'Atelier Polissage', 'operational'),
  ('CNC', 'Machine CNC', 'CNC-001', 'Atelier Usinage', 'operational'),
  ('WaterJet', 'Machine WaterJet', 'WJ-001', 'Atelier Découpe', 'operational'),
  ('Four', 'Four de trempe', 'FOUR-001', 'Atelier Traitement', 'operational'),
  ('Thermos', 'Thermos', 'THERM-001', 'Atelier Assemblage', 'operational'),
  ('Découpe', 'Découpe', 'DEC-001', 'Atelier Découpe', 'operational'),
  ('Laminé', 'Laminé', 'LAM-001', 'Atelier Laminage', 'operational'),
  ('Autre', 'Autre', 'AUT-001', 'Divers', 'operational');
