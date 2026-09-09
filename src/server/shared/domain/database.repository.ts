import type { Database } from './app.types';
export interface DatabaseRepository {
  read(): Database;
  write(database: Database): void;
}
export interface StoragePort {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
