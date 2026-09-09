import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { MonitorRow, Services } from '@/server';
import { cnpjRoot, cnpjRootLabel, money, errorMessage } from '@/shared/ui/utils';
export function useMonitorModel({
  services,
  actorId,
}: {
  services: Services;
  actorId: string;
}) {
  const [month, setMonth] = useState('2026-08');
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [appliedStatus, setAppliedStatus] = useState('all');
  const query = useQuery({
    queryKey: ['monitor', actorId, month],
    queryFn: () => services.monitor(month),
    enabled: !!month,
  });
  const allRows = query.data ?? [];
  const labels = {
    paid: 'Pago',
    open: 'Em aberto',
    overdue: 'Em atraso',
    missing: 'Sem cobrança',
  };
  const groupedRows = Object.values(
    allRows.reduce<Record<string, typeof allRows>>((groups, row) => {
      const root = cnpjRoot(row.company.cnpj);
      groups[root] = [...(groups[root] ?? []), row];
      return groups;
    }, {}),
  ).map((group) => {
    const company = group.find((row) => row.company.cnpj.includes('/0001-'))?.company ?? group[0].company;
    const status: MonitorRow['status'] = group.some((row) => row.status === 'overdue')
      ? 'overdue'
      : group.some((row) => row.status === 'open')
        ? 'open'
        : group.some((row) => row.status === 'paid')
          ? 'paid'
          : 'missing';
    const estimates = group.map((row) => row.estimatedWorkers).filter((value): value is number => value !== null);
    const previous = group.map((row) => row.previousWorkers).filter((value): value is number => value !== null);
    return {
      company,
      rootCnpj: cnpjRootLabel(company.cnpj),
      establishments: group.length,
      paidCents: group.reduce((sum, row) => sum + row.paidCents, 0),
      dueCents: group.reduce((sum, row) => sum + row.dueCents, 0),
      estimatedWorkers: estimates.length ? estimates.reduce((sum, value) => sum + value, 0) : null,
      previousWorkers: previous.length ? previous.reduce((sum, value) => sum + value, 0) : null,
      discrepancy: group.some((row) => row.discrepancy),
      status,
    };
  });
  const needle = appliedSearch.toLocaleLowerCase('pt-BR').trim();
  const numericSearch = appliedSearch.replace(/\D/g, '');
  const rows = groupedRows
    .filter((row) => {
      const matchesText = `${row.company.name} ${row.company.city}`
        .toLocaleLowerCase('pt-BR')
        .includes(needle);
      const matchesCnpj =
        numericSearch.length > 0 &&
        row.company.cnpj.replace(/\D/g, '').includes(numericSearch);
      const matchesStatus =
        appliedStatus === 'all' ||
        (appliedStatus === 'discrepancy' && row.discrepancy) ||
        row.status === appliedStatus;
      return (needle === '' || matchesText || matchesCnpj) && matchesStatus;
    })
    .map((row) => ({
      ...row,
      paidLabel: money(row.paidCents),
      dueLabel: money(row.dueCents),
      estimateLabel:
        row.estimatedWorkers === null
          ? 'Sem estimativa'
          : row.estimatedWorkers.toLocaleString('pt-BR'),
      previousLabel:
        row.previousWorkers === null
          ? 'Sem histórico anterior'
          : `${row.previousWorkers.toLocaleString('pt-BR')} no último mês pago`,
      statusLabel: labels[row.status],
    }));
  return {
    month,
    setMonth,
    search,
    setSearch,
    status,
    setStatus,
    rows,
    isPending: query.isPending,
    isFetching: query.isFetching,
    error: query.isError ? errorMessage(query.error) : '',
    searchRows: () => {
      setAppliedSearch(search);
      setAppliedStatus(status);
      void query.refetch();
    },
    refresh: () => void query.refetch(),
    paidLabel: money(allRows.reduce((sum, row) => sum + row.paidCents, 0)),
    dueLabel: money(allRows.reduce((sum, row) => sum + row.dueCents, 0)),
    discrepancies: allRows.filter((row) => row.discrepancy).length,
    totalCompanies: groupedRows.length,
    paidCount: groupedRows.filter((row) => row.paidCents > 0).length,
    hasFilter: appliedSearch !== '' || appliedStatus !== 'all',
    clearFilters: () => {
      setSearch('');
      setStatus('all');
      setAppliedSearch('');
      setAppliedStatus('all');
    },
  };
}
