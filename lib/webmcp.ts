import { defaults, MAX_QUERY_LENGTH, type Filters } from './search.ts';
import type { Incident } from './types';
type Context = {
  registerTool: (
    tool: {
      name: string;
      title: string;
      description: string;
      inputSchema: object;
      annotations: object;
      execute: (input: unknown) => unknown;
    },
    options: { signal: AbortSignal },
  ) => void | Promise<void>;
};
export function registerArchiveTool(
  context: Context | undefined,
  search: (f: Filters) => Incident[],
  apply: (f: Filters) => void,
) {
  if (!context?.registerTool) return;
  const controller = new AbortController();
  try {
    void Promise.resolve(
      context.registerTool(
        {
          name: 'search_sar_archive',
          title: 'Search Colorado SAR incidents',
          description:
            'Search the public archive by incident titles/notes and location. Updates the visible search and returns the first 20 matches.',
          inputSchema: {
            type: 'object',
            properties: {
              title: { type: 'string', maxLength: MAX_QUERY_LENGTH },
              location: { type: 'string', maxLength: 300 },
            },
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: true },
          execute(input) {
            if (!input || typeof input !== 'object' || Array.isArray(input))
              throw new Error('Expected a search object');
            const params = input as Record<string, unknown>;
            if (
              Object.keys(params).some(
                (k) => !['title', 'location'].includes(k),
              ) ||
              Object.values(params).some((v) => typeof v !== 'string')
            )
              throw new Error('Only string title and location are supported');
            if (
              ((params.title as string) || '').length > MAX_QUERY_LENGTH ||
              ((params.location as string) || '').length > 300
            )
              throw new Error('Search input too long');
            const filters = {
              ...defaults,
              q: (params.title as string) || '',
              location: (params.location as string) || '',
              sort: params.title ? 'relevance' : 'newest',
            };
            const result = search(filters);
            apply(filters);
            return {
              count: result.length,
              incidents: result
                .slice(0, 20)
                .map(({ id, date, summary, location }) => ({
                  id,
                  date,
                  summary,
                  location,
                })),
            };
          },
        },
        { signal: controller.signal },
      ),
    ).catch(() => {});
  } catch {
    /* Optional browser capability. */
  }
  return () => controller.abort();
}
