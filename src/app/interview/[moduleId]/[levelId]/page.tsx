'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dsaModules } from '@/lib/dsa-modules';
import useLocalStorage from '@/hooks/useLocalStorage';
import { useToast } from '@/hooks/use-toast';
import { simulateAiInterviewer } from '@/ai/flows/simulate-ai-interviewer';
import { provideRealtimeCodeReview } from '@/ai/flows/provide-realtime-code-review';
import { analyzeInterviewPerformance } from '@/ai/flows/analyze-interview-performance';
import { textToSpeech } from '@/ai/flows/text-to-speech';
import { ApiKeyDialog } from '@/components/ApiKeyDialog';
import { Loader, Send, Code, Mic, SkipForward, ArrowLeft, Star, HeartCrack } from 'lucide-react';

type Progress = { [moduleId: string]: { unlockedLevel: number; lives: number } };
type ApiKeys = { primaryApiKey: string; backupApiKey: string };
type Conversation = { speaker: 'interviewer' | 'user'; text: string, code?: string };
type InterviewerImageInfo = { src: string; hint: string };

const interviewerImages: Record<string, InterviewerImageInfo> = {
  neutral:   { src: `https://placehold.co/1024x1024.png`, hint: 'professional woman office' },
  curious:   { src: `https://placehold.co/1024x1024.png`, hint: 'curious woman thinking' },
  satisfied: { src: `https://placehold.co/1024x1024.png`, hint: 'satisfied woman smiling' },
  happy:     { src: `https://placehold.co/1024x1024.png`, hint: 'happy woman celebrating' },
  angry:     { src: `https://placehold.co/1024x1024.png`, hint: 'annoyed woman frowning' },
};

export default function InterviewPage() {
  const router = useRouter();
  const params = useParams() as { moduleId: string; levelId: string };
  const { toast } = useToast();
  const [apiKeys] = useLocalStorage<ApiKeys>('api-keys', { primaryApiKey: '', backupApiKey: '' });
  const [progress, setProgress] = useLocalStorage<Progress>('user-progress', {});
  const [xp, setXp] = useLocalStorage('user-xp', 0);
  const [earnedBadges, setEarnedBadges] = useLocalStorage<string[]>('earned-badges', []);
  
  const [isApiKeyDialogOpen, setIsApiKeyDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [conversation, setConversation] = useState<Conversation[]>([]);
  const [sentiment, setSentiment] = useState('neutral');
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [userCode, setUserCode] = useState('');
  const [isInterviewOver, setIsInterviewOver] = useState(false);
  const [finalReport, setFinalReport] = useState<any>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const module = dsaModules.find((m) => m.id === params.moduleId);
  const level = module?.levels.find((l) => l.id.toString() === params.levelId);
  const dialogueEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!apiKeys.primaryApiKey || !apiKeys.backupApiKey) {
      setIsApiKeyDialogOpen(true);
    } else if (level) {
      const initialText = `Hello! Welcome to your interview. Let's start with this question: ${level.question}`;
      setConversation([{ speaker: 'interviewer', text: initialText }]);
      textToSpeech(initialText)
        .then(res => setAudioUrl(res.audioDataUri))
        .catch(err => console.error("Initial TTS failed", err));
    }
  }, [apiKeys, level]);

  useEffect(() => {
    dialogueEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  useEffect(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.play().catch(e => console.error("Audio playback failed:", e));
    }
  }, [audioUrl]);
  
  const handleSendMessage = async () => {
    if (!userInput.trim() && !userCode.trim()) return;
    setIsLoading(true);

    const currentConversation: Conversation = { speaker: 'user', text: userInput, code: showCodeEditor ? userCode : undefined };
    const newConversation = [...conversation, currentConversation];
    setConversation(newConversation);

    const conversationHistory = newConversation.map(c => `${c.speaker}: ${c.text} ${c.code ? `\nCODE:\n${c.code}`:''}`).join('\n');

    try {
        let aiResponse;
        if(showCodeEditor) {
            const review = await provideRealtimeCodeReview({ code: userCode, language: 'javascript', problemDescription: level?.question || '' });
            aiResponse = await simulateAiInterviewer({
                userResponse: `${userInput}\n\nCode Submitted:\n${userCode}\n\nAI Code Review:\n${review.feedback}`,
                interviewerPrompt: 'You are a friendly but sharp technical interviewer.',
                previousConversationSummary: conversationHistory,
                question: level?.question || '',
                primaryApiKey: apiKeys.primaryApiKey,
                backupApiKey: apiKeys.backupApiKey,
            });
            aiResponse.interviewerResponse = `${review.feedback}\n\n${aiResponse.interviewerResponse}`;
        } else {
             aiResponse = await simulateAiInterviewer({
                userResponse: userInput,
                interviewerPrompt: 'You are a friendly but sharp technical interviewer.',
                previousConversationSummary: conversationHistory,
                question: conversation[conversation.length - 1].text,
                primaryApiKey: apiKeys.primaryApiKey,
                backupApiKey: apiKeys.backupApiKey,
            });
        }
      
      const interviewerText = aiResponse.interviewerResponse;
      setConversation([...newConversation, { speaker: 'interviewer', text: interviewerText }]);
      setSentiment(aiResponse.sentiment.toLowerCase() || 'neutral');

      // TTS - fire and forget
      textToSpeech(interviewerText)
        .then(ttsResponse => {
            setAudioUrl(ttsResponse.audioDataUri);
        })
        .catch(ttsError => {
            console.error('TTS Error:', ttsError);
        });

      // Simple logic to end interview or show code editor
      if (aiResponse.nextQuestion.toLowerCase().includes('write the code') || aiResponse.nextQuestion.toLowerCase().includes('show me the code')) {
        setShowCodeEditor(true);
      }
      if (aiResponse.nextQuestion.toLowerCase().includes('thank you for your time')) {
        endInterview();
      }

    } catch (error) {
      toast({
        title: 'AI Error',
        description: 'Could not get a response from the AI. Check your API keys or try again.',
        variant: 'destructive',
      });
    } finally {
      setUserInput('');
      setUserCode('');
      setIsLoading(false);
    }
  };

  const endInterview = async () => {
    setIsLoading(true);
    const transcript = conversation.map(c => `${c.speaker}: ${c.text}`).join('\n');
    try {
        const report = await analyzeInterviewPerformance({ interviewTranscript: transcript });
        setFinalReport(report);
        setIsInterviewOver(true);

        // Logic for pass/fail
        const passed = report.xpPoints > 50;
        const currentModuleProgress = progress[module!.id] || { unlockedLevel: 1, lives: module!.initialLives };
        
        if (passed) {
            const nextLevel = (level?.id || 0) + 1;
            const newProgress = {
                ...progress,
                [module!.id]: {
                    ...currentModuleProgress,
                    unlockedLevel: Math.max(currentModuleProgress.unlockedLevel, nextLevel),
                },
            };
            if(module && module.levels.length < nextLevel && !earnedBadges.includes(module.id)) {
                setEarnedBadges([...earnedBadges, module.id]);
            }
            setProgress(newProgress);
            setXp(xp + report.xpPoints);
        } else {
            const newLives = currentModuleProgress.lives - 1;
            let newProgress;
            if (newLives <= 0) {
                newProgress = { ...progress, [module!.id]: { unlockedLevel: 1, lives: module!.initialLives }};
            } else {
                newProgress = { ...progress, [module!.id]: { ...currentModuleProgress, lives: newLives } };
            }
            setProgress(newProgress);
        }

    } catch(error) {
        toast({ title: 'Error Analyzing Performance', description: 'Could not generate the final report.', variant: 'destructive' });
    }
    setIsLoading(false);
  };
  
  if (!module || !level) return null;

  const currentImage = interviewerImages[sentiment.toLowerCase()] || interviewerImages.neutral;

  return (
    <>
      <ApiKeyDialog isOpen={isApiKeyDialogOpen} />
      <div className="relative h-screen w-screen overflow-hidden bg-black">
        <AnimatePresence>
            <motion.div
                key={sentiment}
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
                className="absolute inset-0"
            >
                <Image
                src={currentImage.src}
                alt="AI Interviewer"
                fill
                className="object-cover"
                data-ai-hint={currentImage.hint}
                />
                <div className="absolute inset-0 bg-black/30"></div>
            </motion.div>
        </AnimatePresence>
        
        <Button onClick={() => router.back()} variant="ghost" className="absolute top-4 left-4 text-white bg-black/50 hover:bg-black/70 hover:text-white">
            <ArrowLeft className="mr-2 h-4 w-4"/> Back to Levels
        </Button>

        <audio ref={audioRef} src={audioUrl || ''} />

        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 flex flex-col gap-4">
          <div className="h-40 max-h-40 overflow-y-auto p-4 rounded-lg bg-black/70 backdrop-blur-sm text-white font-body text-lg space-y-2">
            <AnimatePresence>
              {conversation.map((c, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className={c.speaker === 'user' ? 'text-accent' : ''}
                >
                  <strong className="capitalize font-headline">{c.speaker}:</strong> {c.text}
                </motion.div>
              ))}
            </AnimatePresence>
            {isLoading && <Loader className="animate-spin h-5 w-5" />}
            <div ref={dialogueEndRef} />
          </div>

          <Card className="bg-background/90 backdrop-blur-sm">
            <CardContent className="p-4">
              {showCodeEditor && (
                <div className="mb-4">
                  <label className="font-bold font-code text-lg">Your Code:</label>
                  <Textarea
                    value={userCode}
                    onChange={(e) => setUserCode(e.target.value)}
                    placeholder="Write your code here..."
                    className="font-code bg-black text-green-400 h-48 border-accent"
                  />
                </div>
              )}
              <div className="flex gap-4">
                <Textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Type your response here..."
                  className="flex-grow"
                  disabled={isLoading}
                />
                <div className="flex flex-col gap-2">
                   <Button onClick={handleSendMessage} disabled={isLoading} size="lg">
                    {isLoading ? <Loader className="animate-spin" /> : <Send />}
                  </Button>
                  {!showCodeEditor && <Button variant="outline" onClick={() => setShowCodeEditor(true)} size="icon"><Code/></Button>}
                  <Button variant="outline" onClick={() => {}} size="icon" disabled><Mic/></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

        <AnimatePresence>
        {isInterviewOver && finalReport && (
            <motion.div 
                className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <Card className="w-full max-w-2xl mx-4">
                    <CardHeader className="text-center">
                        <CardTitle className="font-headline text-3xl">Interview Report</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-center">
                            {finalReport.xpPoints > 50 ? (
                                <>
                                    <Star className="h-16 w-16 text-yellow-400 mx-auto animate-pulse" />
                                    <p className="text-2xl font-bold text-green-500 mt-2">Level Passed!</p>
                                    <p className="text-lg font-semibold">You earned {finalReport.xpPoints} XP!</p>
                                </>
                            ) : (
                                <>
                                    <HeartCrack className="h-16 w-16 text-red-500 mx-auto" />
                                    <p className="text-2xl font-bold text-red-500 mt-2">Try Again!</p>
                                    <p className="text-lg font-semibold">You lost a life.</p>
                                </>
                            )}
                        </div>
                        <div><strong className="text-primary">Summary:</strong> {finalReport.summary}</div>
                        <div><strong className="text-primary">Strengths:</strong> {finalReport.strengths}</div>
                        <div><strong className="text-primary">Areas for Improvement:</strong> {finalReport.weaknesses}</div>
                        <Button onClick={() => router.push(`/learning/${module.id}`)} className="w-full" size="lg">
                            <SkipForward className="mr-2 h-4 w-4" /> Continue
                        </Button>
                    </CardContent>
                </Card>
            </motion.div>
        )}
        </AnimatePresence>
    </>
  );
}
