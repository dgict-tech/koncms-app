/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import {
  CHANNELS_KEY,
  youtubeAuthService,
  type ChannelToken,
} from "../services/youtubeAuth.service";

import yticon from "../assets/yticon.png";
import { useToast } from "./ToastProvider";
import type { AccountSetUpProps } from "../pages/admin/Dashboard";

const YouTubeConnect: React.FC<AccountSetUpProps> = ({ user }) => {
  const [channels, setChannels] = useState<ChannelToken[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<ChannelToken | null>(
    null
  );

  // Loading states
  const [initialLoading, setInitialLoading] = useState(true); // ⬅ loads saved channels

  const [connectLoading, setConnectLoading] = useState(false);

  const [confirmModal, setConfirmModal] = useState({
    show: false,
    channelId: null as string | null,
    channelTitle: null as string | null,
  });

  const { showToast } = useToast();

  /**
   * Initialization:
   * - Load scripts
   * - Load saved channels
   */
  useEffect(() => {
    const init = async () => {
      setInitialLoading(true);

      try {
        await youtubeAuthService.loadScripts();
      } catch (err) {
        console.error("Failed to load Google API script:", err);
        const { showToast } = useToast();
        showToast(
          "Unable to load Google APIs. This may be due to a Content Security Policy (CSP) blocking 'eval'. Check your CSP or browser extensions.",
          "error"
        );
        setInitialLoading(false);
        return;
      }

      const saved = await youtubeAuthService.getStoredChannels(user);

      setChannels(saved);
      setInitialLoading(false);
    };

    init();
  }, []);

  /**
   * Connect YouTube Channel
   */
  const handleConnectYouTube = async () => {
    setConnectLoading(true);

    try {
      const url = await youtubeAuthService.getAuthUrl();
      setTimeout(() => {
        window.location.href = url;
      }, 400);
    } catch (err) {
      console.error(err);
      showToast("Unable to start YouTube authentication", "error");
      setConnectLoading(false);
    }
  };

  /**
   * Confirm remove
   */
  const confirmRemove = (channelId: string, channelTitle: string) => {
    setConfirmModal({ show: true, channelId, channelTitle });
  };

  /**
   * Handle remove
   */
  const handleRemove = async () => {
    if (!confirmModal.channelId) return;

    if (!user) {
      showToast("User not found", "error");
      return;
    }

    try {
      // 1️⃣ Call API to remove the channel from backend
      const result = await youtubeAuthService.removeChannel(
        confirmModal.channelId
      );
      console.log(result.message);

      // 2️⃣ Update local state
      setChannels((prev) =>
        prev.filter((c) => c.channelId !== confirmModal.channelId)
      );

      if (selectedChannel?.channelId === confirmModal.channelId) {
        setSelectedChannel(null);
      }

      // 3️⃣ Update localStorage
      const updated = await youtubeAuthService.getStoredChannels(user);
      const filtered = updated.filter(
        (c) => c.channelId !== confirmModal.channelId
      );
      localStorage.setItem(CHANNELS_KEY, JSON.stringify(filtered));

      // 4️⃣ Close confirmation modal
      setConfirmModal({ show: false, channelId: null, channelTitle: null });
    } catch (err) {
      console.error("Failed to remove channel:", err);
      showToast("Failed to remove channel. See console for details.", "error");
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen relative">
      {/* Show loader while fetching channels */}
      {initialLoading && (
        <div className="fixed inset-0 bg-[#0100008d] bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-72 text-center shadow-lg">
            <div className="animate-spin border-4 border-red-600 border-t-transparent rounded-full w-10 h-10 mx-auto mb-4"></div>
            <h2 className="text-gray-700 font-medium">Loading Channels ...</h2>
          </div>
        </div>
      )}

      {/* Only show channel grid AFTER loading */}
      {!initialLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          {/* CONNECT NEW CHANNEL */}
          {user.user.role == "super_admin" && (
            <div
              className="rounded-2xl p-4 sm:p-6 bg-white flex flex-col items-center justify-center shadow-md 
          h-72 sm:h-80 w-full sm:w-64 lg:w-72 border border-red-500 hover:shadow-lg transition"
            >
              <img
                src={yticon}
                alt="YouTube"
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full mb-4 sm:mb-10 shadow-md"
              />

              <h2 className="text-sm sm:text-base text-gray-400 mb-4 sm:mb-10 text-center">
                Connect Your YouTube Channel
              </h2>

              <button
                onClick={handleConnectYouTube}
                disabled={connectLoading}
                className={`px-4 sm:px-5 py-1.5 sm:py-2 text-white rounded-md font-medium text-xs sm:text-sm transition flex items-center gap-2
                ${
                  connectLoading
                    ? "bg-red-400 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {connectLoading ? (
                  <>
                    Connecting{" "}
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </>
                ) : (
                  "+ Connect Channel"
                )}
              </button>
            </div>
          )}

          {channels.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
              <p className="text-xl font-semibold text-gray-600 mb-2">
                {user.user.role === "super_admin" ? (
                  <span>No channels connected yet</span>
                ) : (
                  <span>No channels assigned yet</span>
                )}
              </p>

              <p className="text-gray-500 text-sm">
                {user.user.role === "super_admin"
                  ? "Connect your first YouTube channel to get started."
                  : "Your admin will assign channels to you soon."}
              </p>
            </div>
          ) : (
            channels.map((c) => (
              <div
                key={c.channelId}
                className="rounded-2xl p-4 sm:p-6 bg-white flex flex-col items-center justify-center shadow-md 
                  h-72 sm:h-80 w-full sm:w-64 lg:w-72 border border-gray-200 hover:shadow-lg transition cursor-pointer"
              >
                <img
                  src={c.thumbnail || yticon}
                  alt={c.channelTitle}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-red-600 mb-4 sm:mb-10 shadow-md"
                />

                <h2 className="text-sm sm:text-base text-gray-700 font-medium mb-4 sm:mb-6 text-center">
                  {c.channelTitle}
                </h2>

                <button
                  onClick={() => confirmRemove(c.channelId, c.channelTitle)}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-red-500 hover:text-red-700 font-semibold transition"
                >
                  ✕ Remove
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* REMOVE CONFIRMATION MODAL */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-[#0100008d]  bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-80 text-center shadow-lg">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              Remove Channel
            </h2>

            <p className="text-gray-600 mb-6">
              Are you sure you want to remove{" "}
              <span className="font-medium text-red-600">
                {confirmModal.channelTitle}
              </span>
              ?
            </p>

            <div className="flex justify-center gap-4">
              <button
                onClick={() =>
                  setConfirmModal({
                    show: false,
                    channelId: null,
                    channelTitle: null,
                  })
                }
                className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md"
              >
                Cancel
              </button>

              <button
                onClick={handleRemove}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
              >
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default YouTubeConnect;
