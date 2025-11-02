# 📡 Documentation API REST

Documentation complète de l'API REST pour le système de gestion de maintenance industrielle.

## URL de base

- **Développement local**: `http://localhost:3000/api`
- **Production**: `https://your-app.pages.dev/api`

## Authentification

L'API utilise l'authentification JWT (JSON Web Token). Toutes les routes protégées nécessitent un header `Authorization` avec le format:

```
Authorization: Bearer <token>
```

### Obtenir un token

**Endpoint**: `POST /api/auth/login`

**Request Body**:
```json
{
  "email": "admin@maintenance.com",
  "password": "password123"
}
```

**Response**: `200 OK`
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@maintenance.com",
    "full_name": "Admin Principal",
    "role": "admin",
    "created_at": "2024-11-02T10:00:00.000Z",
    "updated_at": "2024-11-02T10:00:00.000Z"
  }
}
```

## Routes d'authentification

### 1. Inscription

Créer un nouveau compte utilisateur.

**Endpoint**: `POST /api/auth/register`

**Request Body**:
```json
{
  "email": "newuser@maintenance.com",
  "password": "securepassword",
  "full_name": "Jean Dupont",
  "role": "technician"
}
```

**Rôles disponibles**: `admin`, `technician`, `operator`

**Response**: `201 Created`
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 5,
    "email": "newuser@maintenance.com",
    "full_name": "Jean Dupont",
    "role": "technician",
    "created_at": "2024-11-02T14:30:00.000Z",
    "updated_at": "2024-11-02T14:30:00.000Z"
  }
}
```

**Erreurs possibles**:
- `400`: Champs manquants
- `409`: Email déjà utilisé

### 2. Connexion

Obtenir un token d'authentification.

**Endpoint**: `POST /api/auth/login`

**Request Body**:
```json
{
  "email": "admin@maintenance.com",
  "password": "password123"
}
```

**Response**: `200 OK` (voir structure ci-dessus)

**Erreurs possibles**:
- `400`: Champs manquants
- `401`: Email ou mot de passe incorrect

### 3. Profil utilisateur

Obtenir les informations de l'utilisateur connecté.

**Endpoint**: `GET /api/auth/me`

**Headers**: Authentification requise

**Response**: `200 OK`
```json
{
  "user": {
    "id": 1,
    "email": "admin@maintenance.com",
    "full_name": "Admin Principal",
    "role": "admin",
    "created_at": "2024-11-02T10:00:00.000Z",
    "updated_at": "2024-11-02T10:00:00.000Z"
  }
}
```

**Erreurs possibles**:
- `401`: Token manquant ou invalide
- `404`: Utilisateur non trouvé

## Routes des Tickets

Toutes les routes nécessitent une authentification.

### 1. Liste des tickets

Récupérer tous les tickets avec filtres optionnels.

**Endpoint**: `GET /api/tickets`

**Query Parameters** (optionnels):
- `status`: Filtrer par statut (received, diagnostic, in_progress, waiting_parts, completed, archived)
- `priority`: Filtrer par priorité (low, medium, high, critical)

**Exemple**: `GET /api/tickets?status=in_progress&priority=high`

**Response**: `200 OK`
```json
{
  "tickets": [
    {
      "id": 1,
      "ticket_id": "IGP-PDE-7500-20231025-001",
      "title": "Bruit anormal sur la machine PDE-7500",
      "description": "Un bruit métallique se produit lors du démarrage...",
      "machine_id": 1,
      "machine_type": "PDE",
      "model": "7500",
      "serial_number": "IGP-PDE-7500-2023",
      "location": "Atelier A - Zone 1",
      "status": "diagnostic",
      "priority": "high",
      "reported_by": 4,
      "reporter_name": "Opérateur Jean",
      "reporter_email": "operator@maintenance.com",
      "assigned_to": 2,
      "assignee_name": "Technicien Martin",
      "assignee_email": "tech1@maintenance.com",
      "created_at": "2024-10-25T08:30:00.000Z",
      "updated_at": "2024-10-25T09:15:00.000Z",
      "completed_at": null
    }
  ]
}
```

### 2. Détails d'un ticket

Récupérer les détails complets d'un ticket, incluant les médias et la timeline.

**Endpoint**: `GET /api/tickets/:id`

**Response**: `200 OK`
```json
{
  "ticket": {
    "id": 1,
    "ticket_id": "IGP-PDE-7500-20231025-001",
    "title": "Bruit anormal sur la machine PDE-7500",
    "description": "Un bruit métallique se produit lors du démarrage...",
    "machine_id": 1,
    "status": "diagnostic",
    "priority": "high",
    "reported_by": 4,
    "assigned_to": 2,
    "created_at": "2024-10-25T08:30:00.000Z",
    "updated_at": "2024-10-25T09:15:00.000Z",
    "completed_at": null,
    "media": [
      {
        "id": 1,
        "ticket_id": 1,
        "file_key": "tickets/1/1234567890-abc123-photo.jpg",
        "file_name": "photo.jpg",
        "file_type": "image/jpeg",
        "file_size": 524288,
        "url": "https://maintenance-media.r2.cloudflarestorage.com/...",
        "uploaded_by": 4,
        "created_at": "2024-10-25T08:35:00.000Z"
      }
    ],
    "timeline": [
      {
        "id": 2,
        "ticket_id": 1,
        "user_id": 2,
        "user_name": "Technicien Martin",
        "user_email": "tech1@maintenance.com",
        "action": "Changement de statut",
        "old_status": "received",
        "new_status": "diagnostic",
        "comment": "Prise en charge par le technicien Martin",
        "created_at": "2024-10-25T09:15:00.000Z"
      },
      {
        "id": 1,
        "ticket_id": 1,
        "user_id": 4,
        "user_name": "Opérateur Jean",
        "user_email": "operator@maintenance.com",
        "action": "Ticket créé",
        "old_status": null,
        "new_status": "received",
        "comment": "Bruit anormal signalé par l'opérateur",
        "created_at": "2024-10-25T08:30:00.000Z"
      }
    ]
  }
}
```

**Erreurs possibles**:
- `404`: Ticket non trouvé

### 3. Créer un ticket

Créer un nouveau ticket de maintenance.

**Endpoint**: `POST /api/tickets`

**Request Body**:
```json
{
  "title": "Fuite d'huile détectée",
  "description": "Fuite d'huile hydraulique au niveau du vérin principal",
  "machine_id": 3,
  "priority": "high"
}
```

**Priorités disponibles**: `low`, `medium`, `high`, `critical`

**Response**: `201 Created`
```json
{
  "ticket": {
    "id": 6,
    "ticket_id": "IGP-CNC-X500-20241102-001",
    "title": "Fuite d'huile détectée",
    "description": "Fuite d'huile hydraulique au niveau du vérin principal",
    "machine_id": 3,
    "status": "received",
    "priority": "high",
    "reported_by": 4,
    "assigned_to": null,
    "created_at": "2024-11-02T14:45:00.000Z",
    "updated_at": "2024-11-02T14:45:00.000Z",
    "completed_at": null
  }
}
```

**Erreurs possibles**:
- `400`: Champs manquants
- `404`: Machine non trouvée

### 4. Mettre à jour un ticket

Modifier les informations d'un ticket existant.

**Endpoint**: `PATCH /api/tickets/:id`

**Request Body** (tous les champs sont optionnels):
```json
{
  "title": "Nouveau titre",
  "description": "Nouvelle description",
  "status": "in_progress",
  "priority": "critical",
  "assigned_to": 3,
  "comment": "Intervention commencée"
}
```

**Statuts disponibles**: `received`, `diagnostic`, `in_progress`, `waiting_parts`, `completed`, `archived`

**Response**: `200 OK`
```json
{
  "ticket": {
    "id": 1,
    "ticket_id": "IGP-PDE-7500-20231025-001",
    "status": "in_progress",
    "priority": "critical",
    "assigned_to": 3,
    "updated_at": "2024-11-02T15:00:00.000Z",
    ...
  }
}
```

**Erreurs possibles**:
- `404`: Ticket non trouvé

### 5. Supprimer un ticket

Supprimer un ticket (réservé aux administrateurs).

**Endpoint**: `DELETE /api/tickets/:id`

**Permissions**: Admin seulement

**Response**: `200 OK`
```json
{
  "message": "Ticket supprimé avec succès"
}
```

**Erreurs possibles**:
- `403`: Accès refusé (non admin)
- `404`: Ticket non trouvé

## Routes des Machines

### 1. Liste des machines

**Endpoint**: `GET /api/machines`

**Query Parameters** (optionnels):
- `status`: Filtrer par statut (operational, maintenance, out_of_service)

**Response**: `200 OK`
```json
{
  "machines": [
    {
      "id": 1,
      "machine_type": "PDE",
      "model": "7500",
      "serial_number": "IGP-PDE-7500-2023",
      "location": "Atelier A - Zone 1",
      "status": "operational",
      "created_at": "2024-01-15T10:00:00.000Z",
      "updated_at": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

### 2. Détails d'une machine

**Endpoint**: `GET /api/machines/:id`

**Response**: `200 OK`
```json
{
  "machine": {
    "id": 1,
    "machine_type": "PDE",
    "model": "7500",
    "serial_number": "IGP-PDE-7500-2023",
    "location": "Atelier A - Zone 1",
    "status": "operational",
    "created_at": "2024-01-15T10:00:00.000Z",
    "updated_at": "2024-01-15T10:00:00.000Z",
    "tickets": [
      {
        "id": 1,
        "ticket_id": "IGP-PDE-7500-20231025-001",
        "title": "Bruit anormal",
        "status": "diagnostic",
        ...
      }
    ]
  }
}
```

### 3. Créer une machine

**Endpoint**: `POST /api/machines`

**Permissions**: Admin seulement

**Request Body**:
```json
{
  "machine_type": "Robot",
  "model": "ABB-XY",
  "serial_number": "IGP-ROBOT-ABBXY-2024",
  "location": "Atelier B - Zone 3"
}
```

**Response**: `201 Created`

### 4. Mettre à jour une machine

**Endpoint**: `PATCH /api/machines/:id`

**Permissions**: Admin seulement

**Request Body** (tous les champs sont optionnels):
```json
{
  "location": "Atelier C - Zone 1",
  "status": "maintenance"
}
```

**Response**: `200 OK`

### 5. Supprimer une machine

**Endpoint**: `DELETE /api/machines/:id`

**Permissions**: Admin seulement

**Response**: `200 OK`

**Erreurs possibles**:
- `400`: Machine a des tickets associés

## Routes des Médias

### 1. Upload un fichier

Upload un fichier (photo/vidéo) et l'associer à un ticket.

**Endpoint**: `POST /api/media/upload`

**Content-Type**: `multipart/form-data`

**Form Data**:
- `file`: Le fichier à uploader
- `ticket_id`: ID du ticket associé

**Exemple avec curl**:
```bash
curl -X POST http://localhost:3000/api/media/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@/path/to/photo.jpg" \
  -F "ticket_id=1"
```

**Response**: `201 Created`
```json
{
  "media": {
    "id": 1,
    "ticket_id": 1,
    "file_key": "tickets/1/1730556000-abc123-photo.jpg",
    "file_name": "photo.jpg",
    "file_type": "image/jpeg",
    "file_size": 524288,
    "url": "https://maintenance-media.r2.cloudflarestorage.com/...",
    "uploaded_by": 4,
    "created_at": "2024-11-02T15:00:00.000Z"
  }
}
```

**Erreurs possibles**:
- `400`: Fichier ou ticket_id manquant
- `404`: Ticket non trouvé

### 2. Récupérer un fichier

**Endpoint**: `GET /api/media/:id`

**Response**: Le fichier en binaire avec les headers appropriés

### 3. Liste des médias d'un ticket

**Endpoint**: `GET /api/media/ticket/:ticketId`

**Response**: `200 OK`
```json
{
  "media": [
    {
      "id": 1,
      "ticket_id": 1,
      "file_key": "tickets/1/1730556000-abc123-photo.jpg",
      "file_name": "photo.jpg",
      "file_type": "image/jpeg",
      "file_size": 524288,
      "url": "https://maintenance-media.r2.cloudflarestorage.com/...",
      "uploaded_by": 4,
      "created_at": "2024-11-02T15:00:00.000Z"
    }
  ]
}
```

### 4. Supprimer un fichier

**Endpoint**: `DELETE /api/media/:id`

**Response**: `200 OK`
```json
{
  "message": "Média supprimé avec succès"
}
```

## Route de santé

### Vérifier le statut de l'API

**Endpoint**: `GET /api/health`

**Authentification**: Non requise

**Response**: `200 OK`
```json
{
  "status": "ok",
  "timestamp": "2024-11-02T15:30:00.000Z",
  "version": "1.0.0"
}
```

## Codes d'erreur HTTP

- `200`: Succès
- `201`: Créé
- `400`: Requête invalide
- `401`: Non authentifié
- `403`: Accès refusé
- `404`: Ressource non trouvée
- `409`: Conflit (ex: email déjà utilisé)
- `500`: Erreur serveur

## Exemples d'utilisation

### JavaScript / Axios

```javascript
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

// Login
const loginResponse = await axios.post(`${API_URL}/auth/login`, {
  email: 'admin@maintenance.com',
  password: 'password123'
});

const token = loginResponse.data.token;

// Configuration du token
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

// Récupérer les tickets
const ticketsResponse = await axios.get(`${API_URL}/tickets`);
console.log(ticketsResponse.data.tickets);

// Créer un ticket
const newTicket = await axios.post(`${API_URL}/tickets`, {
  title: 'Nouveau problème',
  description: 'Description détaillée',
  machine_id: 1,
  priority: 'high'
});
```

### Python / Requests

```python
import requests

API_URL = 'http://localhost:3000/api'

# Login
login_response = requests.post(f'{API_URL}/auth/login', json={
    'email': 'admin@maintenance.com',
    'password': 'password123'
})

token = login_response.json()['token']
headers = {'Authorization': f'Bearer {token}'}

# Récupérer les tickets
tickets_response = requests.get(f'{API_URL}/tickets', headers=headers)
tickets = tickets_response.json()['tickets']

# Créer un ticket
new_ticket = requests.post(f'{API_URL}/tickets', headers=headers, json={
    'title': 'Nouveau problème',
    'description': 'Description détaillée',
    'machine_id': 1,
    'priority': 'high'
})
```

## Limites et quotas

- Taille maximale des fichiers: 100 MB (configurable)
- Durée du token JWT: 7 jours
- Rate limiting: Non implémenté (à configurer en production)

---

**Version**: 1.0.0  
**Dernière mise à jour**: 2024-11-02
