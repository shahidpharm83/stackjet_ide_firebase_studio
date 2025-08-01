'use server';

/**
 * @fileOverview A multi-step agentic flow for handling complex coding tasks.
 *
 * - agenticFlow - A function that takes a user prompt and returns a structured plan of execution.
 * - AgenticFlowInput - The input type for the agenticFlow function.
 * - AgenticFlowOutput - The return type for the agenticFlow function, containing the plan.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const FileOperationSchema = z.object({
  fileName: z.string().describe('The full relative path of the file.'),
  action: z.enum(['write', 'read', 'edit', 'delete', 'rename', 'move']).describe('The file operation to perform.'),
  content: z.string().optional().describe('The content to write or edit. Required for write/edit actions.'),
  purpose: z.string().describe('A short, clear explanation of why this step is necessary.'),
  expectedOutcome: z.string().describe('What the result of this step will be.'),
});

const CommandOperationSchema = z.object({
  command: z.string().describe('The shell command to execute.'),
  purpose: z.string().describe('A short, clear explanation of why this step is necessary.'),
  expectedOutcome: z.string().describe('What the result of this step will be.'),
});

const PlanStepSchema = z.union([
    FileOperationSchema,
    CommandOperationSchema
]);

const AgenticFlowInputSchema = z.object({
  prompt: z.string().describe('The user\'s request.'),
  apiKey: z.string().optional().describe('The Gemini API key to use for this request.'),
});
export type AgenticFlowInput = z.infer<typeof AgenticFlowInputSchema>;

const AgenticFlowOutputSchema = z.object({
  analysis: z.string().describe("A detailed analysis of the user's request, including your thought process."),
  plan: z.array(PlanStepSchema).describe('The step-by-step plan to address the user\'s request.'),
  summary: z.string().describe('A concluding summary of the planned actions, including total files changed and operations performed.'),
  suggestions: z.array(z.string()).describe('A list of suggestions for next steps or improvements.'),
});
export type AgenticFlowOutput = z.infer<typeof AgenticFlowOutputSchema>;


const agenticPrompt = ai.definePrompt({
  name: 'agenticPrompt',
  input: {schema: AgenticFlowInputSchema.pick({ prompt: true })}, // Prompt only needs the prompt field
  output: {schema: AgenticFlowOutputSchema},
  prompt: `You are Stacky, an expert AI coding agent in the Stackjet IDE.
Your task is to understand a user's request, break it down into a sequence of operations, and return a structured plan in JSON format.

**Your Process:**
1.  **Analyze:** Provide a detailed analysis of the user's request to understand their goal. Explain your reasoning and thought process.
2.  **Plan:** Create a step-by-step plan consisting of file operations (write, edit, delete, etc.) and shell commands. Each step must have a clear 'purpose' and 'expectedOutcome'.
3.  **Summarize:** Provide a comprehensive summary of the entire plan, including the total number of files changed, a breakdown of operation types (e.g., 2 writes, 1 delete), and the total operations to be performed.
4.  **Suggest:** Offer a few relevant suggestions for what the user might want to do next.

**User Request:**
"{{{prompt}}}"

Based on the request, generate a JSON object that strictly follows the output schema.
Ensure all file paths are relative. For any new code, provide the complete file content.
`,
});

export const agenticFlow = ai.defineFlow(
  {
    name: 'agenticFlow',
    inputSchema: AgenticFlowInputSchema,
    outputSchema: AgenticFlowOutputSchema,
  },
  async (input) => {
    // If a specific API key is provided, create a temporary, isolated Genkit instance for this call.
    if (input.apiKey) {
      const executionAi = genkit({
        plugins: [
          googleAI({
            apiKey: input.apiKey,
          }),
        ],
        logLevel: 'silent', // We don't need to log these dynamic, per-request instances
      });

      // Define a temporary prompt within the scope of the temporary AI instance.
      const tempPrompt = executionAi.definePrompt({
        name: 'agenticPrompt_temp', // Different name to avoid conflicts
        input: { schema: AgenticFlowInputSchema.pick({ prompt: true }) },
        output: { schema: AgenticFlowOutputSchema },
        prompt: `You are Stacky, an expert AI coding agent in the Stackjet IDE.
Your task is to understand a user's request, break it down into a sequence of operations, and return a structured plan in JSON format.

**Your Process:**
1.  **Analyze:** Provide a detailed analysis of the user's request to understand their goal. Explain your reasoning and thought process.
2.  **Plan:** Create a step-by-step plan consisting of file operations (write, edit, delete, etc.) and shell commands. Each step must have a clear 'purpose' and 'expectedOutcome'.
3.  **Summarize:** Provide a comprehensive summary of the entire plan, including the total number of files changed, a breakdown of operation types (e.g., 2 writes, 1 delete), and the total operations to be performed.
4.  **Suggest:** Offer a few relevant suggestions for what the user might want to do next.

**User Request:**
"{{{prompt}}}"

Based on the request, generate a JSON object that strictly follows the output schema.
Ensure all file paths are relative. For any new code, provide the complete file content.
`,
      });
      
      const { output } = await tempPrompt({ prompt: input.prompt });
      return output!;

    } else {
      // Use the globally defined prompt if no specific key is provided.
      const {output} = await agenticPrompt({ prompt: input.prompt });
      return output!;
    }
  }
);
