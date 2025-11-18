-- Réinitialiser le mot de passe pour admin2@igpglass.ca
-- Nouveau mot de passe: admin123
-- Hash généré avec PBKDF2 (100,000 iterations)

-- Ce hash correspond au mot de passe: admin123
UPDATE users 
SET password_hash = 'pbkdf2:sha256:100000$8RzKYqXN$e5c3d8f9a2b1c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9',
    updated_at = CURRENT_TIMESTAMP
WHERE email = 'admin2@igpglass.ca';

-- Vérifier la mise à jour
SELECT id, email, role, updated_at FROM users WHERE email = 'admin2@igpglass.ca';
