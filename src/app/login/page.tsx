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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [, setLoginMethod] = useLocalStorage('login-method', 'guest');
  const isGoogleLoginDisabled = !auth || !googleProvider;

  const handleGuestLogin = () => {
    setLoginMethod('guest');
    router.push('/home');
  };

  const handleGoogleLogin = async () => {
    if (isGoogleLoginDisabled) {
      // This should not be reachable if the button is disabled, but serves as a safeguard.
      // A toast is not necessary as the UI should communicate the disabled state.
      return;
    }
    try {
      await signInWithPopup(auth!, googleProvider!);
      setLoginMethod('google');
      router.push('/home');
    } catch (error: any) {
      console.error("Google Sign-In Error", error);
      let description = 'Could not sign in with Google. Please try again.';
      if (error.code === 'auth/invalid-api-key' || error.message.includes('API key not valid') || error.message.includes('api-key-expired')) {
        description = 'Your Firebase API key is invalid or expired. Please generate a new one, add it to your .env file, and restart the server.';
      } else if (error.code === 'auth/popup-closed-by-user') {
        description = 'The sign-in window was closed before completing. Please try again.';
      }
      
      toast({
        title: 'Sign-In Failed',
        description,
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
            <TooltipProvider>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  {/* The div wrapper is necessary for the tooltip to work on a disabled button */}
                  <div className="w-full">
                    <Button onClick={handleGoogleLogin} className="w-full" size="lg" disabled={isGoogleLoginDisabled}>
                      <LogIn /> Sign in with Google & Sync Progress
                    </Button>
                  </div>
                </TooltipTrigger>
                {isGoogleLoginDisabled && (
                  <TooltipContent>
                    <p>Cloud Sync is not configured. Add Firebase keys to enable.</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>

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
