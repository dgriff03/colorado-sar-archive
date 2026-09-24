import { displayValue, label } from '@/lib/search';
import type { Incident } from '@/lib/types';

import { detailLabels } from '@/lib/detail';

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
