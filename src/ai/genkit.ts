import {genkit} from 'genkit';
import {googleAI, openAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    googleAI(),
    openAI({
      apiBaseUrl: 'https://openrouter.ai/api/v1',
    }),
  ],
  model: 'openai/mixtral-8x7b-groq',
});
