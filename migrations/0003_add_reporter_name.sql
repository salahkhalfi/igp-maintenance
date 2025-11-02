-- Ajouter une colonne pour stocker le nom libre de la personne qui rapporte
ALTER TABLE tickets ADD COLUMN reporter_name TEXT;

-- Ajouter une colonne pour stocker le nom libre de la personne assignée (technicien)
ALTER TABLE tickets ADD COLUMN assignee_name TEXT;
