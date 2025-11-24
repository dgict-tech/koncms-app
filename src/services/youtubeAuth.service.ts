/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_URL, Axios_delete, Axios_get, Axios_post } from "./api";
import { API_KEY } from "../components/YouTubeAnalytics";
import { UserAuthorization } from "./auth";

// Google OAuth config
export const CLIENT_ID =
  "943556130775-fbsgln3igbohm502mhhomn0e8q2895gj.apps.googleusercontent.com";

export const REDIRECT_URI = API_URL + "admin/google/callback";
export const BACKEND_URL = API_URL + "admin";

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
  access_token: string;
  refresh_token?: string;
  expiresAt?: number;
  channelTitle: string;
  thumbnail: string;
}
export const CHANNELS_KEY = "yt_channels_tokens";
// localStorage.removeItem("yt_channels_tokens");
export const youtubeAuthService = {
  /**
   * Load Google API scripts once
   */
  loadScripts: (): Promise<void> => {
    return new Promise((resolve) => {
      if (window.gapi && window.gapi.client) return resolve();

      const script = document.createElement("script");
      script.src = "https://apis.google.com/js/api.js";
      script.async = true;
      script.onload = () => window.gapi.load("client", resolve);

      document.body.appendChild(script);
    });
  },

  /**
   * Initialize GAPI client (safe to call multiple times)
   */
  initGapiClient: async (): Promise<void> => {
    await youtubeAuthService.loadScripts();

    if (window.gapi.client._initialized) return;

    await window.gapi.client.init({
      apiKey: API_KEY,
      discoveryDocs: [
        "https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest",
        "https://www.googleapis.com/discovery/v1/apis/youtubeAnalytics/v2/rest",
      ],
    });

    window.gapi.client._initialized = true;
  },

  refreshAllTokens: async (): Promise<ChannelToken | undefined> => {
    const channels = await youtubeAuthService.getStoredChannels();

    for (const channel of channels) {
      console.log(channel);
      if (!channel.refresh_token) continue;

      try {
        const { data } = await Axios_post(
          `${BACKEND_URL}/refresh-token`,
          {
            refresh_token: channel.refresh_token,
            channelId: channel.channelId,
          },
          UserAuthorization()
        );
        const newChannel = {
          ...channel,
          refresh_token: channel.refresh_token,
          access_token: data.access_token,
          expiresAt: data.expiresAt,
        };
        youtubeAuthService.saveChannel(newChannel);
        return newChannel;
        // console.log(`Token refreshed for ${channel.channelTitle}`);
      } catch (err) {
        console.error(
          `Failed to refresh token for ${channel.channelTitle}`,
          err
        );
      }
    }
  },

  refreshChannelToken: async (
    channelId: string
  ): Promise<ChannelToken | undefined> => {
    // get  the stored channels and get channel with access_token
    const channels = await youtubeAuthService.getStoredChannels();

    const channel = channels.find((c) => c.channelId === channelId);
    if (!channel) return;

    // alert("Refreshing token for channel:" + channel.channelTitle);

    try {
      const { data } = await Axios_post(
        `${BACKEND_URL}/refresh-token`,
        {
          refresh_token: channel.refresh_token,
          channelId: channel.channelId,
        },
        UserAuthorization()
      );
      const newChannel = {
        ...channel,
        refresh_token: channel.refresh_token,
        access_token: data.access_token,
        expiresAt: data.expiresAt,
      };
      youtubeAuthService.saveChannel(newChannel);
      return newChannel;
    } catch (err) {
      console.error(`Failed to refresh token for ${channel.channelTitle}`, err);
    }
  },

  /**
   * Authenticate YouTube using access token (from backend)
   */
  authenticateToken: async (
    access_token: string,
    refresh_token: string = ""
  ): Promise<any> => {
    try {
      await youtubeAuthService.initGapiClient();

      // Correct method — NOT gapi.auth.setToken
      window.gapi.client.setToken({ access_token });

      // Load YouTube APIs
      await window.gapi.client.load("youtube", "v3");
      await window.gapi.client.load("youtubeAnalytics", "v2");

      // Fetch channels
      const res = await window.gapi.client.youtube.channels.list({
        part: "snippet,contentDetails",
        mine: true,
        maxResults: 50,
      });

      if (!res.result.items || res.result.items.length === 0) {
        return { status: false, message: "No channels found" };
      }

      const channel = res.result.items[0];

      const channelToken: ChannelToken = {
        channelId: channel.id,
        access_token: access_token,
        refresh_token: refresh_token,
        channelTitle: channel.snippet.title,
        thumbnail: channel.snippet.thumbnails?.default?.url ?? "",
      };

      // Save channel
      const all = await youtubeAuthService.getStoredChannels();
      const updated = all.filter((c) => c.channelId !== channel.id);
      updated.push(channelToken);

      localStorage.setItem(CHANNELS_KEY, JSON.stringify(updated));

      return {
        status: true,
        message: "Channel authenticated successfully",
        data: channelToken,
      };
    } catch (error: any) {
      console.error("authenticateToken error:", error);
      return { status: false, message: "Error authenticating channel", error };
    }
  },

  /**
   * Backend endpoint → Get Google OAuth URL
   */
  getAuthUrl: async (): Promise<string> => {
    const { data } = await Axios_get(`${BACKEND_URL}/google/auth-url`, {
      params: { scope: SCOPES },
      headers: UserAuthorization().headers,
    });
    return data.url;
  },

  /**
   * Exchange `code` → tokens (access_token, refresh_token)
   */
  exchangeCodeForTokens: async (code: string) => {
    const { data } = await Axios_post(
      `${BACKEND_URL}/exchange-code`,
      { code },
      UserAuthorization()
    );
    return data;
  },

  /**
   * Exchange `code` → tokens (access_token, refresh_token)
   */
  getAuthChannel: async (user: any) => {
    const { data } = await Axios_get(
      `${BACKEND_URL}/get-auth-channel/` + user.user.id,
      UserAuthorization()
    );
    return data;
  },
  removeChannel: async (channelId: string) => {
    try {
      const { data } = await Axios_delete(
        `${BACKEND_URL}/delete-channel/${channelId}`,
        UserAuthorization()
      );
      // window.location.reload();
      return data;
    } catch (err: any) {
      console.error("Failed to remove YouTube channel:", err);
      throw err;
    }
  },

  loadAndSaveChannels: async (user: any) => {
    try {
      const channels = await youtubeAuthService.getAuthChannel(user);

      if (!Array.isArray(channels)) {
        console.error("Invalid channel response:", channels);
        return [];
      }
      localStorage.removeItem(CHANNELS_KEY);
      channels.forEach((channel) => {
        youtubeAuthService.saveChannel(channel);
      });

      // console.log("All channels saved to localStorage:", channels);
      return channels;
    } catch (error) {
      console.error("Failed to load channels:", error);
    }
  },

  /**
   * Local storage helpers
   */
  getStoredChannels: async (user?: any): Promise<ChannelToken[]> => {
    try {
      // 1️⃣ Load from localStorage first
      const raw = localStorage.getItem(CHANNELS_KEY);
      const localChannels: ChannelToken[] = raw ? JSON.parse(raw) : [];

      // 2️⃣ If user exists → fetch backend channels
      if (user) {
        const backendChannels =
          (await youtubeAuthService.loadAndSaveChannels(user)) || [];

        // 3️⃣ Merge backend → local (backend has priority)
        backendChannels.forEach((backend) => {
          const existingIndex = localChannels.findIndex(
            (c) => c.channelId === backend.channelId
          );

          if (existingIndex !== -1) {
            // Update existing entry
            localChannels[existingIndex] = {
              ...localChannels[existingIndex],
              ...backend, // backend overwrites
            };
          } else {
            // Add new channel from backend
            localChannels.push(backend);
          }
        });

        // 4️⃣ Save merged result back to localStorage
        localStorage.setItem(CHANNELS_KEY, JSON.stringify(localChannels));
      }

      // 5️⃣ Return fully updated channels
      return localChannels;
    } catch (error) {
      console.error("getStoredChannels error:", error);
      return [];
    }
  },
  getTokenByChannelId: async (channelId: string): Promise<string | null> => {
    const channel = await youtubeAuthService.getStoredChannels();

    const dchanel = channel.find((c) => c.channelId === channelId);

    return dchanel ? dchanel.access_token : null;
  },

  saveChannel: async (channel: ChannelToken) => {
    const key = CHANNELS_KEY;

    // Load existing channels
    const raw = localStorage.getItem(key);
    const stored: ChannelToken[] = raw ? JSON.parse(raw) : [];

    // Check if channel exists
    const existingIndex = stored.findIndex(
      (c) => c.channelId === channel.channelId
    );

    if (existingIndex !== -1) {
      // Update existing
      stored[existingIndex] = {
        ...stored[existingIndex],
        ...channel,
      };
    } else {
      // Add new
      stored.push(channel);
    }

    console.log("Channels after save:", stored);
    // Save back
    localStorage.setItem(key, JSON.stringify(stored));
  },
  getChannel: async (channelId: string): Promise<ChannelToken | null> => {
    const channel = await youtubeAuthService.getStoredChannels();
    return channel.find((c) => c.channelId === channelId) ?? null;
  },

  /**
   * Frontend-built OAuth URL (used nowhere but kept)
   */
  getAuthCodeUrl: (): string => {
    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.search = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: "code",
      scope: SCOPES,
      access_type: "offline",
      prompt: "consent",
    }).toString();

    return authUrl.toString();
  },
};
