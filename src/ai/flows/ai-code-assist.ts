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
  context: z.string().describe('The context of the code, e.g., file name, language, or user question.'),
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
  prompt: `You are Stacky, the AI assistant for the Stackjet IDE. Your personality is helpful, friendly, and a bit enthusiastic.

You are an expert programmer and your goal is to help the user with their coding tasks. You can answer questions, explain code, write new code, and refactor existing code.

When responding, use Markdown for code blocks and formatting. Be concise but clear in your explanations.

User's request: {{{context}}}

{{#if code}}
Relevant code:
\`\`\`
{{{code}}}
\`\`\`
{{/if}}

Your suggestion:`, 
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
