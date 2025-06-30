
'use server';

/**
 * @fileOverview This file defines a Genkit flow for analyzing a mock interview performance.
 *
 * - analyzeInterviewPerformance - A function that analyzes the interview transcript and provides feedback.
 * - AnalyzeInterviewPerformanceInput - The input type for the analyzeInterviewPerformance function.
 * - AnalyzeInterviewPerformanceOutput - The return type for the analyzeInterviewPerformance function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeInterviewPerformanceInputSchema = z.object({
  interviewTranscript: z
    .string()
    .describe('The complete transcript of the mock interview.'),
  primaryGoogleApiKey: z.string().optional().describe("The user's primary Google AI API key."),
  secondaryGoogleApiKey: z.string().optional().describe("The user's secondary Google AI API key."),
});

export type AnalyzeInterviewPerformanceInput = z.infer<
  typeof AnalyzeInterviewPerformanceInputSchema
>;

const AnalyzeInterviewPerformanceOutputSchema = z.object({
  summary: z.string().describe('A summary of the interview performance.'),
  strengths: z
    .string()
    .describe('Key strengths demonstrated during the interview.'),
  weaknesses: z
    .string()
    .describe('Areas where the interviewee needs improvement.'),
  improvementAreas: z
    .string()
    .describe('Specific actions the interviewee can take to improve.'),
  xpPoints: z
    .number()
    .describe(
      'The amount of experience points earned based on interview performance.'
    ),
  usedKey: z.enum(['primary', 'secondary']),
});

export type AnalyzeInterviewPerformanceOutput = z.infer<
  typeof AnalyzeInterviewPerformanceOutputSchema
>;

export async function analyzeInterviewPerformance(
  input: AnalyzeInterviewPerformanceInput
): Promise<AnalyzeInterviewPerformanceOutput> {
  return analyzeInterviewPerformanceFlow(input);
}

const analyzeInterviewPerformancePrompt = ai.definePrompt({
  name: 'analyzeInterviewPerformancePrompt',
  input: {schema: AnalyzeInterviewPerformanceInputSchema.omit({ primaryGoogleApiKey: true, secondaryGoogleApiKey: true })},
  output: {schema: AnalyzeInterviewPerformanceOutputSchema.omit({ usedKey: true })},
  prompt: `You are an AI-powered interview performance analyzer. You will receive the transcript of a mock interview and provide a detailed analysis of the candidate's performance.

  Based on the interview transcript, provide a summary of the candidate's performance, highlighting their key strengths and weaknesses. Also, suggest specific actions the candidate can take to improve their skills.

  Finally, assign experience points to the user between 0 and 100 based on their interview performance. Better performance should be awarded more experience points.

  Interview Transcript:
  {{interviewTranscript}}`,
});

const analyzeInterviewPerformanceFlow = ai.defineFlow(
  {
    name: 'analyzeInterviewPerformanceFlow',
    inputSchema: AnalyzeInterviewPerformanceInputSchema,
    outputSchema: AnalyzeInterviewPerformanceOutputSchema,
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
            const { output } = await analyzeInterviewPerformancePrompt(promptInput, { auth: key.value });
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
