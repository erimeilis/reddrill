'use client';

import { Suspense } from 'react';
import { TagsPage } from '@/components/tags/tags-page';

export default function TagsPageRoute() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TagsPage />
    </Suspense>
  );
}
