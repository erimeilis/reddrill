/**
 * Send Test Email API
 * Sends actual test email via Mandrill
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { mergeVars, globalVars, recipientEmail, recipientName } = await request.json();

    if (!recipientEmail) {
      return NextResponse.json(
        { error: 'Recipient email is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.MANDRILL_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Mandrill API key not configured' },
        { status: 500 }
      );
    }

    // Prepare merge vars in Mandrill format
    const mergeVarsArray = Object.entries(mergeVars || {}).map(([name, content]) => ({
      name,
      content,
    }));

    const globalMergeVarsArray = Object.entries(globalVars || {}).map(([name, content]) => ({
      name,
      content,
    }));

    // Send via Mandrill
    const response = await fetch('https://mandrillapp.com/api/1.0/messages/send-template', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: apiKey,
        template_name: params.slug,
        template_content: [],
        message: {
          to: [{
            email: recipientEmail,
            name: recipientName || recipientEmail,
            type: 'to'
          }],
          merge_vars: [{
            rcpt: recipientEmail,
            vars: mergeVarsArray,
          }],
          global_merge_vars: globalMergeVarsArray.length > 0 ? globalMergeVarsArray : undefined,
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Mandrill API error: ${error}`);
    }

    const result = await response.json();

    // Check if send was successful
    if (result[0]?.status === 'rejected' || result[0]?.status === 'invalid') {
      throw new Error(result[0]?.reject_reason || 'Email was rejected');
    }

    return NextResponse.json({
      success: true,
      messageId: result[0]?._id,
      status: result[0]?.status,
      email: result[0]?.email,
    });
  } catch (error) {
    console.error('Send test error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send test email' },
      { status: 500 }
    );
  }
}
