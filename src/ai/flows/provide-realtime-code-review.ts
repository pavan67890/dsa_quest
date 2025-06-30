
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
  primaryGoogleApiKey: z.string().optional().describe("The user's primary Google AI API key."),
  secondaryGoogleApiKey: z.string().optional().describe("The user's secondary Google AI API key."),
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
  usedKey: z.enum(['primary', 'secondary']),
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
  input: {schema: ProvideRealtimeCodeReviewInputSchema.omit({ primaryGoogleApiKey: true, secondaryGoogleApiKey: true })},
  output: {schema: ProvideRealtimeCodeReviewOutputSchema.omit({ usedKey: true })},
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
    const { primaryGoogleApiKey, secondaryGoogleApiKey, ...promptInput } = input;
    const keys: { name: 'primary' | 'secondary'; value: string }[] = [];

    if (primaryGoogleApiKey && primaryGoogleApiKey.trim()) {
      keys.push({ name: 'primary', value: primaryGoogleApiKey });
    }
    if (secondaryGoogleApiKey && secondaryGoogleApiKey.trim()) {
      keys.push({ name: 'secondary', value: secondaryGoogleApiKey });
    }

    if (keys.length === 0) {
      // The Genkit plugin throws FAILED_PRECONDITION when no key is provided.
      // We throw a more user-friendly error message here to be caught by the client.
      throw new Error('An API key is required. Please go to Settings to add your key.');
    }

    let lastError: any = null;
    for (const key of keys) {
        try {
            const { output } = await provideRealtimeCodeReviewPrompt(promptInput, { auth: key.value });
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
