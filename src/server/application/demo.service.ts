import type { DatabaseRepository } from '@/server/shared/domain/database.repository';
import type { Services, MonitorRow } from '@/server/shared/domain/app.types';
import { AppError } from '@/server/shared/domain/app.errors';
import { requireRole, requireUser } from '@/server/identity/domain/permissions';
import {
  calculateQuote,
  estimateWorkers,
} from '@/server/billing/domain/billing.rules';

export function createServices(
  repository: DatabaseRepository,
  actorId: () => string,
  now: () => string,
  uuid: () => string,
): Services {
  function context() {
    const db = repository.read();
    return { db, actor: requireUser(db.users, actorId()) };
  }
  return {
    async listCompanies() {
      return context().db.companies;
    },
    async saveCompany(company) {
      const { db, actor } = context();
      requireRole(actor, ['admin', 'director', 'operator']);
      const valid =
        company.name.trim().length >= 3 &&
        company.cnpj.replace(/\D/g, '').length === 14 &&
        Number.isSafeInteger(company.workers) &&
        company.workers > 0 &&
        company.email.includes('@');
      if (!valid)
        throw new AppError(
          'COMPANY_INPUT',
          'Verifique razão social, CNPJ, e-mail e número de trabalhadores.',
        );
      const duplicate = db.companies.some(
        (item) =>
          item.id !== company.id &&
          item.cnpj.replace(/\D/g, '') === company.cnpj.replace(/\D/g, ''),
      );
      if (duplicate)
        throw new AppError('DUPLICATE', 'Já existe uma empresa com esse CNPJ.');
      const saved = { ...company, id: company.id || uuid() };
      db.companies = [
        ...db.companies.filter((item) => item.id !== saved.id),
        saved,
      ];
      repository.write(db);
      return saved;
    },
    async lookupCompany(cnpj) {
      const company = context().db.companies.find(
        (item) => item.cnpj.replace(/\D/g, '') === cnpj.replace(/\D/g, ''),
      );
      if (!company)
        throw new AppError(
          'LOOKUP_NOT_FOUND',
          'CNPJ não encontrado na base simulada. Preencha os dados manualmente.',
        );
      return { ...company };
    },
    async listBills() {
      const { db, actor } = context();
      return db.bills.filter(
        (bill) => actor.role !== 'operator' || bill.createdBy === actor.id,
      );
    },
    async monitor(month) {
      const { db, actor } = context();
      const visible = db.bills.filter(
        (bill) => actor.role !== 'operator' || bill.createdBy === actor.id,
      );
      const convention = db.conventions.find(
        (item) => item.year === Number(month.slice(0, 4)),
      );
      const rows: MonitorRow[] = db.companies.map((company) => {
        const bills = visible.filter(
          (bill) =>
            bill.companyId === company.id && bill.months.includes(month),
        );
        // Para boletos agrupados, o rateio mensal usa principal, não multas ou descontos.
        const monthlyValue = (bill: (typeof visible)[number]) =>
          Math.floor(
            (bill.quote?.baseCents ?? bill.totalCents) / bill.months.length,
          );
        const paidCents = bills
          .filter((bill) => bill.status === 'paid')
          .reduce((sum, bill) => sum + monthlyValue(bill), 0);
        const dueCents = bills
          .filter((bill) => bill.status === 'open')
          .reduce((sum, bill) => sum + monthlyValue(bill), 0);
        const priorMonths = [
          ...new Set(
            visible
              .filter(
                (bill) =>
                  bill.companyId === company.id && bill.status === 'paid',
              )
              .flatMap((bill) => bill.months),
          ),
        ]
          .filter((item) => item < month)
          .sort();
        const prior = priorMonths.at(-1);
        const priorCents = prior
          ? visible
              .filter(
                (bill) =>
                  bill.companyId === company.id &&
                  bill.status === 'paid' &&
                  bill.months.includes(prior),
              )
              .reduce((sum, bill) => sum + monthlyValue(bill), 0)
          : 0;
        const priorConvention = prior
          ? db.conventions.find(
              (item) => item.year === Number(prior.slice(0, 4)),
            )
          : undefined;
        const estimatedWorkers =
          convention && bills.length
            ? estimateWorkers(paidCents + dueCents, convention.salaryFloorCents)
            : null;
        const previousWorkers = priorConvention
          ? estimateWorkers(priorCents, priorConvention.salaryFloorCents)
          : null;
        const status =
          bills.length === 0
            ? 'missing'
            : bills.some(
                  (bill) =>
                    bill.status === 'open' && bill.dueDate < now().slice(0, 10),
                )
              ? 'overdue'
              : bills.some((bill) => bill.status === 'open')
                ? 'open'
                : 'paid';
        return {
          company,
          paidCents,
          dueCents,
          estimatedWorkers,
          previousWorkers,
          status,
          discrepancy:
            estimatedWorkers !== null &&
            previousWorkers !== null &&
            estimatedWorkers < previousWorkers,
        };
      });
      return rows;
    },
    async quote(input) {
      const { db } = context();
      return calculateQuote(input, db.conventions, now().slice(0, 10));
    },
    async issue(input) {
      const { db, actor } = context();
      if (!db.companies.some((item) => item.id === input.companyId))
        throw new AppError('NOT_FOUND', 'Selecione uma empresa cadastrada.');
      const duplicate = db.bills.some(
        (bill) =>
          bill.companyId === input.companyId &&
          bill.months.some((month) => input.months.includes(month)),
      );
      if (duplicate)
        throw new AppError(
          'DUPLICATE_BILL',
          'Já existe cobrança para uma das competências selecionadas. Consulte os boletos da empresa.',
        );
      const quote = calculateQuote(input, db.conventions, now().slice(0, 10));
      const notifications = [
        ...new Set([
          actor.email,
          ...db.users
            .filter((user) => user.active && user.role === 'director')
            .map((user) => user.email),
        ]),
      ];
      const bill = {
        id: `DEMO-${uuid().slice(0, 8).toUpperCase()}`,
        companyId: input.companyId,
        months: input.months,
        workers: input.workers,
        dueDate: input.dueDate,
        totalCents: quote.totalCents,
        createdBy: actor.id,
        createdAt: now(),
        status: 'open' as const,
        quote,
        notifications,
      };
      db.bills.unshift(bill);
      repository.write(db);
      return bill;
    },
    async pay(id) {
      const { db, actor } = context();
      requireRole(actor, ['admin', 'director']);
      const bill = db.bills.find((item) => item.id === id);
      if (!bill) throw new AppError('NOT_FOUND', 'Boleto não encontrado.');
      bill.status = 'paid';
      repository.write(db);
    },
    async listUsers() {
      const { db, actor } = context();
      requireRole(actor, ['admin']);
      return db.users;
    },
    async saveUser(user) {
      const { db, actor } = context();
      requireRole(actor, ['admin']);
      if (
        !user.name.trim() ||
        !user.email.includes('@') ||
        !['admin', 'director', 'operator'].includes(user.role)
      )
        throw new AppError('USER_INPUT', 'Verifique nome, e-mail e perfil.');
      if (user.id === actor.id && (!user.active || user.role !== 'admin'))
        throw new AppError(
          'SELF_CHANGE',
          'Use outro administrador para alterar seu próprio acesso.',
        );
      if (
        db.users.some(
          (item) =>
            item.id !== user.id &&
            item.email.toLowerCase() === user.email.toLowerCase(),
        )
      )
        throw new AppError('DUPLICATE_USER', 'Este e-mail já está cadastrado.');
      const saved = { ...user, id: user.id || uuid() };
      db.users = [...db.users.filter((item) => item.id !== saved.id), saved];
      repository.write(db);
      return saved;
    },
    async conventions() {
      return context().db.conventions;
    },
    async saveConvention(convention) {
      const { db, actor } = context();
      requireRole(actor, ['admin', 'director']);
      const valid =
        Number.isInteger(convention.year) &&
        convention.year >= 2020 &&
        convention.year <= 2100 &&
        Number.isSafeInteger(convention.salaryFloorCents) &&
        convention.salaryFloorCents >= 100 &&
        Number.isInteger(convention.dueDay) &&
        convention.dueDay >= 1 &&
        convention.dueDay <= 28 &&
        (convention.monthlyFinePercent === null ||
          (Number.isFinite(convention.monthlyFinePercent) &&
            convention.monthlyFinePercent >= 0 &&
            convention.monthlyFinePercent <= 100));
      if (!valid)
        throw new AppError(
          'CONVENTION_INPUT',
          'Verifique ano, piso salarial, dia (1 a 28) e multa (0 a 100%).',
        );
      db.conventions = [
        ...db.conventions.filter((item) => item.year !== convention.year),
        convention,
      ];
      repository.write(db);
    },
  };
}
