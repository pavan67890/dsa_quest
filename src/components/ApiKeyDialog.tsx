import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useRouter } from "next/navigation"

interface ApiKeyDialogProps {
  isOpen: boolean;
}

export function ApiKeyDialog({ isOpen }: ApiKeyDialogProps) {
  const router = useRouter();

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>API Keys Required</AlertDialogTitle>
          <AlertDialogDescription>
            You need to set your AI API keys before starting an interview. Please go to the settings page to add them.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={() => router.push('/settings')}>
            Go to Settings
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
