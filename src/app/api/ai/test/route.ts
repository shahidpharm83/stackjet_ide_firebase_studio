import { NextRequest, NextResponse } from 'next/server';
import { testApiKeyFlow } from '@/ai/flows/test-key-flow';

export async function POST(req: NextRequest) {
  try {
    const { apiKey } = await req.json();

    if (!apiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 });
    }

    const isSuccess = await testApiKeyFlow(apiKey);

    if (isSuccess) {
      return NextResponse.json({ success: true });
    } else {
      // This case is now handled by the error catching below, 
      // but we leave it for clarity. The flow itself returns false.
      return NextResponse.json({ error: 'The provided API key is invalid or has insufficient permissions.' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('/api/ai/test error:', error);
    // The Genkit run will throw an error for invalid keys, which we catch here.
    return NextResponse.json({ error: error.message || 'The provided API key is invalid or has insufficient permissions.' }, { status: 400 });
  }
}
