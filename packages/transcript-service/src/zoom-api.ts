import crypto from 'crypto';

interface ZoomTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface RTMSSessionResponse {
  session_id: string;
  rtms_url: string;
  rtms_token: string;
}

export class ZoomAPIClient {
  private clientId: string;
  private clientSecret: string;
  private accountId: string | null;
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(clientId: string, clientSecret: string, accountId: string | null = null) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.accountId = accountId;
  }

  /**
   * Check if this is Server-to-Server OAuth (has Account ID)
   */
  isServerToServer(): boolean {
    return this.accountId !== null;
  }

  /**
   * Get OAuth access token
   * Supports both Server-to-Server OAuth (with Account ID) and User-Managed OAuth (without Account ID)
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && Date.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    // Server-to-Server OAuth (requires Account ID)
    if (this.accountId) {
      const tokenUrl = `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${this.accountId}`;
      const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

      try {
        const response = await fetch(tokenUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Failed to get access token: ${error}`);
        }

        const data: ZoomTokenResponse = await response.json();
        this.accessToken = data.access_token;
        this.tokenExpiresAt = Date.now() + (data.expires_in - 300) * 1000;

        console.log('[Zoom API] ✅ Access token obtained (Server-to-Server OAuth)');
        return this.accessToken;
      } catch (error) {
        console.error('[Zoom API] ❌ Failed to get access token:', error);
        throw error;
      }
    } else {
      // User-Managed OAuth requires OAuth 2.0 authorization flow
      // For now, this requires a pre-authorized access token
      // TODO: Implement full OAuth 2.0 flow if needed
      throw new Error('User-Managed OAuth requires OAuth 2.0 authorization flow. RTMS API calls need a user access token.');
    }
  }

  /**
   * Create RTMS session for a meeting
   * Uses meeting UUID (not meeting ID) per Zoom RTMS API
   */
  async createRTMSSession(meetingUuid: string): Promise<RTMSSessionResponse> {
    const token = await this.getAccessToken();
    
    // RTMS API uses UUID in the path
    const url = `https://api.zoom.us/v2/rtms/meetings/${meetingUuid}/sessions`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to create RTMS session: ${response.status} ${error}`);
      }

      const data: RTMSSessionResponse = await response.json();
      console.log(`[Zoom API] ✅ RTMS session created: ${data.session_id}`);
      return data;
    } catch (error) {
      console.error('[Zoom API] ❌ Failed to create RTMS session:', error);
      throw error;
    }
  }
}
