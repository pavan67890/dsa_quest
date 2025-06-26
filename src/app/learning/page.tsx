import Link from 'next/link';
import { GameHeader } from '@/components/GameHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dsaModules } from '@/lib/dsa-modules';
import { ArrowRight } from 'lucide-react';

export default function LearningPage() {
  return (
    <div className="min-h-screen">
      <GameHeader />
      <main className="container mx-auto max-w-7xl px-4 py-24">
        <div className="text-center mb-12">
            <h1 className="text-5xl font-bold font-headline">Learning Path</h1>
            <p className="text-muted-foreground mt-2">Select a module to begin your quest.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {dsaModules.map((module) => (
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
      </main>
    </div>
  );
}
