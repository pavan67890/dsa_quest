
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GameHeader } from '@/components/GameHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader, Send, Sparkles } from 'lucide-react';
import useLocalStorage from '@/hooks/useLocalStorage';
import { useToast } from '@/hooks/use-toast';
import { generateDailyStreakQuestion } from '@/ai/flows/generate-daily-streak-question';
import { simulateAiInterviewer } from '@/ai/flows/simulate-ai-interviewer';
import { ApiKeyDialog } from '@/components/ApiKeyDialog';
import type { Module } from '@/lib/dsa-modules';

type Progress = { [moduleId: string]: { unlockedLevel: number; lives: number } };
type ApiKeys = { primaryApiKey: string; secondaryApiKey?: string; googleApiKey?: string };
type DailyQuestion = {
  question: string;
  module: string;
  level: string;
} | null;
type Feedback = {
    interviewerResponse: string;
    sentiment: string;
} | null;

export default function DailyStreakPage() {
    const { toast } = useToast();
    const [progress] = useLocalStorage<Progress>('user-progress', {});
    const [apiKeys] = useLocalStorage<ApiKeys>('api-keys', { primaryApiKey: '', secondaryApiKey: '', googleApiKey: '' });
    const [isApiKeyDialogOpen, setIsApiKeyDialogOpen] = useState(false);
    
    const [dailyQuestion, setDailyQuestion] = useState<DailyQuestion>(null);
    const [isLoadingQuestion, setIsLoadingQuestion] = useState(true);
    const [userAnswer, setUserAnswer] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<Feedback>(null);
    const [allModules, setAllModules] = useState<Module[]>([]);

    useEffect(() => {
        fetch('/dsa-modules.json')
            .then(res => res.json())
            .then(data => setAllModules(data));
    }, []);

    useEffect(() => {
        if (!apiKeys.primaryApiKey) {
          setIsApiKeyDialogOpen(true);
        } else if (allModules.length > 0) {
            fetchDailyQuestion();
        }
    }, [apiKeys, allModules]);
    
    const fetchDailyQuestion = async () => {
        setIsLoadingQuestion(true);
        setFeedback(null);
        setUserAnswer('');
        try {
            const completedModules = allModules
                .filter(module => {
                    const moduleProgress = progress[module.id];
                    return moduleProgress && moduleProgress.unlockedLevel > module.levels.length;
                })
                .map(module => module.name);

            if (completedModules.length === 0) {
                setDailyQuestion({ question: 'You must complete at least one full module to unlock Daily Streak questions! Go back to the learning path to finish one.', module: 'N/A', level: 'Locked' });
                return;
            }

            const questionData = await generateDailyStreakQuestion({ 
                completedModules,
                ...apiKeys
            });
            setDailyQuestion(questionData);
        } catch (error) {
            toast({
                title: 'Error Generating Question',
                description: 'Could not fetch a daily streak question. Please try again later.',
                variant: 'destructive',
            });
            setDailyQuestion(null);
        } finally {
            setIsLoadingQuestion(false);
        }
    };
    
    const handleSubmitAnswer = async () => {
        if (!userAnswer.trim() || !dailyQuestion || dailyQuestion.level === 'Locked') return;
        setIsSubmitting(true);
        setFeedback(null);
        try {
            const response = await simulateAiInterviewer({
                userResponse: userAnswer,
                interviewerPrompt: "You are an AI assistant evaluating a user's answer to a daily data structure and algorithm question. Provide concise feedback on the correctness and quality of their answer. Be encouraging.",
                previousConversationSummary: '',
                question: dailyQuestion.question,
                ...apiKeys
            });
            setFeedback({
                interviewerResponse: response.interviewerResponse,
                sentiment: response.sentiment
            });
        } catch (error) {
            toast({
                title: 'AI Error',
                description: 'Could not get feedback from the AI. Check your API keys or try again.',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <>
            <ApiKeyDialog isOpen={isApiKeyDialogOpen} />
            <div className="min-h-screen">
                <GameHeader />
                <main className="container mx-auto max-w-3xl px-4 py-24">
                    <div className="text-center mb-12">
                        <h1 className="text-5xl font-bold font-headline text-accent">Daily Streak</h1>
                        <p className="text-muted-foreground mt-2">A surprise question to keep your skills sharp!</p>
                    </div>

                    <Card className="shadow-2xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Sparkles className="h-6 w-6 text-accent" />
                                Today's Challenge
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {isLoadingQuestion ? (
                                <div className="flex items-center justify-center h-48">
                                    <Loader className="h-8 w-8 animate-spin text-accent" />
                                </div>
                            ) : dailyQuestion ? (
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                                    <p className="text-sm text-muted-foreground">From Module: {dailyQuestion.module} | Difficulty: {dailyQuestion.level}</p>
                                    <p className="text-xl font-semibold my-4">{dailyQuestion.question}</p>
                                    
                                    {!feedback ? (
                                        <div className="space-y-4">
                                            <Textarea 
                                                placeholder="Write your answer or code here..."
                                                value={userAnswer}
                                                onChange={(e) => setUserAnswer(e.target.value)}
                                                rows={8}
                                                disabled={isSubmitting || dailyQuestion.level === 'Locked'}
                                            />
                                            <Button onClick={handleSubmitAnswer} disabled={isSubmitting || !userAnswer.trim() || dailyQuestion.level === 'Locked'} className="w-full" size="lg">
                                                {isSubmitting ? <Loader className="animate-spin" /> : <Send />}
                                                Submit Answer
                                            </Button>
                                        </div>
                                    ) : (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                                             <Card className="bg-primary/10 p-4 border-primary">
                                                <CardHeader className="p-0 pb-2">
                                                    <CardTitle className="text-lg">Feedback</CardTitle>
                                                </CardHeader>
                                                <CardContent className="p-0">
                                                    <p>{feedback.interviewerResponse}</p>
                                                </CardContent>
                                             </Card>
                                             <Button onClick={fetchDailyQuestion} className="w-full" variant="outline">
                                                Try Another Question
                                            </Button>
                                        </motion.div>
                                    )}
                                </motion.div>
                            ) : (
                                <div className="text-center text-muted-foreground">
                                    <p>Could not load a question. Please try refreshing the page.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </main>
            </div>
        </>
    );
}
