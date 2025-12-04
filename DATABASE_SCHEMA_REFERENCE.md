# Database Schema & API Mapping Reference

**CRITICAL ARCHITECTURE LESSON (2025-12-04)**
*Context: Failure to implement Permissions/Monetization due to column mismatch.*

## The Core Lesson
**Never assume column names match standard conventions.** The database uses specific technical names that differ from the frontend/API expectations. Always check `PRAGMA table_info(table_name)` before writing queries.

## 1. Roles Table (`roles`)
| Concept | Database Column | API/Frontend Field | Notes |
|---------|----------------|--------------------|-------|
| **ID** | `id` | `id` | Primary Key |
| **UI Name** | `name` | `display_name` or `name` | What the user sees (e.g., "Superviseur") |
| **Technical ID** | `slug` | `name` or `slug` | **CRITICAL**: Used for code checks (e.g., 'admin', 'supervisor'). **Immutable**. |
| **Description** | `description` | `description` | |
| **System Flag** | `is_system` | `is_system` | 1 = Protected, 0 = Custom |

**Mapping Logic:**
```typescript
// Reading from DB
display_name = db.name
slug = db.slug

// Writing to DB
db.name = input.display_name
db.slug = input.name (or input.slug)
```

## 2. Permissions Table (`permissions`)
| Concept | Database Column | API/Frontend Field | Notes |
|---------|----------------|--------------------|-------|
| **ID** | `id` | `id` | |
| **UI Name** | `name` | `display_name` | e.g., "Voir les Tickets" |
| **Technical Key** | `slug` | `action` + `scope` | e.g., "tickets.read.all". Must be parsed. |
| **Grouping** | **`module`** | `resource` | **CRITICAL**: Used for monetization/grouping. Maps to 'planning', 'users', etc. |
| **Description** | `description` | `description` | |

**Mapping Logic:**
```typescript
// Reading from DB
resource = db.module
display_name = db.name
action = db.slug.split('.')[1]
scope = db.slug.split('.')[2]
```

## 3. Monetization / Modules
*   **Control Point**: The `module` column in the `permissions` table.
*   **Implementation**: To disable a module (e.g., Planning) for a user tier, you must query permissions where `module = 'planning'` and filter them out, regardless of the Role.

---
*This document serves as the permanent memory for this architectural constraint.*
