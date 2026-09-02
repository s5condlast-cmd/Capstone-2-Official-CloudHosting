import { Client } from '@microsoft/microsoft-graph-client';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const TOKEN_FILE_PATH = path.resolve(process.cwd(), 'backend', 'config', 'onedrive-token.json');

interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  accountEmail?: string;
  accountName?: string;
}

let inMemoryToken: TokenData | null = null;

/**
 * Loads saved token data from disk or memory.
 */
async function loadSavedToken(): Promise<TokenData | null> {
  if (inMemoryToken && Date.now() < inMemoryToken.expiresAt - 60000) {
    return inMemoryToken;
  }

  try {
    const raw = await fs.readFile(TOKEN_FILE_PATH, 'utf-8');
    const data: TokenData = JSON.parse(raw);
    inMemoryToken = data;
    return data;
  } catch {
    return null;
  }
}

/**
 * Saves fresh token data to disk and cache.
 */
async function saveTokenData(tokenData: TokenData): Promise<void> {
  inMemoryToken = tokenData;
  try {
    await fs.mkdir(path.dirname(TOKEN_FILE_PATH), { recursive: true });
    await fs.writeFile(TOKEN_FILE_PATH, JSON.stringify(tokenData, null, 2), 'utf-8');
  } catch (err) {
    console.error('[OneDrive] Failed to write token file:', err);
  }
}

/**
 * Generates Microsoft OAuth2 Authorization URL.
 */
export function getAuthorizationUrl(redirectUri: string): string {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  if (!clientId) {
    throw new Error('MICROSOFT_CLIENT_ID is not configured in .env');
  }

  const tenant = 'common';
  const scopes = encodeURIComponent('offline_access Files.ReadWrite User.Read');
  const encodedRedirect = encodeURIComponent(redirectUri);

  return `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodedRedirect}&response_mode=query&scope=${scopes}&prompt=select_account`;
}

/**
 * Exchanges authorization code for access and refresh tokens.
 */
export async function exchangeCodeForTokens(code: string, redirectUri: string): Promise<TokenData> {
  const clientId = process.env.MICROSOFT_CLIENT_ID!;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET!;
  const tenant = 'common';

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    scope: 'offline_access Files.ReadWrite User.Read',
  });

  const res = await fetch(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  const data = await res.json();

  if (!res.ok || data.error) {
    throw new Error(data.error_description || data.error || 'Failed to exchange authorization code');
  }

  const tokenData: TokenData = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
  };

  // Retrieve user profile to identify connected account
  try {
    const profileRes = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${data.access_token}` },
    });
    if (profileRes.ok) {
      const profile = await profileRes.json();
      tokenData.accountEmail = profile.mail || profile.userPrincipalName;
      tokenData.accountName = profile.displayName;
    }
  } catch (profileErr) {
    console.warn('[OneDrive] Could not fetch profile for user:', profileErr);
  }

  await saveTokenData(tokenData);
  return tokenData;
}

/**
 * Refreshes an expired access token using the stored refresh token.
 */
async function refreshAccessToken(refreshToken: string): Promise<string> {
  const clientId = process.env.MICROSOFT_CLIENT_ID!;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET!;
  const tenant = 'common';

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    scope: 'offline_access Files.ReadWrite User.Read',
  });

  const res = await fetch(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  const data = await res.json();

  if (!res.ok || data.error) {
    throw new Error(`Token refresh failed: ${data.error_description || data.error}`);
  }

  const updatedToken: TokenData = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken,
    expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
    accountEmail: inMemoryToken?.accountEmail,
    accountName: inMemoryToken?.accountName,
  };

  await saveTokenData(updatedToken);
  return data.access_token;
}

/**
 * Returns a valid access token, auto-refreshing if near expiration.
 */
export async function getValidAccessToken(): Promise<string> {
  const token = await loadSavedToken();
  if (!token) {
    throw new Error(
      'OneDrive is not connected yet. Please connect your Microsoft or STI account via /api/onedrive/auth/login'
    );
  }

  // If expired or expires within 2 minutes, refresh it
  if (Date.now() >= token.expiresAt - 120000) {
    return await refreshAccessToken(token.refreshToken);
  }

  return token.accessToken;
}

/**
 * Returns an authenticated Microsoft Graph client.
 */
export async function getAuthenticatedGraphClient(): Promise<Client> {
  const accessToken = await getValidAccessToken();
  return Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    },
  });
}

/**
 * Checks connection health and returns active drive quota and account details.
 */
export async function testOneDriveConnection() {
  const token = await loadSavedToken();
  if (!token) {
    return {
      connected: false,
      message: 'OneDrive is not authenticated yet. Please connect your account.',
      loginUrl: '/api/onedrive/auth/login',
    };
  }

  try {
    const client = await getAuthenticatedGraphClient();
    const [user, drive] = await Promise.all([
      client.api('/me').select('displayName,mail,userPrincipalName').get(),
      client.api('/me/drive').select('id,driveType,quota').get(),
    ]);

    return {
      connected: true,
      accountName: user.displayName,
      email: user.mail || user.userPrincipalName,
      driveType: drive.driveType,
      driveId: drive.id,
      quota: {
        totalBytes: drive.quota?.total,
        usedBytes: drive.quota?.used,
        remainingBytes: drive.quota?.remaining,
      },
    };
  } catch (err: any) {
    return {
      connected: false,
      error: err.message,
      loginUrl: '/api/onedrive/auth/login',
    };
  }
}

export interface UploadResult {
  id: string;
  name: string;
  size: number;
  webUrl: string;
  path: string;
  createdDateTime: string;
}

/**
 * Uploads a document buffer directly to the user's OneDrive hierarchy.
 */
export async function uploadToOneDrive(
  fileBuffer: Buffer,
  fileName: string,
  subFolderPath: string = ''
): Promise<UploadResult> {
  const client = await getAuthenticatedGraphClient();

  const rootFolder = process.env.ONEDRIVE_ROOT_FOLDER || 'STI_Practicum_Archive';
  const cleanSubPath = subFolderPath.replace(/^[\/\\]+|[\/\\]+$/g, '').trim();
  const fullPath = cleanSubPath ? `${rootFolder}/${cleanSubPath}/${fileName}` : `${rootFolder}/${fileName}`;
  const encodedPath = encodeURI(fullPath);

  const endpoint = `/me/drive/root:/${encodedPath}:/content`;
  const response = await client.api(endpoint).put(fileBuffer);

  return {
    id: response.id,
    name: response.name,
    size: response.size,
    webUrl: response.webUrl,
    path: fullPath,
    createdDateTime: response.createdDateTime,
  };
}

/**
 * Lists files in a given OneDrive folder path.
 */
export async function listOneDriveFolder(folderPath: string = '') {
  const client = await getAuthenticatedGraphClient();

  const rootFolder = process.env.ONEDRIVE_ROOT_FOLDER || 'STI_Practicum_Archive';
  const fullPath = folderPath
    ? `${rootFolder}/${folderPath.replace(/^[\/\\]+|[\/\\]+$/g, '')}`
    : rootFolder;

  const endpoint = `/me/drive/root:/${encodeURI(fullPath)}:/children`;
  const response = await client.api(endpoint).get();

  return response.value || [];
}

/**
 * Retrieves file metadata and direct download link.
 */
export async function getOneDriveFileMetadata(fileId: string) {
  const client = await getAuthenticatedGraphClient();

  const file = await client
    .api(`/me/drive/items/${fileId}`)
    .select('id,name,size,webUrl,@microsoft.graph.downloadUrl,createdDateTime,lastModifiedDateTime')
    .get();

  return {
    id: file.id,
    name: file.name,
    size: file.size,
    webUrl: file.webUrl,
    downloadUrl: file['@microsoft.graph.downloadUrl'],
    createdDateTime: file.createdDateTime,
    lastModifiedDateTime: file.lastModifiedDateTime,
  };
}
