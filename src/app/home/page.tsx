'use client';

import Link from 'next/link';
import { ArrowRight, BookOpen, Flame, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GameHeader } from '@/components/GameHeader';
import { motion } from 'framer-motion';
import useLocalStorage from '@/hooks/useLocalStorage';
import type { Module } from '@/lib/dsa-modules';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { STORAGE_KEYS } from '@/lib/storageKeys';

export default function HomePage() {
  const router = useRouter();
  const [progress] = useLocalStorage(STORAGE_KEYS.USER_PROGRESS, {});
  const [loginMethod] = useLocalStorage(STORAGE_KEYS.LOGIN_METHOD, '');
  const [hasCompletedModule, setHasCompletedModule] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Redirect if user lands here without choosing a login method
    if (!loginMethod) {
      router.replace('/login');
      return;
    }

    fetch('/dsa-modules.json')
      .then((res) => res.json())
      .then((data: Module[]) => {
        const completed = data.some(module => {
            const moduleProgress = progress[module.id];
            return moduleProgress && moduleProgress.unlockedLevel > module.levels.length;
        });
        setHasCompletedModule(completed);
        setIsLoading(false);
      });
  }, [progress, loginMethod, router]);

  // Render nothing while redirecting
  if (!loginMethod) {
    return null;
  }

  return (
    <div className="min-h-screen w-full">
      <GameHeader />
      <main className="flex flex-col items-center justify-center min-h-screen pt-20 px-4">
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: {
              transition: {
                staggerChildren: 0.2
              }
            }
          }}
        >
          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
            <Link href="/learning" className="block group">
              <Card className="h-full transform transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-primary/20">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-2xl font-headline font-bold text-primary">Learning Path</CardTitle>
                  <BookOpen className="h-8 w-8 text-primary" />
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Master data structures and algorithms through guided levels based on proven roadmaps.
                  </p>
                  <div className="mt-4 flex items-center text-primary font-semibold">
                    Start Learning <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>

          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
            <Link href={hasCompletedModule && !isLoading ? "/daily-streak" : "#"} className={`block group ${!hasCompletedModule && 'cursor-not-allowed'}`}>
              <Card className={`h-full transform transition-all duration-300 ${!hasCompletedModule ? 'bg-muted/50 filter grayscale' : 'hover:scale-105 hover:shadow-2xl hover:shadow-accent/20'}`}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className={`text-2xl font-headline font-bold ${!hasCompletedModule ? 'text-muted-foreground' : 'text-accent'}`}>Daily Streak</CardTitle>
                  {isLoading ? <Flame className="h-8 w-8 animate-spin" /> : !hasCompletedModule ? <Lock className="h-8 w-8 text-muted-foreground" /> : <Flame className="h-8 w-8 text-accent" />}
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {isLoading ? 'Loading...' : !hasCompletedModule ? 'Complete an entire module to unlock the Daily Streak challenge.' : 'Test your knowledge with a surprise daily question from topics you\'ve completed. Keep the fire going!'}
                  </p>
                  <div className={`mt-4 flex items-center font-semibold ${!hasCompletedModule ? 'text-muted-foreground' : 'text-accent'}`}>
                    Take the Challenge <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
