
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
import { KeyRound, Shield, Save, Terminal, Cloud, LogIn, LogOut, UploadCloud, DownloadCloud, Loader, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { auth, googleProvider } from '@/lib/firebase';
import { signInWithPopup, signOut, onAuthStateChanged, type User, GoogleAuthProvider } from 'firebase/auth';
import { saveProgress, loadProgress } from '@/services/driveService';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

const formSchema = z.object({
  openRouterApiKey: z.string().min(1, 'OpenRouter API key is required.'),
  googleApiKey: z.string().optional(),
});

export default function SettingsPage() {
  const [apiKeys, setApiKeys] = useLocalStorage('api-keys', {
    openRouterApiKey: '',
    googleApiKey: '',
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
      description: 'Your API keys have been updated locally.',
    });
  }

  const getFreshToken = async (silent = false): Promise<string | null> => {
      if (!auth || !googleProvider) {
          if (!silent) {
            toast({ title: 'Cloud Sync Is Not Configured', description: 'Firebase API keys are missing. Please add them to your environment variables to enable this feature.', variant: 'destructive' });
          }
          return null;
      }

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
    if (!auth) return;
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
        if (auth && googleProvider) {
            toast({ title: 'Authentication Error', description: 'Could not get authentication token. Please sign in.', variant: 'destructive' });
        }
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
          if (auth && googleProvider) {
            toast({ title: 'Authentication Error', description: 'Could not get authentication token. Please sign in.', variant: 'destructive' });
          }
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
                This app uses your personal OpenRouter API key to access powerful language models like Mixtral, Llama3, and Gemma. Your key is stored only in your browser.
                </AlertDescription>
            </Alert>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="openRouterApiKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-lg">
                        <KeyRound className="w-5 h-5 text-primary" /> OpenRouter API Key
                        <Sheet>
                          <SheetTrigger asChild>
                            <Button variant="link" className="p-0 h-auto text-sm">(How to get a key?)</Button>
                          </SheetTrigger>
                          <SheetContent>
                            <SheetHeader>
                              <SheetTitle>Getting your OpenRouter API Key</SheetTitle>
                              <SheetDescription>
                                Follow these steps to get your free API key from OpenRouter, which provides access to many different AI models.
                              </SheetDescription>
                            </SheetHeader>
                            <div className="py-4 space-y-4">
                              <ol className="list-decimal list-inside space-y-2">
                                <li>Go to <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="underline text-primary">openrouter.ai</a> and sign up or log in.</li>
                                <li>Click your profile icon in the top-right and select <strong>Keys</strong>.</li>
                                <li>Click the <strong>+ Create Key</strong> button.</li>
                                <li>Give your key a name (e.g., "DSA-Quest") and click <strong>Create</strong>.</li>
                                <li>Copy the key that starts with `sk-or-` and paste it into the input field on the settings page.</li>
                              </ol>
                              <p className="text-sm text-muted-foreground">OpenRouter provides a generous free tier to get started with various AI models.</p>
                            </div>
                          </SheetContent>
                        </Sheet>
                      </FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter your OpenRouter API key" {...field} />
                      </FormControl>
                      <FormDescription>
                        Used for all core AI interactions.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="googleApiKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-lg"><Shield className="w-5 h-5 text-accent" /> Google AI API Key (for Audio)</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter a Google AI Studio API key" {...field} />
                      </FormControl>
                      <FormDescription>
                        Optional. This key is only used for the text-to-speech audio feature.
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
                {!auth || !googleProvider ? (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Cloud Sync Is Not Configured</AlertTitle>
                        <AlertDescription>
                            Firebase environment variables are missing. Please add them to your project to enable saving your progress to the cloud.
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
                            <Button onClick={() => getFreshToken(false)} className="w-full" size="lg">
                                <LogIn /> Sign in with Google
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
