
'use server';

/**
 * @fileOverview This file defines a Genkit flow for simulating code execution.
 *
 * - executeCode - A function that takes code as input and returns a simulated execution output.
 * - ExecuteCodeInput - The input type for the executeCode function.
 * - ExecuteCodeOutput - The return type for the executeCode function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExecuteCodeInputSchema = z.object({
  code: z.string().describe('The code snippet to be executed.'),
  language: z.string().describe('The programming language of the code snippet.'),
  problemDescription: z
    .string()
    .describe('A brief description of the problem the code is trying to solve.'),
  primaryGoogleApiKey: z.string().optional().describe("The user's primary Google AI API key."),
  secondaryGoogleApiKey: z.string().optional().describe("The user's secondary Google AI API key."),
});

export type ExecuteCodeInput = z.infer<typeof ExecuteCodeInputSchema>;

const ExecuteCodeOutputSchema = z.object({
  output: z
    .string()
    .describe(
      'The simulated output of the code (e.g., stdout, return value, or error message).'
    ),
  isError: z
    .boolean()
    .describe('Whether the simulated execution resulted in an error.'),
  usedKey: z.enum(['primary', 'secondary']),
});

export type ExecuteCodeOutput = z.infer<typeof ExecuteCodeOutputSchema>;

export async function executeCode(
  input: ExecuteCodeInput
): Promise<ExecuteCodeOutput> {
  return executeCodeFlow(input);
}

const executeCodePrompt = ai.definePrompt({
  name: 'executeCodePrompt',
  input: {schema: ExecuteCodeInputSchema.omit({ primaryGoogleApiKey: true, secondaryGoogleApiKey: true })},
  output: {schema: ExecuteCodeOutputSchema.omit({ usedKey: true })},
  prompt: `You are a code execution simulator. Your task is to analyze the provided code snippet, written to solve a specific problem, and simulate its execution.

  Do not just review the code. ACT as if you are the compiler/interpreter. Run the code in your "mind" and determine what its output would be.
  - If the code runs successfully and solves the problem, provide the expected output. For example, if the problem is "find the largest element in [1, 2, 5, 3]" and the code correctly implements this, the output should be "5".
  - If the code has a syntax error, runtime error (e.g., null pointer, index out of bounds), or a logical error that would cause it to crash or produce incorrect results for standard test cases, provide a concise error message that a real interpreter would show.
  - If the code contains print statements (e.g., console.log), show what would be printed to the standard output.

  Problem Description: {{{problemDescription}}}

  Language: {{{language}}}

  Code to Simulate:
  \`\`\`{{{language}}}
  {{{code}}}
  \`\`\`

  Simulate the execution and provide the result. Set the 'isError' flag to true if the simulation results in any kind of error (syntax, runtime, etc.).
  `,
});

const executeCodeFlow = ai.defineFlow(
  {
    name: 'executeCodeFlow',
    inputSchema: ExecuteCodeInputSchema,
    outputSchema: ExecuteCodeOutputSchema,
  },
  async (input) => {
    const { primaryGoogleApiKey, secondaryGoogleApiKey, ...promptInput } = input;
    const keys: { name: 'primary' | 'secondary'; value: string }[] = [];

    if (primaryGoogleApiKey?.trim()) {
      keys.push({ name: 'primary', value: primaryGoogleApiKey });
    }
    if (secondaryGoogleApiKey?.trim()) {
      keys.push({ name: 'secondary', value: secondaryGoogleApiKey });
    }

    if (keys.length === 0) {
      // The Genkit plugin throws FAILED_PRECONDITION when no key is provided.
      // We throw a more user-friendly error message here to be caught by the client.
      throw new Error('A valid Google AI API key is required. Please go to Settings to add your key.');
    }

    let lastError: any = null;
    for (const key of keys) {
        try {
            const { output } = await executeCodePrompt(promptInput, { auth: key.value });
            return { ...output!, usedKey: key.name };
        } catch (e: any) {
            lastError = e;
            const isQuotaError = e.message?.includes('429') || e.status === 'RESOURCE_EXHAUSTED' || e.details?.includes('quota');
            if (!isQuotaError) {
                break;
            }
        }
    }
    throw lastError || new Error('AI flow failed for an unknown reason.');
  }
);
