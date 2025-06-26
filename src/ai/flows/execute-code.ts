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
  primaryApiKey: z.string().describe("The user's primary API key for the AI model."),
  backupApiKey: z.string().describe("The user's backup API key for the AI model."),
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
});

export type ExecuteCodeOutput = z.infer<typeof ExecuteCodeOutputSchema>;

export async function executeCode(
  input: ExecuteCodeInput
): Promise<ExecuteCodeOutput> {
  return executeCodeFlow(input);
}

const executeCodePrompt = ai.definePrompt({
  name: 'executeCodePrompt',
  input: {schema: ExecuteCodeInputSchema},
  output: {schema: ExecuteCodeOutputSchema},
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
    try {
      const { output } = await executeCodePrompt(input, {
        auth: input.primaryApiKey,
      });
      return output!;
    } catch (e) {
      console.warn('Primary API key failed for code execution, trying backup key.', e);
      const { output } = await executeCodePrompt(input, {
        auth: input.backupApiKey,
      });
      return output!;
    }
  }
);
