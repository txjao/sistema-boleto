import * as Dialog from '@radix-ui/react-dialog';
import { Link } from 'react-router';
import { PlusIcon, XIcon, ArrowLeftIcon, PencilSimpleIcon, ReceiptIcon, BuildingsIcon, WarningCircleIcon } from '@phosphor-icons/react';
import { Button } from '@/shared/ui/components/button';
import { Feedback, Loading } from '@/shared/ui/components/feedback';
import { StatusTag } from '@/shared/ui/components/status-tag';
import { maskCnpj, maskPhone } from '@/shared/ui/utils';
import type { Company } from '@/server';
import type { useCatalogModel } from './catalog.model';
import styles from './styles/catalog.module.css';

type FinancialOverview = {
  competence: string;
  received: string;
  debt: string;
  openCount: number;
  overdueCount: number;
  fines: string;
  status: string;
  statusKey: 'paid' | 'open' | 'overdue';
};
type Discrepancy = {
  current: string;
  previous: string;
  reduction: string;
  percentage: string;
};

function AuditOverview({
  company,
  overview,
  discrepancy,
  root,
}: {
  company: Company;
  overview: FinancialOverview;
  discrepancy: Discrepancy | null;
  root: boolean;
}) {
  return (
    <section className={styles.overview}>
      <div className={styles.entityData}>
        {!root && <BuildingsIcon size={24} />}
        <div>
          <h2>{root ? 'Dados do CNPJ raiz' : 'Dados do estabelecimento'}</h2>
          <dl className={styles.companyData}>
            <div><dt>Razão social</dt><dd>{company.name}</dd></div>
            <div><dt>CNPJ</dt><dd>{company.cnpj}</dd></div>
            <div><dt>Trabalhadores cadastrados</dt><dd>{company.workers.toLocaleString('pt-BR')}</dd></div>
            <div><dt>Contato</dt><dd>{company.phone}<br />{company.email}</dd></div>
            <div><dt>Endereço</dt><dd>{company.address}<br />{company.city}</dd></div>
          </dl>
        </div>
      </div>
      <div className={styles.overviewDivider} />
      <div className={styles.overviewHeading}>
        <div>
          <h2>{root ? 'Visão financeira consolidada' : 'Visão financeira do estabelecimento'}</h2>
          <p>{root ? 'Matriz e filiais' : `Auditoria do CNPJ ${company.cnpj}`} na competência {overview.competence}.</p>
        </div>
        <StatusTag state={overview.statusKey}>{overview.status}</StatusTag>
      </div>
      {discrepancy && (
        <div className={styles.discrepancyPanel}>
          <WarningCircleIcon size={24} weight="fill" />
          <div>
            <strong>Discrepância na estimativa de trabalhadores</strong>
            <p>A contribuição indica uma redução que precisa ser analisada, não uma irregularidade confirmada.</p>
          </div>
          <dl>
            <div><dt>Estimativa atual</dt><dd>{discrepancy.current}</dd></div>
            <div><dt>Último mês pago</dt><dd>{discrepancy.previous}</dd></div>
            <div><dt>Redução estimada</dt><dd>{discrepancy.reduction} ({discrepancy.percentage})</dd></div>
          </dl>
        </div>
      )}
      <dl className={styles.detailMetrics}>
        <div><dt>Recebido na competência</dt><dd>{overview.received}</dd></div>
        <div><dt>Débito total em aberto</dt><dd>{overview.debt}</dd></div>
        <div><dt>Boletos em aberto</dt><dd>{overview.openCount}</dd></div>
        <div><dt>Boletos em atraso</dt><dd>{overview.overdueCount}</dd></div>
        <div><dt>Multas registradas</dt><dd>{overview.fines}</dd></div>
      </dl>
      <p className={styles.overviewNote}>Os valores consideram apenas as cobranças visíveis para o perfil selecionado. Multas aparecem quando fazem parte da memória de cálculo do boleto.</p>
    </section>
  );
}
export function CatalogView(props: ReturnType<typeof useCatalogModel>) {
  const {
    kind,
    title,
    description,
    rows,
    selected,
    selectedRoot,
    selectedEstablishment,
    relatedCompanies,
    isEstablishmentDetail,
    companyOverview,
    recentBills,
    companyDiscrepancy,
    history,
    hasCompanyId,
    historyLoading,
    historyError,
    refreshHistory,
    columns,
    fields,
    search,
    setSearch,
    searchCatalog,
    allowed,
    canEdit,
    editing,
    setEditing,
    edit,
    register,
    errors,
    submit,
    isSaving,
    saveError,
    lookup,
    isLookingUp,
    lookupError,
    notice,
    lookupNotice,
    isPending,
    isFetching,
    error,
    refresh,
    actionLabel,
  } = props;
  if (!allowed)
    return (
      <Feedback
        error
        message="Seu perfil não tem acesso ao cadastro de usuários. Selecione Administradora para testar esta tela."
      />
    );
  function maskedField(name: string, mask: (value: string) => string) {
    const field = register(name);
    return (
      <input
        {...field}
        inputMode="numeric"
        aria-invalid={!!errors[name]}
        onChange={(event) => {
          event.target.value = mask(event.target.value);
          void field.onChange(event);
        }}
      />
    );
  }
  return (
    <section>
      {hasCompanyId && (
        <Link className={styles.back} to={isEstablishmentDetail ? `/empresas/${selectedRoot?.id}` : '/'}>
          <ArrowLeftIcon size={16} /> {isEstablishmentDetail ? 'CNPJs vinculados' : 'Voltar ao acompanhamento'}
        </Link>
      )}
      <header className={styles.heading}>
        <div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <div className={styles.headingActions}>
          {selected && (
            <Button asChild variant="outline">
              <Link to={`/boletos/novo?empresa=${selected.id}`}>
                <ReceiptIcon size={17} /> Emitir boleto
              </Link>
            </Button>
          )}
          {canEdit && (
            <Button onClick={() => edit(selected)}>
              {selected ? <PencilSimpleIcon size={17} /> : <PlusIcon size={17} />}
              {selected ? 'Editar empresa' : actionLabel}
            </Button>
          )}
        </div>
      </header>
      {notice && <Feedback message={notice} />}
      {error && <Feedback error message={error} retry={refresh} />}
      {kind === 'settings' && (
        <div className={styles.note}>
          <h2>Parâmetros da demonstração</h2>
          <p>
            O piso de R$ 1.694,00 vem do exemplo fornecido. Multa mensal:
            informe o percentual da convenção; em branco, a emissão mensal
            atrasada fica bloqueada. Nesta POC o vencimento original ocorre no
            próprio mês, entre os dias 1 e 28. A correção é informada
            manualmente na emissão.
          </p>
        </div>
      )}
      {kind === 'users' && (
        <div className={styles.note}>
          <p>
            Administradores gerenciam usuários. Diretores acompanham todas as
            cobranças e simulam pagamentos. Operadores visualizam os boletos que
            criaram. Os três perfis do topo são personas fixas para teste; os
            novos cadastros não criam autenticação.
          </p>
        </div>
      )}
      {!hasCompanyId && (
        <form className={styles.toolbar} onSubmit={(event) => { event.preventDefault(); searchCatalog(); }}>
          <label>
            <span className="sr-only">Pesquisar cadastro</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={kind === 'users' ? 'Pesquisar por nome' : kind === 'companies' ? 'Nome ou CNPJ raiz' : 'Pesquisar por ano'}
            />
          </label>
          <Button type="submit" disabled={isFetching}>
            {isFetching ? 'Buscando…' : 'Buscar'}
          </Button>
        </form>
      )}
      {isPending || (!hasCompanyId && isFetching) ? (
        <Loading />
      ) : !hasCompanyId ? (
        <div className={styles.tableWrap}>
          <table>
            <caption className="sr-only">{title}</caption>
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column}>{column}</th>
                ))}
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  {row.cells.map((cell, index) => (
                    <td key={index}>{cell}</td>
                  ))}
                  <td>
                    <div className="flex gap-2">
                      {row.companyPath && !hasCompanyId && (
                        <Button variant="ghost" asChild>
                          <Link to={row.companyPath}>Visualizar</Link>
                        </Button>
                      )}
                      {canEdit && kind !== 'companies' && (
                        <Button
                          variant="outline"
                          onClick={() => edit(row.record)}
                        >
                          Editar
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && (
            <p className={styles.empty}>
              Não encontramos resultados para esta busca. Revise o termo ou faça um novo cadastro.
            </p>
          )}
        </div>
      ) : null}
      {selectedRoot && !isEstablishmentDetail && (
        <div className={styles.details}>
          {companyOverview && (
            <AuditOverview company={selectedRoot} overview={companyOverview} discrepancy={companyDiscrepancy} root />
          )}
          <section>
            <div className={styles.sectionHeading}>
              <div><h2>CNPJs vinculados <span>{relatedCompanies.length}</span></h2><p>Selecione um estabelecimento para consultar seus dados e cobranças.</p></div>
            </div>
            <div className={styles.tableWrap}>
              <table>
                <thead><tr><th>CNPJ</th><th>Município</th><th>Trabalhadores</th><th>Contato</th><th>Ação</th></tr></thead>
                <tbody>
                  {relatedCompanies.map((company) => (
                    <tr key={company.id}>
                      <td><strong>{company.cnpj}</strong></td>
                      <td>{company.city}</td>
                      <td>{company.workers.toLocaleString('pt-BR')}</td>
                      <td>{company.email}</td>
                      <td><Button asChild variant="ghost"><Link to={company.path}>Visualizar</Link></Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section>
            <div className={styles.sectionHeading}>
              <div><h2>Cobranças recentes</h2><p>Últimos boletos da matriz e das filiais.</p></div>
              <Button asChild variant="ghost"><Link to="/boletos">Ver todos os boletos</Link></Button>
            </div>
            <div className={styles.tableWrap}>
              <table>
                <thead><tr><th>Estabelecimento</th><th>Competência</th><th>Vencimento</th><th>Valor</th><th>Situação</th></tr></thead>
                <tbody>
                  {recentBills.map((bill) => (
                    <tr key={bill.id}>
                      <td><strong>{bill.company}</strong><small>{bill.cnpj}</small></td>
                      <td>{bill.months}</td><td>{bill.due}</td><td>{bill.amount}</td>
                      <td><StatusTag state={bill.statusKey}>{bill.status}</StatusTag></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {recentBills.length === 0 && <p className={styles.empty}>Ainda não há cobranças visíveis para esta empresa.</p>}
            </div>
          </section>
        </div>
      )}
      {selectedEstablishment && (
        <div className={styles.details}>
          {companyOverview && <AuditOverview company={selectedEstablishment} overview={companyOverview} discrepancy={companyDiscrepancy} root={false} />}
          <section>
            <div className={styles.sectionHeading}>
              <div><h2>Histórico de cobranças</h2><p>Boletos emitidos exclusivamente para este CNPJ.</p></div>
              <Button asChild variant="ghost"><Link to={`/boletos?empresa=${selectedEstablishment.id}`}>Ver todos os boletos</Link></Button>
            </div>
            {historyError && (
              <Feedback error message={historyError} retry={refreshHistory} />
            )}
            {historyLoading ? (
              <Loading />
            ) : (
              <div className={styles.tableWrap}>
                <table>
                  <thead>
                    <tr>
                      <th>Competência</th>
                      <th>Valor do boleto</th>
                      <th>Vencimento</th>
                      <th>Situação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((bill) => (
                      <tr key={bill.id}>
                        <td>{bill.months}</td>
                        <td>{bill.amount}</td>
                        <td>{bill.due}</td>
                        <td><StatusTag state={bill.statusKey}>{bill.status}</StatusTag></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {history.length === 0 && (
                  <p className={styles.empty}>
                    Nenhuma cobrança visível para este perfil.
                  </p>
                )}
              </div>
            )}
          </section>
        </div>
      )}
      <Dialog.Root
        open={editing}
        onOpenChange={(open) => {
          if (!isSaving) setEditing(open);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className={styles.overlay} />
          <Dialog.Content className={styles.dialog}>
            <header className={styles.dialogHeader}>
              <div>
                <Dialog.Title className="text-xl font-bold">
                  {title === 'Configurações'
                    ? 'Convenção anual'
                    : kind === 'users'
                      ? 'Cadastro de usuário'
                      : 'Cadastro de empresa'}
                </Dialog.Title>
                <Dialog.Description className="text-sm text-muted-foreground mt-1">
                  Preencha os campos para salvar os dados da demo.
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <Button
                  disabled={isSaving}
                  variant="ghost"
                  aria-label="Fechar cadastro"
                >
                  <XIcon size={20} />
                </Button>
              </Dialog.Close>
            </header>
            <form onSubmit={submit} noValidate>
              {kind === 'companies' ? (
                <div className={styles.companyFields}>
                  <label className={styles.cnpjField}>
                    <span>CNPJ</span>
                    <div className={styles.lookupRow}>
                      {maskedField('cnpj', maskCnpj)}
                      <Button type="button" variant="outline" onClick={lookup} disabled={isLookingUp || isSaving}>
                        {isLookingUp ? 'Consultando…' : 'Consultar CNPJ'}
                      </Button>
                    </div>
                    {errors.cnpj && <span className={styles.fieldError}>{errors.cnpj.message}</span>}
                  </label>
                  <label className={styles.nameField}><span>Razão social</span><input {...register('name')} />{errors.name && <span className={styles.fieldError}>{errors.name.message}</span>}</label>
                  <label><span>Número de trabalhadores</span><input type="text" inputMode="numeric" {...register('workers')} />{errors.workers && <span className={styles.fieldError}>{errors.workers.message}</span>}</label>
                  <label><span>Cidade</span><input {...register('city')} />{errors.city && <span className={styles.fieldError}>{errors.city.message}</span>}</label>
                  <label className={styles.addressField}><span>Endereço</span><input {...register('address')} />{errors.address && <span className={styles.fieldError}>{errors.address.message}</span>}</label>
                  <label><span>Telefone</span>{maskedField('phone', maskPhone)}{errors.phone && <span className={styles.fieldError}>{errors.phone.message}</span>}</label>
                  <label><span>E-mail</span><input type="email" {...register('email')} />{errors.email && <span className={styles.fieldError}>{errors.email.message}</span>}</label>
                </div>
              ) : (
                <div className={styles.fields}>
                  {fields.map((field) => (
                    <label key={field.key}>
                      <span>{field.label}{field.optional && <small> · opcional</small>}</span>
                      {field.options ? (
                        <select {...register(field.key)}>{field.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
                      ) : (
                        <input {...register(field.key)} type={field.type ?? 'text'} step={field.type === 'number' ? 'any' : undefined} aria-invalid={!!errors[field.key]} />
                      )}
                      {errors[field.key] && <span className={styles.fieldError}>{errors[field.key]?.message}</span>}
                    </label>
                  ))}
                </div>
              )}
              {lookupNotice && <Feedback message={lookupNotice} />}
              {lookupError && <Feedback error message={lookupError} />}
              {saveError && <Feedback error message={saveError} />}
              <footer className={styles.actions}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditing(false)}
                  disabled={isSaving}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSaving || isLookingUp}>
                  {isSaving ? 'Salvando…' : 'Salvar cadastro'}
                </Button>
              </footer>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}
