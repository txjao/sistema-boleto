import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Company, Convention, Services, User, Role } from '@/server';
import { cnpjRoot, cnpjRootLabel, dateLabel, errorMessage, money, monthLabel } from '@/shared/ui/utils';

export type CatalogKind = 'companies' | 'users' | 'settings';
interface Field {
  key: string;
  label: string;
  type?: string;
  options?: { value: string; label: string }[];
  optional?: boolean;
}
const fieldsByKind: Record<CatalogKind, Field[]> = {
  companies: [
    { key: 'name', label: 'Razão social' },
    { key: 'cnpj', label: 'CNPJ' },
    { key: 'workers', label: 'Número de trabalhadores', type: 'number' },
    { key: 'city', label: 'Cidade' },
    { key: 'address', label: 'Endereço' },
    { key: 'email', label: 'E-mail', type: 'email' },
    { key: 'phone', label: 'Telefone' },
  ],
  users: [
    { key: 'name', label: 'Nome completo' },
    { key: 'email', label: 'E-mail', type: 'email' },
    {
      key: 'role',
      label: 'Perfil',
      options: [
        { value: 'operator', label: 'Operador' },
        { value: 'director', label: 'Diretor financeiro' },
        { value: 'admin', label: 'Administrador' },
      ],
    },
    {
      key: 'active',
      label: 'Acesso',
      options: [
        { value: 'true', label: 'Ativo' },
        { value: 'false', label: 'Inativo' },
      ],
    },
  ],
  settings: [
    { key: 'year', label: 'Ano da convenção', type: 'number' },
    { key: 'salaryFloor', label: 'Piso salarial (R$)', type: 'number' },
    { key: 'dueDay', label: 'Dia de vencimento (1 a 28)', type: 'number' },
    {
      key: 'monthlyFinePercent',
      label: 'Multa mensal sobre o principal (%)',
      type: 'number',
      optional: true,
    },
  ],
};
const roleLabels = {
  admin: 'Administrador',
  director: 'Diretor financeiro',
  operator: 'Operador',
};
export function useCatalogModel({
  services,
  actorId,
  role,
  kind,
  companyId,
  establishmentId,
  competence,
}: {
  services: Services;
  actorId: string;
  role: Role;
  kind: CatalogKind;
  companyId?: string;
  establishmentId?: string;
  competence: string;
}) {
  const client = useQueryClient();
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [editing, setEditing] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [notice, setNotice] = useState('');
  const [lookupNotice, setLookupNotice] = useState('');
  const allowed = kind !== 'users' || role === 'admin';
  const canEdit =
    kind === 'companies' ||
    (kind === 'users' && role === 'admin') ||
    (kind === 'settings' && role !== 'operator');
  const fields = fieldsByKind[kind];
  const schema = z.record(z.string(), z.string()).superRefine((values, ctx) => {
    for (const field of fields) {
      const value = values[field.key]?.trim() ?? '';
      if (!value && !field.optional)
        ctx.addIssue({
          code: 'custom',
          path: [field.key],
          message: 'Preencha este campo.',
        });
      if (
        value &&
        field.type === 'email' &&
        !z.email().safeParse(value).success
      )
        ctx.addIssue({
          code: 'custom',
          path: [field.key],
          message: 'Informe um e-mail válido.',
        });
      if (field.key === 'cnpj' && value.replace(/\D/g, '').length !== 14)
        ctx.addIssue({
          code: 'custom',
          path: [field.key],
          message: 'Informe os 14 dígitos do CNPJ.',
        });
    }
  });
  const form = useForm<Record<string, string>>({
    resolver: zodResolver(schema),
  });
  const query = useQuery<(Company | User | Convention)[]>({
    queryKey: [kind, actorId],
    enabled: allowed,
    queryFn: () =>
      kind === 'companies'
        ? services.listCompanies()
        : kind === 'users'
          ? services.listUsers()
          : services.conventions(),
  });
  const bills = useQuery({
    queryKey: ['bills', actorId],
    queryFn: () => services.listBills(),
    enabled: !!companyId,
  });
  const monitoring = useQuery({
    queryKey: ['monitor', actorId, competence],
    queryFn: () => services.monitor(competence),
    enabled: !!companyId,
  });
  const save = useMutation({
    mutationFn: async (values: Record<string, string>) => {
      if (kind === 'companies')
        return services.saveCompany({
          id: editingId,
          name: values.name,
          cnpj: values.cnpj,
          workers: Number(values.workers),
          city: values.city,
          address: values.address,
          email: values.email,
          phone: values.phone,
        });
      if (kind === 'users')
        return services.saveUser({
          id: editingId,
          name: values.name,
          email: values.email,
          role: values.role as Role,
          active: values.active === 'true',
        });
      await services.saveConvention({
        year: Number(values.year),
        salaryFloorCents: Math.round(Number(values.salaryFloor) * 100),
        dueDay: Number(values.dueDay),
        monthlyFinePercent:
          values.monthlyFinePercent === ''
            ? null
            : Number(values.monthlyFinePercent),
      });
    },
    onSuccess: async () => {
      setEditing(false);
      setNotice('Alterações salvas neste navegador.');
      await client.invalidateQueries();
    },
  });
  const lookup = useMutation({
    mutationFn: () => services.lookupCompany(form.getValues('cnpj') ?? ''),
    onSuccess: (company) => {
      for (const field of fields)
        form.setValue(
          field.key,
          String(company[field.key as keyof Company] ?? ''),
        );
      setLookupNotice(
        'Dados encontrados na base simulada. Nenhuma consulta externa foi realizada.',
      );
    },
  });
  function edit(record?: Company | User | Convention) {
    save.reset();
    lookup.reset();
    setNotice('');
    setLookupNotice('');
    const values: Record<string, string> =
      kind === 'users'
        ? { role: 'operator', active: 'true' }
        : kind === 'settings'
          ? {
              year: '2026',
              salaryFloor: '1694',
              dueDay: '15',
              monthlyFinePercent: '',
            }
          : {};
    if (record)
      for (const [key, value] of Object.entries(record))
        values[key] = value === null ? '' : String(value);
    if (record && 'salaryFloorCents' in record)
      values.salaryFloor = String(record.salaryFloorCents / 100);
    setEditingId(record && 'id' in record ? record.id : '');
    form.reset(values);
    setEditing(true);
  }
  const companies = kind === 'companies' ? (query.data as Company[] | undefined) ?? [] : [];
  const selectedRoot = companyId
    ? (query.data as Company[] | undefined)?.find(
        (company) => company.id === companyId,
      )
    : undefined;
  const relatedCompanies = selectedRoot
    ? companies.filter((company) => cnpjRoot(company.cnpj) === cnpjRoot(selectedRoot.cnpj))
    : [];
  const selectedEstablishment = establishmentId
    ? relatedCompanies.find((company) => company.id === establishmentId)
    : undefined;
  const selected = selectedEstablishment ?? selectedRoot;
  const rootRecords: (Company | User | Convention)[] =
    kind === 'companies'
      ? Object.values(
          companies.reduce<Record<string, Company[]>>((groups, company) => {
            const root = cnpjRoot(company.cnpj);
            groups[root] = [...(groups[root] ?? []), company];
            return groups;
          }, {}),
        ).map((group) => group.find((company) => company.cnpj.includes('/0001-')) ?? group[0])
      : query.data ?? [];
  const rows = rootRecords
    .filter((record) => {
      const text = Object.values(record).join(' ').toLocaleLowerCase('pt-BR');
      const needle = appliedSearch.toLocaleLowerCase('pt-BR');
      return (
        text.includes(needle) ||
        (kind === 'companies' &&
          'cnpj' in record &&
          appliedSearch.replace(/\D/g, '').length > 0 &&
          record.cnpj.replace(/\D/g, '').includes(appliedSearch.replace(/\D/g, '')))
      );
    })
    .map((record) => {
      const cells =
        'cnpj' in record
          ? (() => {
              const group = companies.filter((company) => cnpjRoot(company.cnpj) === cnpjRoot(record.cnpj));
              return [
                record.name,
                cnpjRootLabel(record.cnpj),
                `${group.length} ${group.length === 1 ? 'CNPJ' : 'CNPJs'}`,
                group.reduce((sum, company) => sum + company.workers, 0).toLocaleString('pt-BR'),
                [...new Set(group.map((company) => company.city))].join(', '),
              ];
            })()
          : 'role' in record
            ? [
                record.name,
                record.email,
                roleLabels[record.role],
                record.active ? 'Ativo' : 'Inativo',
              ]
            : [
                String(record.year),
                money(record.salaryFloorCents),
                `Dia ${record.dueDay}`,
                record.monthlyFinePercent === null
                  ? 'Não definida'
                  : `${record.monthlyFinePercent}%`,
              ];
      return {
        id: 'id' in record ? record.id : String(record.year),
        cells,
        record,
        companyPath: 'cnpj' in record ? `/empresas/${record.id}` : '',
      };
    });
  const history =
    bills.data
      ?.filter((bill) => bill.companyId === (selectedEstablishment?.id ?? selectedRoot?.id))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((bill) => ({
        id: bill.id,
        months: bill.months.map(monthLabel).join(', '),
        amount: money(bill.totalCents),
        due: dateLabel(bill.dueDate),
        status:
          bill.status === 'paid'
            ? 'Pago'
            : bill.dueDate < '2026-09-08'
              ? 'Em atraso'
              : 'Em aberto',
        statusKey:
          bill.status === 'paid'
            ? ('paid' as const)
            : bill.dueDate < '2026-09-08'
              ? ('overdue' as const)
              : ('open' as const),
      })) ?? [];
  const detailCompanies = selectedEstablishment
    ? [selectedEstablishment]
    : relatedCompanies;
  const detailIds = new Set(detailCompanies.map((company) => company.id));
  const detailBills = (bills.data ?? []).filter((bill) => detailIds.has(bill.companyId));
  const openBills = detailBills.filter((bill) => bill.status === 'open');
  const overdueBills = openBills.filter((bill) => bill.dueDate < '2026-09-08');
  const receivedInCompetence = detailBills
    .filter((bill) => bill.status === 'paid' && bill.months.includes(competence))
    .reduce(
      (sum, bill) =>
        sum + Math.floor((bill.quote?.baseCents ?? bill.totalCents) / bill.months.length),
      0,
    );
  const recentBills = [...detailBills]
    .sort((a, b) => b.dueDate.localeCompare(a.dueDate))
    .slice(0, 8)
    .map((bill) => {
      const company = detailCompanies.find((item) => item.id === bill.companyId);
      const overdue = bill.status === 'open' && bill.dueDate < '2026-09-08';
      return {
        id: bill.id,
        company: company?.city ?? 'Estabelecimento',
        cnpj: company?.cnpj ?? '',
        months: bill.months.map(monthLabel).join(', '),
        amount: money(bill.totalCents),
        due: dateLabel(bill.dueDate),
        status: bill.status === 'paid' ? 'Pago' : overdue ? 'Em atraso' : 'Em aberto',
        statusKey: bill.status === 'paid' ? ('paid' as const) : overdue ? ('overdue' as const) : ('open' as const),
      };
    });
  const monitoringRows = selectedRoot
    ? (monitoring.data ?? []).filter(
        (row) =>
          selectedEstablishment
            ? row.company.id === selectedEstablishment.id
            : cnpjRoot(row.company.cnpj) === cnpjRoot(selectedRoot.cnpj),
      )
    : [];
  const currentEstimates = monitoringRows
    .map((row) => row.estimatedWorkers)
    .filter((value): value is number => value !== null);
  const previousEstimates = monitoringRows
    .map((row) => row.previousWorkers)
    .filter((value): value is number => value !== null);
  const currentWorkers = currentEstimates.reduce((sum, value) => sum + value, 0);
  const previousWorkers = previousEstimates.reduce((sum, value) => sum + value, 0);
  const companyDiscrepancy = monitoringRows.some((row) => row.discrepancy)
    ? {
        current: currentWorkers.toLocaleString('pt-BR'),
        previous: previousWorkers.toLocaleString('pt-BR'),
        reduction: Math.max(0, previousWorkers - currentWorkers).toLocaleString('pt-BR'),
        percentage:
          previousWorkers > 0
            ? `${Math.round(((previousWorkers - currentWorkers) / previousWorkers) * 100)}%`
            : '—',
      }
    : null;
  const companyOverview = selectedRoot
    ? {
        competence: monthLabel(competence),
        received: money(receivedInCompetence),
        debt: money(openBills.reduce((sum, bill) => sum + bill.totalCents, 0)),
        openCount: openBills.length,
        overdueCount: overdueBills.length,
        fines: money(
          openBills.reduce((sum, bill) => sum + (bill.quote?.fineCents ?? 0), 0),
        ),
        status: overdueBills.length
          ? 'Possui cobranças em atraso'
          : openBills.length
            ? 'Possui cobranças em aberto'
            : 'Sem débitos em aberto',
        statusKey: overdueBills.length ? ('overdue' as const) : openBills.length ? ('open' as const) : ('paid' as const),
      }
    : null;
  const titles = {
    companies: 'Empresas',
    users: 'Usuários',
    settings: 'Configurações',
  };
  const descriptions = {
    companies: 'Consulte empresas pelo CNPJ raiz e acesse seus estabelecimentos.',
    users: 'Organize os perfis e experimente os níveis de acesso.',
    settings: 'Parâmetros anuais da contribuição negocial.',
  };
  return {
    kind,
    title: selected?.name ?? titles[kind],
    description: selected
      ? selectedEstablishment
        ? `${selected.cnpj} · ${selected.city}`
        : `CNPJ raiz ${cnpjRootLabel(selected.cnpj)} · ${relatedCompanies.length} estabelecimentos`
      : descriptions[kind],
    rows,
    selected,
    selectedRoot,
    selectedEstablishment,
    relatedCompanies: relatedCompanies.map((company) => ({
      ...company,
      path: `/empresas/${selectedRoot?.id}/cnpjs/${company.id}`,
    })),
    isEstablishmentDetail: !!selectedEstablishment,
    companyOverview,
    recentBills,
    companyDiscrepancy,
    history,
    hasCompanyId: !!companyId,
    historyLoading: bills.isPending && !!companyId,
    historyError: bills.isError ? errorMessage(bills.error) : '',
    refreshHistory: () => void bills.refetch(),
    columns:
      kind === 'companies'
        ? ['Razão social', 'CNPJ raiz', 'Estabelecimentos', 'Trabalhadores', 'Municípios']
        : kind === 'users'
          ? ['Nome', 'E-mail', 'Perfil', 'Acesso']
          : ['Ano', 'Piso salarial', 'Vencimento', 'Multa mensal'],
    fields,
    search,
    setSearch,
    searchCatalog: () => {
      setAppliedSearch(search);
      void query.refetch();
    },
    allowed,
    canEdit,
    editing,
    setEditing,
    edit,
    register: form.register,
    errors: form.formState.errors,
    submit: form.handleSubmit((values) => save.mutate(values)),
    isSaving: save.isPending,
    saveError: save.isError ? errorMessage(save.error) : '',
    lookup: () => lookup.mutate(),
    isLookingUp: lookup.isPending,
    lookupError: lookup.isError ? errorMessage(lookup.error) : '',
    notice,
    lookupNotice,
    isPending: query.isPending,
    isFetching: query.isFetching,
    error: query.isError ? errorMessage(query.error) : '',
    refresh: () => void query.refetch(),
    actionLabel:
      kind === 'companies'
        ? 'Nova empresa'
        : kind === 'users'
          ? 'Novo usuário'
          : 'Nova convenção',
  };
}
