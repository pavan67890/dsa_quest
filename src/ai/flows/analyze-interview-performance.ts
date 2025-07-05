
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
  primaryApiKey: z.string().optional().describe("The user's primary Google AI API key."),
  secondaryApiKey: z.string().optional().describe("The user's secondary Google AI API key for fallback."),
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
    keyUsed: z.enum(['primary', 'secondary']).describe('Which API key was used for the request.'),
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
  input: {schema: AnalyzeInterviewPerformanceInputSchema.omit({ primaryApiKey: true, secondaryApiKey: true })},
  output: {schema: AnalyzeInterviewPerformanceOutputSchema.omit({ keyUsed: true })},
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
    const { primaryApiKey, secondaryApiKey, ...promptInput } = input;
    
    if (primaryApiKey?.trim()) {
      try {
        const { output } = await analyzeInterviewPerformancePrompt(promptInput, { auth: primaryApiKey });
        if (!output) throw new Error('The AI model did not return a valid output.');
        return {...output, keyUsed: 'primary'};
      } catch (e: any) {
        if (e.message?.includes('429') && secondaryApiKey?.trim()) {
          const { output } = await analyzeInterviewPerformancePrompt(promptInput, { auth: secondaryApiKey });
          if (!output) throw new Error('The AI model did not return a valid output on fallback.');
          return {...output, keyUsed: 'secondary'};
        }
        throw e;
      }
    } else if (secondaryApiKey?.trim()) {
      const { output } = await analyzeInterviewPerformancePrompt(promptInput, { auth: secondaryApiKey });
      if (!output) throw new Error('The AI model did not return a valid output.');
      return {...output, keyUsed: 'secondary'};
    }

    throw new Error('A valid API key is required. Please go to Settings to add your key.');
  }
);
