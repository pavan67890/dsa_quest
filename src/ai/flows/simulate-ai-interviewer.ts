'use server';

/**
 * @fileOverview Simulates an AI interviewer that dynamically generates questions and provides feedback.
 *
 * - simulateAiInterviewer - A function that simulates the AI interview process.
 * - SimulateAiInterviewerInput - The input type for the simulateAiInterviewer function.
 * - SimulateAiInterviewerOutput - The return type for the simulateAiInterviewer function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SimulateAiInterviewerInputSchema = z.object({
  userResponse: z.string().describe("The user's response to the interviewer's question."),
  interviewerPrompt: z.string().describe('The initial prompt or role for the AI interviewer.'),
  previousConversationSummary: z
    .string()
    .describe('A short summary of the previous conversation to maintain context.'),
  question: z.string().describe('The current question asked by the interviewer.'),
  primaryApiKey: z.string().describe("The user's primary API key for the AI model."),
  backupApiKey: z.string().describe("The user's backup API key for the AI model."),
});

export type SimulateAiInterviewerInput = z.infer<typeof SimulateAiInterviewerInputSchema>;

const SimulateAiInterviewerOutputSchema = z.object({
  interviewerResponse: z.string().describe("The AI interviewer's response to the user."),
  nextQuestion: z.string().describe('The next question from the AI interviewer.'),
  conversationSummary:
    z.string()
      .describe('A summary of the current interviewer question and user response.'),
  sentiment: z.string().describe('The sentiment of the conversation for interviewer image changing.'),
  codeReview: z.string().optional().describe('The AI code review and suggestions if applicable'),
});

export type SimulateAiInterviewerOutput = z.infer<typeof SimulateAiInterviewerOutputSchema>;

export async function simulateAiInterviewer(
  input: SimulateAiInterviewerInput
): Promise<SimulateAiInterviewerOutput> {
  return simulateAiInterviewerFlow(input);
}

const simulateAiInterviewerPrompt = ai.definePrompt({
  name: 'simulateAiInterviewerPrompt',
  input: {schema: SimulateAiInterviewerInputSchema},
  output: {schema: SimulateAiInterviewerOutputSchema},
  prompt: `You are an AI interviewer conducting a mock interview. Your role is to ask relevant questions, provide feedback, and assess the candidate's performance.

  Interviewer Prompt: {{{interviewerPrompt}}}
  Previous Conversation Summary: {{{previousConversationSummary}}}
  Interviewer Question: {{{question}}}
  User Response: {{{userResponse}}}

  Based on the user's response, generate:
  - interviewerResponse: Your response to the user.
  - nextQuestion: The next question you should ask the user.
  - conversationSummary: A summary of the current interviewer question and user response.
  - sentiment: The sentiment of the conversation (e.g., positive, neutral, negative) for interviewer image changing.
  - codeReview: If the user response contains code, review the code written by the candidate, provide suggestions and improvements.

  Format your response as a JSON object.
`,
});

const simulateAiInterviewerFlow = ai.defineFlow(
  {
    name: 'simulateAiInterviewerFlow',
    inputSchema: SimulateAiInterviewerInputSchema,
    outputSchema: SimulateAiInterviewerOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await simulateAiInterviewerPrompt(input, {
        auth: input.primaryApiKey,
      });
      return output!;
    } catch (e) {
      console.warn('Primary API key failed for interviewer simulation, trying backup key.', e);
      const { output } = await simulateAiInterviewerPrompt(input, {
        auth: input.backupApiKey,
      });
      return output!;
    }
  }
);
