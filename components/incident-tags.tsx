import { displayValue, label } from '@/lib/search';
import type { Incident } from '@/lib/types';

const detailLabels: Record<string, string> = {
  ONE_LINER: 'One-line report',
  BASIC_FACTS: 'Basic facts',
  HOW_MINIMAL_SOURCING: 'Mechanism · minimal sourcing',
  MECHANISM_SINGLE_SOURCE: 'Mechanism · single source',
  DETAILED_MULTIPLE_SOURCES: 'Detailed · multiple sources',
};

export function IncidentTags({ incident }: { incident: Incident }) {
  const score = displayValue(incident.detail_score);
  return (
    <>
      <span className="type-tag outcome-tag">Outcome: {label(incident.outcome)}</span>
      <span
        className="type-tag detail-tag"
        title={`Reported detail classification: ${score}. Describes source detail, not independent verification.`}
      >
        Detail: {detailLabels[score] || score}
      </span>
    </>
  );
}
