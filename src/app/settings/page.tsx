
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { GameHeader } from '@/components/GameHeader';
import useLocalStorage from '@/hooks/useLocalStorage';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, Save, Terminal, Cloud, LogIn, LogOut, UploadCloud, DownloadCloud, Loader, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { auth, googleProvider } from '@/lib/firebase';
import { signInWithPopup, signOut, onAuthStateChanged, type User, GoogleAuthProvider } from 'firebase/auth';
import { saveProgress, loadProgress } from '@/services/driveService';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

const formSchema = z.object({
  googleApiKey: z.string().optional(),
});

type ApiKeys = {
  googleApiKey?: string;
};

export default function SettingsPage() {
  const [apiKeys, setApiKeys] = useLocalStorage<ApiKeys>('api-keys', {});
  const { toast } = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [, setLoginMethod] = useLocalStorage('login-method', 'guest');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        googleApiKey: apiKeys.googleApiKey || '',
    },
  });
  
  useEffect(() => {
    form.reset({
        googleApiKey: apiKeys.googleApiKey || '',
    });
  }, [apiKeys, form]);

  useEffect(() => {
    if (!auth) {
        setIsAuthLoading(false);
        return;
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  function onSubmit(values: z.infer<typeof formSchema>) {
    setApiKeys(values);
    toast({
      title: 'Settings Saved!',
      description: 'Your API key has been updated locally.',
    });
  }

  const getFreshToken = async (): Promise<string | null> => {
      if (!auth || !googleProvider) {
        toast({ title: 'Cloud Sync Is Not Configured', description: 'Firebase configuration not detected. Please ensure your keys are in a `.env.local` file and that you have restarted your development server to enable cloud sync.', variant: 'destructive' });
        return null;
      }

      try {
          const result = await signInWithPopup(auth, googleProvider);
          const credential = GoogleAuthProvider.credentialFromResult(result);
          if (credential?.accessToken) {
              setUser(result.user);
              setLoginMethod('google');
              toast({ title: 'Sync Enabled!', description: 'Your progress will now be synced with your Google Drive.' });
              return credential.accessToken;
          }
          return null;
      } catch (error: any) {
          console.error("Google Sign-In Error", error);
          let description = 'Could not sign in with Google. Please try again.';
          if (error.code === 'auth/invalid-api-key' || error.message.includes('API key not valid') || error.message.includes('api-key-expired')) {
            description = 'Your Firebase API key is invalid or expired. Please generate a new one, add it to your .env file, and restart the server.';
          } else if (error.code === 'auth/popup-closed-by-user') {
            description = 'The sign-in window was closed before completing. Please try again.';
          }
          toast({ title: 'Sign-In Failed', description, variant: 'destructive' });
          return null;
      }
  };

  const handleSignOut = async () => {
    if (!auth) return;
    await signOut(auth);
    setUser(null);
    setLoginMethod('guest');
    toast({ title: "Signed Out", description: "You are now in guest mode. Your progress will only be saved in this browser." });
  };

  const handleSaveToDrive = async () => {
      const token = await getFreshToken();
      if (!token) return;

      setIsSyncing(true);
      try {
          const progressData = {
              'user-progress': JSON.parse(localStorage.getItem('user-progress') || '{}'),
              'user-xp': JSON.parse(localStorage.getItem('user-xp') || '0'),
              'earned-badges': JSON.parse(localStorage.getItem('earned-badges') || '[]'),
          };
          await saveProgress(token, progressData);
          toast({ title: 'Progress Saved!', description: 'Your progress has been saved to Google Drive.' });
      } catch (error) {
          console.error('Save to Drive Error', error);
          toast({ title: 'Save Failed', description: String(error) || 'Could not save progress to Google Drive.', variant: 'destructive' });
      } finally {
          setIsSyncing(false);
      }
  };

  const handleLoadFromDrive = async () => {
      const token = await getFreshToken();
      if (!token) return;

      setIsSyncing(true);
      try {
          const progressData: any = await loadProgress(token);
          if (progressData) {
              localStorage.setItem('user-progress', JSON.stringify(progressData['user-progress'] || {}));
              localStorage.setItem('user-xp', JSON.stringify(progressData['user-xp'] || 0));
              localStorage.setItem('earned-badges', JSON.stringify(progressData['earned-badges'] || []));
              toast({ title: 'Progress Loaded!', description: 'Your progress has been loaded. The page will now reload.' });
              setTimeout(() => window.location.reload(), 2000);
          } else {
               toast({ title: 'No Progress Found', description: 'No saved data was found in your Google Drive.', variant: 'default' });
          }
      } catch (error) {
          console.error('Load from Drive Error', error);
          toast({ title: 'Load Failed', description: String(error) || 'Could not load progress from Google Drive.', variant: 'destructive' });
      } finally {
          setIsSyncing(false);
      }
  };

  return (
    <div className="min-h-screen">
      <GameHeader />
      <main className="flex items-center justify-center min-h-screen pt-20 px-4">
        <Card className="w-full max-w-2xl shadow-2xl">
          <CardHeader>
            <CardTitle className="font-headline text-3xl">Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <h3 className="text-xl font-headline flex items-center gap-2 mb-4">API Keys</h3>
            <Alert className="mb-6">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Bring-Your-Own-Key (BYOK) System</AlertTitle>
                <AlertDescription>
                  This app is built on Google's AI Platform. For the "Bring Your Own Key" system to work, you must provide your personal Google AI API key. The key is stored securely in your browser and is required for all AI features.
                </AlertDescription>
            </Alert>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="googleApiKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-lg">
                        <KeyRound className="w-5 h-5 text-primary" /> Google AI API Key
                      </FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter your Google AI key" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">Need a key?</p>
                    <Sheet>
                        <SheetTrigger asChild>
                        <Button variant="link" className="p-0 h-auto text-sm">How to get a Google AI API key</Button>
                        </SheetTrigger>
                        <SheetContent>
                        <SheetHeader>
                            <SheetTitle>Getting your Google AI API Key</SheetTitle>
                            <SheetDescription>
                             Follow these steps to get a free API key from Google AI Studio to use with models like Gemini.
                            </SheetDescription>
                        </SheetHeader>
                        <div className="py-4 space-y-4">
                            <ol className="list-decimal list-inside space-y-2">
                            <li>Go to <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline text-primary">Google AI Studio</a>.</li>
                            <li>Log in with your Google account.</li>
                            <li>Click the "Create API key" button.</li>
                            <li>Copy your new API key and paste it into the key input field on the settings page.</li>
                            </ol>
                            <p className="text-sm text-muted-foreground">Your API keys are stored only in your browser and are never shared.</p>
                        </div>
                        </SheetContent>
                    </Sheet>
                </div>
                <Button type="submit" className="w-full" size="lg">
                  <Save className="mr-2 h-4 w-4" /> Save API Key
                </Button>
              </form>
            </Form>

            <Separator className="my-8" />
            
            <div className="space-y-4">
                <h3 className="text-xl font-headline flex items-center gap-2">
                    <Cloud className="w-6 h-6 text-primary"/> Cloud Sync
                </h3>
                {!auth || !googleProvider ? (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Cloud Sync Is Not Configured</AlertTitle>
                        <AlertDescription>
                            Firebase configuration not detected. Please ensure your keys are in a `.env.local` file and that you have restarted your development server to enable cloud sync.
                        </AlertDescription>
                    </Alert>
                ) : (
                    <>
                        <p className="text-sm text-muted-foreground">
                            Sign in with your Google account to save and load your progress to your private Google Drive app folder.
                        </p>
                        {isAuthLoading ? (
                            <div className="flex items-center justify-center h-20">
                                <Loader className="animate-spin" />
                            </div>
                        ) : user ? (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                                    <p className="font-semibold">Signed in as {user.displayName || user.email}</p>
                                    <Button variant="outline" onClick={handleSignOut}><LogOut />Sign Out</Button>
                                </div>
                                <div className="flex gap-4">
                                    <Button onClick={handleSaveToDrive} className="w-full" disabled={isSyncing}>
                                        {isSyncing ? <Loader className="animate-spin" /> : <UploadCloud />}
                                        Save to Drive
                                    </Button>
                                    <Button onClick={handleLoadFromDrive} className="w-full" variant="outline" disabled={isSyncing}>
                                        {isSyncing ? <Loader className="animate-spin" /> : <DownloadCloud />}
                                        Load from Drive
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <Button onClick={() => getFreshToken()} className="w-full" size="lg">
                                <LogIn /> Sign in with Google to Enable Sync
                            </Button>
                        )}
                    </>
                )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
