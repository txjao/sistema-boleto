import { useSearchParams } from 'react-router';
import { useServices } from '@/app/providers/services-provider';
import { useSessionStore } from '@/app/state/session.store';
import { useIssueModel } from './issue.model';
import { IssueView } from './issue.view';
export function IssuePage() {
  const services = useServices();
  const actorId = useSessionStore((state) => state.actorId);
  const [params] = useSearchParams();
  const model = useIssueModel({
    services,
    actorId,
    initialCompany: params.get('empresa') ?? '',
  });
  return <IssueView {...model} />;
}
