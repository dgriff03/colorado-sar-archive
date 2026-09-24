export const detailLabels: Record<string, string> = {
  ONE_LINER: 'One-line report',
  BASIC_FACTS: 'Basic facts',
  HOW_MINIMAL_SOURCING: 'Mechanism · minimal sourcing',
  MECHANISM_SINGLE_SOURCE: 'Mechanism · single source',
  DETAILED_MULTIPLE_SOURCES: 'Detailed · multiple sources',
};

export function detailLabel(value: string | number | null | undefined): string {
  if (value == null || String(value).trim() === '') return 'Not recorded';
  const key = String(value).trim();
  return detailLabels[key] || key.toLowerCase().replace(/[_-]+/g, ' ').replace(/^./, c => c.toUpperCase());
}
