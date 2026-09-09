import type { ReactNode } from 'react';
import {
  CheckCircleIcon,
  ClockIcon,
  MinusCircleIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react';
import styles from './styles/status-tag.module.css';

export type StatusTagState = 'paid' | 'overdue' | 'open' | 'missing';

const icons = {
  paid: CheckCircleIcon,
  overdue: WarningCircleIcon,
  open: ClockIcon,
  missing: MinusCircleIcon,
};

export function StatusTag({ state, children }: { state: StatusTagState; children: ReactNode }) {
  const Icon = icons[state];
  return (
    <span className={styles.tag} data-state={state}>
      <Icon size={14} weight={state === 'paid' || state === 'overdue' ? 'fill' : 'regular'} />
      {children}
    </span>
  );
}
