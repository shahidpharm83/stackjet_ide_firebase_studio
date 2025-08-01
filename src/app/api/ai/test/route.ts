import { NextRequest, NextResponse } from 'next/server';
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// This is a self-contained API route that does not depend on any external flows.
// It directly tests the API key.

export async function POST(req: NextRequest) {
  let apiKey: string;

  try {
    const body = await req.json();
    apiKey = body.apiKey;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 });
    }
  } catch (error) {
    // This catches errors from req.json() if the body is not valid JSON
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  try {
    // Initialize a temporary, isolated Genkit instance specifically for this test.
    // This ensures we are using the user-provided key and not a globally configured one.
    const testAi = genkit({
      plugins: [
        googleAI({
          apiKey: apiKey,
        }),
      ],
      // We disable logging for these test calls to keep the console clean.
      logLevel: 'silent',
    });

    // Make a very simple, low-cost API call to verify the key.
    const response = await testAi.generate({
      model: 'googleai/gemini-2.0-flash',
      prompt: 'test',
      config: {
        maxOutputTokens: 1,
      },
    });

    // If the call succeeds and we get any text back, the key is considered valid.
    if (response.text) {
      return NextResponse.json({ success: true });
    } else {
      // This case handles situations where the API call succeeds but returns no content.
      throw new Error('API call succeeded but returned no data.');
    }
  } catch (error: any) {
    // This is the crucial error handler. Any failure in the genkit() or ai.generate()
    // calls above (e.g., invalid key, network issue, permissions error) will be caught here.
    console.error('API Key Test Failed:', error.message);
    
    // We return a clear, structured JSON error response.
    return NextResponse.json({ error: 'The provided API key is invalid or has insufficient permissions.' }, { status: 400 });
  }
}
