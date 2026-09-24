import { label } from '@/lib/search';
import type { Incident } from '@/lib/types';

import { detailLabel } from '@/lib/detail';

export function IncidentTags({ incident }: { incident: Incident }) {
  const score = detailLabel(incident.detail_score);
  return (
    <>
      <span className="type-tag outcome-tag">Outcome: {label(incident.outcome)}</span>
      <span
        className="type-tag detail-tag"
        title={`Reported detail classification: ${score}. Describes source detail, not independent verification.`}
      >
        Detail: {score}
      </span>
    </>
  );
}
