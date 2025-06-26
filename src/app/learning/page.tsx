
'use client';

import Link from 'next/link';
import { GameHeader } from '@/components/GameHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Loader } from 'lucide-react';
import type { Module } from '@/lib/dsa-modules';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function LearningPage() {
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/dsa-modules.json')
      .then((res) => res.json())
      .then((data) => {
        setModules(data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Failed to load modules:', error);
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen">
      <GameHeader />
      <main className="container mx-auto max-w-7xl px-4 py-24">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold font-headline">Learning Path</h1>
          <p className="text-muted-foreground mt-2">Select a module to begin your quest.</p>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-8 w-3/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-6 w-1/3 mt-4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {modules.map((module) => (
              <Link key={module.id} href={`/learning/${module.id}`} className="block group">
                <Card className="h-full transform transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:border-primary">
                  <CardHeader>
                    <CardTitle className="font-headline text-2xl text-primary">{module.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">{module.description}</p>
                    <div className="flex items-center text-primary font-semibold">
                      View Levels <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
