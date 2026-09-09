import type { Database } from '@/server/shared/domain/app.types';

export function createSeed(): Database {
  const companies = [
    {
      id: 'c1',
      name: 'Horizonte Construção Pesada',
      cnpj: '12.345.678/0001-95',
      city: 'Belo Horizonte',
      workers: 500,
    },
    {
      id: 'c2',
      name: 'Horizonte Construção Pesada',
      cnpj: '12.345.678/0002-76',
      city: 'Contagem',
      workers: 320,
    },
    {
      id: 'c3',
      name: 'Horizonte Construção Pesada',
      cnpj: '12.345.678/0003-57',
      city: 'Betim',
      workers: 250,
    },
    {
      id: 'c4',
      name: 'Estrada Nova Engenharia',
      cnpj: '23.456.789/0001-95',
      city: 'Itabira',
      workers: 180,
    },
    {
      id: 'c5',
      name: 'Vale do Aço Infraestrutura',
      cnpj: '34.567.890/0001-90',
      city: 'Ipatinga',
      workers: 420,
    },
  ].map((company) => ({
    ...company,
    address: 'Av. das Obras, 100 · Centro',
    email: `financeiro+${company.id}@example.com`,
    phone: '(31) 3333-0000',
  }));
  const bills = companies.flatMap((company, index) =>
    ['2026-06', '2026-07', '2026-08'].map((month, m) => ({
      id: `DEMO-${index + 1}${m + 1}`,
      companyId: company.id,
      months: [month],
      workers: company.workers,
      dueDate: `${month}-15`,
      totalCents: index === 2 && m === 2 ? 100000 : company.workers * 1694,
      createdBy: index % 2 === 0 ? 'u3' : 'u1',
      createdAt: `${month}-01T12:00:00Z`,
      status: (m < 2 || index === 0 || index === 2 ? 'paid' : 'open') as
        'paid' | 'open',
      notifications: [],
    })),
  );
  return {
    version: 1,
    companies,
    bills,
    users: [
      {
        id: 'u1',
        name: 'Marina Alves',
        email: 'marina@example.com',
        role: 'admin',
        active: true,
      },
      {
        id: 'u2',
        name: 'Carlos Mendes',
        email: 'carlos@example.com',
        role: 'director',
        active: true,
      },
      {
        id: 'u3',
        name: 'Ana Costa',
        email: 'ana@example.com',
        role: 'operator',
        active: true,
      },
    ],
    conventions: [
      {
        year: 2026,
        salaryFloorCents: 169400,
        dueDay: 15,
        monthlyFinePercent: null,
      },
    ],
  };
}
