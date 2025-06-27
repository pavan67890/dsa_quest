'use server';

/**
 * @fileOverview Generates a daily streak question based on the user's completed modules.
 *
 * - generateDailyStreakQuestion - A function that generates a daily streak question.
 * - GenerateDailyStreakQuestionInput - The input type for the generateDailyStreakQuestion function.
 * - GenerateDailyStreakQuestionOutput - The return type for the generateDailyStreakQuestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateDailyStreakQuestionInputSchema = z.object({
  completedModules: z
    .array(z.string())
    .describe('An array of names of the modules the user has fully completed.'),
  primaryApiKey: z.string().describe("The user's primary API key for the AI model."),
  backupApiKey: z.string().describe("The user's backup API key for the AI model."),
});
export type GenerateDailyStreakQuestionInput = z.infer<
  typeof GenerateDailyStreakQuestionInputSchema
>;

const GenerateDailyStreakQuestionOutputSchema = z.object({
  question: z.string().describe('The generated daily streak question.'),
  module: z.string().describe('The module the question is from.'),
  level: z.string().describe("The conceptual difficulty of the question (e.g., 'Easy', 'Medium', 'Hard')."),
});
export type GenerateDailyStreakQuestionOutput = z.infer<
  typeof GenerateDailyStreakQuestionOutputSchema
>;

export async function generateDailyStreakQuestion(
  input: GenerateDailyStreakQuestionInput
): Promise<GenerateDailyStreakQuestionOutput> {
  return generateDailyStreakQuestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDailyStreakQuestionPrompt',
  input: {schema: GenerateDailyStreakQuestionInputSchema},
  output: {schema: GenerateDailyStreakQuestionOutputSchema},
  prompt: `You are an expert interviewer, designing daily streak questions for DSA Quest. The questions should be based on modules that the user has fully completed, to reinforce their understanding of previously learned concepts.

  Generate a challenging but fair question from one of the following completed modules:
  {{#each completedModules}}
  - {{{this}}}
  {{/each}}

  The question should assess the user's understanding of DSA concepts from one of those modules.
  The question should not be a simple definition, but a problem that requires some thought.
  When providing the 'level', it does not need to correspond to an exact level from the training data, but can be a conceptual difficulty like 'Easy', 'Medium', or 'Hard'.

  Return the question, module, and level in JSON format.
`,
});

const generateDailyStreakQuestionFlow = ai.defineFlow(
  {
    name: 'generateDailyStreakQuestionFlow',
    inputSchema: GenerateDailyStreakQuestionInputSchema,
    outputSchema: GenerateDailyStreakQuestionOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await prompt(input, { auth: input.primaryApiKey });
      return output!;
    } catch (e) {
      console.warn('Primary API key failed for daily question, trying backup key.', e);
      const { output } = await prompt(input, { auth: input.backupApiKey });
      return output!;
    }
  }
);
