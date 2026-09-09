import { useAppShellModel } from './app-shell.model';
import { AppShellView } from './app-shell.view';
export function AppShell() {
  const model = useAppShellModel();
  return <AppShellView {...model} />;
}
