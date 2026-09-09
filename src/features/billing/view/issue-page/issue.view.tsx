import { Link } from 'react-router';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  CalculatorIcon,
} from '@phosphor-icons/react';
import { Button } from '@/shared/ui/components/button';
import { Feedback, Loading } from '@/shared/ui/components/feedback';
import type { useIssueModel } from './issue.model';
import styles from '@/features/billing/view/styles/billing.module.css';
export function IssueView(props: ReturnType<typeof useIssueModel>) {
  const {
    register,
    errors,
    months,
    selectedCompany,
    companySearch,
    searchCompany,
    fillWorkers,
    companyId,
    companies,
    busy,
    isPreviewing,
    isIssuing,
    isPending,
    preview,
    issue,
    error,
    refresh,
    canIssue,
    summary,
    success,
  } = props;
  if (success)
    return (
      <section>
        <div className={styles.success}>
          <CheckCircleIcon size={48} weight="duotone" />
          <h1>Boleto criado na demonstração</h1>
          <p>
            {success.id} · {success.total}
          </p>
          <p>Vencimento em {success.due}</p>
          <div className={styles.simulationNote}>
            Documento simulado, sem validade para pagamento.
          </div>
          <h2>Rastreabilidade</h2>
          <p>Confirmação da Caixa e envio de e-mail simulados.</p>
          <p>Destinatários: {success.recipients}</p>
          <Button asChild>
            <Link to="/boletos">Consultar boletos</Link>
          </Button>
        </div>
      </section>
    );
  return (
    <section>
      <Link to="/boletos" className={styles.back}>
        <ArrowLeftIcon size={16} /> Voltar aos boletos
      </Link>
      <header className={styles.heading}>
        <div>
          <h1>Emitir boleto</h1>
          <p>
            Informe as competências e confira os valores antes de confirmar.
          </p>
        </div>
      </header>
      {isPending ? (
        <Loading />
      ) : (
        <div className={styles.issueGrid}>
          <form onSubmit={preview} noValidate className={styles.form}>
            <fieldset disabled={busy}>
              <legend>Dados da contribuição</legend>
              <label>
                Empresa
                <input type="hidden" {...register('companyId')} />
                <input
                  type="search"
                  list="companies-list"
                  value={companySearch}
                  onChange={(event) => searchCompany(event.target.value)}
                  placeholder="Busque por nome ou CNPJ"
                  role="combobox"
                  aria-autocomplete="list"
                  aria-invalid={!!errors.companyId}
                />
                <datalist id="companies-list">
                  {companies.map((company) => (
                    <option key={company.id} value={`${company.name} · ${company.cnpj}`} />
                  ))}
                </datalist>
                {errors.companyId && (
                  <span className={styles.fieldError}>
                    {errors.companyId.message}
                  </span>
                )}
              </label>
              <label>
                Tipo de contribuição
                <input readOnly value="Contribuição negocial" />
              </label>
              <div className={styles.twoColumns}>
                <label>
                  Ano
                  <input {...register('year')} inputMode="numeric" />
                  {errors.year && (
                    <span className={styles.fieldError}>
                      {errors.year.message}
                    </span>
                  )}
                </label>
                <label>
                  Vencimento do novo boleto
                  <input
                    type="date"
                    min="2026-09-08"
                    {...register('dueDate')}
                  />
                  {errors.dueDate && (
                    <span className={styles.fieldError}>
                      {errors.dueDate.message}
                    </span>
                  )}
                </label>
              </div>
              <fieldset className={styles.months}>
                <legend>Competências</legend>
                <div>
                  {months.map((month) => (
                    <label key={month.value}>
                      <input
                        type="checkbox"
                        value={month.value}
                        {...register('months')}
                      />
                      {month.label}
                    </label>
                  ))}
                </div>
                {errors.months && (
                  <span className={styles.fieldError}>
                    {errors.months.message}
                  </span>
                )}
              </fieldset>
              <label>
                Número de trabalhadores
                <input
                  type="number"
                  min="1"
                  max="1000000"
                  {...register('workers')}
                />
                {errors.workers && (
                  <span className={styles.fieldError}>
                    {errors.workers.message}
                  </span>
                )}
              </label>
              {selectedCompany && (
                <Button type="button" variant="ghost" onClick={fillWorkers}>
                  Usar quantidade do cadastro ({selectedCompany.workers})
                </Button>
              )}
              <h2>Ajustes da cobrança</h2>
              <label>
                Valor principal informado pela empresa (R$)
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Opcional: mantém o cálculo automático"
                  {...register('override')}
                />
                {errors.override && (
                  <span className={styles.fieldError}>
                    {errors.override.message}
                  </span>
                )}
                <small>
                  Quando preenchido, substitui o principal total das
                  competências selecionadas.
                </small>
              </label>
              <div className={styles.twoColumns}>
                <label>
                  Desconto (R$)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    {...register('discount')}
                  />
                  {errors.discount && (
                    <span className={styles.fieldError}>
                      {errors.discount.message}
                    </span>
                  )}
                </label>
                <label>
                  Correção informada (R$)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    {...register('correction')}
                  />
                  {errors.correction && (
                    <span className={styles.fieldError}>
                      {errors.correction.message}
                    </span>
                  )}
                </label>
              </div>
              <p className={styles.helper}>
                A fórmula de correção da convenção ainda precisa ser definida.
                Nesta demo, informe o valor manualmente.
              </p>
              <Button type="submit" disabled={busy}>
                <CalculatorIcon size={18} />
                {isPreviewing ? 'Calculando…' : 'Calcular prévia'}
              </Button>
            </fieldset>
          </form>
          <aside className={styles.summary}>
            <h2>Resumo da cobrança</h2>
            {error && (
              <Feedback error message={error} retry={isPending ? refresh : undefined} />
            )}
            {summary ? (
              <>
                <dl>
                  <div>
                    <dt>Principal{summary.overridden ? ' informado' : ''}</dt>
                    <dd>{summary.base}</dd>
                  </div>
                  <div>
                    <dt>Multa limitada ao débito</dt>
                    <dd>{summary.fine}</dd>
                  </div>
                  <div>
                    <dt>Correção</dt>
                    <dd>{summary.correction}</dd>
                  </div>
                  <div>
                    <dt>Desconto</dt>
                    <dd>− {summary.discount}</dd>
                  </div>
                  <div className={styles.total}>
                    <dt>Total do boleto</dt>
                    <dd>{summary.total}</dd>
                  </div>
                </dl>
                <p className={styles.helper}>
                  Estimativa mensal pelo principal: {summary.estimate}{' '}
                  trabalhadores.
                </p>
                <details>
                  <summary>Memória de cálculo</summary>
                  <p className={styles.helper}>
                    Principal mensal: 1% do piso salarial × trabalhadores. Para várias competências atrasadas, a multa é 20% do piso × trabalhadores, limitada ao principal vencido.
                  </p>
                  {summary.lines.map((line) => (
                    <p key={line.month} className={styles.calculationLine}>
                      {line.month} · {line.amount} ·{' '}
                      {line.overdue ? 'Atrasada' : 'No prazo'}
                    </p>
                  ))}
                </details>
                <Button
                  className="w-full mt-6"
                  onClick={issue}
                  disabled={!canIssue}
                >
                  {isIssuing ? 'Emitindo…' : 'Confirmar emissão simulada'}
                </Button>
              </>
            ) : (
              <div className={styles.summaryEmpty}>
                <CalculatorIcon size={32} />
                <p>Preencha os dados e calcule a prévia.</p>
                <small>
                  Ao alterar os campos, uma nova prévia será necessária.
                </small>
              </div>
            )}
            <p className={styles.simulationNote}>
              Emissão e notificações simuladas. Nenhum boleto bancário será
              gerado.
            </p>
          </aside>
        </div>
      )}
    </section>
  );
}
