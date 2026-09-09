import { BrowserRouter, Link, Route, Routes } from 'react-router';
import { AppShell } from '@/app/layout/app-shell.page';
import { MonitorPage } from '@/features/monitor';
import { CatalogPage } from '@/features/catalog';
import { BillsPage, IssuePage } from '@/features/billing';
export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<MonitorPage />} />
          <Route
            path="empresas"
            element={<CatalogPage key="companies" kind="companies" />}
          />
          <Route
            path="empresas/:companyId"
            element={<CatalogPage key="company-detail" kind="companies" />}
          />
          <Route
            path="empresas/:companyId/cnpjs/:establishmentId"
            element={<CatalogPage key="establishment-detail" kind="companies" />}
          />
          <Route
            path="usuarios"
            element={<CatalogPage key="users" kind="users" />}
          />
          <Route
            path="configuracoes"
            element={<CatalogPage key="settings" kind="settings" />}
          />
          <Route path="boletos" element={<BillsPage />} />
          <Route path="boletos/novo" element={<IssuePage />} />
          <Route
            path="*"
            element={
              <section>
                <h1 className="text-2xl font-bold">Página não encontrada</h1>
                <Link className="underline" to="/">
                  Voltar ao acompanhamento
                </Link>
              </section>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
