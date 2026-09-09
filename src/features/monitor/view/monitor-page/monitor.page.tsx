import { useServices } from '@/app/providers/services-provider';
import { useSessionStore } from '@/app/state/session.store';
import { useMonitorModel } from './monitor.model';
import { MonitorView } from './monitor.view';
export function MonitorPage() {
  const services = useServices();
  const actorId = useSessionStore((state) => state.actorId);
  const model = useMonitorModel({ services, actorId });
  return <MonitorView {...model} />;
}
