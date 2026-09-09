import { useScenariosPanelModel } from './scenarios-panel.model';
import { ScenariosPanelView } from './scenarios-panel.view';
export function DevTools() {
  function resetDemo() {
    window.localStorage.removeItem('siticop:demo:v1');
    window.location.reload();
  }
  const model = useScenariosPanelModel({ resetDemo });
  return <ScenariosPanelView {...model} />;
}
