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
import { KeyRound, Save, Terminal, Cloud, LogIn, LogOut, Loader, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { auth, googleProvider } from '@/lib/firebase';
import { signInWithPopup, signOut, onAuthStateChanged, type User, GoogleAuthProvider } from 'firebase/auth';
import { loadProgress, triggerSync } from '@/services/driveService';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { STORAGE_KEYS } from '@/lib/storageKeys';

const formSchema = z.object({
  primaryApiKey: z.string().optional(),
  secondaryApiKey: z.string().optional(),
  primaryApiKeyLimit: z.string().optional(),
  secondaryApiKeyLimit: z.string().optional(),
});

type ApiKeys = {
  primaryApiKey?: string;
  secondaryApiKey?: string;
  primaryApiKeyLimit?: string;
  secondaryApiKeyLimit?: string;
};

type KeyUsageStats = {
  primary: { date: string; count: number };
  secondary: { date: string; count: number };
};

export default function SettingsPage() {
  const [apiKeys, setApiKeys] = useLocalStorage<ApiKeys>(STORAGE_KEYS.API_KEYS, {});
  const [keyUsageStats] = useLocalStorage<KeyUsageStats>(STORAGE_KEYS.KEY_USAGE_STATS, {
    primary: { date: '', count: 0 },
    secondary: { date: '', count: 0 },
  });
  const { toast } = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [loginMethod, setLoginMethod] = useLocalStorage(STORAGE_KEYS.LOGIN_METHOD, 'guest');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      primaryApiKey: apiKeys.primaryApiKey || '',
      secondaryApiKey: apiKeys.secondaryApiKey || '',
      primaryApiKeyLimit: apiKeys.primaryApiKeyLimit || '',
      secondaryApiKeyLimit: apiKeys.secondaryApiKeyLimit || '',
    },
  });
  
  useEffect(() => {
    form.reset({
      primaryApiKey: apiKeys.primaryApiKey || '',
      secondaryApiKey: apiKeys.secondaryApiKey || '',
      primaryApiKeyLimit: apiKeys.primaryApiKeyLimit || '',
      secondaryApiKeyLimit: apiKeys.secondaryApiKeyLimit || '',
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

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setApiKeys(values);
    toast({
      title: 'Settings Saved!',
      description: 'Your API keys and limits have been updated.',
    });
    if (loginMethod === 'google') {
        try {
            await triggerSync();
            toast({
                title: 'Settings Synced!',
                description: 'Your new API keys have also been saved to your Google Drive.',
            });
        } catch (e) {
            toast({
                title: 'Sync Failed',
                description: 'Could not sync your new keys to Google Drive.',
                variant: 'destructive',
            });
        }
    }
  }

  const handleSignIn = async (): Promise<void> => {
      if (!auth || !googleProvider) {
        toast({ title: 'Cloud Sync Is Not Configured', description: 'Firebase configuration not detected. Please ensure your keys are in a `.env.local` file and that you have restarted your development server to enable cloud sync.', variant: 'destructive' });
        return;
      }

      try {
          setIsAuthLoading(true);
          const result = await signInWithPopup(auth, googleProvider);
          const credential = GoogleAuthProvider.credentialFromResult(result);
          
          if (credential?.accessToken) {
              setUser(result.user);
              setLoginMethod('google');
              
              try {
                const progressData: any = await loadProgress(credential.accessToken);
                if (progressData) {
                    localStorage.setItem(STORAGE_KEYS.USER_PROGRESS, JSON.stringify(progressData[STORAGE_KEYS.USER_PROGRESS] || {}));
                    localStorage.setItem(STORAGE_KEYS.USER_XP, JSON.stringify(progressData[STORAGE_KEYS.USER_XP] || 0));
                    localStorage.setItem(STORAGE_KEYS.EARNED_BADGES, JSON.stringify(progressData[STORAGE_KEYS.EARNED_BADGES] || []));
                    localStorage.setItem(STORAGE_KEYS.API_KEYS, JSON.stringify(progressData[STORAGE_KEYS.API_KEYS] || {}));
                    toast({ title: 'Progress Loaded!', description: `Welcome back, ${result.user.displayName}! Your progress has been restored from Google Drive.` });
                } else {
                     toast({ title: `Welcome, ${result.user.displayName}!`, description: 'No cloud save found. Your future progress will be synced automatically.', variant: 'default' });
                }
              } catch(e) {
                console.error("Failed to load progress on login:", e);
                toast({ title: `Welcome, ${result.user.displayName}!`, description: 'Could not load progress from the cloud, but you are signed in. Your future progress will be synced.', variant: 'default' });
              }
          }
      } catch (error: any) {
          console.error("Google Sign-In Error", error);
          let description = 'Could not sign in with Google. Please try again.';
          if (error.code === 'auth/invalid-api-key' || error.message.includes('API key not valid') || error.message.includes('api-key-expired')) {
            description = 'Your Firebase API key is invalid or expired. Please generate a new one, add it to your .env file, and restart the server.';
          } else if (error.code === 'auth/popup-closed-by-user') {
            description = 'The sign-in window was closed before completing. Please try again.';
          }
          toast({ title: 'Sign-In Failed', description, variant: 'destructive' });
      } finally {
        setIsAuthLoading(false);
      }
  };

  const handleSignOut = async () => {
    if (!auth) return;
    await signOut(auth);
    setUser(null);
    setLoginMethod('guest');
    toast({ title: "Signed Out", description: "You are now in guest mode. Your progress will only be saved in this browser." });
  };

  const today = new Date().toISOString().split('T')[0];
  const primaryCallsToday = keyUsageStats.primary.date === today ? keyUsageStats.primary.count : 0;
  const secondaryCallsToday = keyUsageStats.secondary.date === today ? keyUsageStats.secondary.count : 0;

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
                 This app utilizes a flexible BYOK system. For the best experience, we recommend using a Mixtral-8x7b model endpoint as your primary key and a Gemma-7B model endpoint as your secondary key. The app will automatically fall back to the secondary key if the primary key's daily limit is reached or an API error occurs.
                </AlertDescription>
            </Alert>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <Tabs defaultValue="primary" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="primary">Primary Key</TabsTrigger>
                    <TabsTrigger value="secondary">Secondary Key</TabsTrigger>
                  </TabsList>
                  <TabsContent value="primary" className="pt-4 space-y-4">
                     <FormField
                        control={form.control}
                        name="primaryApiKey"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2 text-lg">
                              <KeyRound className="w-5 h-5 text-primary" /> Primary API Key (e.g., Mixtral-8x7b)
                            </FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Enter your primary API key" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="primaryApiKeyLimit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Daily Request Limit</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="e.g., 1000" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
                          <Info className="h-4 w-4"/>
                          Calls Today: {primaryCallsToday} / {apiKeys.primaryApiKeyLimit || '∞'}
                      </div>
                  </TabsContent>
                  <TabsContent value="secondary" className="pt-4 space-y-4">
                     <FormField
                        control={form.control}
                        name="secondaryApiKey"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2 text-lg">
                              <KeyRound className="w-5 h-5 text-secondary-foreground" /> Secondary API Key (e.g., Gemma-7B)
                            </FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Enter your fallback API key" {...field} />
                            </FormControl>
                             <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="secondaryApiKeyLimit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Daily Request Limit</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="e.g., 1000" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                        />
                      <div className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
                          <Info className="h-4 w-4"/>
                          Calls Today: {secondaryCallsToday} / {apiKeys.secondaryApiKeyLimit || '∞'}
                      </div>
                  </TabsContent>
                </Tabs>

                <div className="flex items-center gap-2 pt-4">
                    <p className="text-sm text-muted-foreground">Need a key?</p>
                    <Sheet>
                        <SheetTrigger asChild>
                        <Button variant="link" className="p-0 h-auto text-sm">How to get an API key</Button>
                        </SheetTrigger>
                        <SheetContent>
                        <SheetHeader>
                            <SheetTitle>Getting your API Key</SheetTitle>
                            <SheetDescription>
                             Follow these steps to get a free API key from a provider like OpenRouter to use with models like Mixtral or Gemma.
                            </SheetDescription>
                        </SheetHeader>
                        <div className="py-4 space-y-4">
                            <ol className="list-decimal list-inside space-y-2">
                            <li>Go to a provider like <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="underline text-primary">OpenRouter.ai</a>.</li>
                            <li>Sign up or log in.</li>
                            <li>Navigate to the 'Keys' section of your account.</li>
                            <li>Click the "Create Key" button.</li>
                            <li>Copy your new API key and paste it into the appropriate field on the settings page.</li>
                            </ol>
                            <p className="text-sm text-muted-foreground">When you sign in with Google, your API keys are saved to your personal Google Drive along with your game progress.</p>
                        </div>
                        </SheetContent>
                    </Sheet>
                </div>
                <Button type="submit" className="w-full" size="lg">
                  <Save className="mr-2 h-4 w-4" /> Save API Keys & Limits
                </Button>
              </form>
            </Form>

            <Separator className="my-8" />
            
            <div className="space-y-4">
                <h3 className="text-xl font-headline flex items-center gap-2">
                    <Cloud className="w-6 h-6 text-primary"/> Cloud Sync
                </h3>
                {!auth || !googleProvider ? (
                    <Alert>
                        <Cloud className="h-4 w-4" />
                        <AlertTitle>Enable Cloud Sync</AlertTitle>
                        <AlertDescription>
                          To save your progress across devices, connect a Google account. This requires Firebase to be configured in your environment. Once enabled, you can sign in here to back up and restore your progress to Google Drive.
                        </AlertDescription>
                    </Alert>
                ) : (
                    <>
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
                                 <Alert>
                                    <Cloud className="h-4 w-4" />
                                    <AlertTitle>Cloud Sync is Active</AlertTitle>
                                    <AlertDescription>
                                        Your progress and settings are automatically saved to Google Drive when you complete interviews or update your keys.
                                    </AlertDescription>
                                </Alert>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    Sign in with your Google account to automatically save and load all your progress and settings to your private Google Drive app folder.
                                </p>
                                <Button onClick={handleSignIn} className="w-full" size="lg">
                                    <LogIn /> Sign in with Google to Enable Sync
                                </Button>
                            </div>
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
