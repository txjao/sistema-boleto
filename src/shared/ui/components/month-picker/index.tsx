import { useEffect, useId, useRef, useState } from 'react';
import { CalendarBlankIcon, CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react';
import styles from './styles/month-picker.module.css';

const months = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

export function MonthPicker({
  value,
  onChange,
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  id?: string;
}) {
  const generatedId = useId();
  const panelId = `${generatedId}-panel`;
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(Number(value.slice(0, 4)) || 2026);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function close(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);
  const selectedMonth = Number(value.slice(5, 7));
  const label = value
    ? new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
        new Date(`${value}-01T12:00:00Z`),
      )
    : 'Selecionar competência';
  return (
    <div className={styles.root} ref={root}>
      <button
        id={id}
        type="button"
        className={styles.trigger}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{label}</span>
        <CalendarBlankIcon size={18} aria-hidden="true" />
      </button>
      {open && (
        <div id={panelId} className={styles.panel} role="dialog" aria-label="Selecionar competência">
          <div className={styles.year}>
            <button type="button" onClick={() => setYear((current) => current - 1)} aria-label="Ano anterior">
              <CaretLeftIcon size={17} />
            </button>
            <strong>{year}</strong>
            <button type="button" onClick={() => setYear((current) => current + 1)} aria-label="Próximo ano">
              <CaretRightIcon size={17} />
            </button>
          </div>
          <div className={styles.months}>
            {months.map((month, index) => {
              const number = index + 1;
              const selected = year === Number(value.slice(0, 4)) && number === selectedMonth;
              return (
                <button
                  key={month}
                  type="button"
                  data-selected={selected}
                  aria-pressed={selected}
                  onClick={() => {
                    onChange(`${year}-${String(number).padStart(2, '0')}`);
                    setOpen(false);
                  }}
                >
                  {month}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            className={styles.current}
            onClick={() => {
              onChange('2026-09');
              setYear(2026);
              setOpen(false);
            }}
          >
            Competência atual
          </button>
        </div>
      )}
    </div>
  );
}
