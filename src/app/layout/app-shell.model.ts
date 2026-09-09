import { useLocation } from 'react-router';
import { demoProfiles, useSessionStore } from '@/app/state/session.store';
import { useQueryClient } from '@tanstack/react-query';
export function useAppShellModel() {
  const state = useSessionStore();
  const location = useLocation();
  const client = useQueryClient();
  const profile = demoProfiles.find((item) => item.id === state.actorId)!;
  const nav = [
    { path: '/', label: 'Acompanhamento', icon: 'chart' },
    { path: '/boletos', label: 'Boletos', icon: 'bill' },
    { path: '/empresas', label: 'Empresas', icon: 'company' },
    ...(profile.role === 'admin'
      ? [{ path: '/usuarios', label: 'Usuários', icon: 'users' }]
      : []),
    { path: '/configuracoes', label: 'Configurações', icon: 'settings' },
  ];
  return {
    ...state,
    profile,
    profiles: demoProfiles,
    nav: nav.map((item) => ({
      ...item,
      active:
        item.path === '/'
          ? location.pathname === '/'
          : location.pathname.startsWith(item.path),
    })),
    changeActor: (id: string) => {
      state.setActor(id);
      client.clear();
      state.closeMenu();
    },
    currentLabel:
      nav.find((item) =>
        item.path === '/'
          ? location.pathname === '/'
          : location.pathname.startsWith(item.path),
      )?.label ?? 'Sistema de boletos',
  };
}
