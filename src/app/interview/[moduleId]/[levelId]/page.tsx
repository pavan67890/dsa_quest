
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Editor from '@monaco-editor/react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Module, Level, ModuleWithLevels } from '@/lib/dsa-modules';
import useLocalStorage from '@/hooks/useLocalStorage';
import { useToast } from '@/hooks/use-toast';
import { simulateAiInterviewer } from '@/ai/flows/simulate-ai-interviewer';
import { provideRealtimeCodeReview } from '@/ai/flows/provide-realtime-code-review';
import { analyzeInterviewPerformance } from '@/ai/flows/analyze-interview-performance';
import { textToSpeech } from '@/ai/flows/text-to-speech';
import { executeCode } from '@/ai/flows/execute-code';
import { triggerSync } from '@/services/driveService';
import { ApiKeyDialog } from '@/components/ApiKeyDialog';
import { Loader, Send, Code, Mic, SkipForward, ArrowLeft, Star, HeartCrack, Sparkles, User, Play, X, Cloud } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { STORAGE_KEYS } from '@/lib/storageKeys';

type Progress = { [moduleId: string]: { unlockedLevel: number; lives: number } };
type ApiKeys = { 
  primaryApiKey?: string; 
  secondaryApiKey?: string;
  primaryApiKeyLimit?: string;
  secondaryApiKeyLimit?: string;
};
type Conversation = { id: number; speaker: 'interviewer' | 'user'; text: string, code?: string };
type InterviewerImageInfo = { src: string };
type CodeOutput = { output: string; isError: boolean } | null;
type KeyUsageStats = {
  primary: { date: string; count: number };
  secondary: { date: string; count: number };
};
type StreamingMessage = {
  id: number;
  fullText: string;
  displayText: string;
};

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
  const moduleId = params.moduleId as string;
  const levelId = params.levelId as string;

  const { toast } = useToast();
  const [apiKeys, setApiKeys] = useLocalStorage<ApiKeys>(STORAGE_KEYS.API_KEYS, {});
  const [keyUsageStats, setKeyUsageStats] = useLocalStorage<KeyUsageStats>(STORAGE_KEYS.KEY_USAGE_STATS, {
    primary: { date: '', count: 0 },
    secondary: { date: '', count: 0 },
  });
  const [progress, setProgress] = useLocalStorage<Progress>(STORAGE_KEYS.USER_PROGRESS, {});
  const [xp, setXp] = useLocalStorage(STORAGE_KEYS.USER_XP, 0);
  const [earnedBadges, setEarnedBadges] = useLocalStorage<string[]>(STORAGE_KEYS.EARNED_BADGES, []);
  
  const [module, setModule] = useState<ModuleWithLevels | null>(null);
  const [level, setLevel] = useState<Level | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);

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
  const [isRunningCode, setIsRunningCode] = useState(false);
  const [codeOutput, setCodeOutput] = useState<CodeOutput>(null);
  const [streamingMessage, setStreamingMessage] = useState<StreamingMessage | null>(null);
  const pendingTextRef = useRef<string | null>(null);

  const dialogueEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!moduleId || !levelId) return;
    setIsDataLoading(true);
    fetch('/dsa-modules.json')
      .then((res) => res.json())
      .then((modules: Module[]) => {
        const foundModule = modules.find((m) => m.id === moduleId);
        if (foundModule) {
          fetch(foundModule.dataFile)
            .then(res => res.json())
            .then((levels: Level[]) => {
              const fullModule = { ...foundModule, levels };
              setModule(fullModule);
              const foundLevel = fullModule.levels.find((l) => l.id.toString() === levelId);
              setLevel(foundLevel || null);
              if (foundLevel && foundLevel.sampleInput) {
                const starterCode = `function solve() {\n  // Sample Input:\n  // ${foundLevel.sampleInput}\n  //\n  // Your code here\n  //\n  // Expected Output:\n  // ${foundLevel.sampleOutput}\n}\n`;
                setUserCode(starterCode);
              }
            });
        }
      })
      .catch((error) => console.error('Failed to load module data:', error))
      .finally(() => setIsDataLoading(false));
  }, [moduleId, levelId]);


  const updateUsageStats = useCallback((keyType: 'primary' | 'secondary') => {
    const today = new Date().toISOString().split('T')[0];
    setKeyUsageStats(prevStats => {
      const newStats = { ...prevStats };
      if (keyType === 'primary') {
        if (newStats.primary.date !== today) {
          newStats.primary = { date: today, count: 1 };
        } else {
          newStats.primary.count++;
        }
      } else if (keyType === 'secondary') {
        if (newStats.secondary.date !== today) {
          newStats.secondary = { date: today, count: 1 };
        } else {
          newStats.secondary.count++;
        }
      }
      return newStats;
    });
  }, [setKeyUsageStats]);

  const checkAndWarnLimits = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    
    const primaryLimit = apiKeys.primaryApiKeyLimit ? parseInt(apiKeys.primaryApiKeyLimit, 10) : Infinity;
    const primaryUsage = keyUsageStats.primary.date === today ? keyUsageStats.primary.count : 0;

    if (isFinite(primaryLimit) && primaryUsage >= primaryLimit) {
         toast({
            title: 'Primary Key Limit Reached',
            description: 'Falling back to secondary API key if available.',
            variant: 'destructive',
        });
        return;
    }

    if (isFinite(primaryLimit) && primaryUsage > 0 && primaryUsage >= primaryLimit * 0.9) {
        toast({
            title: 'API Key Limit Warning',
            description: `You have used ${primaryUsage} of your ${primaryLimit} daily requests for the primary key.`,
        });
    }
  }, [apiKeys.primaryApiKeyLimit, keyUsageStats.primary, toast]);


  const handleInterviewerResponse = useCallback((text: string) => {
    setIsAiTyping(true);
    pendingTextRef.current = text;
    
    if (isTtsDisabled || (!apiKeys.primaryApiKey && !apiKeys.secondaryApiKey)) {
        setIsAiTyping(false);
        setStreamingMessage({
            id: conversationIdCounter.current++,
            fullText: text,
            displayText: '',
        });
        pendingTextRef.current = null;
        return;
    }

    checkAndWarnLimits();
    textToSpeech({
        text: text,
        primaryApiKey: apiKeys.primaryApiKey,
        secondaryApiKey: apiKeys.secondaryApiKey,
    })
    .then(ttsResponse => {
        if (ttsResponse?.audioDataUri) {
            setAudioUrl(ttsResponse.audioDataUri);
            updateUsageStats(ttsResponse.keyUsed);
        } else {
            setIsAiTyping(false);
            setStreamingMessage({
                id: conversationIdCounter.current++,
                fullText: text,
                displayText: '',
            });
            pendingTextRef.current = null;
        }
    })
    .catch(ttsError => {
        console.error('Text-to-speech failed:', ttsError);
        const errorMessage = ttsError instanceof Error ? ttsError.message : String(ttsError);
        if (errorMessage.includes('429') || errorMessage.toLowerCase().includes('quota')) {
            toast({
                title: 'Audio Quota Exceeded',
                description: 'You have used up your daily free limit. Audio will be disabled for this session.',
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
        setIsAiTyping(false);
        setStreamingMessage({
            id: conversationIdCounter.current++,
            fullText: text,
            displayText: '',
        });
        pendingTextRef.current = null;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKeys, toast, isTtsDisabled, updateUsageStats, checkAndWarnLimits]);
  
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
    if (isDataLoading) return;
    if (!apiKeys.primaryApiKey && !apiKeys.secondaryApiKey) {
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
      
      handleInterviewerResponse(initialText);
    }
  }, [apiKeys, level, module, conversation.length, handleInterviewerResponse, interviewPhase, isDataLoading]);

  useEffect(() => {
    dialogueEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation, isAiTyping, streamingMessage]);

  const handleSendMessage = async () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    }
    if (!userInput.trim() && !userCode.trim()) return;
    setIsLoading(true);
    setAudioUrl(null);

    checkAndWarnLimits();

    const currentConversation: Conversation = { id: conversationIdCounter.current++, speaker: 'user', text: userInput, code: showCodeEditor ? userCode : undefined };
    setConversation(conv => [...conv, currentConversation]);
    setUserInput('');

    const conversationHistory = [...conversation, currentConversation].slice(-6).map(c => `${c.speaker}: ${c.text} ${c.code ? `\nCODE:\n${c.code}`:''}`).join('\n');

    try {
        let aiResponse;
        
        const commonPayload = {
            previousConversationSummary: conversationHistory,
            primaryApiKey: apiKeys.primaryApiKey,
            secondaryApiKey: apiKeys.secondaryApiKey,
        };

        if (interviewPhase === 'greeting') {
            aiResponse = await simulateAiInterviewer({
                ...commonPayload,
                userResponse: userInput,
                interviewerPrompt: `You are a friendly technical interviewer. The user has just confirmed they are ready to start. Your task is to:
1. Respond positively (e.g., "Excellent!", "Great to hear!").
2. Ask the user to briefly introduce themselves and their experience with programming.
This is an icebreaker question before the main technical problem. Keep your response concise.`,
                question: '', 
            });
            setInterviewPhase('icebreaker');
        } else if (interviewPhase === 'icebreaker') {
            aiResponse = await simulateAiInterviewer({
                ...commonPayload,
                userResponse: userInput,
                interviewerPrompt: `You are a friendly technical interviewer. The user has just introduced themselves. Your task is to:
1. Briefly and positively acknowledge their introduction (e.g., "Thanks for sharing," "That's an interesting background.").
2. Smoothly transition to the main technical question.
3. State the main technical question clearly.
The main technical question you must ask is provided in the 'question' field. After asking, set the nextQuestion to be an empty string to signify you are waiting for their answer.`,
                question: currentQuestion,
            });
            setInterviewPhase('technical');
        } else if(showCodeEditor) {
            checkAndWarnLimits();
            const review = await provideRealtimeCodeReview({
              code: userCode,
              language: language,
              problemDescription: currentQuestion,
              primaryApiKey: apiKeys.primaryApiKey,
              secondaryApiKey: apiKeys.secondaryApiKey,
            });
            updateUsageStats(review.keyUsed);
            aiResponse = await simulateAiInterviewer({
                ...commonPayload,
                userResponse: `${userInput}\n\nCode Submitted:\n${userCode}\n\nAI Code Review:\n${review.feedback}`,
                interviewerPrompt: 'You are a friendly but sharp technical interviewer evaluating a candidate\'s code submission and follow-up explanation.',
                question: currentQuestion,
            });
            aiResponse.interviewerResponse = `${review.feedback}\n\n${aiResponse.interviewerResponse}`;
        } else {
             aiResponse = await simulateAiInterviewer({
                ...commonPayload,
                userResponse: userInput,
                interviewerPrompt: 'You are a friendly but sharp technical interviewer evaluating a candidate\'s answer to a technical question. Provide follow-up questions if needed, or hints if the user is stuck.',
                question: currentQuestion,
            });
        }
      
      updateUsageStats(aiResponse.keyUsed);
      const interviewerText = aiResponse.interviewerResponse;
      setSentiment(aiResponse.sentiment.toLowerCase() || 'neutral');
      
      handleInterviewerResponse(interviewerText);

      if (aiResponse.nextQuestion.toLowerCase().includes('write the code') || aiResponse.nextQuestion.toLowerCase().includes('show me the code')) {
        setShowCodeEditor(true);
      }
      if (aiResponse.nextQuestion.toLowerCase().includes('thank you for your time')) {
        endInterview();
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast({
        title: 'AI Error',
        description: errorMessage.includes('429') 
          ? 'You have exceeded your API quota. Please check your plan and billing details.'
          : 'Could not get a response from the AI. Check your API key or try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const endInterview = async () => {
    setIsLoading(true);
    const transcript = conversation.map(c => `${c.speaker}: ${c.text}`).join('\n');
    checkAndWarnLimits();
    try {
        const report = await analyzeInterviewPerformance({ 
            interviewTranscript: transcript,
            primaryApiKey: apiKeys.primaryApiKey,
            secondaryApiKey: apiKeys.secondaryApiKey,
        });
        updateUsageStats(report.keyUsed);
        setFinalReport(report);
        setIsInterviewOver(true);

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
        
        try {
          await triggerSync();
          toast({
            title: 'Progress Synced',
            description: 'Your results have been saved to the cloud.',
            action: (
              <div className="p-1">
                <Cloud className="h-5 w-5 text-primary" />
              </div>
            ),
          });
        } catch (syncError) {
          console.error("Sync failed after interview:", syncError);
          toast({
            title: 'Sync Failed',
            description: 'Your progress was saved locally, but failed to sync to the cloud.',
            variant: 'destructive'
          });
        }

    } catch(error: any) {
        toast({ title: 'Error Analyzing Performance', description: error.message || 'Could not generate the final report.', variant: 'destructive' });
    }
    setIsLoading(false);
  };
  
  const handleRunCode = async () => {
    if (!userCode.trim()) return;
    setIsRunningCode(true);
    setCodeOutput(null);
    checkAndWarnLimits();
    try {
      const result = await executeCode({
        code: userCode,
        language,
        problemDescription: currentQuestion,
        primaryApiKey: apiKeys.primaryApiKey,
        secondaryApiKey: apiKeys.secondaryApiKey,
      });
      updateUsageStats(result.keyUsed);
      setCodeOutput(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setCodeOutput({ output: errorMessage, isError: true });
      toast({
        title: 'Execution Error',
        description: 'Could not simulate code execution. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsRunningCode(false);
    }
  };

  const handleAudioPlay = () => {
    if (pendingTextRef.current) {
        setIsAiTyping(false);
        setStreamingMessage({
            id: conversationIdCounter.current++,
            fullText: pendingTextRef.current,
            displayText: '',
        });
        pendingTextRef.current = null;
    }
  };

  useEffect(() => {
    if (!streamingMessage) return;

    if (streamingMessage.displayText.length === streamingMessage.fullText.length) {
        setConversation(conv => [...conv, { 
            id: streamingMessage.id, 
            speaker: 'interviewer', 
            text: streamingMessage.fullText 
        }]);
        setStreamingMessage(null);
        return;
    }

    const words = streamingMessage.fullText.split(' ');
    const currentWords = streamingMessage.displayText.split(' ').filter(w => w !== '');
    const nextWordIndex = currentWords.length;

    if (nextWordIndex >= words.length) {
        setStreamingMessage(msg => msg ? { ...msg, displayText: msg.fullText } : null);
        return;
    }

    const delay = 180; // WPM approximation
    const timer = setTimeout(() => {
        setStreamingMessage(msg => {
            if (!msg) return null;
            const newText = msg.displayText ? `${msg.displayText} ${words[nextWordIndex]}` : words[nextWordIndex];
            return { ...msg, displayText: newText };
        });
    }, delay);

    return () => clearTimeout(timer);
  }, [streamingMessage]);

  if (isDataLoading) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-black text-white">
        <Loader className="h-10 w-10 animate-spin" />
        <p className="ml-4 text-xl">Loading Interview...</p>
      </div>
    );
  }
  
  if (!module || !level) {
      return (
        <div className="flex items-center justify-center h-screen w-screen bg-black text-white">
            <p className="text-xl">Interview level not found.</p>
        </div>
      )
  }

  const currentImage = interviewerImages[sentiment.toLowerCase()] || interviewerImages.neutral;

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

        {audioUrl && <audio key={audioUrl} src={audioUrl} autoPlay className="hidden" onPlay={handleAudioPlay} onEnded={() => setAudioUrl(null)} />}

        <div className="relative mt-auto p-4 flex flex-col gap-4">
            <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-4 flex flex-col justify-end">
                <AnimatePresence>
                    {conversation.map((c) => (
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

                    {streamingMessage && (
                        <motion.div
                            key={streamingMessage.id}
                            layout
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            className="flex items-end gap-2 justify-start"
                        >
                             <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                                <Sparkles className="w-4 h-4 text-primary-foreground" />
                            </div>
                            <div className="max-w-xl rounded-xl px-4 py-3 shadow-md bg-black/80 backdrop-blur-sm text-white rounded-bl-none">
                                <p className="font-body text-base">{streamingMessage.displayText}</p>
                            </div>
                        </motion.div>
                    )}

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
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={handleRunCode} disabled={isRunningCode}>
                           {isRunningCode ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                            Run
                        </Button>
                        <Select value={language} onValueChange={setLanguage}>
                            <SelectTrigger className="w-[180px] bg-background h-9">
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
                        <Button variant="ghost" size="icon" onClick={() => setShowCodeEditor(false)} className="h-9 w-9">
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                  </div>
                  <Card className="overflow-hidden border-accent">
                      <Editor
                          height="15vh"
                          language={language}
                          value={userCode}
                          theme="vs-dark"
                          onChange={(value) => {
                            setUserCode(value || '');
                            setCodeOutput(null);
                          }}
                          options={{
                              fontSize: 14,
                              minimap: { enabled: false },
                              scrollBeyondLastLine: false,
                              wordWrap: 'on',
                              padding: { top: 10 },
                          }}
                      />
                  </Card>
                   {codeOutput && (
                    <div className="mt-4">
                      <label className="font-bold font-code text-base">Output</label>
                      <Card className={`mt-2 font-code text-sm p-3 bg-black/50 ${codeOutput.isError ? 'border-red-500/50 text-red-400' : 'border-green-500/50 text-white'}`}>
                          <pre className="whitespace-pre-wrap">{codeOutput.output}</pre>
                      </Card>
                    </div>
                  )}
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

    