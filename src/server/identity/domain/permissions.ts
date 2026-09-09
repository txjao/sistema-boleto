import { AppError } from '@/server/shared/domain/app.errors';
import type { User } from '@/server/shared/domain/app.types';
export function requireUser(users: User[], id: string) {
  const actor = users.find((user) => user.id === id && user.active);
  if (!actor)
    throw new AppError(
      'FORBIDDEN',
      'Este perfil está inativo. Selecione outro perfil da demo.',
    );
  return actor;
}
export function requireRole(actor: User, allowed: User['role'][]) {
  if (!allowed.includes(actor.role))
    throw new AppError(
      'FORBIDDEN',
      'Este perfil não tem permissão para essa operação.',
    );
}
