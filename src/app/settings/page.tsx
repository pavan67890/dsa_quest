
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GameHeader } from '@/components/GameHeader';
import useLocalStorage from '@/hooks/useLocalStorage';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, Shield, Save, Terminal, Cloud, LogIn, LogOut, UploadCloud, DownloadCloud, Loader } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { auth, googleProvider } from '@/lib/firebase';
import { signInWithPopup, signOut, onAuthStateChanged, type User, GoogleAuthProvider } from 'firebase/auth';
import { saveProgress, loadProgress } from '@/services/driveService';

const formSchema = z.object({
  primaryApiKey: z.string().min(1, 'Primary API key is required.'),
  backupApiKey: z.string().min(1, 'Backup API key is required.'),
});

export default function SettingsPage() {
  const [apiKeys, setApiKeys] = useLocalStorage('api-keys', {
    primaryApiKey: '',
    backupApiKey: '',
  });
  const { toast } = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [oauthToken, setOauthToken] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: apiKeys,
  });

  useEffect(() => {
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
      description: 'Your API keys have been updated locally.',
    });
  }

  const getFreshToken = async (silent = false): Promise<string | null> => {
      try {
          const result = await signInWithPopup(auth, googleProvider);
          const credential = GoogleAuthProvider.credentialFromResult(result);
          if (credential?.accessToken) {
              setOauthToken(credential.accessToken);
              setUser(result.user);
              return credential.accessToken;
          }
          return null;
      } catch (error) {
          if (!silent) {
            console.error("Google Sign-In Error", error);
            toast({ title: 'Sign-In Failed', description: 'Could not sign in with Google. Please try again.', variant: 'destructive' });
          }
          return null;
      }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setUser(null);
    setOauthToken(null);
  };

  const handleSaveToDrive = async () => {
      let token = oauthToken;
      if (!token) {
        token = await getFreshToken();
      }
      if (!token) {
        toast({ title: 'Authentication Error', description: 'Could not get authentication token. Please sign in.', variant: 'destructive' });
        return;
      }

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
       let token = oauthToken;
      if (!token) {
        token = await getFreshToken();
      }
       if (!token) {
          toast({ title: 'Authentication Error', description: 'Could not get authentication token. Please sign in.', variant: 'destructive' });
          return;
      }

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
                <AlertTitle>Bring-Your-Own-Key (BYOK) Model</AlertTitle>
                <AlertDescription>
                This app uses your personal Google AI API keys. They are stored only in your browser. To check your usage, please visit your <a href="https://ai.google.dev/studio" target="_blank" rel="noopener noreferrer" className="underline text-primary font-semibold">Google AI Studio dashboard</a>.
                </AlertDescription>
            </Alert>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="primaryApiKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-lg"><KeyRound className="w-5 h-5 text-primary" /> Primary API Key</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter your Google AI Studio API key" {...field} />
                      </FormControl>
                      <FormDescription>
                        This key will be used for all AI interactions.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="backupApiKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-lg"><Shield className="w-5 h-5 text-accent" /> Backup API Key</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter a different Google AI Studio API key" {...field} />
                      </FormControl>
                      <FormDescription>
                        This key will be used as a fallback if the primary key fails.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" size="lg">
                  <Save className="mr-2 h-4 w-4" /> Save API Keys
                </Button>
              </form>
            </Form>

            <Separator className="my-8" />
            
            <div className="space-y-4">
                <h3 className="text-xl font-headline flex items-center gap-2">
                    <Cloud className="w-6 h-6 text-primary"/> Cloud Sync
                </h3>
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
                    <Button onClick={() => getFreshToken(false)} className="w-full" size="lg">
                        <LogIn /> Sign in with Google
                    </Button>
                )}
            </div>

          </CardContent>
        </Card>
      </main>
    </div>
  );
}
