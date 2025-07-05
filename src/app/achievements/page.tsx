'use client';

import type { LucideProps } from 'lucide-react';
import type { ForwardRefExoticComponent, RefAttributes } from 'react';
import { GameHeader } from '@/components/GameHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import useLocalStorage from '@/hooks/useLocalStorage';
import { Medal, ShieldCheck, Star } from 'lucide-react';
import { STORAGE_KEYS } from '@/lib/storageKeys';

type BadgeInfo = {
  id: string;
  name: string;
  Icon: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>;
  className: string;
  description: string;
};

const allBadges: BadgeInfo[] = [
  { id: 'arrays', name: 'Array Alchemist', Icon: Star, className: 'text-yellow-400', description: 'Mastered the Arrays module.' },
  { id: 'strings', name: 'String Sensei', Icon: Medal, className: 'text-orange-400', description: 'Mastered the Strings module.' },
  { id: 'recursion', name: 'Recursion Ruler', Icon: ShieldCheck, className: 'text-purple-400', description: 'Mastered the Recursion module.' },
];

export default function AchievementsPage() {
  const [earnedBadges] = useLocalStorage<string[]>(STORAGE_KEYS.EARNED_BADGES, []);

  return (
    <div className="min-h-screen">
      <GameHeader />
      <main className="flex flex-col items-center justify-center min-h-screen pt-20 px-4">
        <Card className="w-full max-w-4xl shadow-2xl">
          <CardHeader>
            <CardTitle className="font-headline text-3xl">Your Achievements</CardTitle>
          </CardHeader>
          <CardContent>
            {allBadges.length === 0 ? (
                <p className="text-center text-muted-foreground">
                    No achievements earned yet. Complete modules to earn badges!
                </p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                {allBadges.map(({ id, name, Icon, className, description }) => {
                    const hasBadge = earnedBadges.includes(id);
                    return (
                    <div
                        key={id}
                        className={`group p-6 rounded-2xl border-2 flex flex-col items-center justify-center text-center transition-all duration-500 ease-in-out transform hover:-translate-y-2 ${
                        hasBadge
                            ? 'border-primary bg-primary/10 shadow-2xl shadow-primary/20 hover:shadow-primary/30'
                            : 'border-dashed bg-muted/50 filter grayscale opacity-60'
                        }`}
                    >
                        <div className="mb-4">
                            <Icon className={`h-16 w-16 transition-transform duration-300 group-hover:scale-110 ${hasBadge ? className : 'text-muted-foreground'}`} />
                        </div>
                        <h3 className="text-xl font-bold font-headline">{name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{description}</p>
                        {hasBadge && (
                            <Badge variant="default" className="mt-4 bg-primary text-primary-foreground shadow-lg">Unlocked</Badge>
                        )}
                    </div>
                    );
                })}
                </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
