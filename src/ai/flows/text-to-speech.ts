
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
  primaryApiKey: z.string().optional().describe("The user's primary Google AI API key for TTS."),
  secondaryApiKey: z.string().optional().describe("The user's secondary Google AI API key for TTS fallback."),
});
export type TextToSpeechInput = z.infer<typeof TextToSpeechInputSchema>;

const TextToSpeechOutputSchema = z.object({
  audioDataUri: z.string().describe('The audio data as a base64-encoded WAV data URI.'),
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
    const { primaryApiKey, secondaryApiKey, ...promptInput } = input;

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

    async function executeTTS(apiKey: string) {
        const { media } = await ai.generate(
            generateOptions,
            { auth: apiKey }
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
        };
    }
    
    if (primaryApiKey?.trim()) {
      try {
        return await executeTTS(primaryApiKey);
      } catch (e: any) {
        if (e.message?.includes('429') && secondaryApiKey?.trim()) {
          return await executeTTS(secondaryApiKey);
        }
        throw e;
      }
    } else if (secondaryApiKey?.trim()) {
      return await executeTTS(secondaryApiKey);
    }

    throw new Error('A valid Google AI API key is required. Please go to Settings to add your key.');
  }
);
