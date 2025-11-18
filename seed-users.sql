-- Script de seed pour restaurer les utilisateurs de production en local
-- Exécuter avec: npx wrangler d1 execute maintenance-db --local --file=./seed-users.sql

-- Supprimer tous les utilisateurs existants
DELETE FROM users;

-- Importer TOUS les 11 utilisateurs de production (backup du 2025-11-18)
INSERT INTO users (id, email, password_hash, full_name, role, created_at, updated_at, last_login, is_super_admin) VALUES
(0, 'system.team@igpglass.ca', 'SYSTEM_USER_NO_LOGIN', '👥 Toute l''équipe', 'technician', '2025-11-09 13:24:26', '2025-11-09 13:24:26', NULL, 0),
(1, 'admin@igpglass.ca', 'v2:708a8b42775ca44de086eafad3bd58b4:aadf07ecbfd5fe05fba80901f13b89aa4045d8d5999ae93e1c6736e39218635f', 'Administrateur IGP', 'admin', '2025-11-02 19:24:53', '2025-11-14 14:16:24', '2025-11-18 12:20:31', 0),
(2, 'technicien@igpglass.ca', 'v2:2ed97b0107a98a795fc4f316b7afdce7:2ef3cf43e7849c759e45b8ffc1c17f3db5c0194eea286efc65ce0f7921d52f37', 'Laurent', 'technician', '2025-11-02 19:24:53', '2025-11-14 14:39:16', '2025-11-16 06:56:50', 0),
(4, 'operateur@igpglass.ca', 'v2:2dcb5f8afeb0b7695a6be291b865b1de:0ba992f34a3256d91a59a6df8d0a02f89d57fa39969b3e41204cc1949b17e27a', 'Salah', 'operator', '2025-11-02 19:24:53', '2025-11-14 12:40:08', '2025-11-14 14:17:13', 0),
(5, 'mbelanger@igpglass.com', 'v2:a85f8159e68a8513eba3918c09dcce29:d4048b5c7f79d7d60a1fca03177696ffa0558046e63459ee22e8fa2194ad8cb0', 'Marc Bélanger', 'admin', '2025-11-03 20:18:54', '2025-11-08 16:40:49', '2025-11-11 18:51:12', 0),
(6, 'brahim@igpglass.ca', 'v2:05737ab71b0257c311c8917f7dcd383b:6c83a1323657338b3c6c04a5372315a8fddf9ffc14264aee4953731f221fd8a8', 'Brahim', 'technician', '2025-11-04 20:16:47', '2025-11-08 07:39:53', '2025-11-08 18:55:23', 0),
(7, 'superviseur@igpglass.com', 'v2:5c1ebc5816d4aefdf6a2c47db6b4fe7b:9e148824748c0cf4afae2331504f93a2cc685cc65256d399cdfa0fc2e5a3f228', 'Yves', 'supervisor', '2025-11-05 09:34:44', '2025-11-08 17:35:40', '2025-11-05 09:34:44', 0),
(8, 'mounir@igpglass.ca', 'v2:a6df207c44c749ee669434ad41a0166d:73583a7f1756f4d81935d3f2092695121333da6feb04c03dcd163326af356867', 'Mounir Sayad', 'team_leader', '2025-11-07 13:43:23', '2025-11-08 12:47:58', NULL, 0),
(9, 'technicien1@igpglass.ca', 'v2:def27263e9744ad7a97ee8c9f8d53866:4a142af1ea3805c8d726d252a45b5efc90cff4d9dbd15781650a903189966864', 'Deuxieme Technicien', 'technician', '2025-11-07 14:05:54', '2025-11-15 09:58:12', '2025-11-16 06:34:38', 0),
(10, 'ali@igpglass.ca', 'v2:70e67d7aab7b0f08f2c3b21df625fc6f:36f488ce462f806e0369d49f0dab4aec80a1c8d6b4cc9e5fd21fcb2d432ee51c', 'Ali', 'furnace_operator', '2025-11-08 17:05:24', '2025-11-08 17:05:24', '2025-11-10 09:53:54', 0),
(11, 'salah@khalfi.com', 'v2:46aed0a042b42c7252300784b4e693d8:1777b464cd03c75c6d1fe96579e84842d46c7cbd73753f5f77ada82c52035b04', 'Salah Khalfi', 'admin', '2025-11-12 14:15:16', '2025-11-12 14:17:32', '2025-11-13 08:43:52', 1);

-- Vérification
SELECT COUNT(*) as total_users FROM users;
SELECT id, email, full_name, role FROM users ORDER BY id;
