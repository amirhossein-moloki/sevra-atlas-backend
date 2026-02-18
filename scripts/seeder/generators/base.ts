import { PrismaClient } from '@prisma/client';

export abstract class BaseGenerator {
  constructor(protected prisma: PrismaClient) {}

  protected log(msg: string) {
    console.log(`[${this.constructor.name}] ${msg}`);
  }

  abstract seed(count: number): Promise<void>;
}

export const getRandom = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

export const weightedRandom = (probabilities: number[]): number => {
  const random = Math.random();
  let sum = 0;
  for (let i = 0; i < probabilities.length; i++) {
    sum += probabilities[i];
    if (random <= sum) return i;
  }
  return probabilities.length - 1;
};
