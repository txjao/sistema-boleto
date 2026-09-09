import { useParams, useSearchParams } from 'react-router';
import { useServices } from '@/app/providers/services-provider';
import { useSessionStore, demoProfiles } from '@/app/state/session.store';
import { useCatalogModel, type CatalogKind } from './catalog.model';
import { CatalogView } from './catalog.view';
export function CatalogPage({ kind }: { kind: CatalogKind }) {
  const services = useServices();
  const actorId = useSessionStore((state) => state.actorId);
  const role = demoProfiles.find((item) => item.id === actorId)!.role;
  const { companyId, establishmentId } = useParams();
  const [params] = useSearchParams();
  const model = useCatalogModel({
    services,
    actorId,
    role,
    kind,
    companyId,
    establishmentId,
    competence: params.get('competencia') ?? '2026-08',
  });
  return <CatalogView {...model} />;
}
