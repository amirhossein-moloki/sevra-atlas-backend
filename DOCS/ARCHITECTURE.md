# Backend Architecture

This project follows a decoupled, modular architecture using the **Repository Pattern** to manage data access.

## Layered Architecture

### 1. Controllers (`*.controller.ts`)
- Handle incoming HTTP requests.
- Validate request parameters/body (using Zod).
- Delegate business logic to Services.
- Return HTTP responses.
- **Rules:** Never import `prisma` directly.

### 2. Services (`*.service.ts`)
- Contain business logic and use cases.
- Coordinate multiple repository calls.
- Manage transactions using `withTx`.
- Handle caching and third-party integrations (SMS, S3, etc.).
- **Rules:** Never import `prisma` directly. Use constructor-based Dependency Injection for Repositories.

### 3. Repositories (`*.repository.ts`)
- The **only** layer allowed to interact with the Database via `prisma`.
- Provide high-level, domain-specific methods for data access.
- Support optional transaction clients for nested calls.
- Use Query Fragments for consistent `include`/`select` patterns.

### 4. Database Layer (`src/shared/db/`)
- `prisma.ts`: Singleton PrismaClient instance.
- `tx.ts`: Transaction helpers (`withTx`, `TransactionClient`).
- `queryFragments.ts`: Standardized Prisma query blocks to prevent duplication.

## Transaction Management

Transactions are managed at the **Service** layer using the `withTx` helper. Repositories must accept an optional `tx` parameter to participate in an existing transaction.

```typescript
// Service Layer
async someUseCase(data: any) {
  return withTx(async (tx) => {
    const entity = await this.repo.create(data, tx);
    await this.otherRepo.logAction(entity.id, tx);
    return entity;
  });
}
```

## Dependency Injection and Testing

Services use constructor-based DI, allowing for easy mocking in unit tests.

```typescript
export class SalonsService {
  constructor(
    private readonly repo: SalonsRepository = salonsRepository,
    private readonly mediaRepo: MediaRepository = mediaRepository
  ) {}
}

// Unit Test
const mockRepo = mockDeep<SalonsRepository>();
const service = new SalonsService(mockRepo);
```

## Consistency Rules

1. **Naming:** Repositories should be named `<Module>Repository` and exported as a singleton instance.
2. **Query Fragments:** Common `include` or `select` blocks should be moved to `src/shared/db/queryFragments.ts`.
3. **Soft Delete:** Always use the repository's `softDelete` method if available.
4. **Validation:** Always use Prisma's `UncheckedCreateInput` or `UncheckedUpdateInput` for repository methods that take data objects to ensure compatibility with BigInt IDs.
