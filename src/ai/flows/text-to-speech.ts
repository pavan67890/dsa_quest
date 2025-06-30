
'use server';

/**
 * @fileOverview Converts text to speech using Genkit.
 *
 * - textToSpeech - A function that converts text into an audio data URI.
 * - TextToSpeechInput - The input type for the textToSpeech function.
 * - TextToSpeechOutput - The return type for the textToSpeech function.
 */

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';
import wav from 'wav';

const TextToSpeechInputSchema = z.object({
  text: z.string().describe('The text to convert to speech.'),
  primaryGoogleApiKey: z.string().optional().describe("The user's primary Google AI API key for TTS."),
  secondaryGoogleApiKey: z.string().optional().describe("The user's secondary Google AI API key for TTS."),
});
export type TextToSpeechInput = z.infer<typeof TextToSpeechInputSchema>;

const TextToSpeechOutputSchema = z.object({
  audioDataUri: z.string().describe('The audio data as a base64-encoded WAV data URI.'),
  usedKey: z.enum(['primary', 'secondary']),
});
export type TextToSpeechOutput = z.infer<typeof TextToSpeechOutputSchema>;

export async function textToSpeech(input: TextToSpeechInput): Promise<TextToSpeechOutput> {
  return textToSpeechFlow(input);
}

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const bufs: Buffer[] = [];
    writer.on('error', reject);
    writer.on('data', (d: Buffer) => {
      bufs.push(d);
    });
    writer.on('end', () => {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

const textToSpeechFlow = ai.defineFlow(
  {
    name: 'textToSpeechFlow',
    inputSchema: TextToSpeechInputSchema,
    outputSchema: TextToSpeechOutputSchema,
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
            const generateOptions = {
                model: googleAI.model('gemini-2.5-flash-preview-tts'),
                config: {
                    responseModalities: ['AUDIO' as const],
                    speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Leda' },
                    },
                    },
                },
                prompt: promptInput.text,
            };
            const { media } = await ai.generate(
                generateOptions,
                { auth: key.value }
            );
            
            if (!media) {
                throw new Error('No audio media returned from TTS model.');
            }

            const audioBuffer = Buffer.from(
                media.url.substring(media.url.indexOf(',') + 1),
                'base64'
            );

            const wavBase64 = await toWav(audioBuffer);
            
            return {
                audioDataUri: `data:audio/wav;base64,${wavBase64}`,
                usedKey: key.name,
            };
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
