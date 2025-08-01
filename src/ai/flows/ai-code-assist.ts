'use server';

/**
 * @fileOverview Provides AI-powered code suggestions and autocompletion.
 *
 * - aiCodeAssist - A function that provides code suggestions based on the given code and context.
 * - AiCodeAssistInput - The input type for the aiCodeAssist function.
 * - AiCodeAssistOutput - The return type for the aiCodeAssist function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiCodeAssistInputSchema = z.object({
  code: z.string().describe('The current code snippet.'),
  context: z.string().describe('The context of the code, e.g., file name, language.'),
});
export type AiCodeAssistInput = z.infer<typeof AiCodeAssistInputSchema>;

const AiCodeAssistOutputSchema = z.object({
  suggestion: z.string().describe('The AI-powered code suggestion or autocompletion.'),
});
export type AiCodeAssistOutput = z.infer<typeof AiCodeAssistOutputSchema>;

export async function aiCodeAssist(input: AiCodeAssistInput): Promise<AiCodeAssistOutput> {
  return aiCodeAssistFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiCodeAssistPrompt',
  input: {schema: AiCodeAssistInputSchema},
  output: {schema: AiCodeAssistOutputSchema},
  prompt: `You are an AI code assistant. Given the following code and context, provide a code suggestion or autocompletion.\n\nContext: {{{context}}}\nCode: {{{code}}}\n\nSuggestion:`, 
});

const aiCodeAssistFlow = ai.defineFlow(
  {
    name: 'aiCodeAssistFlow',
    inputSchema: AiCodeAssistInputSchema,
    outputSchema: AiCodeAssistOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
