import * as Popover from '@radix-ui/react-popover';
import { WrenchIcon, XIcon } from '@phosphor-icons/react';
import type { useScenariosPanelModel } from './scenarios-panel.model';
import type { Operation, Mode } from '@/devtools/application/scenarios.store';
import { Button } from '@/shared/ui/components/button';
import styles from './styles/scenarios-panel.module.css';
export function ScenariosPanelView(
  props: ReturnType<typeof useScenariosPanelModel>,
) {
  const {
    open,
    setOpen,
    operations,
    modes,
    operation,
    mode,
    changeOperation,
    setMode,
    arm,
    cancel,
    resetDemo,
    armedLabel,
    hasArmed,
    logs,
  } = props;
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          className={`${styles.launcher} focus-ring`}
          aria-label="Ferramentas de desenvolvimento"
        >
          <WrenchIcon size={21} />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className={styles.panel}
          side="top"
          align="start"
          sideOffset={12}
          collisionPadding={16}
          aria-label="Cenários de API"
        >
          <header className={styles.header}>
            <div>
              <h2>Cenários de API</h2>
              <p>Ferramenta da demonstração</p>
            </div>
            <Popover.Close asChild>
              <Button variant="ghost" aria-label="Fechar ferramentas">
                <XIcon size={18} />
              </Button>
            </Popover.Close>
          </header>
          <div className={styles.fields}>
            <label>
              Operação
              <select
                value={operation}
                onChange={(event) =>
                  changeOperation(event.target.value as Operation)
                }
              >
                {operations.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Próxima resposta
              <select
                value={mode}
                onChange={(event) => setMode(event.target.value as Mode)}
              >
                {modes.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <Button onClick={arm} className="w-full">
            Programar próxima operação
          </Button>
          <p className={styles.hint}>
            Execute a ação correspondente na aplicação. A simulação será
            consumida uma única vez. Para acompanhamento, use “Atualizar”.
          </p>
          <div className={styles.armed} role="status">
            <p>{armedLabel}</p>
            {hasArmed && (
              <Button variant="ghost" onClick={cancel}>
                Cancelar cenário
              </Button>
            )}
          </div>
          <h3 className="font-semibold text-sm mt-5 mb-3">
            Operações recentes
          </h3>
          {logs.length === 0 ? (
            <p className={styles.hint}>Nenhuma operação registrada.</p>
          ) : (
            <ol className={styles.logs}>
              {logs.map((log) => (
                <li key={log.id}>
                  <div>
                    {log.label}
                    <small>{log.durationLabel}</small>
                  </div>
                  <span data-state={log.status}>{log.statusLabel}</span>
                </li>
              ))}
            </ol>
          )}
          <div className={styles.reset}>
            <div>
              <h3>Dados locais</h3>
              <p>Restaura empresas, boletos, usuários e convenções.</p>
            </div>
            <Button variant="outline" onClick={resetDemo}>
              Restaurar demo
            </Button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
