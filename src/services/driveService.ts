
import { auth, googleProvider } from '@/lib/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { STORAGE_KEYS } from '@/lib/storageKeys';

const APP_FILE_NAME = 'dsa-quest-progress.json';
const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3/files';
const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files';

/**
 * A helper function to create a more informative error from a Google API response.
 * @param response The raw fetch response.
 * @param action A string describing the action that failed (e.g., "list files").
 * @returns An Error object.
 */
async function createDriveApiError(response: Response, action: string): Promise<Error> {
    // A 403 error is a strong indicator that the Drive API is not enabled.
    if (response.status === 403) {
        return new Error('Google Drive API access denied. Please ensure the "Google Drive API" is enabled for your project in the Google Cloud Console.');
    }
    
    let errorDetails = `Status: ${response.status}`;
    try {
        const error = await response.json();
        console.error(`Failed to ${action}`, error);
        errorDetails = error.error?.message || JSON.stringify(error);
    } catch (e) {
        console.error(`Failed to parse error JSON from Google Drive API during ${action}.`);
    }

    return new Error(`Could not ${action} in Google Drive. ${errorDetails}`);
}

/**
 * Finds the unique ID of the application's data file within the user's hidden appDataFolder.
 * This ensures the app only interacts with its own sandboxed data in the user's drive.
 * @param accessToken The user's Google OAuth2 access token.
 * @returns The file ID if it exists, otherwise null.
 */
async function getAppFileId(accessToken: string): Promise<string | null> {
  // The `spaces=appDataFolder` query parameter is crucial. It restricts the search
  // to the special, hidden folder in the user's Google Drive that is only
  // accessible to this application. This is the core of the privacy model.
  const response = await fetch(`${DRIVE_API_URL}?spaces=appDataFolder&fields=files(id,name)`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  if (!response.ok) {
    throw await createDriveApiError(response, 'list files');
  }
  const { files } = await response.json();
  const existingFile = files.find((file: any) => file.name === APP_FILE_NAME);
  return existingFile ? existingFile.id : null;
}

/**
 * Saves the user's progress to a file in their personal Google Drive's appDataFolder.
 * If the file doesn't exist, it creates it.
 * @param accessToken The user's Google OAuth2 access token.
 * @param progressData The user's progress data to save.
 */
export async function saveProgress(accessToken: string, progressData: object): Promise<void> {
    let fileId = await getAppFileId(accessToken);

    const metadata = {
        name: APP_FILE_NAME,
        mimeType: 'application/json',
    };

    if (!fileId) {
        // If the file doesn't exist, create it within the `appDataFolder`.
        // The `parents: ['appDataFolder']` property ensures the file is created in the
        // correct, sandboxed location, remaining private to the user and this app.
        const createResponse = await fetch(DRIVE_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ...metadata, parents: ['appDataFolder'] }),
        });
        if (!createResponse.ok) {
            throw await createDriveApiError(createResponse, 'create file');
        }
        const newFile = await createResponse.json();
        fileId = newFile.id;
    }

    // Upload/update the file content.
    const uploadUrl = `${DRIVE_UPLOAD_URL}/${fileId}?uploadType=media`;
    const uploadResponse = await fetch(uploadUrl, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(progressData)
    });

    if (!uploadResponse.ok) {
        throw await createDriveApiError(uploadResponse, 'save progress');
    }
}

/**
 * Loads the user's progress from their personal Google Drive's appDataFolder.
 * @param accessToken The user's Google OAuth2 access token.
 * @returns The user's progress data, or null if no data is found.
 */
export async function loadProgress(accessToken: string): Promise<object | null> {
    const fileId = await getAppFileId(accessToken);
    if (!fileId) {
        return null;
    }

    // Download the file's content directly using its ID.
    const response = await fetch(`${DRIVE_API_URL}/${fileId}?alt=media`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    if (!response.ok) {
        throw await createDriveApiError(response, 'load progress');
    }

    return response.json();
}

/**
 * Triggers a sync to Google Drive. This function will prompt the user to sign in
 * if necessary to get a fresh access token, then save all local progress data.
 */
export async function triggerSync() {
    if (!auth || !googleProvider) {
        console.warn('Firebase not configured, skipping sync.');
        return;
    }

    const loginMethod = localStorage.getItem(STORAGE_KEYS.LOGIN_METHOD);
    if (loginMethod !== '"google"') {
        return; // Only sync if user is in google mode
    }

    try {
        const result = await signInWithPopup(auth, googleProvider);
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token = credential?.accessToken;

        if (!token) {
            throw new Error('Could not retrieve access token from Google.');
        }

        const progressData = {
            [STORAGE_KEYS.USER_PROGRESS]: JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_PROGRESS) || '{}'),
            [STORAGE_KEYS.USER_XP]: JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_XP) || '0'),
            [STORAGE_KEYS.EARNED_BADGES]: JSON.parse(localStorage.getItem(STORAGE_KEYS.EARNED_BADGES) || '[]'),
        };
        
        await saveProgress(token, progressData);
        console.log("Progress synced to drive successfully.");

    } catch (error) {
        console.error("Auto-sync failed", error);
        // Re-throw so the caller can handle it (e.g., show a toast)
        throw error;
    }
}
