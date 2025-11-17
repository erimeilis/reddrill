import { NextRequest, NextResponse } from 'next/server';

// POST /api/mandrill - Validate API key and list templates
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey, action } = body;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      );
    }

    const trimmedKey = apiKey.trim();

    // Handle different actions
    switch (action) {
      case 'validate':
      case 'listTemplates':
        try {
          // Call Mandrill API directly using fetch (server-side, no CORS issues)
          const response = await fetch('https://mandrillapp.com/api/1.0/templates/list', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: trimmedKey })
          });

          const result = await response.json();

          // Check for Mandrill error responses
          // Mandrill returns 200 even for errors, so check response structure
          if (result.status === 'error' || result.name === 'Invalid_Key') {
            return NextResponse.json(
              {
                success: false,
                error: result.message || 'Invalid API key. Please check your Mandrill API key and try again.'
              },
              { status: 401 }
            );
          }

          // Check if response is an array (valid templates list)
          if (!Array.isArray(result)) {
            console.error('[API] Unexpected response format:', result);
            return NextResponse.json(
              {
                success: false,
                error: 'Unexpected response format from Mandrill API'
              },
              { status: 500 }
            );
          }

          return NextResponse.json({
            success: true,
            templates: result,
            count: result.length
          });
        } catch (error: any) {
          console.error('[API] Mandrill error:', error);

          return NextResponse.json(
            {
              success: false,
              error: error.message || 'Failed to connect to Mandrill API'
            },
            { status: 500 }
          );
        }

      case 'getTemplateInfo':
        try {
          const { templateName } = body;
          if (!templateName) {
            return NextResponse.json(
              { error: 'Template name is required' },
              { status: 400 }
            );
          }

          const response = await fetch('https://mandrillapp.com/api/1.0/templates/info', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: trimmedKey, name: templateName })
          });

          const result = await response.json();

          if (result.status === 'error') {
            return NextResponse.json(
              {
                success: false,
                error: result.message || 'Failed to get template info'
              },
              { status: 400 }
            );
          }

          return NextResponse.json({
            success: true,
            template: result
          });
        } catch (error: any) {
          console.error('[API] Get template info error:', error);

          return NextResponse.json(
            {
              success: false,
              error: error.message || 'Failed to get template info'
            },
            { status: 500 }
          );
        }

      case 'addTemplate':
        try {
          const { name, code, subject, from_email, from_name, text, labels } = body;
          if (!name) {
            return NextResponse.json(
              { error: 'Template name is required' },
              { status: 400 }
            );
          }

          const response = await fetch('https://mandrillapp.com/api/1.0/templates/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              key: trimmedKey,
              name,
              code,
              subject,
              from_email,
              from_name,
              text,
              labels
            })
          });

          const result = await response.json();

          if (result.status === 'error') {
            return NextResponse.json(
              { success: false, error: result.message || 'Failed to create template' },
              { status: 400 }
            );
          }

          return NextResponse.json({ success: true, template: result });
        } catch (error: any) {
          console.error('[API] Add template error:', error);
          return NextResponse.json(
            { success: false, error: error.message || 'Failed to create template' },
            { status: 500 }
          );
        }

      case 'updateTemplate':
        try {
          const { name, code, subject, from_email, from_name, text, labels } = body;
          if (!name) {
            return NextResponse.json(
              { error: 'Template name is required' },
              { status: 400 }
            );
          }

          const response = await fetch('https://mandrillapp.com/api/1.0/templates/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              key: trimmedKey,
              name,
              code,
              subject,
              from_email,
              from_name,
              text,
              labels
            })
          });

          const result = await response.json();

          if (result.status === 'error') {
            return NextResponse.json(
              { success: false, error: result.message || 'Failed to update template' },
              { status: 400 }
            );
          }

          return NextResponse.json({ success: true, template: result });
        } catch (error: any) {
          console.error('[API] Update template error:', error);
          return NextResponse.json(
            { success: false, error: error.message || 'Failed to update template' },
            { status: 500 }
          );
        }

      case 'deleteTemplate':
        try {
          const { name } = body;
          if (!name) {
            return NextResponse.json(
              { error: 'Template name is required' },
              { status: 400 }
            );
          }

          const response = await fetch('https://mandrillapp.com/api/1.0/templates/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: trimmedKey, name })
          });

          const result = await response.json();

          if (result.status === 'error') {
            return NextResponse.json(
              { success: false, error: result.message || 'Failed to delete template' },
              { status: 400 }
            );
          }

          return NextResponse.json({ success: true, template: result });
        } catch (error: any) {
          console.error('[API] Delete template error:', error);
          return NextResponse.json(
            { success: false, error: error.message || 'Failed to delete template' },
            { status: 500 }
          );
        }

      case 'importTemplates':
        try {
          const { templates } = body;
          if (!Array.isArray(templates)) {
            return NextResponse.json(
              { error: 'Templates array is required' },
              { status: 400 }
            );
          }

          const errors: string[] = [];
          let imported = 0;

          // Step 1: Get all existing templates
          const listResponse = await fetch('https://mandrillapp.com/api/1.0/templates/list', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: trimmedKey })
          });

          const existingTemplates = await listResponse.json();

          if (Array.isArray(existingTemplates)) {
            // Step 2: Delete all existing templates
            for (const template of existingTemplates) {
              try {
                await fetch('https://mandrillapp.com/api/1.0/templates/delete', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ key: trimmedKey, name: template.name })
                });
              } catch (error: any) {
                errors.push(`Failed to delete template "${template.name}": ${error.message}`);
              }
            }
          }

          // Step 3: Create templates from import
          for (const template of templates) {
            try {
              const addResponse = await fetch('https://mandrillapp.com/api/1.0/templates/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  key: trimmedKey,
                  name: template.name,
                  code: template.code,
                  subject: template.subject,
                  from_email: template.from_email,
                  from_name: template.from_name,
                  text: template.text,
                  labels: template.labels
                })
              });

              const addResult = await addResponse.json();

              if (addResult.status === 'error') {
                errors.push(`Failed to create template "${template.name}": ${addResult.message}`);
              } else {
                imported++;
              }
            } catch (error: any) {
              errors.push(`Failed to create template "${template.name}": ${error.message}`);
            }
          }

          return NextResponse.json({
            success: errors.length === 0,
            imported,
            errors
          });
        } catch (error: any) {
          console.error('[API] Import templates error:', error);
          return NextResponse.json(
            { success: false, error: error.message || 'Failed to import templates', imported: 0, errors: [error.message] },
            { status: 500 }
          );
        }

      case 'searchMessages':
        try {
          const { query, date_from, date_to, tags, senders, limit } = body;

          const response = await fetch('https://mandrillapp.com/api/1.0/messages/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              key: trimmedKey,
              query: query || '*',
              date_from,
              date_to,
              tags,
              senders,
              limit: limit || 100
            })
          });

          const result = await response.json();

          if (result.status === 'error') {
            return NextResponse.json(
              { success: false, error: result.message || 'Failed to search messages' },
              { status: 400 }
            );
          }

          return NextResponse.json({
            success: true,
            results: result,
            total: result.length
          });
        } catch (error: any) {
          console.error('[API] Search messages error:', error);
          return NextResponse.json(
            { success: false, error: error.message || 'Failed to search messages' },
            { status: 500 }
          );
        }

      case 'listTags':
        try {
          const response = await fetch('https://mandrillapp.com/api/1.0/tags/list', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: trimmedKey })
          });

          const result = await response.json();

          if (result.status === 'error') {
            return NextResponse.json(
              { success: false, error: result.message || 'Failed to list tags' },
              { status: 400 }
            );
          }

          return NextResponse.json({ success: true, tags: result });
        } catch (error: any) {
          console.error('[API] List tags error:', error);
          return NextResponse.json(
            { success: false, error: error.message || 'Failed to list tags' },
            { status: 500 }
          );
        }

      case 'deleteTag':
        try {
          const { tag } = body;
          if (!tag) {
            return NextResponse.json(
              { error: 'Tag is required' },
              { status: 400 }
            );
          }

          const response = await fetch('https://mandrillapp.com/api/1.0/tags/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: trimmedKey, tag })
          });

          const result = await response.json();

          if (result.status === 'error') {
            return NextResponse.json(
              { success: false, error: result.message || 'Failed to delete tag' },
              { status: 400 }
            );
          }

          return NextResponse.json({ success: true, result });
        } catch (error: any) {
          console.error('[API] Delete tag error:', error);
          return NextResponse.json(
            { success: false, error: error.message || 'Failed to delete tag' },
            { status: 500 }
          );
        }

      case 'listSenders':
        try {
          const response = await fetch('https://mandrillapp.com/api/1.0/senders/list', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: trimmedKey })
          });

          const result = await response.json();

          if (result.status === 'error') {
            return NextResponse.json(
              { success: false, error: result.message || 'Failed to list senders' },
              { status: 400 }
            );
          }

          return NextResponse.json({ success: true, senders: result });
        } catch (error: any) {
          console.error('[API] List senders error:', error);
          return NextResponse.json(
            { success: false, error: error.message || 'Failed to list senders' },
            { status: 500 }
          );
        }

      case 'getSenderInfo':
        try {
          const { address } = body;
          if (!address) {
            return NextResponse.json(
              { error: 'Sender address is required' },
              { status: 400 }
            );
          }

          const response = await fetch('https://mandrillapp.com/api/1.0/senders/info', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: trimmedKey, address })
          });

          const result = await response.json();

          if (result.status === 'error') {
            return NextResponse.json(
              { success: false, error: result.message || 'Failed to get sender info' },
              { status: 400 }
            );
          }

          return NextResponse.json({ success: true, sender: result });
        } catch (error: any) {
          console.error('[API] Get sender info error:', error);
          return NextResponse.json(
            { success: false, error: error.message || 'Failed to get sender info' },
            { status: 500 }
          );
        }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('[API] Request error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
