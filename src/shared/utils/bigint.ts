import { ApiError } from '../errors/ApiError';

/**
 * Safely converts a value to BigInt.
 * Throws ApiError 400 if the value is invalid or undefined.
 */
export function safeBigInt(value: any, fieldName: string = 'id'): bigint {
  if (value === undefined || value === null || value === '' || value === 'undefined') {
    throw new ApiError(400, `${fieldName} is required and must be a valid number`);
  }

  try {
    // Check if it's a numeric string
    if (typeof value === 'string' && !/^\d+$/.test(value)) {
      throw new Error();
    }
    return BigInt(value);
  } catch (error) {
    throw new ApiError(400, `Invalid ${fieldName}: ${value}`);
  }
}
