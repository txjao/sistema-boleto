import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App } from '@/app/app';
import { ServicesProvider } from '@/app/providers/services-provider';
import { useSessionStore } from '@/app/state/session.store';
import { createDemoServer } from '@/server';
import { decorateServices, DevTools } from '@/devtools';
import '@/shared/ui/styles/globals.css';

async function bootstrap() {
  // O adapter acessa localStorage dentro dos métodos: falhas chegam como erros de API.
  const storage = {
    getItem: (key: string) => window.localStorage.getItem(key),
    setItem: (key: string, value: string) =>
      window.localStorage.setItem(key, value),
  };
  const services = decorateServices(
    createDemoServer(storage, () => useSessionStore.getState().actorId),
  );
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false, staleTime: 15000 },
      mutations: { retry: false },
    },
  });
  createRoot(document.getElementById('root')!).render(
    <QueryClientProvider client={client}>
      <ServicesProvider services={services}>
        <App />
        <DevTools />
      </ServicesProvider>
    </QueryClientProvider>,
  );
}
void bootstrap();
