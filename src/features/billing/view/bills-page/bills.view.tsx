import { Link } from 'react-router';
import { Button } from '@/shared/ui/components/button';
import { Feedback, Loading } from '@/shared/ui/components/feedback';
import { StatusTag } from '@/shared/ui/components/status-tag';
import type { useBillsModel } from './bills.model';
import styles from '@/features/billing/view/styles/billing.module.css';
export function BillsView(props: ReturnType<typeof useBillsModel>) {
  const {
    rows,
    search,
    setSearch,
    status,
    setStatus,
    notice,
    canPay,
    pay,
    isPaying,
    error,
    isPending,
    isFetching,
    searchBills,
    refresh,
  } = props;
  return (
    <section>
      <header className={styles.heading}>
        <div>
          <h1>Boletos</h1>
          <p>Consulte emissões, competências e confirmações de pagamento.</p>
        </div>
        <Button asChild>
          <Link to="/boletos/novo">Emitir boleto</Link>
        </Button>
      </header>
      {notice && <Feedback message={notice} />}
      {error && <Feedback error message={error} retry={refresh} />}
      <form className={styles.toolbar} onSubmit={(event) => { event.preventDefault(); searchBills(); }}>
        <label>
          <span className="sr-only">Pesquisar boletos</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Empresa, CNPJ ou identificação"
          />
        </label>
        <label>
          <span className="sr-only">Situação do boleto</span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="all">Todas as situações</option>
            <option value="paid">Pagos</option>
            <option value="open">Em aberto / atraso</option>
          </select>
        </label>
        <Button type="submit" disabled={isFetching}>
          {isFetching ? 'Buscando…' : 'Buscar'}
        </Button>
      </form>
      {isPending || isFetching ? (
        <Loading />
      ) : (
        <div className={styles.tableWrap}>
          <table>
            <thead>
              <tr>
                <th>Empresa / boleto</th>
                <th>Competência</th>
                <th>Vencimento</th>
                <th>Valor</th>
                <th>Situação</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((bill) => (
                <tr key={bill.id}>
                  <td>
                    <strong>{bill.name}</strong>
                    <small>
                      {bill.id} · {bill.cnpj}
                    </small>
                    <details>
                      <summary>Registro da emissão</summary>
                      <p>{bill.notificationsLabel}</p>
                      <p>Guarda quem recebeu a notificação e os eventos simulados do boleto.</p>
                    </details>
                  </td>
                  <td>{bill.monthsLabel}</td>
                  <td>{bill.dueLabel}</td>
                  <td>{bill.amountLabel}</td>
                  <td><StatusTag state={bill.statusKey}>{bill.statusLabel}</StatusTag></td>
                  <td>
                    {canPay && bill.status === 'open' ? (
                      <Button
                        variant="outline"
                        onClick={() => pay(bill.id)}
                        disabled={isPaying}
                      >
                        {isPaying ? 'Processando…' : 'Simular pagamento'}
                      </Button>
                    ) : (
                      <span className="text-muted-foreground">
                        {bill.status === 'paid'
                          ? 'Confirmado'
                          : 'Somente consulta'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && (
            <p className={styles.empty}>
              Nenhum boleto encontrado. Ajuste os filtros ou emita uma nova
              cobrança.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
