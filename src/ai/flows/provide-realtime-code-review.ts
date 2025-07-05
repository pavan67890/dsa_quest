
/**
 * @fileOverview This file defines a Genkit flow for providing real-time code review during a DSA interview simulation.
 *
 * - provideRealtimeCodeReview - A function that takes code as input and returns AI-powered feedback on correctness, efficiency, and style.
 * - ProvideRealtimeCodeReviewInput - The input type for the provideRealtimeCodeReview function.
 * - ProvideRealtimeCodeReviewOutput - The return type for the provideRealtimeCodeReview function.
 */

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProvideRealtimeCodeReviewInputSchema = z.object({
  code: z.string().describe('The code snippet to be reviewed.'),
  language: z.string().describe('The programming language of the code snippet.'),
  problemDescription: z
    .string()
    .describe('A brief description of the problem the code is trying to solve.'),
  previousFeedback: z
    .string()
    .optional()
    .describe(
      'Previous feedback provided to the user on their code. Useful for maintaining context.'
    ),
  primaryApiKey: z.string().optional().describe("The user's primary Google AI API key."),
  secondaryApiKey: z.string().optional().describe("The user's secondary Google AI API key for fallback."),
});

export type ProvideRealtimeCodeReviewInput = z.infer<
  typeof ProvideRealtimeCodeReviewInputSchema
>;

const ProvideRealtimeCodeReviewOutputSchema = z.object({
  feedback: z
    .string()
    .describe(
      'AI-powered feedback on the code snippet, including correctness, efficiency, and style.'
    ),
  revisedCode: z
    .string()
    .optional()
    .describe(
      'The revised code snippet with AI-powered code improvement suggestions.'
    ),
  explanation: z
    .string()
    .optional()
    .describe(
      'Explanation of what each of changes mean and why they were made.'
    ),
  keyUsed: z.enum(['primary', 'secondary']).describe('Which API key was used for the request.'),
});

export type ProvideRealtimeCodeReviewOutput = z.infer<
  typeof ProvideRealtimeCodeReviewOutputSchema
>;

export async function provideRealtimeCodeReview(
  input: ProvideRealtimeCodeReviewInput
): Promise<ProvideRealtimeCodeReviewOutput> {
  return provideRealtimeCodeReviewFlow(input);
}

const provideRealtimeCodeReviewPrompt = ai.definePrompt({
  name: 'provideRealtimeCodeReviewPrompt',
  input: {schema: ProvideRealtimeCodeReviewInputSchema.omit({ primaryApiKey: true, secondaryApiKey: true })},
  output: {schema: ProvideRealtimeCodeReviewOutputSchema.omit({ keyUsed: true })},
  prompt: `You are an expert code reviewer specializing in data structures and algorithms.

  You will provide feedback to the user on their code, focusing on correctness, efficiency, and style. 
  You may also suggest code revisions and provide an explanation for the changes.
  Consider the problem the code is trying to solve when providing feedback.
  Try to suggest using more optimal solutions.

  Problem Description: {{{problemDescription}}}

  Previous Feedback: {{#if previousFeedback}}{{{previousFeedback}}}{{else}}No previous feedback provided{{/if}}

  Code:
  \`\`\`{{{language}}}}\n  {{{code}}}\n  \`\`\`
  `,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

const provideRealtimeCodeReviewFlow = ai.defineFlow(
  {
    name: 'provideRealtimeCodeReviewFlow',
    inputSchema: ProvideRealtimeCodeReviewInputSchema,
    outputSchema: ProvideRealtimeCodeReviewOutputSchema,
  },
  async (input) => {
    const { primaryApiKey, secondaryApiKey, ...promptInput } = input;
    
    if (primaryApiKey?.trim()) {
      try {
        const { output } = await provideRealtimeCodeReviewPrompt(promptInput, { auth: primaryApiKey });
        if (!output) throw new Error('The AI model did not return a valid output.');
        return {...output, keyUsed: 'primary'};
      } catch (e: any) {
        if (e.message?.includes('429') && secondaryApiKey?.trim()) {
          const { output } = await provideRealtimeCodeReviewPrompt(promptInput, { auth: secondaryApiKey });
          if (!output) throw new Error('The AI model did not return a valid output on fallback.');
          return {...output, keyUsed: 'secondary'};
        }
        throw e;
      }
    } else if (secondaryApiKey?.trim()) {
      const { output } = await provideRealtimeCodeReviewPrompt(promptInput, { auth: secondaryApiKey });
      if (!output) throw new Error('The AI model did not return a valid output.');
      return {...output, keyUsed: 'secondary'};
    }

    throw new Error('A valid API key is required. Please go to Settings to add your key.');
  }
);
