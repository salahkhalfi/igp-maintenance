# Guide Drizzle ORM (Migration Phase 1)

## Introduction
Nous avons commencé la migration vers "The Modern Stack" pour rendre l'application plus robuste et facile à maintenir.
La première étape est l'intégration de **Drizzle ORM**.

## Structure
- `src/db/schema.ts`: Définition du schéma de la base de données (Source de vérité).
- `src/db/index.ts`: Configuration du client Drizzle.
- `drizzle.config.ts`: Configuration de Drizzle Kit pour les migrations.
- `src/routes/machines.ts`: Exemple de route refactorisée utilisant Drizzle.

## Comment utiliser Drizzle

### 1. Importer le client et le schéma
```typescript
import { getDb } from '../db';
import { machines, tickets } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
```

### 2. Faire des requêtes (Type-Safe !)
```typescript
const db = getDb(c.env);

// SELECT
const allMachines = await db.select().from(machines);

// SELECT avec WHERE
const activeMachines = await db
  .select()
  .from(machines)
  .where(eq(machines.status, 'operational'));

// INSERT
await db.insert(machines).values({
  machine_type: 'CNC',
  model: 'X-2000',
  serial_number: '12345'
});
```

## Commandes Utiles
- `npm run db:generate`: Générer des fichiers de migration SQL basés sur les changements dans `schema.ts`.
- `npm run db:migrate:local`: Appliquer les migrations en local.

## Prochaines Étapes
1. Refactoriser `src/routes/tickets.ts` (Gros morceau !).
2. Installer **Zod** pour la validation des données entrantes (API).
3. Utiliser **Hono RPC** pour le frontend.
