import type { Services } from '@/server';
import { AppError } from '@/server/shared/domain/app.errors';
import {
  scenariosStore,
  type createScenariosStore,
  type Operation,
} from '@/devtools/application/scenarios.store';
export const listOperations: Operation[] = [
  'monitor',
  'listCompanies',
  'listBills',
  'listUsers',
  'conventions',
];
export function decorateServices(
  services: Services,
  store: ReturnType<typeof createScenariosStore> = scenariosStore,
  wait: (ms: number) => Promise<void> = (ms) =>
    new Promise((resolve) => setTimeout(resolve, ms)),
  now: () => number = () => performance.now(),
): Services {
  let sequence = 0;
  return new Proxy(services, {
    get(target, key: string) {
      const operation = key as Operation;
      const method = target[operation];
      if (typeof method !== 'function') return method;
      return async (...args: unknown[]) => {
        const scenario = store.getState().consume(operation);
        const id = ++sequence;
        const started = now();
        store.getState().begin({ id, operation, status: 'pending' });
        try {
          await wait(scenario?.mode === 'slow' ? 3000 : 450);
          if (scenario?.mode === 'error')
            throw new AppError(
              'SIMULATED_FAILURE',
              'Falha simulada no serviço. Tente novamente.',
            );
          const isEmptyList =
            scenario?.mode === 'empty' && listOperations.includes(operation);
          const result = isEmptyList
            ? []
            : await Reflect.apply(method, target, args);
          store.getState().finish(id, 'success', Math.round(now() - started));
          return result;
        } catch (error) {
          store.getState().finish(id, 'error', Math.round(now() - started));
          throw error;
        }
      };
    },
  });
}
