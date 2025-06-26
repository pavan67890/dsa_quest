'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
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
import { KeyRound, Shield, Save } from 'lucide-react';

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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: apiKeys,
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setApiKeys(values);
    toast({
      title: 'Settings Saved!',
      description: 'Your API keys have been updated locally.',
    });
  }

  return (
    <div className="min-h-screen">
      <GameHeader />
      <main className="flex items-center justify-center min-h-screen pt-20 px-4">
        <Card className="w-full max-w-2xl shadow-2xl">
          <CardHeader>
            <CardTitle className="font-headline text-3xl">API Key Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              DSA Quest uses a Bring-Your-Own-Key (BYOK) model. Your keys are stored securely on your local machine and never sent to our servers.
            </p>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="primaryApiKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-lg"><KeyRound className="w-5 h-5 text-primary" /> Primary API Key</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter your primary key (e.g., Mixtral-8x7b)" {...field} />
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
                        <Input type="password" placeholder="Enter your backup key (e.g., Gemma 7B)" {...field} />
                      </FormControl>
                      <FormDescription>
                        This key will be used as a fallback if the primary key fails.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" size="lg">
                  <Save className="mr-2 h-4 w-4" /> Save Keys
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
