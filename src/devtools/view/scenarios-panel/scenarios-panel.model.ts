import { useState } from 'react';
import { useStore } from 'zustand';
import {
  scenariosStore,
  type Operation,
  type Mode,
} from '@/devtools/application/scenarios.store';
import { listOperations } from '@/devtools/infrastructure/scenarios.gateway';
const labels: Record<Operation, string> = {
  monitor: 'Carregar acompanhamento',
  listCompanies: 'Listar empresas',
  saveCompany: 'Salvar empresa',
  lookupCompany: 'Consultar CNPJ',
  listBills: 'Listar boletos',
  quote: 'Calcular boleto',
  issue: 'Emitir boleto',
  pay: 'Simular pagamento',
  listUsers: 'Listar usuários',
  saveUser: 'Salvar usuário',
  conventions: 'Carregar convenção',
  saveConvention: 'Salvar convenção',
};
export function useScenariosPanelModel({
  resetDemo,
}: {
  resetDemo: () => void;
}) {
  const state = useStore(scenariosStore);
  const [open, setOpen] = useState(false);
  const [operation, setOperation] = useState<Operation>('monitor');
  const [mode, setMode] = useState<Mode>('error');
  const statusLabels = {
    pending: 'Carregando',
    success: 'Sucesso',
    error: 'Erro',
  };
  const modeLabels = {
    normal: 'Normal · 450 ms',
    slow: 'Lenta · 3 segundos',
    error: 'Falhar uma vez',
    empty: 'Lista vazia',
  };
  function changeOperation(value: Operation) {
    setOperation(value);
    if (!listOperations.includes(value) && mode === 'empty') setMode('normal');
  }
  return {
    open,
    setOpen,
    operation,
    mode,
    setMode,
    changeOperation,
    resetDemo,
    operations: Object.entries(labels),
    modes: Object.entries(modeLabels).filter(
      ([key]) => key !== 'empty' || listOperations.includes(operation),
    ),
    arm: () => state.arm({ operation, mode }),
    cancel: state.cancel,
    hasArmed: state.armed !== null,
    armedLabel: state.armed
      ? `${labels[state.armed.operation]}: ${modeLabels[state.armed.mode]}`
      : 'Nenhum cenário programado.',
    logs: state.logs.map((log) => ({
      ...log,
      label: labels[log.operation],
      statusLabel: statusLabels[log.status],
      durationLabel:
        log.duration === undefined ? 'Em andamento' : `${log.duration} ms`,
    })),
  };
}
