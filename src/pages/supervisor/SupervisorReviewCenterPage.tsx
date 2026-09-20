import React from 'react';
import { DocumentReviewCenter } from '@/src/components/review/DocumentReviewCenter';

export function SupervisorReviewCenterPage() {
  return <DocumentReviewCenter role="supervisor" baseRoute="/supervisor/reviews" />;
}

export default SupervisorReviewCenterPage;

