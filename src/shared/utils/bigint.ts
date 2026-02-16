import { ApiError } from '../errors/ApiError';

/**
 * Safely converts a value to BigInt.
 * Throws ApiError 400 if the value is invalid or undefined.
 */
export function safeBigInt(value: unknown, fieldName: string = 'id'): bigint {
  if (value === undefined || value === null || (value as string) === '' || (value as string) === 'undefined') {
    throw new ApiError(400, `${fieldName} is required and must be a valid number`);
  }

  try {
    // Check if it's a numeric string
    if (typeof value === 'string' && !/^\d+$/.test(value)) {
      throw new Error();
    }
    return BigInt(value as string | number | bigint | boolean);
  } catch (_error) {
    throw new ApiError(400, `Invalid ${fieldName}: ${value}`);
  }
}
