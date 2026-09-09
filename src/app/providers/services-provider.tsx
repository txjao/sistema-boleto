import { createContext, useContext, type PropsWithChildren } from 'react';
import type { Services } from '@/server';
const Context = createContext<Services | null>(null);
export function ServicesProvider({
  services,
  children,
}: PropsWithChildren<{ services: Services }>) {
  return <Context.Provider value={services}>{children}</Context.Provider>;
}
export function useServices() {
  const services = useContext(Context);
  if (!services) throw new Error('ServicesProvider ausente.');
  return services;
}
