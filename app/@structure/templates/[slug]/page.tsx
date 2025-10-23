'use client';

import { Suspense } from 'react';
import { TemplatesPage } from '@/components/templates/templates-page';

// When viewing a specific template, still show the templates list in the @structure slot
export default function TemplateStructurePage() {
  return (
    <Suspense fallback={<div>Loading templates...</div>}>
      <TemplatesPage />
    </Suspense>
  );
}
