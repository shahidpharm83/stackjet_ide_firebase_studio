import { NextRequest, NextResponse } from 'next/server';
import { testApiKeyFlow } from '@/ai/flows/test-key-flow';
import { run } from 'genkit';

export async function POST(req: NextRequest) {
  try {
    const { apiKey } = await req.json();

    if (!apiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 });
    }

    const isSuccess = await run(testApiKeyFlow, apiKey);

    if (isSuccess) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'The provided API key is invalid or has insufficient permissions.' }, { status: 401 });
    }
  } catch (error: any) {
    console.error('/api/ai/test error:', error);
    return NextResponse.json({ error: error.message || 'An unexpected error occurred.' }, { status: 500 });
  }
}
