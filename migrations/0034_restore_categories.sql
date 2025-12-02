-- Re-insert default categories if missing
INSERT OR IGNORE INTO planning_categories (id, label, icon, color) VALUES 
('cut', 'Mise en Prod', 'fa-layer-group', 'blue'),
('ship', 'Expéditions', 'fa-truck', 'green'),
('maintenance', 'Maintenance', 'fa-tools', 'red'),
('reminder', 'Rappel / Note', 'fa-info-circle', 'yellow'),
('blocked', 'Bloqué', 'fa-ban', 'red');
