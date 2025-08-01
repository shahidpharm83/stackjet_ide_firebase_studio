
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
  imageDataUri: z.string().optional().describe("An optional image provided by the user, as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
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
  input: {schema: AgenticFlowInputSchema.pick({ prompt: true, imageDataUri: true })},
  output: {schema: AgenticFlowOutputSchema},
  prompt: `You are Stacky, an expert AI coding agent in the Stackjet IDE.
Your task is to understand a user's request, break it down into a sequence of operations, and return a structured plan in JSON format.

**Your Process:**
1.  **Analyze Project Context:** Before formulating a plan, you MUST determine the technology stack (e.g., language, framework, libraries) of the project. Your first steps in the plan should often be to 'read' key configuration or manifest files like 'package.json', 'tsconfig.json', 'next.config.ts', etc. Your entire plan must be consistent with the identified technology stack. For example, do not suggest Python code for a TypeScript/React project.

2.  **Project Scaffolding:**
    *   If the user asks to create a project with both frontend and backend components, your plan MUST create separate 'frontend' and 'backend' directories to organize the code.
    *   If the request implies multiple applications (e.g., an admin frontend and a user frontend), create descriptively named folders (e.g., 'frontend-admin', 'frontend-user', 'backend-api'). All subsequent file operations must place files in the correct directory.
    *   **Default Technologies:** If the user does not specify a language or framework, you MUST use the following defaults: For a frontend, use React with Tailwind CSS. For a backend, use Node.js. If the user *does* specify technologies, you MUST use what they have requested.

3.  **Special Handling for Vague Requests:** If the user's request is high-level or vague (e.g., "add more features", "improve my app", "read files and assess"), your primary goal is to gather context first.
    *   Your plan should **ONLY** contain 'read' operations for relevant files.
    *   Do **NOT** include 'write', 'edit', or 'command' operations in this initial discovery phase.
    *   In your analysis, explain that you are first reading files to understand the project and that you will propose specific changes in the next step, after the user approves the read-only plan.

4.  **Special Handling for "fix error" or "debug" requests**: If the user asks you to fix an error, follow this specific process:
    *   First, **Analyze Project Context** as described in step 1.
    *   Next, create a plan to **read the relevant source files** where the error is likely to be occurring.
    *   Based on your analysis of the files you read, create a plan with the necessary \`edit\` or \`write\` operations to fix the error(s).
    *   If you cannot find a specific error, your plan should read the main project files and analyze them for potential security vulnerabilities, performance issues, or other areas for improvement. Propose a plan with \`edit\` operations to fix these issues.

5.  **Analyze User Request:** For specific requests, provide a detailed analysis of the user's goal. Explain your reasoning and thought process. If an image is provided, describe how it influences your plan. Your analysis must incorporate the project context you discovered.

6.  **Plan:** Create a step-by-step plan consisting of file operations (write, edit, read, delete, etc.) and shell commands. Each step must have a clear 'purpose' and 'expectedOutcome'. Your plan should be based on the user's request and the context of the files you read. All code you generate must match the project's established coding style and conventions.

7.  **Summarize:** Provide a comprehensive summary of the entire plan, including the total number of files changed, a breakdown of operation types (e.g., 2 writes, 1 delete), and the total operations to be performed.

8.  **Suggest:** Offer a few relevant suggestions for what the user might want to do next.

**User Request:**
"{{{prompt}}}"

{{#if imageDataUri}}
**Reference Image:**
An image has been provided. Analyze it carefully to inform your plan. For example, if it's a UI mockup, your plan should generate the necessary code to implement it.
{{media url=imageDataUri}}
{{/if}}

Based on the request, generate a JSON object that strictly follows the output schema.
Ensure all file paths are relative. For any new code, provide the complete file content.
Crucially, the 'content' field for file operations must contain only the raw code, without any markdown formatting like \`\`\`javascript or \`\`\`.
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
        model: 'googleai/gemini-2.0-flash', // Explicitly define the model
        input: { schema: AgenticFlowInputSchema.pick({ prompt: true, imageDataUri: true }) },
        output: { schema: AgenticFlowOutputSchema },
        prompt: `You are Stacky, an expert AI coding agent in the Stackjet IDE.
Your task is to understand a user's request, break it down into a sequence of operations, and return a structured plan in JSON format.

**Your Process:**
1.  **Analyze Project Context:** Before formulating a plan, you MUST determine the technology stack (e.g., language, framework, libraries) of the project. Your first steps in the plan should often be to 'read' key configuration or manifest files like 'package.json', 'tsconfig.json', 'next.config.ts', etc. Your entire plan must be consistent with the identified technology stack. For example, do not suggest Python code for a TypeScript/React project.

2.  **Project Scaffolding:**
    *   If the user asks to create a project with both frontend and backend components, your plan MUST create separate 'frontend' and 'backend' directories to organize the code.
    *   If the request implies multiple applications (e.g., an admin frontend and a user frontend), create descriptively named folders (e.g., 'frontend-admin', 'frontend-user', 'backend-api'). All subsequent file operations must place files in the correct directory.
    *   **Default Technologies:** If the user does not specify a language or framework, you MUST use the following defaults: For a frontend, use React with Tailwind CSS. For a backend, use Node.js. If the user *does* specify technologies, you MUST use what they have requested.

3.  **Special Handling for Vague Requests:** If the user's request is high-level or vague (e.g., "add more features", "improve my app", "read files and assess"), your primary goal is to gather context first.
    *   Your plan should **ONLY** contain 'read' operations for relevant files.
    *   Do **NOT** include 'write', 'edit', or 'command' operations in this initial discovery phase.
    *   In your analysis, explain that you are first reading files to understand the project and that you will propose specific changes in the next step, after the user approves the read-only plan.

4.  **Special Handling for "fix error" or "debug" requests**: If the user asks you to fix an error, follow this specific process:
    *   First, **Analyze Project Context** as described in step 1.
    *   Next, create a plan to **read the relevant source files** where the error is likely to be occurring.
    *   Based on your analysis of the files you read, create a plan with the necessary \`edit\` or \`write\` operations to fix the error(s).
    *   If you cannot find a specific error, your plan should read the main project files and analyze them for potential security vulnerabilities, performance issues, or other areas for improvement. Propose a plan with \`edit\` operations to fix these issues.

5.  **Analyze User Request:** For specific requests, provide a detailed analysis of the user's goal. Explain your reasoning and thought process. If an image is provided, describe how it influences your plan. Your analysis must incorporate the project context you discovered.

6.  **Plan:** Create a step-by-step plan consisting of file operations (write, edit, read, delete, etc.) and shell commands. Each step must have a clear 'purpose' and 'expectedOutcome'. Your plan should be based on the user's request and the context of the files you read. All code you generate must match the project's established coding style and conventions.

7.  **Summarize:** Provide a comprehensive summary of the entire plan, including the total number of files changed, a breakdown of operation types (e.g., 2 writes, 1 delete), and the total operations to be performed.

8.  **Suggest:** Offer a few relevant suggestions for what the user might want to do next.

**User Request:**
"{{{prompt}}}"

{{#if imageDataUri}}
**Reference Image:**
An image has been provided. Analyze it carefully to inform your plan. For example, if it's a UI mockup, your plan should generate the necessary code to implement it.
{{media url=imageDataUri}}
{{/if}}

Based on the request, generate a JSON object that strictly follows the output schema.
Ensure all file paths are relative. For any new code, provide the complete file content.
Crucially, the 'content' field for file operations must contain only the raw code, without any markdown formatting like \`\`\`javascript or \`\`\`.
`,
      });
      
      const { output } = await tempPrompt({ prompt: input.prompt, imageDataUri: input.imageDataUri });
      return output!;

    } else {
      // Use the globally defined prompt if no specific key is provided.
      const {output} = await agenticPrompt({ prompt: input.prompt, imageDataUri: input.imageDataUri });
      return output!;
    }
  }
);
