import { Link } from 'react-router';
import {
  ArrowUpRightIcon,
  ArrowsClockwiseIcon,
  MagnifyingGlassIcon,
  WarningCircleIcon,
  PlusIcon,
} from '@phosphor-icons/react';
import { Button } from '@/shared/ui/components/button';
import { Feedback, Loading } from '@/shared/ui/components/feedback';
import { MonthPicker } from '@/shared/ui/components/month-picker';
import { StatusTag } from '@/shared/ui/components/status-tag';
import type { useMonitorModel } from './monitor.model';
import styles from './styles/monitor.module.css';
export function MonitorView(props: ReturnType<typeof useMonitorModel>) {
  const {
    month,
    setMonth,
    search,
    setSearch,
    status,
    setStatus,
    rows,
    isPending,
    isFetching,
    error,
    refresh,
    searchRows,
    paidLabel,
    dueLabel,
    discrepancies,
    totalCompanies,
    paidCount,
    hasFilter,
    clearFilters,
  } = props;
  return (
    <section>
      <header className={styles.heading}>
        <div>
          <h1>Acompanhamento</h1>
          <p>Uma visão clara das contribuições de cada empresa.</p>
        </div>
        <Button asChild>
          <Link to="/boletos/novo">
            <PlusIcon size={18} />
            Emitir boleto
          </Link>
        </Button>
      </header>
      <div className={styles.period}>
        <label htmlFor="competence">Competência</label>
        <MonthPicker id="competence" value={month} onChange={setMonth} />
        <span>Valores por competência · dados de demonstração</span>
        <Button
          variant="ghost"
          onClick={refresh}
          disabled={isFetching || !month}
        >
          <ArrowsClockwiseIcon size={18} />
          {isFetching ? 'Atualizando…' : 'Atualizar'}
        </Button>
      </div>
      {error && <Feedback error message={error} retry={refresh} />}
      {isPending ? (
        <Loading />
      ) : (
        <>
          <dl className={styles.metrics}>
            <div>
              <dt>Contribuições recebidas</dt>
              <dd>{paidLabel}</dd>
              <span>{paidCount} empresas com pagamento</span>
            </div>
            <div>
              <dt>Valor em aberto</dt>
              <dd>{dueLabel}</dd>
              <span>Principal das cobranças pendentes</span>
            </div>
            <div>
              <dt>Discrepâncias a verificar</dt>
              <dd>{discrepancies}</dd>
              <span>Comparação com o último mês pago</span>
            </div>
          </dl>
          <div className={styles.tableSection}>
            <div className={styles.tableHeading}>
              <h2>
                Contribuições por empresa <span>{totalCompanies}</span>
              </h2>
              <p>Pesquise o CNPJ raiz para acompanhar matriz e filiais.</p>
            </div>
            <form className={styles.filters} onSubmit={(event) => { event.preventDefault(); searchRows(); }}>
              <label className={styles.search}>
                <span className="sr-only">
                  Pesquisar por CNPJ, empresa ou cidade
                </span>
                <MagnifyingGlassIcon size={19} />
                <input
                  placeholder="CNPJ raiz, empresa ou cidade"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              <label>
                <span className="sr-only">Filtrar situação</span>
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                >
                  <option value="all">Todas as situações</option>
                  <option value="paid">Pagas</option>
                  <option value="overdue">Em atraso</option>
                  <option value="open">Em aberto</option>
                  <option value="discrepancy">Com discrepância</option>
                  <option value="missing">Sem cobrança</option>
                </select>
              </label>
              <Button type="submit" disabled={isFetching}>
                {isFetching ? 'Buscando…' : 'Buscar'}
              </Button>
              {hasFilter && (
                <Button variant="ghost" onClick={clearFilters}>
                  Limpar
                </Button>
              )}
            </form>
            <div className={styles.tableScroll}>
              <table>
                <caption className="sr-only">
                  Contribuições por empresa na competência selecionada
                </caption>
                <thead>
                  <tr>
                    <th>Empresa / CNPJ</th>
                    <th>Recebido</th>
                    <th>Em aberto</th>
                    <th>Trabalhadores estimados</th>
                    <th>Situação</th>
                    <th>
                      <span className="sr-only">Ação</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.company.id} data-discrepancy={row.discrepancy}>
                      <td>
                        <Link
                          className={styles.company}
                          to={`/empresas/${row.company.id}?competencia=${month}`}
                        >
                          {row.company.name}
                        </Link>
                        <span className={styles.secondary}>
                          CNPJ raiz {row.rootCnpj}
                        </span>
                        <span className={styles.location}>
                          {row.establishments} CNPJs vinculados
                        </span>
                      </td>
                      <td
                        className={styles.amount}
                        data-paid={row.paidCents > 0}
                      >
                        {row.paidLabel}
                      </td>
                      <td
                        className={styles.amount}
                        data-overdue={row.status === 'overdue'}
                      >
                        {row.dueLabel}
                      </td>
                      <td>
                        <div
                          className={styles.estimate}
                          data-alert={row.discrepancy}
                        >
                          {row.discrepancy && (
                            <WarningCircleIcon size={17} weight="fill" />
                          )}
                          {row.estimateLabel}
                        </div>
                        <span className={styles.secondary}>
                          {row.previousLabel}
                        </span>
                        {row.discrepancy && (
                          <span className={styles.alertLabel}>
                            Discrepância a verificar
                          </span>
                        )}
                      </td>
                      <td>
                        <StatusTag state={row.status}>{row.statusLabel}</StatusTag>
                      </td>
                      <td>
                        <Link
                          className={`${styles.openLink} focus-ring`}
                          to={`/empresas/${row.company.id}?competencia=${month}`}
                          aria-label={`Ver ${row.company.name}, CNPJ ${row.company.cnpj}`}
                        >
                          <ArrowUpRightIcon size={19} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length === 0 && (
              <div className={styles.empty}>
                <h3>Nenhuma contribuição encontrada</h3>
                <p>Ajuste a competência ou os filtros para continuar.</p>
                {hasFilter && (
                  <Button variant="outline" onClick={clearFilters}>
                    Limpar filtros
                  </Button>
                )}
              </div>
            )}
            <footer className={styles.tableFooter}>
              {rows.length} de {totalCompanies} empresas{' '}
              <span>
                Estimativas são indícios para análise, não comprovação de
                irregularidade.
              </span>
            </footer>
          </div>
        </>
      )}
    </section>
  );
}
