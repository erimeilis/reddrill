/**
 * Template Preview API
 * Renders template with test data for preview without sending
 */

import { NextRequest, NextResponse } from 'next/server';
import mandrillClient from '@/lib/api/mandrill';
import { substitutePlaceholders } from '@/lib/utils/placeholder-parser';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { mergeVars, globalVars } = await request.json();

    // Fetch template from Mandrill
    const template = await mandrillClient.getTemplateInfo(slug);

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Substitute placeholders in all fields
    const rendered = {
      subject: substitutePlaceholders(
        template.subject || '',
        mergeVars || {},
        globalVars || {}
      ),
      fromName: substitutePlaceholders(
        template.from_name || '',
        mergeVars || {},
        globalVars || {}
      ),
      fromEmail: substitutePlaceholders(
        template.from_email || '',
        mergeVars || {},
        globalVars || {}
      ),
      htmlContent: substitutePlaceholders(
        template.code || '',
        mergeVars || {},
        globalVars || {}
      ),
      textContent: substitutePlaceholders(
        template.text || '',
        mergeVars || {},
        globalVars || {}
      ),
    };

    return NextResponse.json(rendered);
  } catch (error) {
    console.error('Preview error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Preview failed' },
      { status: 500 }
    );
  }
}
