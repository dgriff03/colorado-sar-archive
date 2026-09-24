'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { initialExplorer, type ExplorerState } from '@/lib/explorer';
import { createExplorerNavigation } from '@/lib/navigation';
export function useExplorer() {
  const [state, setState] = useState<ExplorerState>(initialExplorer),
    [ready, setReady] = useState(false);
  const controller = useRef<ReturnType<typeof createExplorerNavigation> | null>(
    null,
  );
  useEffect(() => {
    const navigation = createExplorerNavigation(
      {
        url: () => location.pathname + location.search,
        historyState: () => history.state,
        write: (url, mode, overlay) => {
          const value = { ...history.state, sarOverlay: overlay };
          if (mode === 'push') history.pushState(value, '', url);
          else history.replaceState(value, '', url);
        },
        back: () => history.back(),
        notify: () => window.dispatchEvent(new Event('sar:navigation')),
      },
      (next) => {
        setState(next);
        setReady(true);
      },
    );
    controller.current = navigation;
    navigation.sync();
    window.addEventListener('popstate', navigation.sync);
    return () => {
      window.removeEventListener('popstate', navigation.sync);
      controller.current = null;
    };
  }, []);
  const navigate = useCallback(
    (patch: Partial<ExplorerState>, mode: 'push' | 'replace' = 'push') =>
      controller.current?.navigate(patch, mode),
    [],
  );
  const openIncident = useCallback(
    (id: string) => controller.current?.openIncident(id),
    [],
  );
  const closeIncident = useCallback(
    () => controller.current?.closeIncident(),
    [],
  );
  return { state, ready, navigate, openIncident, closeIncident };
}
