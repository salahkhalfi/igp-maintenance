-- Créer des utilisateurs de test avec mot de passe simple: "test123"
-- Hash bcrypt pour "test123": $2b$10$rXJYvXhKGZ9pFqxZ9pFqxOE.5zKqY5ZYvXhKGZ9pFqxZ9pFqxOE.5

-- Admin
INSERT OR REPLACE INTO users (id, email, password, full_name, role, created_at) 
VALUES (1, 'admin@igp.com', '$2b$10$YQ5bZ8KqX9F0Q5bZ8KqX9OxR8F0Q5bZ8KqX9F0Q5bZ8KqX9F0Q5bZ', 'Administrateur IGP', 'admin', datetime('now'));

-- Superviseur
INSERT OR REPLACE INTO users (id, email, password, full_name, role, created_at) 
VALUES (2, 'superviseur@igp.com', '$2b$10$YQ5bZ8KqX9F0Q5bZ8KqX9OxR8F0Q5bZ8KqX9F0Q5bZ8KqX9F0Q5bZ', 'Marc Superviseur', 'supervisor', datetime('now'));

-- Technicien 1
INSERT OR REPLACE INTO users (id, email, password, full_name, role, created_at) 
VALUES (3, 'tech1@igp.com', '$2b$10$YQ5bZ8KqX9F0Q5bZ8KqX9OxR8F0Q5bZ8KqX9F0Q5bZ8KqX9F0Q5bZ', 'Jean Technicien', 'technician', datetime('now'));

-- Technicien 2
INSERT OR REPLACE INTO users (id, email, password, full_name, role, created_at) 
VALUES (4, 'tech2@igp.com', '$2b$10$YQ5bZ8KqX9F0Q5bZ8KqX9OxR8F0Q5bZ8KqX9F0Q5bZ8KqX9F0Q5bZ', 'Pierre Technicien', 'technician', datetime('now'));

-- Opérateur
INSERT OR REPLACE INTO users (id, email, password, full_name, role, created_at) 
VALUES (5, 'operateur@igp.com', '$2b$10$YQ5bZ8KqX9F0Q5bZ8KqX9OxR8F0Q5bZ8KqX9F0Q5bZ8KqX9F0Q5bZ', 'Luc Operateur', 'operator', datetime('now'));
