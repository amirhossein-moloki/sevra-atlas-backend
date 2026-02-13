import { prisma } from './prisma';
import { Prisma } from '@prisma/client';

/**
 * TransactionClient is the type for the Prisma transaction context.
 * It is used to pass the transaction context to repository methods.
 */
export type TransactionClient = Prisma.TransactionClient;

/**
 * Executes a callback within a Prisma transaction.
 * @param callback The function to execute within the transaction.
 * @param options Prisma transaction options.
 * @returns The result of the callback.
 */
export async function withTx<T>(
  callback: (tx: TransactionClient) => Promise<T>,
  options?: { maxWait?: number; timeout?: number; isolationLevel?: Prisma.TransactionIsolationLevel }
): Promise<T> {
  return prisma.$transaction(callback, options);
}
