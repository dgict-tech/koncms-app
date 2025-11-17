/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";

export const CLIENT_ID =
  "943556130775-fbsgln3igbohm502mhhomn0e8q2895gj.apps.googleusercontent.com";

export const REDIRECT_URI = "http://localhost:3000/admin/google/callback"; // Must match OAuth credentials
export const BACKEND_URL = "http://localhost:3000/admin"; // Your backend endpoint

export const SCOPES = [
  "https://www.googleapis.com/auth/yt-analytics.readonly",
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/youtubepartner",
  "https://www.googleapis.com/auth/yt-analytics-monetary.readonly",
].join(" ");

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

export interface ChannelToken {
  channelId: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number; // timestamp when token expires
  channelTitle: string;
  thumbnail: string;
}

const CHANNELS_KEY = "yt_channels_tokens";

export const youtubeAuthService = {
  /**
   * Load Google API scripts
   */
  loadScripts: (): Promise<void> => {
    return new Promise((resolve) => {
      const gapiScript = document.createElement("script");
      gapiScript.src = "https://apis.google.com/js/api.js";
      gapiScript.async = true;
      gapiScript.onload = () => {
        window.gapi.load("client", resolve);
      };
      document.body.appendChild(gapiScript);

      const gisScript = document.createElement("script");
      gisScript.src = "https://accounts.google.com/gsi/client";
      gisScript.async = true;
      document.body.appendChild(gisScript);
    });
  },

  /**
   * Authenticate channel (popup + exchange tokens)
   */
  authenticateChannelByServer: async (): Promise<ChannelToken | null> => {
    const code = await youtubeAuthService.getAuthCode();
    return youtubeAuthService.exchangeCodeForTokens(code);
  },

  /**
   * Open OAuth popup and return authorization code
   */
  authenticateChannel3: async (): Promise<ChannelToken | null> => {
    return new Promise((resolve, reject) => {
      if (!window.google || !window.gapi) {
        return reject("Google scripts not loaded yet");
      }

      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: async (tokenResponse: any) => {
          if (!tokenResponse.access_token) return reject("No access token");

          // Set token for gapi
          window.gapi.client.setToken({
            access_token: tokenResponse.access_token,
          });

          // Load YouTube APIs
          await window.gapi.client.load("youtubeAnalytics", "v2");
          await window.gapi.client.load("youtube", "v3");

          // Fetch user channels
          const res = await window.gapi.client.youtube.channels.list({
            part: "snippet,contentDetails",
            mine: true,
            maxResults: 50,
          });

          if (!res.result.items || res.result.items.length === 0)
            return reject("No channels found");

          // Pick first channel for simplicity (user can select later)
          const channel = res.result.items[0];
          const channelToken: ChannelToken = {
            channelId: channel.id,
            accessToken: tokenResponse.access_token,
            channelTitle: channel.snippet.title,
            thumbnail: channel.snippet.thumbnails?.default?.url ?? "",
          };

          // Save in localStorage
          const stored = youtubeAuthService.getStoredChannels();
          const updated = [
            ...stored.filter((c) => c.channelId !== channelToken.channelId),
            channelToken,
          ];
          localStorage.setItem(CHANNELS_KEY, JSON.stringify(updated));

          resolve(channelToken);
        },
      });

      tokenClient.requestAccessToken();
    });
  },

  // Step 1: Ask backend for auth URL
  async getAuthUrl(): Promise<string> {
    const { data } = await axios.get(`${BACKEND_URL}/google/auth-url`, {
      params: { scope: SCOPES },
    });
    return data.url;
  },

  exchangeCodeForTokens: async (code: string) => {
    const { data } = await axios.post(`${BACKEND_URL}/exchange-code`, { code });
    return data; // backend returns access_token, refresh_token, expires_in
  },

  getGoogleAuthUrl: async (): Promise<string> => {
    const { data } = await axios.get(`${BACKEND_URL}/google/auth-url`, {
      params: { scope: SCOPES },
    });
    alert(data.url);
    return data.url;
  },

  /**
   * Step 3: Full flow (redirect-less)
   */
  authenticateChannel: async () => {
    try {
      const url = await youtubeAuthService.getGoogleAuthUrl();
      alert(1);
      // Use a hidden iframe to perform silent auth
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.src = url;
      document.body.appendChild(iframe);
      alert(2);
      return new Promise((resolve, reject) => {
        window.addEventListener("message", async (event) => {
          if (event.origin !== window.location.origin) return;
          if (event.data.type === "google_oauth_code") {
            alert(4);
            try {
              const tokens = await youtubeAuthService.exchangeCodeForTokens(
                event.data.code
              );
              resolve(tokens);
            } catch (err) {
              reject(err);
            } finally {
              iframe.remove();
            }
          }
        });
      });
    } catch (err) {
      alert(5);
      console.error("Auth failed:", err);
      throw err;
    }
  },

  /**
   * Get all stored channel tokens
   */
  getStoredChannels: (): ChannelToken[] => {
    const data = localStorage.getItem(CHANNELS_KEY);
    if (!data) return [];
    try {
      return JSON.parse(data) as ChannelToken[];
    } catch {
      return [];
    }
  },

  /**
   * Remove a channel from stored tokens
   */
  removeChannel: (channelId: string) => {
    const stored = youtubeAuthService.getStoredChannels();
    const updated = stored.filter((c) => c.channelId !== channelId);
    localStorage.setItem(CHANNELS_KEY, JSON.stringify(updated));
  },

  /**
   * Get a channel token by channelId
   */
  getTokenByChannelId: (channelId: string): string | null => {
    const stored = youtubeAuthService.getStoredChannels();
    const channel = stored.find((c) => c.channelId === channelId);
    return channel ? channel.accessToken : null;
  },

  /**
   * Local storage helpers
   */
  saveChannel: (channel: ChannelToken) => {
    const all = youtubeAuthService.getStoredChannels();
    const updated = [
      ...all.filter((c) => c.channelId !== channel.channelId),
      channel,
    ];
    localStorage.setItem(CHANNELS_KEY, JSON.stringify(updated));
  },

  getChannel: (channelId: string): ChannelToken | null => {
    return (
      youtubeAuthService
        .getStoredChannels()
        .find((c) => c.channelId === channelId) || null
    );
  },

  /**
   * Open OAuth popup and return authorization code
   */
  getAuthCode: (): Promise<string> => {
    return new Promise((resolve, reject) => {
      const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      authUrl.search = new URLSearchParams({
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        response_type: "code",
        scope: SCOPES,
        access_type: "offline",
        prompt: "consent",
      }).toString();

      const width = 500;
      const height = 600;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(
        authUrl.toString(),
        "google_oauth",
        `width=${width},height=${height},top=${top},left=${left}`
      );

      if (!popup) return reject("Popup blocked");

      const listener = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        if (event.data.type === "google_oauth_code") {
          window.removeEventListener("message", listener);
          popup.close();
          resolve(event.data.code);
        }
      };

      window.addEventListener("message", listener);
    });
  },

  getAuthCodeAndExchangeToken: async (): Promise<ChannelToken | null> => {
    return new Promise((resolve, reject) => {
      const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      authUrl.search = new URLSearchParams({
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        response_type: "code",
        scope: SCOPES,
        access_type: "offline",
        prompt: "consent",
      }).toString();

      const width = 500;
      const height = 600;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(
        authUrl.toString(),
        "google_oauth",
        `width=${width},height=${height},top=${top},left=${left}`
      );

      if (!popup) return reject("Popup blocked");

      // Listen for messages from the popup
      const listener = async (event: MessageEvent) => {
        if (event.origin !== "http://localhost:3000") return; // frontend origin
        if (event.data.type === "google_oauth_code") {
          window.removeEventListener("message", listener);
          const code = event.data.code;

          try {
            // Exchange code via backend
            const { data } = await axios.post(`${BACKEND_URL}/exchange-code`, {
              code,
            });
            const { access_token, refresh_token, expires_in } = data;

            await youtubeAuthService.loadScripts();
            await window.gapi.client.load("youtube", "v3");
            window.gapi.client.setToken({ access_token });

            const res = await window.gapi.client.youtube.channels.list({
              part: "snippet,contentDetails",
              mine: true,
              maxResults: 1,
            });

            if (!res.result.items || res.result.items.length === 0)
              return resolve(null);

            const channel = res.result.items[0];
            const expiresAt = Date.now() + expires_in * 1000;

            const tokenData: ChannelToken = {
              channelId: channel.id,
              accessToken: access_token,
              refreshToken: refresh_token,
              expiresAt,
              channelTitle: channel.snippet.title,
              thumbnail: channel.snippet.thumbnails?.default?.url ?? "",
            };

            youtubeAuthService.saveChannel(tokenData);
            resolve(tokenData);
          } catch (err) {
            console.error("Token exchange failed:", err);
            resolve(null);
          }

          // Close the popup safely (COOP-safe)
          if (!popup.closed) popup.close();
        }
      };

      window.addEventListener("message", listener);

      // Fallback: detect if popup closed without completing OAuth
      const checkPopupClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkPopupClosed);
          window.removeEventListener("message", listener);
          resolve(null); // user closed popup
        }
      }, 500);
    });
  },

  /**
   * Exchange authorization code for tokens via backend
   */
  exchangeCodeForTokens2: async (
    code: string
  ): Promise<ChannelToken | null> => {
    try {
      const { data } = await axios.post(`${BACKEND_URL}/exchange-code`, {
        code,
      });
      const { access_token, refresh_token, expires_in } = data;

      await youtubeAuthService.loadScripts();
      await window.gapi.client.load("youtube", "v3");
      window.gapi.client.setToken({ access_token });

      const res = await window.gapi.client.youtube.channels.list({
        part: "snippet,contentDetails",
        mine: true,
        maxResults: 1,
      });

      if (!res.result.items || res.result.items.length === 0) return null;

      const channel = res.result.items[0];
      const expiresAt = Date.now() + expires_in * 1000;

      const tokenData: ChannelToken = {
        channelId: channel.id,
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt,
        channelTitle: channel.snippet.title,
        thumbnail: channel.snippet.thumbnails?.default?.url ?? "",
      };

      youtubeAuthService.saveChannel(tokenData);
      return tokenData;
    } catch (err) {
      console.error("Token exchange failed:", err);
      return null;
    }
  },
};
