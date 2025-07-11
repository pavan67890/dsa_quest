
'use client';

import Link from 'next/link';
import { Settings, Trophy, Sparkles, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import useLocalStorage from '@/hooks/useLocalStorage';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { STORAGE_KEYS } from '@/lib/storageKeys';
import { useToast } from '@/hooks/use-toast';

export function GameHeader() {
  const router = useRouter();
  const [xp] = useLocalStorage(STORAGE_KEYS.USER_XP, 0);
  const [loginMethod] = useLocalStorage(STORAGE_KEYS.LOGIN_METHOD, 'guest');
  
  const { toast } = useToast();

  const calculatedLevel = Math.floor(xp / 100) + 1;
  const progress = xp % 100;
  
  const [lastKnownLevel, setLastKnownLevel] = useState(calculatedLevel);

  useEffect(() => {
    if (calculatedLevel > lastKnownLevel) {
      toast({
        title: `🎉 Level Up!`,
        description: `Congratulations! You've reached Level ${calculatedLevel}!`,
      });
      setLastKnownLevel(calculatedLevel);
    } else if (calculatedLevel < lastKnownLevel) {
      setLastKnownLevel(calculatedLevel);
    }
  }, [xp, calculatedLevel, lastKnownLevel, toast]);


  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-background/80 backdrop-blur-sm">
      <div className="flex items-center gap-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Go back</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Go back</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <Link href="/home" className="flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold font-headline text-primary">DSA Quest</h1>
        </Link>
        <div className="w-48">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-full">
                  <span className="text-xs font-semibold text-muted-foreground">LVL {calculatedLevel}</span>
                  <Progress value={progress} className="h-2" />
                  <span className="text-xs text-muted-foreground">{xp} / {(calculatedLevel) * 100} XP</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{progress}% to next level</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isClient && loginMethod === 'guest' && (
           <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="text-yellow-500 hover:text-yellow-400 hover:bg-yellow-500/10" asChild>
                    <Link href="/settings">
                        <AlertTriangle className="h-5 w-5" />
                        <span className="sr-only">Guest Mode Warning</span>
                    </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs border-yellow-500/50 bg-background text-foreground">
                <p>You are playing as a guest. Your progress is saved only in this browser and could be lost.</p>
                <p className="font-semibold">Go to Settings to sync with Google Drive.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/achievements">
                        <Trophy className="h-5 w-5" />
                        <span className="sr-only">Achievements</span>
                        </Link>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Achievements</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/settings">
                        <Settings className="h-5 w-5" />
                        <span className="sr-only">Settings</span>
                        </Link>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Settings</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
      </div>
    </header>
  );
}
