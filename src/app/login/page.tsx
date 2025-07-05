'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn, User } from 'lucide-react';
import useLocalStorage from '@/hooks/useLocalStorage';
import { auth, googleProvider } from '@/lib/firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { loadProgress } from '@/services/driveService';
import { STORAGE_KEYS } from '@/lib/storageKeys';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [, setLoginMethod] = useLocalStorage(STORAGE_KEYS.LOGIN_METHOD, 'guest');

  const handleGuestLogin = () => {
    setLoginMethod('guest');
    router.push('/home');
  };

  const handleGoogleLogin = async () => {
    if (!auth || !googleProvider) {
      toast({
        title: 'Sign-In Failed',
        description: 'Cloud Sync is not configured. Add your Firebase keys to the .env file and restart the server to enable this feature.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      setLoginMethod('google');
      
      if (credential?.accessToken) {
        try {
          const progressData: any = await loadProgress(credential.accessToken);
          if (progressData) {
            localStorage.setItem(STORAGE_KEYS.USER_PROGRESS, JSON.stringify(progressData[STORAGE_KEYS.USER_PROGRESS] || {}));
            localStorage.setItem(STORAGE_KEYS.USER_XP, JSON.stringify(progressData[STORAGE_KEYS.USER_XP] || 0));
            localStorage.setItem(STORAGE_KEYS.EARNED_BADGES, JSON.stringify(progressData[STORAGE_KEYS.EARNED_BADGES] || []));
            localStorage.setItem(STORAGE_KEYS.API_KEYS, JSON.stringify(progressData[STORAGE_KEYS.API_KEYS] || {}));
            toast({
              title: 'Progress Loaded!',
              description: `Welcome back, ${result.user.displayName}! Your progress has been restored from the cloud.`,
            });
          }
        } catch (e) {
          console.error('Failed to load progress on login:', e);
          // Fail silently on load error, don't block login
        }
      }
      
      router.push('/home');
    } catch (error: any) {
      console.error("Google Sign-In Error", error);
      let description = 'Could not sign in with Google. Please try again.';
      // Check for common, user-fixable errors.
      if (error.code === 'auth/invalid-api-key' || error.message.includes('API key not valid') || error.message.includes('api-key-expired')) {
        description = 'Your Firebase API key is invalid or expired. Please generate a new one, add it to your .env file, and restart the server.';
      } else if (error.code === 'auth/popup-closed-by-user') {
        description = 'The sign-in window was closed before completing. Please try again.';
      } else if (error.code === 'auth/unauthorized-domain') {
        description = "This app's domain is not authorized for Firebase sign-in. Please add it to the authorized domains in your Firebase project settings.";
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
