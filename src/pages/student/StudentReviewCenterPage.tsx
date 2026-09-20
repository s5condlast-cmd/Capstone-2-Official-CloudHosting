import React from 'react';
import { DocumentReviewCenter } from '@/src/components/review/DocumentReviewCenter';

export function StudentReviewCenterPage() {
  return <DocumentReviewCenter role="student" baseRoute="/student/reviews" />;
}

export default StudentReviewCenterPage;
