import React from 'react';
import { DocumentReviewCenter } from '@/src/components/review/DocumentReviewCenter';

export function AdviserReviewCenterPage() {
  return <DocumentReviewCenter role="adviser" baseRoute="/adviser/reviews" />;
}

export default AdviserReviewCenterPage;
