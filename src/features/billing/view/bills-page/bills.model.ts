import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Services, Role } from '@/server';
import { money, dateLabel, monthLabel, errorMessage } from '@/shared/ui/utils';
export function useBillsModel({
  services,
  actorId,
  role,
}: {
  services: Services;
  actorId: string;
  role: Role;
}) {
  const client = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [appliedStatus, setAppliedStatus] = useState('all');
  const [notice, setNotice] = useState('');
  const query = useQuery({
    queryKey: ['bills', actorId],
    queryFn: () => services.listBills(),
  });
  const companies = useQuery({
    queryKey: ['companies', actorId],
    queryFn: () => services.listCompanies(),
  });
  const payment = useMutation({
    mutationFn: (id: string) => services.pay(id),
    onSuccess: async () => {
      setNotice(
        'Pagamento confirmado na simulação. Nenhuma operação bancária foi realizada.',
      );
      await client.invalidateQueries();
    },
  });
  const rows = (query.data ?? [])
    .map((bill) => {
      const company = companies.data?.find(
        (item) => item.id === bill.companyId,
      );
      const overdue = bill.status === 'open' && bill.dueDate < '2026-09-08';
      return {
        ...bill,
        name: company?.name ?? 'Empresa',
        cnpj: company?.cnpj ?? '',
        amountLabel: money(bill.totalCents),
        dueLabel: dateLabel(bill.dueDate),
        monthsLabel: bill.months.map(monthLabel).join(', '),
        statusLabel:
          bill.status === 'paid' ? 'Pago' : overdue ? 'Em atraso' : 'Em aberto',
        statusKey: bill.status === 'paid' ? 'paid' as const : overdue ? 'overdue' as const : 'open' as const,
        notificationsLabel: bill.notifications.length
          ? `Destinatários simulados: ${bill.notifications.join(', ')}`
          : 'Registro inicial da demonstração',
      };
    })
    .filter(
      (bill) =>
        `${bill.name} ${bill.cnpj} ${bill.id}`
          .toLowerCase()
          .includes(appliedSearch.toLowerCase()) &&
        (appliedStatus === 'all' || bill.status === appliedStatus),
    );
  return {
    rows,
    search,
    setSearch,
    status,
    setStatus,
    notice,
    canPay: role !== 'operator',
    pay: (id: string) => payment.mutate(id),
    isPaying: payment.isPending,
    error: query.isError
      ? errorMessage(query.error)
      : companies.isError
        ? errorMessage(companies.error)
        : payment.isError
          ? errorMessage(payment.error)
          : '',
    isPending: query.isPending || companies.isPending,
    isFetching: query.isFetching || companies.isFetching,
    searchBills: () => {
      setAppliedSearch(search);
      setAppliedStatus(status);
      void query.refetch();
      void companies.refetch();
    },
    refresh: () => {
      void query.refetch();
      void companies.refetch();
    },
  };
}
