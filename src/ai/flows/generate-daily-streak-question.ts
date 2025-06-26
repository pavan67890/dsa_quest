'use server';

/**
 * @fileOverview Generates a daily streak question based on the user's completed modules and levels.
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
    .describe('An array of names of the modules the user has completed.'),
  completedLevels: z
    .array(z.string())
    .describe('An array of IDs of the levels the user has completed.'),
});
export type GenerateDailyStreakQuestionInput = z.infer<
  typeof GenerateDailyStreakQuestionInputSchema
>;

const GenerateDailyStreakQuestionOutputSchema = z.object({
  question: z.string().describe('The generated daily streak question.'),
  module: z.string().describe('The module the question is from.'),
  level: z.string().describe('The level the question is from.'),
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
  prompt: `You are an expert interviewer, designing daily streak questions for DSA Quest. The questions should be based on modules and levels that the user has completed, to reinforce their understanding of previously learned concepts.

  Completed Modules: {{completedModules}}
  Completed Levels: {{completedLevels}}

  Generate a question that reinforces the user's understanding of these concepts. Return the question, the module it belongs to, and the specific level it relates to.
  Make the question challenging, but fair, to continuously reinforce their knowledge.
  The question should assess the users understanding of DSA concepts.

  Return the question, module, and level in JSON format.
`,
});

const generateDailyStreakQuestionFlow = ai.defineFlow(
  {
    name: 'generateDailyStreakQuestionFlow',
    inputSchema: GenerateDailyStreakQuestionInputSchema,
    outputSchema: GenerateDailyStreakQuestionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
