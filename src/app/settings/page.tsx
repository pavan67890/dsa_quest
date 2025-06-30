
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
import { KeyRound, Save, Terminal, Cloud, LogIn, LogOut, UploadCloud, DownloadCloud, Loader, AlertTriangle, BarChart } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { auth, googleProvider } from '@/lib/firebase';
import { signInWithPopup, signOut, onAuthStateChanged, type User, GoogleAuthProvider } from 'firebase/auth';
import { saveProgress, loadProgress } from '@/services/driveService';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const formSchema = z.object({
  primaryGoogleApiKey: z.string().optional(),
  secondaryGoogleApiKey: z.string().optional(),
});

type ApiKeys = {
  primaryGoogleApiKey?: string;
  secondaryGoogleApiKey?: string;
};

type KeyStats = {
  [apiKey: string]: {
    calls: number;
    date: string;
  };
};

export default function SettingsPage() {
  const [apiKeys, setApiKeys] = useLocalStorage<ApiKeys>('api-keys', {});
  const [keyStats] = useLocalStorage<KeyStats>('key-stats', {});
  const { toast } = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [, setLoginMethod] = useLocalStorage('login-method', 'guest');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        primaryGoogleApiKey: apiKeys.primaryGoogleApiKey || '',
        secondaryGoogleApiKey: apiKeys.secondaryGoogleApiKey || '',
    },
  });
  
  useEffect(() => {
    form.reset({
        primaryGoogleApiKey: apiKeys.primaryGoogleApiKey || '',
        secondaryGoogleApiKey: apiKeys.secondaryGoogleApiKey || '',
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
      description: 'Your API keys have been updated locally.',
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

  const getTodaysCalls = (apiKey?: string) => {
    if (!apiKey || !keyStats[apiKey]) return 0;
    const today = new Date().toISOString().split('T')[0];
    if (keyStats[apiKey].date === today) {
        return keyStats[apiKey].calls;
    }
    return 0;
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
                <AlertTitle>Bring-Your-Own-Key (BYOK) with Fallback</AlertTitle>
                <AlertDescription>
                This app uses your personal Google AI API keys. Provide a primary and a secondary key. If the primary key fails due to quota limits, the app will automatically fall back to the secondary key.
                </AlertDescription>
            </Alert>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <Tabs defaultValue="primary" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="primary">Primary Key</TabsTrigger>
                    <TabsTrigger value="secondary">Secondary Key</TabsTrigger>
                  </TabsList>
                  <TabsContent value="primary" className="space-y-4 pt-4">
                    <FormField
                      control={form.control}
                      name="primaryGoogleApiKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-lg">
                            <KeyRound className="w-5 h-5 text-primary" /> Primary Google AI Key
                          </FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter your primary Google AI key" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-base font-medium flex items-center gap-2"><BarChart/> Key Statistics</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{getTodaysCalls(apiKeys.primaryGoogleApiKey)}</div>
                        <p className="text-xs text-muted-foreground">API calls made today with this key</p>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  <TabsContent value="secondary" className="space-y-4 pt-4">
                     <FormField
                      control={form.control}
                      name="secondaryGoogleApiKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-lg">
                            <KeyRound className="w-5 h-5 text-secondary" /> Secondary Google AI Key (Fallback)
                          </FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter your secondary Google AI key" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-base font-medium flex items-center gap-2"><BarChart/> Key Statistics</CardTitle>
                      </CardHeader>
                      <CardContent>
                         <div className="text-2xl font-bold">{getTodaysCalls(apiKeys.secondaryGoogleApiKey)}</div>
                        <p className="text-xs text-muted-foreground">API calls made today with this key</p>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
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
                            Follow these steps to get your free API key from Google AI Studio, which provides access to Gemini models.
                            </SheetDescription>
                        </SheetHeader>
                        <div className="py-4 space-y-4">
                            <ol className="list-decimal list-inside space-y-2">
                            <li>Go to <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline text-primary">aistudio.google.com</a> and sign in with your Google account.</li>
                            <li>Click the <strong>Create API key</strong> button.</li>
                            <li>Copy the generated key and paste it into the input field on the settings page.</li>
                            <li>You can create multiple keys to use as primary and secondary.</li>
                            </ol>
                            <p className="text-sm text-muted-foreground">Google provides a generous free tier to get started with the Gemini API.</p>
                        </div>
                        </SheetContent>
                    </Sheet>
                </div>
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
                            <Button onClick={getFreshToken} className="w-full" size="lg">
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
