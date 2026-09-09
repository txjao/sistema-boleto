import { create } from 'zustand';
import type { Role } from '@/server';
export const demoProfiles = [
  {
    id: 'u1',
    label: 'Marina Alves · Administradora',
    name: 'Marina Alves',
    role: 'admin' as Role,
  },
  {
    id: 'u2',
    label: 'Carlos Mendes · Diretor financeiro',
    name: 'Carlos Mendes',
    role: 'director' as Role,
  },
  {
    id: 'u3',
    label: 'Ana Costa · Operadora',
    name: 'Ana Costa',
    role: 'operator' as Role,
  },
];
export const useSessionStore = create<{
  actorId: string;
  setActor: (id: string) => void;
  menuOpen: boolean;
  toggleMenu: () => void;
  closeMenu: () => void;
}>((set) => ({
  actorId: 'u1',
  setActor: (actorId) => set({ actorId }),
  menuOpen: false,
  toggleMenu: () => set((state) => ({ menuOpen: !state.menuOpen })),
  closeMenu: () => set({ menuOpen: false }),
}));
