import { AppError } from '@/server/shared/domain/app.errors';
import type {
  Convention,
  Quote,
  QuoteInput,
} from '@/server/shared/domain/app.types';

export function cents(value: number) {
  const valid = Number.isSafeInteger(value) && value >= 0;
  if (!valid)
    throw new AppError(
      'INVALID_AMOUNT',
      'O valor deve ser um inteiro não negativo em centavos.',
    );
  return value;
}
export function contributionPerWorker(salary: number) {
  const amount = Math.round(cents(salary) / 100);
  if (amount <= 0)
    throw new AppError('INVALID_FLOOR', 'Informe um piso salarial válido.');
  return amount;
}
export function estimateWorkers(amount: number, salary: number) {
  return Math.floor(cents(amount) / contributionPerWorker(salary));
}
export function validDate(date: string) {
  const parsed = new Date(`${date}T12:00:00Z`);
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === date
  );
}
export function dueFor(month: string, day: number) {
  // Hipótese da demo: vencimento no próprio mês da competência; dia limitado a 28.
  return `${month}-${String(day).padStart(2, '0')}`;
}
export function calculateQuote(
  input: QuoteInput,
  conventions: Convention[],
  today: string,
): Quote {
  const months = [...new Set(input.months)].sort();
  const validMonths =
    months.length > 0 &&
    months.length <= 12 &&
    months.every((month) => /^\d{4}-(0[1-9]|1[0-2])$/.test(month));
  if (!validMonths)
    throw new AppError('MONTHS', 'Selecione de 1 a 12 competências válidas.');
  if (months.length !== input.months.length)
    throw new AppError(
      'DUPLICATE_MONTH',
      'Uma competência não pode ser repetida.',
    );
  const validWorkers =
    Number.isSafeInteger(input.workers) &&
    input.workers > 0 &&
    input.workers <= 1000000;
  if (!validWorkers)
    throw new AppError('WORKERS', 'Informe de 1 a 1.000.000 de trabalhadores.');
  if (!validDate(input.dueDate) || input.dueDate < today)
    throw new AppError(
      'DUE_DATE',
      'O vencimento do novo boleto deve ser hoje ou uma data futura.',
    );
  const years = new Set(months.map((month) => Number(month.slice(0, 4))));
  if (years.size !== 1)
    throw new AppError(
      'MIXED_YEARS',
      'Emita separadamente as competências de anos diferentes.',
    );
  const convention = conventions.find((item) => years.has(item.year));
  if (!convention)
    throw new AppError(
      'CONVENTION',
      'Cadastre a convenção desse ano nas configurações.',
    );
  const monthly = cents(
    contributionPerWorker(convention.salaryFloorCents) * input.workers,
  );
  const breakdown = months.map((month) => ({
    month,
    baseCents: monthly,
    overdue: today > dueFor(month, convention.dueDay),
  }));
  const overdueMonths = breakdown.filter((line) => line.overdue).length;
  const calculatedBase = cents(monthly * months.length);
  const baseCents =
    input.overrideCents === undefined
      ? calculatedBase
      : cents(input.overrideCents);
  if (baseCents === 0)
    throw new AppError(
      'ZERO_AMOUNT',
      'O valor principal deve ser maior que zero.',
    );
  let fineCents = 0;
  if (overdueMonths > 0) {
    if (months.length > 1) {
      const overdueDebt = Math.round(
        (baseCents * overdueMonths) / months.length,
      );
      fineCents = Math.min(
        overdueDebt,
        Math.round(convention.salaryFloorCents * 0.2) * input.workers,
      );
    } else {
      if (convention.monthlyFinePercent === null)
        throw new AppError(
          'FINE_UNDEFINED',
          'Defina a multa mensal da convenção nas configurações antes de emitir uma competência atrasada.',
        );
      fineCents = Math.min(
        baseCents,
        Math.round((baseCents * convention.monthlyFinePercent) / 100),
      );
    }
  }
  const correctionCents = cents(input.correctionCents);
  const discountCents = cents(input.discountCents);
  if (!overdueMonths && correctionCents > 0)
    throw new AppError(
      'CORRECTION',
      'Correção só é permitida para competências atrasadas.',
    );
  const totalCents = cents(baseCents + fineCents + correctionCents);
  if (discountCents >= totalCents)
    throw new AppError(
      'DISCOUNT',
      'O desconto deve ser menor que o total da cobrança.',
    );
  return {
    baseCents,
    fineCents,
    correctionCents,
    discountCents,
    totalCents: totalCents - discountCents,
    estimatedWorkers: estimateWorkers(
      Math.floor(baseCents / months.length),
      convention.salaryFloorCents,
    ),
    overdueMonths,
    breakdown,
  };
}
