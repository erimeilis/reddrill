/**
 * Translation API route supporting multiple providers
 * Cloudflare Workers AI, Google Cloud Translation, Azure Translator, Crowdin
 * Includes automatic placeholder protection to preserve dynamic content
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import {
  protectPlaceholders,
  restorePlaceholders,
  validatePlaceholders,
} from '@/lib/utils/placeholder-parser';

// Note: runtime config removed for cacheComponents compatibility in next.config.ts
// This route runs in Node.js runtime by default

export async function POST(request: NextRequest) {
  try {
    const { text, sourceLang, targetLang, provider = 'cloudflare', apiKey, projectId, protectPlaceholdersFlag = true } = await request.json();

    if (!text || !sourceLang || !targetLang) {
      return NextResponse.json(
        { error: 'Missing required fields: text, sourceLang, targetLang' },
        { status: 400 }
      );
    }

    // Step 1: Protect placeholders before translation
    const { protectedText, tokenMap } = protectPlaceholdersFlag
      ? protectPlaceholders(text)
      : { protectedText: text, tokenMap: new Map() };

    // Step 2: Perform translation with protected text
    let translatedText: string;

    switch (provider) {
      case 'cloudflare':
        translatedText = await translateWithCloudflare(protectedText, sourceLang, targetLang, request);
        break;

      case 'google':
        if (!apiKey) {
          return NextResponse.json(
            { error: 'API key required for Google Cloud Translation' },
            { status: 400 }
          );
        }
        translatedText = await translateWithGoogle(protectedText, sourceLang, targetLang, apiKey);
        break;

      case 'azure':
        if (!apiKey) {
          return NextResponse.json(
            { error: 'API key required for Azure Translator' },
            { status: 400 }
          );
        }
        translatedText = await translateWithAzure(protectedText, sourceLang, targetLang, apiKey);
        break;

      case 'crowdin':
        if (!apiKey || !projectId) {
          return NextResponse.json(
            { error: 'API key and Project ID required for Crowdin' },
            { status: 400 }
          );
        }
        translatedText = await translateWithCrowdin(protectedText, sourceLang, targetLang, apiKey, projectId);
        break;

      default:
        return NextResponse.json(
          { error: `Unknown provider: ${provider}` },
          { status: 400 }
        );
    }

    // Step 3: Restore placeholders after translation
    const restoredText = protectPlaceholdersFlag
      ? restorePlaceholders(translatedText, tokenMap)
      : translatedText;

    // Step 4: Validate placeholders
    const validation = protectPlaceholdersFlag
      ? validatePlaceholders(text, restoredText)
      : { isValid: true, warnings: [], missing: [], added: [], corrupted: [] };

    return NextResponse.json({
      translatedText: restoredText,
      validation,
      placeholderProtection: protectPlaceholdersFlag,
    });
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Translation failed' },
      { status: 500 }
    );
  }
}

/**
 * Translate using Cloudflare Workers AI (native binding)
 */
async function translateWithCloudflare(
  text: string,
  sourceLang: string,
  targetLang: string,
  request: NextRequest
): Promise<string> {
  // Access Cloudflare Workers AI binding via OpenNext context
  const { env } = getCloudflareContext();
  const AI = (env as any).AI;

  if (!AI) {
    throw new Error('Cloudflare Workers AI not available. Ensure [ai] binding is configured in wrangler.toml');
  }

  // Use native binding directly
  const response = await AI.run('@cf/meta/m2m100-1.2b', {
    text,
    source_lang: sourceLang,
    target_lang: targetLang
  });

  return response.translated_text;
}

/**
 * Translate using Google Cloud Translation API
 */
async function translateWithGoogle(
  text: string,
  sourceLang: string,
  targetLang: string,
  apiKey: string
): Promise<string> {
  const response = await fetch(
    `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: text,
        source: sourceLang,
        target: targetLang,
        format: 'text' // We handle HTML separately in our HTML parser
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google Translation failed: ${error}`);
  }

  const data = await response.json();
  return data.data.translations[0].translatedText;
}

/**
 * Translate using Microsoft Azure Translator
 */
async function translateWithAzure(
  text: string,
  sourceLang: string,
  targetLang: string,
  apiKey: string,
  region: string = 'global'
): Promise<string> {
  const response = await fetch(
    `https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&from=${sourceLang}&to=${targetLang}`,
    {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
        'Ocp-Apim-Subscription-Region': region,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([{ text }])
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Azure Translation failed: ${error}`);
  }

  const data = await response.json();
  return data[0].translations[0].text;
}

/**
 * Translate using Crowdin API v2
 */
async function translateWithCrowdin(
  text: string,
  sourceLang: string,
  targetLang: string,
  apiKey: string,
  projectId: string
): Promise<string> {
  // Crowdin uses language codes like 'en', 'pl', 'de', etc.
  // Split text by lines for better translation context
  const lines = text.split('\n').filter(line => line.trim());

  const response = await fetch(
    `https://api.crowdin.com/api/v2/projects/${projectId}/translations`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sourceLanguageId: sourceLang,
        targetLanguageId: targetLang,
        strings: lines,
        method: 'mt' // Machine translation
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Crowdin Translation failed: ${error}`);
  }

  const data = await response.json();

  // Crowdin returns array of translated strings
  if (data.data && Array.isArray(data.data)) {
    return data.data.map((item: any) => item.data?.text || item.text || '').join('\n');
  }

  throw new Error('Unexpected Crowdin API response format');
}
