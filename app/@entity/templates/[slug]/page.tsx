import { TemplateEditForm } from '@/components/templates/template-edit-form';

interface TemplateEditPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function TemplateEditPage({ params }: TemplateEditPageProps) {
  const { slug } = await params;
  return <TemplateEditForm templateSlug={slug} />;
}
