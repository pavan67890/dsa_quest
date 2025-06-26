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
  primaryApiKey: z.string().describe("The user's primary API key for the AI model."),
  backupApiKey: z.string().describe("The user's backup API key for the AI model."),
});

export type AnalyzeInterviewPerformanceInput = z.infer<
  typeof AnalyzeInterviewPerformanceInputSchema
>;

const AnalyzeInterviewPerformanceOutputSchema = z.object({
  summary: z.string().describe('A summary of the interview performance.'),
  strengths: z.string().describe('Key strengths demonstrated during the interview.'),
  weaknesses: z.string().describe('Areas where the interviewee needs improvement.'),
  improvementAreas: z
    .string()
    .describe('Specific actions the interviewee can take to improve.'),
  xpPoints: z
    .number()
    .describe('The amount of experience points earned based on interview performance.'),
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
  input: {schema: AnalyzeInterviewPerformanceInputSchema},
  output: {schema: AnalyzeInterviewPerformanceOutputSchema},
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
    try {
      const { output } = await analyzeInterviewPerformancePrompt(input, {
        auth: input.primaryApiKey,
      });
      return output!;
    } catch (e) {
      console.warn('Primary API key failed for performance analysis, trying backup key.', e);
      const { output } = await analyzeInterviewPerformancePrompt(input, {
        auth: input.backupApiKey,
      });
      return output!;
    }
  }
);
