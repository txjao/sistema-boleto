import { Button } from '@/shared/ui/components/button';
import styles from './styles/feedback.module.css';
export function Feedback({
  message,
  error = false,
  retry,
}: {
  message: string;
  error?: boolean;
  retry?: () => void;
}) {
  return (
    <div
      className={styles.feedback}
      data-error={error}
      role={error ? 'alert' : 'status'}
    >
      <p>{message}</p>
      {retry && (
        <Button variant="outline" onClick={retry}>
          Tentar novamente
        </Button>
      )}
    </div>
  );
}
export function Loading() {
  return (
    <div className={styles.loading} role="status" aria-label="Carregando dados">
      <span className="sr-only">Carregando dados…</span>
      {[1, 2, 3, 4].map((line) => (
        <div key={line} />
      ))}
    </div>
  );
}
