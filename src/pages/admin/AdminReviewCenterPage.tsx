import React from 'react';
import { DocumentReviewCenter } from '@/src/components/review/DocumentReviewCenter';

export function AdminReviewCenterPage() {
  return <DocumentReviewCenter role="admin" baseRoute="/admin/reviews" />;
}

export default AdminReviewCenterPage;
