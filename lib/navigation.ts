import { explorerUrl, readExplorer, type ExplorerState } from './explorer.ts';
export type NavigationPort = {
  url: () => string;
  historyState: () => Record<string, unknown> | null;
  write: (url: string, mode: 'push' | 'replace', overlay: boolean) => void;
  back: () => void;
  notify: () => void;
};
export function createExplorerNavigation(
  port: NavigationPort,
  onChange: (state: ExplorerState) => void,
) {
  let current = readExplorer(
    new URL(port.url(), 'https://archive.example').search,
  );
  function sync() {
    current = readExplorer(
      new URL(port.url(), 'https://archive.example').search,
    );
    onChange(current);
  }
  function navigate(
    patch: Partial<ExplorerState>,
    mode: 'push' | 'replace' = 'push',
    overlay = false,
  ) {
    const next = { ...current, ...patch };
    const url = explorerUrl(next);
    if (url !== port.url()) port.write(url, mode, overlay);
    current = next;
    onChange(next);
    port.notify();
  }
  return {
    sync,
    navigate,
    resolveIncident: (id: string) => navigate({ selected: id }, 'replace', !!port.historyState()?.sarOverlay),
    openIncident: (id: string) => navigate({ selected: id }, 'push', true),
    closeIncident: () => {
      if (port.historyState()?.sarOverlay) port.back();
      else navigate({ selected: null }, 'replace');
    },
  };
}
