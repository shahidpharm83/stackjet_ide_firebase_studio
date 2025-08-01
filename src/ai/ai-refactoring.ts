// The ai-refactoring.ts file implements an AI-powered code refactoring tool.
// It suggests improvements to simplify code logic and enhance maintainability.
// - refactorCode - An async function that takes code as input and returns refactored code with suggestions.
// - RefactorCodeInput - The input type for the refactorCode function.
// - RefactorCodeOutput - The output type for the refactorCode function.

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RefactorCodeInputSchema = z.object({
  code: z.string().describe('The code to be refactored.'),
});

export type RefactorCodeInput = z.infer<typeof RefactorCodeInputSchema>;

const RefactorCodeOutputSchema = z.object({
  refactoredCode: z.string().describe('The refactored code with improvements.'),
  suggestions: z.array(z.string()).describe('Suggestions for code improvements.'),
});

export type RefactorCodeOutput = z.infer<typeof RefactorCodeOutputSchema>;

export async function refactorCode(input: RefactorCodeInput): Promise<RefactorCodeOutput> {
  return refactorCodeFlow(input);
}

const refactorCodePrompt = ai.definePrompt({
  name: 'refactorCodePrompt',
  input: {schema: RefactorCodeInputSchema},
  output: {schema: RefactorCodeOutputSchema},
  prompt: `You are an AI-powered code refactoring tool. Your task is to analyze the given code and suggest refactoring improvements to simplify its logic and enhance maintainability.

  Analyze the code and determine whether refactoring could simplify the logic. Only propose changes that demonstrably improve the code.

  Provide the refactored code and a list of suggestions for the changes made.

  Code:
  {{code}}`,
});

const refactorCodeFlow = ai.defineFlow(
  {
    name: 'refactorCodeFlow',
    inputSchema: RefactorCodeInputSchema,
    outputSchema: RefactorCodeOutputSchema,
  },
  async input => {
    const {output} = await refactorCodePrompt(input);
    return output!;
  }
);
