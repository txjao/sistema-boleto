import { createServices } from './application/demo.service';
import { createLocalRepository } from './shared/infrastructure/database.repository.local';
import type { StoragePort } from './shared/domain/database.repository';
export type {
  Services,
  Company,
  Bill,
  User,
  Convention,
  Quote,
  QuoteInput,
  Role,
  MonitorRow,
} from './shared/domain/app.types';
export function createDemoServer(storage: StoragePort, actor: () => string) {
  // Relógio fixo torna os exemplos de atraso reproduzíveis.
  return createServices(
    createLocalRepository(storage),
    actor,
    () => '2026-09-08T12:00:00Z',
    () => crypto.randomUUID(),
  );
}
