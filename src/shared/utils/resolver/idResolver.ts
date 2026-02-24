import { safeBigInt } from '../bigint';
import { ApiError } from '../../errors/ApiError';

export async function resolveId(
  identifier: string,
  finder: (idOrSlug: string) => Promise<{ id: bigint } | null>,
  entityName: string = 'Entity'
): Promise<bigint> {
  if (!identifier) {
    throw new ApiError(400, `${entityName} identifier is required`);
  }

  // If it's a numeric ID
  if (/^\d+$/.test(identifier) && identifier.length < 20) {
    return safeBigInt(identifier);
  }

  // Otherwise treat as slug
  const entity = await finder(identifier);
  if (!entity) {
    throw new ApiError(404, `${entityName} not found`);
  }

  return entity.id;
}
