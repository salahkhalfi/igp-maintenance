PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE d1_migrations(
		id         INTEGER PRIMARY KEY AUTOINCREMENT,
		name       TEXT UNIQUE,
		applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
INSERT INTO "d1_migrations" VALUES(1,'0001_initial_schema.sql','2025-11-05 09:43:21');
INSERT INTO "d1_migrations" VALUES(2,'0002_add_comments.sql','2025-11-05 09:43:21');
INSERT INTO "d1_migrations" VALUES(3,'0003_add_reporter_name.sql','2025-11-05 09:43:21');
INSERT INTO "d1_migrations" VALUES(4,'0004_add_scheduled_date.sql','2025-11-05 10:14:56');
INSERT INTO "d1_migrations" VALUES(5,'0005_add_messages.sql','2025-11-05 13:45:25');
INSERT INTO "d1_migrations" VALUES(6,'0006_add_last_login.sql','2025-11-06 09:08:10');
INSERT INTO "d1_migrations" VALUES(7,'0007_add_foreign_key_constraints.sql','2025-11-06 12:26:41');
INSERT INTO "d1_migrations" VALUES(8,'0008_create_rbac_system.sql','2025-11-06 12:26:41');
INSERT INTO "d1_migrations" VALUES(9,'0006_add_audio_messages.sql','2025-11-06 14:45:05');
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin', 'supervisor', 'technician', 'operator')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
, last_login DATETIME);
INSERT INTO "users" VALUES(1,'supervisor@test.com','test','Test Superviseur','supervisor','2025-11-05 09:43:36','2025-11-05 09:43:36','2025-11-05 09:43:36');
INSERT INTO "users" VALUES(2,'admin@igp.com','v2:7d82da7b6fadffe59c06fbf3085ffa83:082e31de7ce08158560f52f1011431fb2422217a0413d6ef0a1b4b7127a09b2b','Admin IGP','admin','2025-11-05 11:48:23','2025-11-05 11:48:23','2025-11-06 14:51:24');
INSERT INTO "users" VALUES(3,'superviseur@igp.com','v2:34d9d492581d2c627e5d5cb7624d96e3:84959a69f189575313c1eb88c678372be5688a74b344c659a4035b35502dac4f','Marc Superviseur','supervisor','2025-11-05 11:48:30','2025-11-05 11:48:30','2025-11-06 09:48:29');
INSERT INTO "users" VALUES(4,'tech@igp.com','v2:ba943ecb37e4890b562e47dc20e8dc91:8ad0012d4e577d07f017a468353da77249ba9f42a7e4c5cedd73e0a2361df12a','Jean Technicien','technician','2025-11-05 11:48:37','2025-11-06 08:25:39','2025-11-06 09:47:39');
INSERT INTO "users" VALUES(5,'tech2@igp.com','v2:059bfac3d5f118a3703f44476c87c6ea:0f8723deb1660541a158d7f9f66136a69f78cc2fb12779fcbd01cfdb0213204f','Pierre Technicien','technician','2025-11-05 11:48:37','2025-11-05 11:48:37','2025-11-05 11:48:37');
INSERT INTO "users" VALUES(6,'operateur@igp.com','v2:21e0c8f4c963249e82297ad221f9e8a7:778ba2a8e709e76d184151f5cc4e03199fdf29d506c45dbde9bec6ab307c9fa7','Luc Operateur','operator','2025-11-05 11:48:43','2025-11-06 08:19:30','2025-11-05 11:48:43');
CREATE TABLE machines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  machine_type TEXT NOT NULL,
  model TEXT NOT NULL,
  serial_number TEXT UNIQUE,
  location TEXT,
  status TEXT DEFAULT 'operational' CHECK(status IN ('operational', 'maintenance', 'out_of_service')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "machines" VALUES(1,'Presse Hydraulique','HP-3000','SN-001-2023','Atelier A','operational','2025-11-05 11:53:52','2025-11-05 11:53:52');
INSERT INTO "machines" VALUES(2,'Four Industriel','FS-2500','SN-002-2023','Atelier B','operational','2025-11-05 11:53:52','2025-11-05 11:53:52');
INSERT INTO "machines" VALUES(3,'Convoyeur','CV-1200','SN-003-2023','Zone Production','operational','2025-11-05 11:53:52','2025-11-05 11:53:52');
INSERT INTO "machines" VALUES(4,'Compresseur','AM-5000','SN-004-2023','Salle Mecanique','operational','2025-11-05 11:53:52','2025-11-05 11:53:52');
INSERT INTO "machines" VALUES(5,'Robot de Soudure','RW-800','SN-005-2023','Atelier C','operational','2025-11-05 11:53:52','2025-11-05 11:53:52');
INSERT INTO "machines" VALUES(6,'Chariot Elevateur','LM-250','SN-006-2023','Entrepot','operational','2025-11-05 11:53:52','2025-11-05 11:53:52');
INSERT INTO "machines" VALUES(7,'Broyeur','BR-400','SN-007-2023','Zone Recyclage','operational','2025-11-05 11:53:52','2025-11-05 11:53:52');
INSERT INTO "machines" VALUES(8,'Pompe','PM-1500','SN-008-2023','Salle des Pompes','operational','2025-11-05 11:53:52','2025-11-05 11:53:52');
INSERT INTO "machines" VALUES(9,'Machine''s Test','Model "Special" & <script>','SN-123','Atelier D''été','operational','2025-11-06 13:51:28','2025-11-06 13:51:28');
INSERT INTO "machines" VALUES(10,'Test Apostrophe','Model OK','SN-999','Atelier','operational','2025-11-06 13:51:36','2025-11-06 13:51:36');
INSERT INTO "machines" VALUES(11,'Machine d''atelier','Model l''original','SN-1000','Atelier d''été','operational','2025-11-06 13:51:47','2025-11-06 13:51:47');
INSERT INTO "machines" VALUES(12,'<script>alert("XSS")</script>','<img src=x onerror=alert(1)>','SN-XSS','Test','operational','2025-11-06 13:51:55','2025-11-06 13:51:55');
CREATE TABLE tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  machine_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'received' CHECK(status IN ('received', 'diagnostic', 'in_progress', 'waiting_parts', 'completed', 'archived')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'critical')),
  reported_by INTEGER NOT NULL,
  assigned_to INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME, reporter_name TEXT, assignee_name TEXT, scheduled_date DATETIME,
  FOREIGN KEY (machine_id) REFERENCES machines(id),
  FOREIGN KEY (reported_by) REFERENCES users(id),
  FOREIGN KEY (assigned_to) REFERENCES users(id)
);
INSERT INTO "tickets" VALUES(1,'IGP-CHARIOT ELEVATEUR-LM-250-20251105-986','Tes','Problème ',6,'diagnostic','medium',3,4,'2025-11-05 06:54:36','2025-11-06 07:59:44',NULL,'Marc Superviseur',NULL,'2025-11-07T07:54:00');
INSERT INTO "tickets" VALUES(2,'IGP-CHARIOT ELEVATEUR-LM-250-20251106-747','probleme de bruit cnc','j''entend des bruits bizarres',6,'in_progress','low',6,NULL,'2025-11-06 03:22:04','2025-11-06 08:26:18',NULL,'Luc Operateur',NULL,NULL);
INSERT INTO "tickets" VALUES(3,'IGP-PRESSE HYDRAULIQUE-HP-3000-20251106-345','demande par un technicien','blabla',1,'received','low',4,NULL,'2025-11-06 03:55:41','2025-11-06 03:55:41',NULL,'Jean Technicien',NULL,NULL);
CREATE TABLE media (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id INTEGER NOT NULL,
  file_key TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  url TEXT NOT NULL,
  uploaded_by INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id)
);
INSERT INTO "media" VALUES(1,2,'tickets/2/1762417324360-bd2z7p-7_wastes_LP copy.jpg','7_wastes_LP copy.jpg','image/jpeg',12747,'https://maintenance-media.your-account.r2.cloudflarestorage.com/tickets/2/1762417324360-bd2z7p-7_wastes_LP copy.jpg',6,'2025-11-06 08:22:04');
CREATE TABLE ticket_timeline (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  action TEXT NOT NULL,
  old_status TEXT,
  new_status TEXT,
  comment TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
INSERT INTO "ticket_timeline" VALUES(1,1,3,'Ticket créé',NULL,'received','Problème ','2025-11-05 11:54:38');
INSERT INTO "ticket_timeline" VALUES(2,1,3,'Mise à jour',NULL,NULL,NULL,'2025-11-05 11:55:01');
INSERT INTO "ticket_timeline" VALUES(3,1,3,'Mise à jour',NULL,NULL,NULL,'2025-11-05 12:53:39');
INSERT INTO "ticket_timeline" VALUES(4,1,4,'Changement de statut','received','diagnostic','Changement de statut: received → diagnostic','2025-11-05 17:11:28');
INSERT INTO "ticket_timeline" VALUES(5,1,4,'Changement de statut','diagnostic','in_progress','Changement de statut: diagnostic → in_progress','2025-11-05 17:27:31');
INSERT INTO "ticket_timeline" VALUES(6,1,4,'Changement de statut','in_progress','diagnostic','Changement de statut: in_progress → diagnostic','2025-11-05 17:27:36');
INSERT INTO "ticket_timeline" VALUES(7,1,4,'Changement de statut','diagnostic','received','Changement de statut: diagnostic → received','2025-11-05 17:59:53');
INSERT INTO "ticket_timeline" VALUES(8,1,4,'Changement de statut','received','received','Changement de statut: diagnostic → received','2025-11-05 17:59:58');
INSERT INTO "ticket_timeline" VALUES(9,1,4,'Changement de statut','received','diagnostic','Changement de statut: received → diagnostic','2025-11-05 18:01:57');
INSERT INTO "ticket_timeline" VALUES(10,1,4,'Changement de statut','diagnostic','in_progress','Changement de statut: diagnostic → in_progress','2025-11-05 18:06:20');
INSERT INTO "ticket_timeline" VALUES(11,1,4,'Changement de statut','in_progress','diagnostic','Changement de statut: in_progress → diagnostic','2025-11-05 18:06:39');
INSERT INTO "ticket_timeline" VALUES(12,1,4,'Changement de statut','diagnostic','received','Changement de statut: diagnostic → received','2025-11-05 18:11:02');
INSERT INTO "ticket_timeline" VALUES(13,1,4,'Changement de statut','received','in_progress','Changement de statut: received → in_progress','2025-11-05 18:11:09');
INSERT INTO "ticket_timeline" VALUES(14,1,4,'Changement de statut','in_progress','diagnostic','Changement de statut: in_progress → diagnostic','2025-11-05 18:11:20');
INSERT INTO "ticket_timeline" VALUES(15,1,2,'Changement de statut','diagnostic','in_progress','Changement de statut: diagnostic → in_progress','2025-11-06 07:59:23');
INSERT INTO "ticket_timeline" VALUES(16,1,2,'Changement de statut','in_progress','diagnostic','Changement de statut: in_progress → diagnostic','2025-11-06 07:59:44');
INSERT INTO "ticket_timeline" VALUES(17,2,6,'Ticket créé',NULL,'received','j''entend des bruits bizarres','2025-11-06 08:22:04');
INSERT INTO "ticket_timeline" VALUES(18,2,4,'Changement de statut','received','in_progress','Changement de statut: received → in_progress','2025-11-06 08:26:18');
INSERT INTO "ticket_timeline" VALUES(19,3,4,'Ticket créé',NULL,'received','blabla','2025-11-06 08:55:41');
CREATE TABLE ticket_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id INTEGER NOT NULL,
  user_name TEXT NOT NULL,
  user_role TEXT,
  comment TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
);
CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_id INTEGER NOT NULL,
  recipient_id INTEGER,
  message_type TEXT NOT NULL CHECK(message_type IN ('public', 'private')),
  content TEXT NOT NULL,
  is_read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  read_at DATETIME, audio_file_key TEXT, audio_duration INTEGER, audio_size INTEGER,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE
);
INSERT INTO "messages" VALUES(1,4,5,'private','Test message ',0,'2025-11-05 14:54:59',NULL,NULL,NULL,NULL);
INSERT INTO "messages" VALUES(2,4,2,'private','Un message pour l''administration ',1,'2025-11-05 19:09:04','2025-11-06 07:55:59',NULL,NULL,NULL);
INSERT INTO "messages" VALUES(3,4,NULL,'public','Un message public',0,'2025-11-05 19:09:24',NULL,NULL,NULL,NULL);
INSERT INTO "messages" VALUES(4,2,6,'private','salut luc',0,'2025-11-06 08:48:11',NULL,NULL,NULL,NULL);
INSERT INTO "messages" VALUES(5,2,NULL,'public','salut tout le monde',0,'2025-11-06 08:48:27',NULL,NULL,NULL,NULL);
INSERT INTO "messages" VALUES(6,2,NULL,'public','deuxieme message publique',0,'2025-11-06 08:57:33',NULL,NULL,NULL,NULL);
INSERT INTO "messages" VALUES(7,2,4,'private','Salut jean 2e message',0,'2025-11-06 08:58:04',NULL,NULL,NULL,NULL);
INSERT INTO "messages" VALUES(8,3,2,'private','salut boss',1,'2025-11-06 09:49:13','2025-11-06 09:49:58',NULL,NULL,NULL);
INSERT INTO "messages" VALUES(9,2,NULL,'public','🎤 Message vocal',0,'2025-11-06 15:24:54',NULL,'messages/audio/2/1762442694731-6mx52k.webm',7,118148);
CREATE TABLE roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,                    
  display_name TEXT NOT NULL,                   
  description TEXT,                             
  is_system INTEGER DEFAULT 0,                  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "roles" VALUES(1,'admin','Administrateur','Accès complet au système, gestion des utilisateurs et des rôles',1,'2025-11-06 12:26:41','2025-11-06 12:26:41');
INSERT INTO "roles" VALUES(2,'supervisor','Superviseur','Gestion des tickets, machines et équipe (sauf admins)',1,'2025-11-06 12:26:41','2025-11-06 12:26:41');
INSERT INTO "roles" VALUES(3,'technician','Technicien','Intervention sur les tickets, déplacement et modification',1,'2025-11-06 12:26:41','2025-11-06 12:26:41');
INSERT INTO "roles" VALUES(4,'operator','Opérateur','Création et suivi de ses propres tickets uniquement',1,'2025-11-06 12:26:41','2025-11-06 12:26:41');
CREATE TABLE permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  resource TEXT NOT NULL,                       
  action TEXT NOT NULL,                         
  scope TEXT NOT NULL,                          
  display_name TEXT NOT NULL,                   
  description TEXT,                             
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(resource, action, scope)               
);
INSERT INTO "permissions" VALUES(1,'tickets','create','all','Créer des tickets','Permet de créer des tickets de maintenance','2025-11-06 12:26:41');
INSERT INTO "permissions" VALUES(2,'tickets','read','all','Voir tous les tickets','Accès en lecture à tous les tickets','2025-11-06 12:26:41');
INSERT INTO "permissions" VALUES(3,'tickets','read','own','Voir ses tickets','Accès uniquement à ses propres tickets','2025-11-06 12:26:41');
INSERT INTO "permissions" VALUES(4,'tickets','update','all','Modifier tous les tickets','Modification complète de tous les tickets','2025-11-06 12:26:41');
INSERT INTO "permissions" VALUES(5,'tickets','update','own','Modifier ses tickets','Modification uniquement de ses propres tickets','2025-11-06 12:26:41');
INSERT INTO "permissions" VALUES(6,'tickets','delete','all','Supprimer tous les tickets','Suppression de n importe quel ticket','2025-11-06 12:26:41');
INSERT INTO "permissions" VALUES(7,'tickets','delete','own','Supprimer ses tickets','Suppression uniquement de ses propres tickets','2025-11-06 12:26:41');
INSERT INTO "permissions" VALUES(8,'tickets','assign','all','Assigner des tickets','Assigner des tickets à des techniciens','2025-11-06 12:26:41');
INSERT INTO "permissions" VALUES(9,'tickets','move','all','Déplacer des tickets','Changer le statut/colonne des tickets','2025-11-06 12:26:41');
INSERT INTO "permissions" VALUES(10,'tickets','comment','all','Commenter les tickets','Ajouter des commentaires sur les tickets','2025-11-06 12:26:41');
INSERT INTO "permissions" VALUES(11,'machines','create','all','Créer des machines','Ajouter de nouvelles machines au système','2025-11-06 12:26:41');
INSERT INTO "permissions" VALUES(12,'machines','read','all','Voir les machines','Accès en lecture aux machines','2025-11-06 12:26:41');
INSERT INTO "permissions" VALUES(13,'machines','update','all','Modifier les machines','Modification des informations machines','2025-11-06 12:26:41');
INSERT INTO "permissions" VALUES(14,'machines','delete','all','Supprimer les machines','Suppression de machines (si aucun ticket)','2025-11-06 12:26:41');
INSERT INTO "permissions" VALUES(15,'users','create','all','Créer des utilisateurs','Ajouter de nouveaux utilisateurs','2025-11-06 12:26:41');
INSERT INTO "permissions" VALUES(16,'users','read','all','Voir les utilisateurs','Liste et détails des utilisateurs','2025-11-06 12:26:41');
INSERT INTO "permissions" VALUES(17,'users','update','all','Modifier les utilisateurs','Modification email, nom, rôle','2025-11-06 12:26:41');
INSERT INTO "permissions" VALUES(18,'users','delete','all','Supprimer les utilisateurs','Suppression d utilisateurs','2025-11-06 12:26:41');
INSERT INTO "permissions" VALUES(19,'users','reset_password','all','Réinitialiser mots de passe','Changer le mot de passe d autres utilisateurs','2025-11-06 12:26:41');
INSERT INTO "permissions" VALUES(20,'messages','create','public','Messages publics','Envoyer des messages publics à l équipe','2025-11-06 12:26:41');
INSERT INTO "permissions" VALUES(21,'messages','create','private','Messages privés','Envoyer des messages privés','2025-11-06 12:26:41');
INSERT INTO "permissions" VALUES(22,'messages','read','all','Lire les messages','Accès aux messages publics et privés','2025-11-06 12:26:41');
INSERT INTO "permissions" VALUES(23,'messages','delete','own','Supprimer ses messages','Supprimer ses propres messages','2025-11-06 12:26:41');
INSERT INTO "permissions" VALUES(24,'messages','delete','all','Supprimer tous les messages','Supprimer n importe quel message','2025-11-06 12:26:41');
INSERT INTO "permissions" VALUES(25,'media','upload','all','Uploader des médias','Ajouter photos/vidéos aux tickets','2025-11-06 12:26:41');
INSERT INTO "permissions" VALUES(26,'media','delete','own','Supprimer ses médias','Supprimer ses propres uploads','2025-11-06 12:26:41');
INSERT INTO "permissions" VALUES(27,'media','delete','all','Supprimer tous les médias','Supprimer n importe quel média','2025-11-06 12:26:41');
INSERT INTO "permissions" VALUES(28,'roles','create','all','Créer des rôles','Créer de nouveaux rôles personnalisés','2025-11-06 12:26:41');
INSERT INTO "permissions" VALUES(29,'roles','read','all','Voir les rôles','Liste des rôles et permissions','2025-11-06 12:26:41');
INSERT INTO "permissions" VALUES(30,'roles','update','all','Modifier les rôles','Modifier les permissions des rôles','2025-11-06 12:26:41');
INSERT INTO "permissions" VALUES(31,'roles','delete','custom','Supprimer rôles personnalisés','Supprimer rôles non-système','2025-11-06 12:26:41');
CREATE TABLE role_permissions (
  role_id INTEGER NOT NULL,
  permission_id INTEGER NOT NULL,
  granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);
INSERT INTO "role_permissions" VALUES(1,11,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(1,12,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(1,13,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(1,14,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(1,25,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(1,26,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(1,27,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(1,20,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(1,21,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(1,22,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(1,23,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(1,24,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(1,28,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(1,29,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(1,30,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(1,31,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(1,1,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(1,2,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(1,3,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(1,4,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(1,5,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(1,6,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(1,7,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(1,8,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(1,9,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(1,10,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(1,15,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(1,16,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(1,17,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(1,18,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(1,19,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(2,11,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(2,14,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(2,12,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(2,13,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(2,27,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(2,26,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(2,25,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(2,21,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(2,20,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(2,24,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(2,23,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(2,22,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(2,8,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(2,10,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(2,1,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(2,6,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(2,7,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(2,9,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(2,2,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(2,3,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(2,4,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(2,5,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(2,15,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(2,16,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(2,17,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(3,8,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(3,10,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(3,1,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(3,6,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(3,7,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(3,9,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(3,2,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(3,3,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(3,4,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(3,5,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(3,12,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(3,21,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(3,20,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(3,23,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(3,26,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(3,16,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(4,10,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(4,1,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(4,6,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(4,7,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(4,2,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(4,3,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(4,4,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(4,5,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(4,12,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(4,25,'2025-11-06 12:26:41');
INSERT INTO "role_permissions" VALUES(4,16,'2025-11-06 12:26:41');
DELETE FROM sqlite_sequence;
INSERT INTO "sqlite_sequence" VALUES('d1_migrations',9);
INSERT INTO "sqlite_sequence" VALUES('users',6);
INSERT INTO "sqlite_sequence" VALUES('machines',12);
INSERT INTO "sqlite_sequence" VALUES('tickets',3);
INSERT INTO "sqlite_sequence" VALUES('ticket_timeline',19);
INSERT INTO "sqlite_sequence" VALUES('messages',9);
INSERT INTO "sqlite_sequence" VALUES('media',1);
INSERT INTO "sqlite_sequence" VALUES('roles',5);
INSERT INTO "sqlite_sequence" VALUES('permissions',31);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_machine ON tickets(machine_id);
CREATE INDEX idx_tickets_assigned ON tickets(assigned_to);
CREATE INDEX idx_tickets_created ON tickets(created_at DESC);
CREATE INDEX idx_media_ticket ON media(ticket_id);
CREATE INDEX idx_timeline_ticket ON ticket_timeline(ticket_id, created_at DESC);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_machines_serial ON machines(serial_number);
CREATE INDEX idx_comments_ticket_id ON ticket_comments(ticket_id);
CREATE INDEX idx_comments_created_at ON ticket_comments(created_at);
CREATE INDEX idx_tickets_scheduled ON tickets(scheduled_date);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_recipient ON messages(recipient_id);
CREATE INDEX idx_messages_type ON messages(message_type);
CREATE INDEX idx_messages_created ON messages(created_at DESC);
CREATE INDEX idx_messages_unread ON messages(is_read, recipient_id);
CREATE INDEX idx_roles_name ON roles(name);
CREATE INDEX idx_permissions_resource ON permissions(resource);
CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission ON role_permissions(permission_id);
CREATE INDEX idx_messages_audio ON messages(audio_file_key) WHERE audio_file_key IS NOT NULL;