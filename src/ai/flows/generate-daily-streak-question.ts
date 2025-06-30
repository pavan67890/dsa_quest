
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
  primaryGoogleApiKey: z.string().optional().describe("The user's primary Google AI API key."),
  secondaryGoogleApiKey: z.string().optional().describe("The user's secondary Google AI API key."),
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
  usedKey: z.enum(['primary', 'secondary']),
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
  input: {schema: GenerateDailyStreakQuestionInputSchema.omit({ primaryGoogleApiKey: true, secondaryGoogleApiKey: true })},
  output: {schema: GenerateDailyStreakQuestionOutputSchema.omit({ usedKey: true })},
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
            const { output } = await prompt(promptInput, { auth: key.value });
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
