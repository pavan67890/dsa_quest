
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
  userResponse: z
    .string()
    .describe("The user's response to the interviewer's question."),
  interviewerPrompt: z
    .string()
    .describe('The initial prompt or role for the AI interviewer.'),
  previousConversationSummary: z
    .string()
    .describe(
      'A short summary of the previous conversation to maintain context.'
    ),
  question: z.string().describe('The current question asked by the interviewer.'),
  primaryGoogleApiKey: z.string().optional().describe("The user's primary Google AI API key."),
  secondaryGoogleApiKey: z.string().optional().describe("The user's secondary Google AI API key."),
});

export type SimulateAiInterviewerInput = z.infer<
  typeof SimulateAiInterviewerInputSchema
>;

const SimulateAiInterviewerOutputSchema = z.object({
  interviewerResponse: z
    .string()
    .describe("The AI interviewer's response to the user."),
  nextQuestion: z
    .string()
    .describe('The next question from the AI interviewer.'),
  conversationSummary: z
    .string()
    .describe(
      'A summary of the current interviewer question and user response.'
    ),
  sentiment: z
    .string()
    .describe(
      'The sentiment of the conversation for interviewer image changing.'
    ),
  codeReview: z
    .string()
    .optional()
    .describe(
      'The AI code review and suggestions if applicable'
    ),
  usedKey: z.enum(['primary', 'secondary']),
});

export type SimulateAiInterviewerOutput = z.infer<
  typeof SimulateAiInterviewerOutputSchema
>;

export async function simulateAiInterviewer(
  input: SimulateAiInterviewerInput
): Promise<SimulateAiInterviewerOutput> {
  return simulateAiInterviewerFlow(input);
}

const simulateAiInterviewerPrompt = ai.definePrompt({
  name: 'simulateAiInterviewerPrompt',
  input: {schema: SimulateAiInterviewerInputSchema.omit({ primaryGoogleApiKey: true, secondaryGoogleApiKey: true })},
  output: {schema: SimulateAiInterviewerOutputSchema.omit({ usedKey: true })},
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
            const { output } = await simulateAiInterviewerPrompt(promptInput, { auth: key.value });
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
