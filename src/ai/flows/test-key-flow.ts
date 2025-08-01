'use server';
/**
 * @fileOverview A simple flow to test if a Gemini API key is valid.
 *
 * - testApiKey - A function that takes an API key and performs a test call.
 */

import { genkit, z } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

export const testApiKeyFlow = genkit.defineFlow(
  {
    name: 'testApiKeyFlow',
    inputSchema: z.string(),
    outputSchema: z.boolean(),
  },
  async (apiKey) => {
    try {
      // Initialize a temporary Genkit instance with the provided key
      const testAi = genkit({
        plugins: [
          googleAI({
            apiKey: apiKey,
          }),
        ],
      });

      // Make a simple, low-cost call to the model
      const response = await testAi.generate({
        model: 'googleai/gemini-2.0-flash',
        prompt: 'Give me a one-word response.',
        config: {
          maxOutputTokens: 2,
        },
      });

      // If the call succeeds and we get text back, the key is valid.
      return !!response.text;
    } catch (error) {
      console.error('API Key test failed:', error);
      // Any error during the API call indicates an invalid key or other issue.
      return false;
    }
  }
);
