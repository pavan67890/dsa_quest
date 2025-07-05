
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
    .describe(
      'An array of names of the modules the user has fully completed.'
    ),
  primaryApiKey: z.string().optional().describe("The user's primary Google AI API key."),
  secondaryApiKey: z.string().optional().describe("The user's secondary Google AI API key for fallback."),
});
export type GenerateDailyStreakQuestionInput = z.infer<
  typeof GenerateDailyStreakQuestionInputSchema
>;

const GenerateDailyStreakQuestionOutputSchema = z.object({
  question: z.string().describe('The generated daily streak question.'),
  module: z.string().describe('The module the question is from.'),
  level: z
    .string()
    .describe(
      "The conceptual difficulty of the question (e.g., 'Easy', 'Medium', 'Hard')."
    ),
  keyUsed: z.enum(['primary', 'secondary']).describe('Which API key was used for the request.'),
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
  input: {schema: GenerateDailyStreakQuestionInputSchema.omit({ primaryApiKey: true, secondaryApiKey: true })},
  output: {schema: GenerateDailyStreakQuestionOutputSchema.omit({ keyUsed: true })},
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
    const { primaryApiKey, secondaryApiKey, ...promptInput } = input;
    
    if (primaryApiKey?.trim()) {
      try {
        const { output } = await prompt(promptInput, { auth: primaryApiKey });
        if (!output) throw new Error('The AI model did not return a valid output.');
        return {...output, keyUsed: 'primary'};
      } catch (e: any) {
        if (e.message?.includes('429') && secondaryApiKey?.trim()) {
          const { output } = await prompt(promptInput, { auth: secondaryApiKey });
          if (!output) throw new Error('The AI model did not return a valid output on fallback.');
          return {...output, keyUsed: 'secondary'};
        }
        throw e;
      }
    } else if (secondaryApiKey?.trim()) {
      const { output } = await prompt(promptInput, { auth: secondaryApiKey });
      if (!output) throw new Error('The AI model did not return a valid output.');
      return {...output, keyUsed: 'secondary'};
    }

    throw new Error('A valid API key is required. Please go to Settings to add your key.');
  }
);
