import { useServices } from '@/app/providers/services-provider';
import { useSessionStore, demoProfiles } from '@/app/state/session.store';
import { useBillsModel } from './bills.model';
import { BillsView } from './bills.view';
export function BillsPage() {
  const services = useServices();
  const actorId = useSessionStore((state) => state.actorId);
  const role = demoProfiles.find((item) => item.id === actorId)!.role;
  const model = useBillsModel({ services, actorId, role });
  return <BillsView {...model} />;
}
