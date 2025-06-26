
'use client';

import { useParams, useRouter } from 'next/navigation';
import { dsaModules } from '@/lib/dsa-modules';
import { GameHeader } from '@/components/GameHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import useLocalStorage from '@/hooks/useLocalStorage';
import { Heart, Lock, Sparkles, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useState } from 'react';

type Progress = { [moduleId: string]: { unlockedLevel: number; lives: number } };

export default function ModulePage() {
  const router = useRouter();
  const { moduleId: rawModuleId } = useParams();
  const moduleId = Array.isArray(rawModuleId) ? rawModuleId[0] : rawModuleId;
  const module = dsaModules.find((m) => m.id === moduleId);
  
  const [progress, setProgress] = useLocalStorage<Progress>('user-progress', {});
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  if (!module) {
    return (
      <div>
        <GameHeader />
        <main className="flex items-center justify-center h-screen">Module not found.</main>
      </div>
    );
  }
  
  const moduleProgress = progress[module.id] || { unlockedLevel: 1, lives: module.initialLives };

  const handleResetProgress = () => {
    const newProgress = { ...progress };
    newProgress[module.id] = { unlockedLevel: 1, lives: module.initialLives };
    setProgress(newProgress);
    setShowResetConfirm(false);
  };

  const handleLevelClick = (levelId: number) => {
    if (levelId <= moduleProgress.unlockedLevel) {
      router.push(`/interview/${module.id}/${levelId}`);
    }
  };


  return (
    <div className="min-h-screen">
      <GameHeader />
      <main className="container mx-auto max-w-5xl px-4 py-24">
        <div className="flex justify-between items-center mb-8">
            <div>
                <h1 className="text-5xl font-bold font-headline">{module.name}</h1>
                <p className="text-muted-foreground mt-2">{module.description}</p>
            </div>
            <Card className="p-4 flex items-center gap-2">
                <div className="flex items-center gap-1 text-red-500">
                    {[...Array(moduleProgress.lives)].map((_, i) => (
                        <Heart key={i} className="h-6 w-6 fill-current" />
                    ))}
                    {[...Array(module.initialLives - moduleProgress.lives)].map((_, i) => (
                        <Heart key={i} className="h-6 w-6 text-muted-foreground" />
                    ))}
                </div>
                <span className="font-bold text-lg">{moduleProgress.lives} / {module.initialLives}</span>
            </Card>
        </div>

        <Card>
            <CardContent className="p-8">
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-4">
                    {module.levels.map((level) => {
                        const isUnlocked = level.id <= moduleProgress.unlockedLevel;
                        const isSurprise = level.isSurprise;
                        return (
                            <TooltipProvider key={level.id} delayDuration={0}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div onClick={() => handleLevelClick(level.id)}>
                                        <div
                                            className={`
                                            aspect-square rounded-lg border-2 flex items-center justify-center 
                                            transition-all duration-300
                                            ${isUnlocked ? 'cursor-pointer hover:scale-110 hover:shadow-lg' : 'cursor-not-allowed'}
                                            ${isSurprise 
                                                ? isUnlocked ? 'bg-primary/20 border-primary animate-pulse' : 'bg-muted/30 border-dashed'
                                                : isUnlocked ? 'bg-accent/20 border-accent' : 'bg-muted/30 border-dashed'}
                                            `}
                                        >
                                            {isUnlocked ? (
                                                isSurprise ? <Sparkles className="h-8 w-8 text-primary" /> : <span className="text-2xl font-bold font-headline">{level.name}</span>
                                            ) : (
                                                <Lock className="h-8 w-8 text-muted-foreground" />
                                            )}
                                        </div>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-xs text-center">
                                        <p className="font-bold">{isSurprise ? 'Surprise Level!' : `Level: ${level.name}`}</p>
                                        {isSurprise ? (
                                            <p className="text-sm">A random question from this module awaits!</p>
                                        ) : (
                                            <p className="text-sm">{level.question}</p>
                                        )}
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
        
        <div className="mt-8 flex justify-end">
            <Button variant="destructive" onClick={() => setShowResetConfirm(true)}>
                <AlertTriangle className="mr-2 h-4 w-4" /> Reset Progress for this Module
            </Button>
        </div>
      </main>

       <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will reset your progress and lives for the '{module.name}' module. You will have to start from Level 1 again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setShowResetConfirm(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleResetProgress}>
              Yes, reset progress
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
