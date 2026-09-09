import { z } from 'zod';
import type { Database } from '@/server/shared/domain/app.types';
import type {
  DatabaseRepository,
  StoragePort,
} from '@/server/shared/domain/database.repository';
import { AppError } from '@/server/shared/domain/app.errors';
import { createSeed } from './demo.seed';

export const STORAGE_KEY = 'siticop:demo:v1';
const money = z.number().int().nonnegative();
const company = z.object({
  id: z.string(),
  name: z.string(),
  cnpj: z.string(),
  city: z.string(),
  address: z.string(),
  email: z.string(),
  phone: z.string(),
  workers: z.number().int().nonnegative(),
});
const quote = z.object({
  baseCents: money,
  fineCents: money,
  correctionCents: money,
  discountCents: money,
  totalCents: money,
  estimatedWorkers: money,
  overdueMonths: money,
  breakdown: z.array(
    z.object({ month: z.string(), baseCents: money, overdue: z.boolean() }),
  ),
});
const schema = z.object({
  version: z.literal(1),
  companies: z.array(company),
  bills: z.array(
    z.object({
      id: z.string(),
      companyId: z.string(),
      months: z.array(z.string()),
      workers: money,
      dueDate: z.string(),
      totalCents: money,
      createdBy: z.string(),
      createdAt: z.string(),
      status: z.enum(['open', 'paid']),
      quote: quote.optional(),
      notifications: z.array(z.string()),
    }),
  ),
  users: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      email: z.string(),
      role: z.enum(['admin', 'director', 'operator']),
      active: z.boolean(),
    }),
  ),
  conventions: z.array(
    z.object({
      year: z.number().int(),
      salaryFloorCents: money,
      dueDay: z.number().int().min(1).max(28),
      monthlyFinePercent: z.number().min(0).max(100).nullable(),
    }),
  ),
});
export function createLocalRepository(
  storage: StoragePort,
): DatabaseRepository {
  return {
    read() {
      try {
        const serialized = storage.getItem(STORAGE_KEY);
        return serialized === null
          ? createSeed()
          : schema.parse(JSON.parse(serialized));
      } catch {
        throw new AppError(
          'STORAGE_READ',
          'Não foi possível ler os dados locais. O conteúdo foi preservado. Verifique o armazenamento do navegador.',
        );
      }
    },
    write(database: Database) {
      try {
        storage.setItem(STORAGE_KEY, JSON.stringify(schema.parse(database)));
      } catch {
        throw new AppError(
          'STORAGE_WRITE',
          'Não foi possível salvar. Verifique o espaço e as permissões do navegador.',
        );
      }
    },
  };
}
