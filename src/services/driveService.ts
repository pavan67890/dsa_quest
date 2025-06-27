
const APP_FILE_NAME = 'dsa-quest-progress.json';
const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3/files';
const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files';

async function getAppFileId(accessToken: string): Promise<string | null> {
  const response = await fetch(`${DRIVE_API_URL}?spaces=appDataFolder&fields=files(id,name)`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  if (!response.ok) {
    const error = await response.json();
    console.error('Failed to list files in appDataFolder', error);
    throw new Error(`Could not access Google Drive. ${error.error?.message || ''}`);
  }
  const { files } = await response.json();
  const existingFile = files.find((file: any) => file.name === APP_FILE_NAME);
  return existingFile ? existingFile.id : null;
}

export async function saveProgress(accessToken: string, progressData: object): Promise<void> {
    let fileId = await getAppFileId(accessToken);

    const metadata = {
        name: APP_FILE_NAME,
        mimeType: 'application/json',
    };

    if (!fileId) {
        const createResponse = await fetch(DRIVE_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ...metadata, parents: ['appDataFolder'] }),
        });
        if (!createResponse.ok) {
            throw new Error('Could not create file in Google Drive.');
        }
        const newFile = await createResponse.json();
        fileId = newFile.id;
    }

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
        throw new Error('Could not save progress to Google Drive.');
    }
}

export async function loadProgress(accessToken: string): Promise<object | null> {
    const fileId = await getAppFileId(accessToken);
    if (!fileId) {
        return null;
    }

    const response = await fetch(`${DRIVE_API_URL}/${fileId}?alt=media`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    if (!response.ok) {
        throw new Error('Could not load progress from Google Drive.');
    }

    return response.json();
}
