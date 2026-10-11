import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

export type ToolName = 'search_incidents' | 'get_incident' | 'group_incidents';
export type ToolUsage = {
  event: 'mcp_tool_usage';
  tool: ToolName;
  status: 'success' | 'no_matches' | 'error';
  duration_ms: number;
  results_returned: number;
  timestamp: string;
};
export type UsageSink = (event: ToolUsage) => void;

// This observer never receives arguments, client metadata, or request headers.
// Only explicit scalar fields are passed to the hosted logger.
export function createToolObserver(sink?: UsageSink) {
  return async function observe<T extends CallToolResult>(
    tool: ToolName,
    run: () => Promise<T>,
  ): Promise<T> {
    if (!sink) return run();
    const started = performance.now();
    let status: ToolUsage['status'] = 'error';
    let count = 0;
    try {
      const response = await run();
      if (!response.isError) {
        const data = response.structuredContent;
        status = 'success';
        if (tool === 'search_incidents') {
          count = (Array.isArray(data?.incidents) ? data.incidents.length : 0)
            + (Array.isArray(data?.nearby) ? data.nearby.length : 0);
          if (data?.total === 0 && !data?.nearby_total) status = 'no_matches';
        } else if (tool === 'group_incidents') {
          count = Array.isArray(data?.groups) ? data.groups.length : 0;
          if (data?.total_groups === 0) status = 'no_matches';
        } else {
          count = data?.incident ? 1 : 0;
        }
      }
      return response;
    } finally {
      try {
        sink({
          event: 'mcp_tool_usage', tool, status,
          duration_ms: Math.max(0, Math.round(performance.now() - started)),
          results_returned: count,
          timestamp: new Date().toISOString(),
        });
      } catch {
        // Analytics must never change tool behavior or expose exception text.
      }
    }
  };
}
