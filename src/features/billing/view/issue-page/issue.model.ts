import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { QuoteInput, Services } from '@/server';
import { money, errorMessage, monthLabel, dateLabel } from '@/shared/ui/utils';
const amount = z
  .string()
  .refine(
    (value) =>
      value === '' || (Number.isFinite(Number(value)) && Number(value) >= 0),
    'Informe um valor positivo ou zero.',
  );
const schema = z.object({
  companyId: z.string().min(1, 'Selecione uma empresa.'),
  year: z.string().regex(/^\d{4}$/, 'Informe o ano.'),
  months: z.array(z.string()).min(1, 'Selecione ao menos uma competência.'),
  workers: z
    .string()
    .refine(
      (value) => Number.isSafeInteger(Number(value)) && Number(value) > 0,
      'Informe um número inteiro maior que zero.',
    ),
  dueDate: z.string().min(1, 'Informe o vencimento.'),
  override: amount,
  discount: amount,
  correction: amount,
});
type Values = z.infer<typeof schema>;
export function toQuoteInput(values: Values): QuoteInput {
  return {
    companyId: values.companyId,
    months: values.months.map((month) => `${values.year}-${month}`).sort(),
    workers: Number(values.workers),
    dueDate: values.dueDate,
    overrideCents:
      values.override === ''
        ? undefined
        : Math.round(Number(values.override) * 100),
    discountCents: Math.round(Number(values.discount) * 100),
    correctionCents: Math.round(Number(values.correction) * 100),
  };
}
export function useIssueModel({
  services,
  actorId,
  initialCompany,
}: {
  services: Services;
  actorId: string;
  initialCompany: string;
}) {
  const client = useQueryClient();
  const [companySearch, setCompanySearch] = useState('');
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      companyId: initialCompany,
      year: '2026',
      months: ['09'],
      workers: '',
      dueDate: '2026-09-15',
      override: '',
      discount: '0',
      correction: '0',
    },
  });
  const values = useWatch({ control: form.control });
  const query = useQuery({
    queryKey: ['companies', actorId],
    queryFn: () => services.listCompanies(),
  });
  useEffect(() => {
    const company = query.data?.find((item) => item.id === initialCompany);
    if (company) {
      setCompanySearch(`${company.name} · ${company.cnpj}`);
      form.setValue('workers', String(company.workers));
    }
  }, [form, initialCompany, query.data]);
  const preview = useMutation({
    mutationFn: async (submitted: Values) => {
      const input = toQuoteInput(submitted);
      return {
        quote: await services.quote(input),
        signature: JSON.stringify(submitted),
      };
    },
  });
  const issue = useMutation({
    mutationFn: (submitted: Values) => services.issue(toQuoteInput(submitted)),
    onSuccess: () => client.invalidateQueries(),
  });
  const quoteIsCurrent =
    !!preview.data && preview.data.signature === JSON.stringify(values);
  const quote = quoteIsCurrent ? preview.data?.quote : undefined;
  const selectedCompany = query.data?.find(
    (company) => company.id === values.companyId,
  );
  function selectCompany(id: string) {
    form.setValue('companyId', id, { shouldValidate: true });
    const company = query.data?.find((item) => item.id === id);
    if (company)
      form.setValue('workers', String(company.workers), {
        shouldValidate: true,
      });
  }
  function searchCompany(value: string) {
    setCompanySearch(value);
    const normalized = value.toLocaleLowerCase('pt-BR').trim();
    const company = query.data?.find(
      (item) =>
        `${item.name} · ${item.cnpj}`.toLocaleLowerCase('pt-BR') === normalized ||
        item.cnpj === value,
    );
    selectCompany(company?.id ?? '');
  }
  function fillWorkers() {
    if (selectedCompany)
      form.setValue('workers', String(selectedCompany.workers), {
        shouldValidate: true,
      });
  }
  const busy = preview.isPending || issue.isPending;
  const months = [
    'Jan',
    'Fev',
    'Mar',
    'Abr',
    'Mai',
    'Jun',
    'Jul',
    'Ago',
    'Set',
    'Out',
    'Nov',
    'Dez',
  ].map((label, index) => ({
    label,
    value: String(index + 1).padStart(2, '0'),
  }));
  return {
    register: form.register,
    errors: form.formState.errors,
    months,
    selectedCompany,
    selectCompany,
    fillWorkers,
    companyId: values.companyId,
    companySearch,
    searchCompany,
    companies: query.data ?? [],
    busy,
    isPreviewing: preview.isPending,
    isIssuing: issue.isPending,
    isPending: query.isPending,
    preview: form.handleSubmit((submitted) => {
      issue.reset();
      preview.mutate(submitted);
    }),
    issue: form.handleSubmit((submitted) => {
      if (quoteIsCurrent) issue.mutate(submitted);
    }),
    error: query.isError
      ? errorMessage(query.error)
      : issue.isError
        ? errorMessage(issue.error)
        : preview.isError
          ? errorMessage(preview.error)
          : '',
    refresh: () => void query.refetch(),
    canIssue: quoteIsCurrent && !busy && !issue.isSuccess,
    summary: quote
      ? {
          total: money(quote.totalCents),
          base: money(quote.baseCents),
          fine: money(quote.fineCents),
          discount: money(quote.discountCents),
          correction: money(quote.correctionCents),
          estimate: String(quote.estimatedWorkers),
          overdueMonths: quote.overdueMonths,
          lines: quote.breakdown.map((line) => ({
            month: monthLabel(line.month),
            amount: money(line.baseCents),
            overdue: line.overdue,
          })),
          overridden: values.override !== '',
        }
      : null,
    success: issue.data
      ? {
          id: issue.data.id,
          total: money(issue.data.totalCents),
          due: dateLabel(issue.data.dueDate),
          recipients: issue.data.notifications.join(', '),
        }
      : null,
  };
}
