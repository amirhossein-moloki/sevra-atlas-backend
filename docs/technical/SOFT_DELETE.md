# Standardized Soft Delete Policy

To ensure data integrity, facilitate recovery, and maintain a consistent behavior across all modules, Sevra Atlas implements a **Soft Delete** policy for all core entities and taxonomy.

## Core Principles

1.  **No Hard Deletes**: Core entities and important taxonomy should never be permanently removed from the database via a `DELETE` query.
2.  **`deletedAt` Field**: Every soft-deletable model must include a `deletedAt` field of type `DateTime?`.
3.  **Status Sync**: If a model has a `status` field (e.g., `AccountStatus`, `PostStatus`, `ReviewStatus`), it must be updated to the appropriate "deleted" or "archived" state when soft-deleted.
4.  **Query Filtering**: All `find` and `count` operations must explicitly filter out records where `deletedAt` is not null.

## Implementation Details

### Database Schema (Prisma)

Models supporting soft delete include the following field:
```prisma
deletedAt DateTime? @map("deleted_at")
```

### Supported Models

The following models are standardized for soft delete:
- **Directory**: `User`, `Salon`, `Artist`, `Review`, `Specialty`, `ServiceCategory`, `ServiceDefinition`.
- **Blog**: `Post`, `Category`, `Tag`, `Series`, `Comment`, `Page`.
- **General**: `Media`.

### Service Layer Pattern

**Deletion:**
```typescript
async deleteEntity(id: bigint) {
  await prisma.entity.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      status: 'DELETED' // if applicable
    }
  });
}
```

**Retrieval:**
```typescript
async getEntity(id: bigint) {
  const entity = await prisma.entity.findFirst({
    where: { id, deletedAt: null }
  });
  if (!entity) throw new ApiError(404, 'Entity not found');
  return entity;
}
```

## Exceptions

Minor join tables or purely relational records (like `SalonArtist`, `PostTag`, `ReviewVote`) may still use hard delete if they don't carry significant independent value and are easily recreatable.

## Recovery

To recover a soft-deleted record, an administrator must manually clear the `deletedAt` field and reset the `status` to an active state (e.g., `ACTIVE` or `PUBLISHED`).
