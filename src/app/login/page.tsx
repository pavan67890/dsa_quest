'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn, User } from 'lucide-react';
import useLocalStorage from '@/hooks/useLocalStorage';
import { auth, googleProvider } from '@/lib/firebase';
import { signInWithPopup } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [, setLoginMethod] = useLocalStorage('login-method', 'guest');

  const handleGuestLogin = () => {
    setLoginMethod('guest');
    router.push('/home');
  };

  const handleGoogleLogin = async () => {
    if (!auth || !googleProvider) {
      toast({
        title: 'Cloud Sync Not Configured',
        description: 'Firebase is not set up. Please add the necessary environment variables to enable this feature.',
        variant: 'destructive',
      });
      return;
    }
    try {
      await signInWithPopup(auth, googleProvider);
      setLoginMethod('google');
      router.push('/home');
    } catch (error) {
      console.error("Google Sign-In Error", error);
      toast({
        title: 'Sign-In Failed',
        description: 'Could not sign in with Google. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background text-foreground">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="text-center">
            <h1 className="font-headline text-5xl font-bold tracking-tighter text-primary">
              DSA Quest
            </h1>
            <CardDescription>
              Your journey to mastering data structures & algorithms begins here.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-sm text-muted-foreground">Choose how you want to play:</p>
            <Button onClick={handleGoogleLogin} className="w-full" size="lg">
              <LogIn /> Sign in with Google & Sync Progress
            </Button>
            <Button onClick={handleGuestLogin} className="w-full" variant="secondary" size="lg">
              <User /> Continue as Guest
            </Button>
            <p className="text-xs text-muted-foreground text-center pt-2">
              Guest progress is saved only in this browser. Sign in to sync your progress across devices.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
