'use client';

import Link from 'next/link';
import { ArrowRight, BookOpen, Flame } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GameHeader } from '@/components/GameHeader';
import { motion } from 'framer-motion';

export default function HomePage() {
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
            <Link href="/daily-streak" className="block group">
              <Card className="h-full transform transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-accent/20">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-2xl font-headline font-bold text-accent">Daily Streak</CardTitle>
                  <Flame className="h-8 w-8 text-accent" />
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Test your knowledge with a surprise daily question from topics you've completed. Keep the fire going!
                  </p>
                  <div className="mt-4 flex items-center text-accent font-semibold">
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
