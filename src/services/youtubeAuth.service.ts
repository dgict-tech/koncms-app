/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import { API_URL } from "./api";
import { API_KEY } from "../components/YouTubeAnalytics";

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

  refreshAllTokens: async (): Promise<void> => {
    const channels = await youtubeAuthService.getStoredChannels();

    for (const channel of channels) {
      console.log(channel);
      if (!channel.refresh_token) continue;

      try {
        const { data } = await axios.post(`${BACKEND_URL}/refresh-token`, {
          refresh_token: channel.refresh_token,
          channelId: channel.channelId,
        });

        youtubeAuthService.saveChannel({
          ...channel,
          refresh_token: channel.refresh_token,
          access_token: data.access_token,
          expiresAt: data.expiresAt,
        });

        // console.log(`Token refreshed for ${channel.channelTitle}`);
      } catch (err) {
        console.error(
          `Failed to refresh token for ${channel.channelTitle}`,
          err
        );
      }
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
    const { data } = await axios.get(`${BACKEND_URL}/google/auth-url`, {
      params: { scope: SCOPES },
    });
    return data.url;
  },

  /**
   * Exchange `code` → tokens (access_token, refresh_token)
   */
  exchangeCodeForTokens: async (code: string) => {
    const { data } = await axios.post(`${BACKEND_URL}/exchange-code`, { code });
    return data;
  },

  /**
   * Exchange `code` → tokens (access_token, refresh_token)
   */
  getAuthChannel: async (user: any) => {
    const { data } = await axios.get(
      `${BACKEND_URL}/get-auth-channel/` + user.user.id
    );
    return data;
  },
  removeChannel: async (user: any, channelId: string) => {
    if (!user || !user.user?.id) {
      throw new Error("User not provided or invalid");
    }

    try {
      const { data } = await axios.delete(
        `${BACKEND_URL}/delete-channel/${user.user.id}/${channelId}`
      );
      return data; // { success: boolean, message: string }
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
  getStoredChannels: async (user: any = null): Promise<ChannelToken[]> => {
    try {
      // If user exists → fetch from backend then save to localStorage
      if (user !== null) {
        const channels =
          (await youtubeAuthService.loadAndSaveChannels(user)) || [];

        console.log("channels", channels);

        // If backend has no channels → clear localStorage
        if (channels.length === 0) {
          localStorage.removeItem(CHANNELS_KEY);
          return [];
        }

        // Return backend channels
        return channels;
      }

      // No user → load from localStorage
      const raw = localStorage.getItem(CHANNELS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (error) {
      console.error("getStoredChannels error:", error);
      return [];
    }
  },

  // removeChannel: async (channelId: string) => {
  //   const updated = await youtubeAuthService.getStoredChannels();

  //   updated.filter((c) => c.channelId !== channelId);

  //   localStorage.setItem(CHANNELS_KEY, JSON.stringify(updated));
  // },

  getTokenByChannelId: async (channelId: string): Promise<string | null> => {
    const channel = await youtubeAuthService.getStoredChannels();

    const dchanel = channel.find((c) => c.channelId === channelId);

    return dchanel ? dchanel.access_token : null;
  },

  saveChannel: async (channel: ChannelToken) => {
    const stored = await youtubeAuthService.getStoredChannels();

    // Find if this channel already exists
    const existingIndex = stored.findIndex(
      (c) => c.channelId === channel.channelId
    );

    if (existingIndex !== -1) {
      // s("🔄 Updating existing channel:", channel.channelTitle);

      // Replace existing entry
      stored[existingIndex] = {
        ...stored[existingIndex], // keep old fields like refresh_token
        ...channel, // overwrite with new data
      };
    } else {
      // console.log("🆕 Adding new channel:", channel.channelTitle);

      // Add as a new entry
      stored.push(channel);
    }

    localStorage.setItem(CHANNELS_KEY, JSON.stringify(stored));
    // console.log("💾 Channels saved →", stored);
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
