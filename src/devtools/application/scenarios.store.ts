import { createStore } from 'zustand/vanilla';
import type { Services } from '@/server';
export type Operation = keyof Services;
export type Mode = 'normal' | 'slow' | 'error' | 'empty';
export interface Scenario {
  operation: Operation;
  mode: Mode;
}
interface Log {
  id: number;
  operation: Operation;
  status: 'pending' | 'success' | 'error';
  duration?: number;
}
interface State {
  armed: Scenario | null;
  logs: Log[];
  arm(scenario: Scenario): void;
  cancel(): void;
  consume(operation: Operation): Scenario | null;
  begin(log: Log): void;
  finish(id: number, status: Log['status'], duration: number): void;
}
export function createScenariosStore() {
  return createStore<State>((set, get) => ({
    armed: null,
    logs: [],
    arm: (armed) => set({ armed }),
    cancel: () => set({ armed: null }),
    consume(operation) {
      const armed = get().armed;
      if (armed?.operation !== operation) return null;
      set({ armed: null });
      return armed;
    },
    begin: (log) =>
      set((state) => ({ logs: [log, ...state.logs].slice(0, 8) })),
    finish: (id, status, duration) =>
      set((state) => ({
        logs: state.logs.map((log) =>
          log.id === id ? { ...log, status, duration } : log,
        ),
      })),
  }));
}
export const scenariosStore = createScenariosStore();
