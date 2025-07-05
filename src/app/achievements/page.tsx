'use client';

import type { LucideProps } from 'lucide-react';
import type { ForwardRefExoticComponent, RefAttributes } from 'react';
import { GameHeader } from '@/components/GameHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Medal,
  ShieldCheck,
  Star,
  Link,
  Layers,
  Binary,
  GitGraph,
  Table,
  Cpu,
  Pyramid,
  BrainCircuit,
  Search,
  BookOpen,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import type { Module } from '@/lib/dsa-modules';
import useLocalStorage from '@/hooks/useLocalStorage';
import { STORAGE_KEYS } from '@/lib/storageKeys';

type BadgeInfo = {
  id: string;
  name: string;
  Icon: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>;
  className: string;
  description: string;
};

// Map module IDs to their badge details
const badgeDetails: Record<string, Omit<BadgeInfo, 'id' | 'description'>> = {
  arrays: { name: 'Array Alchemist', Icon: Star, className: 'text-yellow-400' },
  strings: { name: 'String Sensei', Icon: Medal, className: 'text-orange-400' },
  'linked-lists': { name: 'List Lancer', Icon: Link, className: 'text-cyan-400' },
  'stacks-queues': { name: 'Stack Strategist', Icon: Layers, className: 'text-indigo-400' },
  recursion: { name: 'Recursion Ruler', Icon: ShieldCheck, className: 'text-purple-400' },
  trees: { name: 'Tree Traversal Titan', Icon: Binary, className: 'text-green-400' },
  graphs: { name: 'Graph Guru', Icon: GitGraph, className: 'text-blue-400' },
  'hash-tables': { name: 'Hash Hero', Icon: Table, className: 'text-rose-400' },
  heaps: { name: 'Heap Hopper', Icon: Pyramid, className: 'text-amber-400' },
  'dynamic-programming': { name: 'DP Dynamo', Icon: BrainCircuit, className: 'text-pink-400' },
  'sorting-searching': { name: 'Sort Sage', Icon: Search, className: 'text-violet-400' },
  'bit-manipulation': { name: 'Bit Brawler', Icon: Cpu, className: 'text-teal-400' },
  default: { name: 'Module Master', Icon: BookOpen, className: 'text-gray-400' }
};

export default function AchievementsPage() {
  const [earnedBadges] = useLocalStorage<string[]>(STORAGE_KEYS.EARNED_BADGES, []);
  const [allBadges, setAllBadges] = useState<BadgeInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/dsa-modules.json')
      .then(res => res.json())
      .then((modules: Module[]) => {
        const generatedBadges = modules.map(module => {
          const details = badgeDetails[module.id] || badgeDetails.default;
          return {
            id: module.id,
            name: details.name,
            Icon: details.Icon,
            className: details.className,
            description: `Mastered the ${module.name} module.`,
          };
        });
        setAllBadges(generatedBadges);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Failed to load modules for achievements:", err);
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen">
      <GameHeader />
      <main className="flex flex-col items-center justify-center min-h-screen pt-20 px-4 pb-20">
        <Card className="w-full max-w-4xl shadow-2xl">
          <CardHeader>
            <CardTitle className="font-headline text-3xl">Your Achievements</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="p-6 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center">
                    <Skeleton className="h-24 w-24 rounded-full mb-4" />
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
              </div>
            ) : allBadges.length === 0 ? (
                <p className="text-center text-muted-foreground">
                    No modules found. Cannot display achievements.
                </p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                <AnimatePresence>
                  {allBadges.map(({ id, name, Icon, className, description }, index) => {
                      const hasBadge = earnedBadges.includes(id);
                      return (
                      <motion.div
                          key={id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.5, delay: index * 0.05 }}
                          className={`group p-6 rounded-2xl border-2 flex flex-col items-center justify-center text-center transition-all duration-500 ease-in-out ${
                          hasBadge
                              ? 'border-primary bg-primary/10 shadow-2xl shadow-primary/20'
                              : 'border-dashed bg-muted/50'
                          }`}
                      >
                           <motion.div
                            className="mb-4"
                            initial={false}
                            animate={hasBadge ? { filter: 'grayscale(0%)', scale: 1.1, y: -5 } : { filter: 'grayscale(100%)', scale: 1, y: 0 }}
                            transition={{ duration: 0.7, type: 'spring', stiffness: 100, damping: 10 }}
                            whileHover={{ scale: hasBadge ? 1.2 : 1.05 }}
                          >
                             <Icon className={`h-24 w-24 transition-colors duration-500 ${hasBadge ? className : 'text-muted-foreground/50'}`} />
                           </motion.div>
                          <h3 className="text-xl font-bold font-headline">{name}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{description}</p>
                          {hasBadge && (
                              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                                <Badge variant="default" className="mt-4 bg-primary text-primary-foreground shadow-lg">Unlocked</Badge>
                              </motion.div>
                          )}
                      </motion.div>
                      );
                  })}
                </AnimatePresence>
                </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
