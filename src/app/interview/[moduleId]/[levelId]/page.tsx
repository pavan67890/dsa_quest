
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Editor from '@monaco-editor/react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { dsaModules } from '@/lib/dsa-modules';
import useLocalStorage from '@/hooks/useLocalStorage';
import { useToast } from '@/hooks/use-toast';
import { simulateAiInterviewer } from '@/ai/flows/simulate-ai-interviewer';
import { provideRealtimeCodeReview } from '@/ai/flows/provide-realtime-code-review';
import { analyzeInterviewPerformance } from '@/ai/flows/analyze-interview-performance';
import { textToSpeech } from '@/ai/flows/text-to-speech';
import { ApiKeyDialog } from '@/components/ApiKeyDialog';
import { Loader, Send, Code, Mic, SkipForward, ArrowLeft, Star, HeartCrack, Sparkles, User } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Progress = { [moduleId: string]: { unlockedLevel: number; lives: number } };
type ApiKeys = { primaryApiKey: string; backupApiKey: string };
type Conversation = { id: number; speaker: 'interviewer' | 'user'; text: string, code?: string };
type InterviewerImageInfo = { src: string };

// Using local images from public/hr
const interviewerImages: Record<string, InterviewerImageInfo> = {
  neutral:   { src: '/hr/calm.png' },
  curious:   { src: '/hr/confused.png' },
  satisfied: { src: '/hr/happy.png' },
  happy:     { src: '/hr/happy.png' },
  angry:     { src: '/hr/shocked.png' },
};

export default function InterviewPage() {
  const router = useRouter();
  const params = useParams();
  const moduleId = String(params.moduleId);
  const levelId = String(params.levelId);

  const { toast } = useToast();
  const [apiKeys] = useLocalStorage<ApiKeys>('api-keys', { primaryApiKey: '', backupApiKey: '' });
  const [progress, setProgress] = useLocalStorage<Progress>('user-progress', {});
  const [xp, setXp] = useLocalStorage('user-xp', 0);
  const [earnedBadges, setEarnedBadges] = useLocalStorage<string[]>('earned-badges', []);
  
  const [isApiKeyDialogOpen, setIsApiKeyDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [conversation, setConversation] = useState<Conversation[]>([]);
  const conversationIdCounter = useRef(0);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [sentiment, setSentiment] = useState('neutral');
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [userCode, setUserCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [isInterviewOver, setIsInterviewOver] = useState(false);
  const [finalReport, setFinalReport] = useState<any>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isTtsDisabled, setIsTtsDisabled] = useState(false);
  const [interviewPhase, setInterviewPhase] = useState<'greeting' | 'icebreaker' | 'technical'>('greeting');

  const module = dsaModules.find((m) => m.id === moduleId);
  const level = module?.levels.find((l) => l.id.toString() === levelId);
  const dialogueEndRef = useRef<HTMLDivElement>(null);

  const handleInterviewerResponse = useCallback((text: string, isInitialMessage = false) => {
    setIsAiTyping(true);

    const ttsPromise = isTtsDisabled
      ? Promise.resolve(null)
      : textToSpeech({
          text: text,
          primaryApiKey: apiKeys.primaryApiKey,
          backupApiKey: apiKeys.backupApiKey,
        }).catch(ttsError => {
          console.error('Text-to-speech failed:', ttsError);
          const errorMessage = ttsError instanceof Error ? ttsError.message : String(ttsError);
          if (errorMessage.includes('429') || errorMessage.toLowerCase().includes('quota')) {
              toast({
                title: 'Audio Quota Exceeded',
                description: 'You have used up your daily free limit for text-to-speech. Audio will be disabled for this session.',
                variant: 'destructive',
              });
              setIsTtsDisabled(true);
          } else {
              toast({
                title: 'Audio Error',
                description: 'Could not generate audio for the response.',
                variant: 'destructive',
              });
          }
          return null;
        });
    
    ttsPromise.then(ttsResponse => {
        setIsAiTyping(false);
        const conversationId = conversationIdCounter.current++;
        const newConversation: Conversation = { id: conversationId, speaker: 'interviewer', text };
        setConversation(conv => [...conv, newConversation]);

        if (ttsResponse?.audioDataUri) {
          setAudioUrl(ttsResponse.audioDataUri);
        }
    });

  }, [apiKeys, toast, isTtsDisabled]);

  useEffect(() => {
    if (typeof window !== 'undefined' && !recognitionRef.current) {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';
      }
    }

    return () => {
      recognitionRef.current?.abort();
    };
  }, []);
  
  const handleToggleRecording = () => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      toast({
        title: 'Browser Not Supported',
        description: 'Your browser does not support speech recognition.',
        variant: 'destructive',
      });
      return;
    }
  
    if (isRecording) {
      recognition.stop();
      return;
    }

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setUserInput(transcript);
    };
    recognition.onerror = (event: any) => {
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        toast({
          title: 'Speech Recognition Error',
          description: `Error: ${event.error}. Please ensure microphone access is allowed.`,
          variant: 'destructive',
        });
      }
      setIsRecording(false);
    };
    recognition.onend = () => {
      setIsRecording(false);
    };

    setUserInput('');
    setIsRecording(true);
    recognition.start();
  };
  
  useEffect(() => {
    if (!apiKeys.primaryApiKey || !apiKeys.backupApiKey) {
      setIsApiKeyDialogOpen(true);
    } else if (module && level && conversation.length === 0 && interviewPhase === 'greeting') {
      let questionText = level.question;
      if (level.isSurprise) {
        const regularLevels = module.levels.filter(l => !l.isSurprise && l.id !== level.id);
        const availableQuestions = regularLevels.map(l => l.question).filter(Boolean);
        if (availableQuestions.length > 0) {
          const randomIndex = Math.floor(Math.random() * availableQuestions.length);
          questionText = availableQuestions[randomIndex];
        } else {
          questionText = "Tell me about yourself and your experience with data structures.";
        }
      }
      setCurrentQuestion(questionText);
      const initialText = "Hello! I'm your AI interviewer for today's session. It's great to have you here. Are you ready to begin?";
      
      handleInterviewerResponse(initialText, true);
    }
  }, [apiKeys, level, module, conversation.length, handleInterviewerResponse, interviewPhase]);

  useEffect(() => {
    dialogueEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation, isAiTyping]);

  const handleSendMessage = async () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    }
    if (!userInput.trim() && !userCode.trim()) return;
    setIsLoading(true);
    setAudioUrl(null);

    const currentConversation: Conversation = { id: conversationIdCounter.current++, speaker: 'user', text: userInput, code: showCodeEditor ? userCode : undefined };
    setConversation(conv => [...conv, currentConversation]);
    setUserInput('');
    setIsAiTyping(true);

    const conversationHistory = [...conversation, currentConversation].slice(-6).map(c => `${c.speaker}: ${c.text} ${c.code ? `\nCODE:\n${c.code}`:''}`).join('\n');

    try {
        let aiResponse;
        
        if (interviewPhase === 'greeting') {
            aiResponse = await simulateAiInterviewer({
                userResponse: userInput,
                interviewerPrompt: `You are a friendly technical interviewer. The user has just confirmed they are ready to start. Your task is to:
1. Respond positively (e.g., "Excellent!", "Great to hear!").
2. Ask the user to briefly introduce themselves and their experience with programming.
This is an icebreaker question before the main technical problem. Keep your response concise.`,
                previousConversationSummary: conversationHistory,
                question: '', // No technical question yet
                primaryApiKey: apiKeys.primaryApiKey,
                backupApiKey: apiKeys.backupApiKey,
            });
            setInterviewPhase('icebreaker');
        } else if (interviewPhase === 'icebreaker') {
            aiResponse = await simulateAiInterviewer({
                userResponse: userInput,
                interviewerPrompt: `You are a friendly technical interviewer. The user has just introduced themselves. Your task is to:
1. Briefly and positively acknowledge their introduction (e.g., "Thanks for sharing," "That's an interesting background.").
2. Smoothly transition to the main technical question.
3. State the main technical question clearly.
The main technical question you must ask is provided in the 'question' field. After asking, set the nextQuestion to be an empty string to signify you are waiting for their answer.`,
                previousConversationSummary: conversationHistory,
                question: currentQuestion, // This is the stored technical question
                primaryApiKey: apiKeys.primaryApiKey,
                backupApiKey: apiKeys.backupApiKey,
            });
            setInterviewPhase('technical');
        } else if(showCodeEditor) {
            const review = await provideRealtimeCodeReview({
              code: userCode,
              language: language,
              problemDescription: currentQuestion,
              primaryApiKey: apiKeys.primaryApiKey,
              backupApiKey: apiKeys.backupApiKey,
            });
            aiResponse = await simulateAiInterviewer({
                userResponse: `${userInput}\n\nCode Submitted:\n${userCode}\n\nAI Code Review:\n${review.feedback}`,
                interviewerPrompt: 'You are a friendly but sharp technical interviewer evaluating a candidate\'s code submission and follow-up explanation.',
                previousConversationSummary: conversationHistory,
                question: currentQuestion,
                primaryApiKey: apiKeys.primaryApiKey,
                backupApiKey: apiKeys.backupApiKey,
            });
            aiResponse.interviewerResponse = `${review.feedback}\n\n${aiResponse.interviewerResponse}`;
        } else {
             aiResponse = await simulateAiInterviewer({
                userResponse: userInput,
                interviewerPrompt: 'You are a friendly but sharp technical interviewer evaluating a candidate\'s answer to a technical question. Provide follow-up questions if needed, or hints if the user is stuck.',
                previousConversationSummary: conversationHistory,
                question: currentQuestion,
                primaryApiKey: apiKeys.primaryApiKey,
                backupApiKey: apiKeys.backupApiKey,
            });
        }
      
      const interviewerText = aiResponse.interviewerResponse;
      setSentiment(aiResponse.sentiment.toLowerCase() || 'neutral');
      
      handleInterviewerResponse(interviewerText);

      // Simple logic to end interview or show code editor
      if (aiResponse.nextQuestion.toLowerCase().includes('write the code') || aiResponse.nextQuestion.toLowerCase().includes('show me the code')) {
        setShowCodeEditor(true);
      }
      if (aiResponse.nextQuestion.toLowerCase().includes('thank you for your time')) {
        endInterview();
      }

    } catch (error) {
      setIsAiTyping(false);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast({
        title: 'AI Error',
        description: errorMessage.includes('429') 
          ? 'You have exceeded your API quota. Please check your plan and billing details.'
          : 'Could not get a response from the AI. Check your API keys or try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const endInterview = async () => {
    setIsLoading(true);
    const transcript = conversation.map(c => `${c.speaker}: ${c.text}`).join('\n');
    try {
        const report = await analyzeInterviewPerformance({ 
            interviewTranscript: transcript,
            primaryApiKey: apiKeys.primaryApiKey,
            backupApiKey: apiKeys.backupApiKey,
        });
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

  const lastUserMessageIndex = conversation.map(c => c.speaker).lastIndexOf('user');
  const lastInterviewerMessageIndex = conversation.map(c => c.speaker).lastIndexOf('interviewer');

  const conversationToDisplay = conversation.filter((c, index) => {
    // If it's the first message from the interviewer, show it.
    if (lastUserMessageIndex === -1 && index === lastInterviewerMessageIndex) {
      return true;
    }
    // Otherwise, show only the last message from user and interviewer.
    return index === lastUserMessageIndex || index === lastInterviewerMessageIndex;
  });

  return (
    <>
      <ApiKeyDialog isOpen={isApiKeyDialogOpen} />
      <div className="relative h-dvh w-screen overflow-hidden bg-black flex flex-col">
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
                className="object-contain"
                />
                <div className="absolute inset-0 bg-black/30"></div>
            </motion.div>
        </AnimatePresence>
        
        <Button onClick={() => router.back()} variant="ghost" className="absolute top-4 left-4 text-white bg-black/50 hover:bg-black/70 hover:text-white">
            <ArrowLeft className="mr-2 h-4 w-4"/> Back to Levels
        </Button>

        {audioUrl && <audio key={audioUrl} src={audioUrl} autoPlay className="hidden" />}

        <div className="relative mt-auto p-4 pb-0 flex flex-col gap-4">
            <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-4 flex flex-col justify-end">
                <AnimatePresence>
                    {conversationToDisplay.map((c) => (
                        <motion.div
                            key={c.id}
                            layout
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            className={`flex items-end gap-2 ${c.speaker === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            {c.speaker === 'interviewer' && (
                                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                                    <Sparkles className="w-4 h-4 text-primary-foreground" />
                                </div>
                            )}
                            <div
                                className={`max-w-xl rounded-xl px-4 py-3 shadow-md ${
                                    c.speaker === 'user'
                                        ? 'bg-accent text-accent-foreground rounded-br-none'
                                        : 'bg-black/80 backdrop-blur-sm text-white rounded-bl-none'
                                }`}
                            >
                                <p className="font-body text-base">{c.text}</p>
                                {c.code && (
                                    <div className="mt-2 text-xs bg-black/50 p-2 rounded font-code">
                                        <pre><code>{c.code}</code></pre>
                                    </div>
                                )}
                            </div>
                            {c.speaker === 'user' && (
                                <div className="w-8 h-8 rounded-full bg-card flex items-center justify-center shrink-0">
                                    <User className="w-4 h-4 text-card-foreground" />
                                </div>
                            )}
                        </motion.div>
                    ))}
                    {isAiTyping && (
                        <motion.div
                            key="typing-indicator"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-end gap-2 justify-start"
                        >
                            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                                <Sparkles className="w-4 h-4 text-primary-foreground" />
                            </div>
                            <div className="max-w-md rounded-xl px-4 py-3 bg-black/80 backdrop-blur-sm text-white rounded-bl-none shadow-md">
                                <div className="flex gap-1.5 items-center">
                                    <span className="h-2 w-2 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                    <span className="h-2 w-2 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                    <span className="h-2 w-2 bg-white rounded-full animate-bounce"></span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                <div ref={dialogueEndRef} />
            </div>

          <Card className="bg-background/90 backdrop-blur-sm shrink-0">
            <CardContent className="p-4">
              {showCodeEditor && (
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="font-bold font-code text-lg">Your Code:</label>
                    <Select value={language} onValueChange={setLanguage}>
                        <SelectTrigger className="w-[180px] bg-background">
                            <SelectValue placeholder="Language" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="javascript">JavaScript</SelectItem>
                            <SelectItem value="typescript">TypeScript</SelectItem>
                            <SelectItem value="python">Python</SelectItem>
                            <SelectItem value="java">Java</SelectItem>
                            <SelectItem value="cpp">C++</SelectItem>
                        </SelectContent>
                    </Select>
                  </div>
                  <Card className="overflow-hidden border-accent">
                      <Editor
                          height="15vh"
                          language={language}
                          value={userCode}
                          theme="vs-dark"
                          onChange={(value) => setUserCode(value || '')}
                          options={{
                              fontSize: 14,
                              minimap: { enabled: false },
                              scrollBeyondLastLine: false,
                              wordWrap: 'on',
                              padding: { top: 10 },
                          }}
                      />
                  </Card>
                </div>
              )}
              <div className="flex gap-4">
                <Textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Type your response here or use the mic..."
                  className="flex-grow"
                  disabled={isLoading}
                />
                <div className="flex flex-col gap-2">
                   <Button onClick={handleSendMessage} disabled={isLoading} size="lg">
                    {isLoading ? <Loader className="animate-spin" /> : <Send />}
                  </Button>
                  {!showCodeEditor && <Button variant="outline" onClick={() => setShowCodeEditor(true)} size="icon"><Code/></Button>}
                  <Button variant={isRecording ? 'destructive' : 'outline'} onClick={handleToggleRecording} size="icon" disabled={isLoading}>
                    <Mic className={isRecording ? 'animate-pulse' : ''} />
                  </Button>
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
                        <Button onClick={() => router.push(`/learning/${moduleId}`)} className="w-full" size="lg">
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
