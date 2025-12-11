/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  BACKEND_URL,
  youtubeAuthService,
} from "../services/youtubeAuth.service";
import { Axios_get, assignVideoToUser } from "../services/api";
import { UserAuthorization } from "../services/auth";
import { useAuth } from "../hooks/useAuth";
import { fetchChannelVideos } from "../services/youtube.service";
import { useToast } from "./ToastProvider";

const ManageUserAccount: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuth();
  const authUserId = user?.user?.id ?? null;
  const { showToast } = useToast();

  const [profile, setProfile] = useState<any>(null);
  const [channels, setChannels] = useState<any[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(
    null
  );
  const [videos, setVideos] = useState<any[]>([]);
  const [videoFilter, setVideoFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [assigning, setAssigning] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      try {
        // fetch user profile
        const { data: userResp } = await Axios_get(
          `${BACKEND_URL}/${id}`,
          UserAuthorization()
        );
        const raw = userResp.data || userResp || {};
        setProfile(raw);

        // fetch available channels (same approach as ManageAdmin)
        try {
          const { data: chResp } = await Axios_get(
            `${BACKEND_URL}/get-auth-channel/${authUserId}`,
            UserAuthorization()
          );
          const rawCh = chResp.data || chResp || [];
          const normalized = rawCh.map((c: any) => ({
            channelId: c.channelId ?? c.id ?? c._id ?? c,
            channelTitle:
              c.channelTitle ?? c.title ?? c.snippet?.title ?? "Untitled",
            raw: c,
          }));
          setChannels(normalized);
        } catch (err) {
          console.log(err);
          const local = await youtubeAuthService.getStoredChannels();
          const normalized = (local || []).map((c: any) => ({
            channelId: c.channelId ?? c.id ?? c,
            channelTitle: c.channelTitle ?? c.title ?? "Untitled",
            raw: c,
          }));
          setChannels(normalized || []);
        }
      } catch (err) {
        console.error("Failed to load user or channels", err);
        showToast("Failed to load user. See console for details.", "error");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, authUserId, showToast]);

  const handleSelectChannel = async (chId: string) => {
    setSelectedChannelId(chId);
    setLoadingVideos(true);
    setVideos([]);
    try {
      // find channel token in local storage (youtubeAuthService)
      const stored = await youtubeAuthService.getStoredChannels();
      const channelToken = (stored || []).find(
        (c: any) => c.channelId === chId || c.id === chId || c._id === chId
      );
      const access_token = channelToken?.access_token;
      if (!access_token) {
        showToast(
          "No access token found for this channel. Please connect it first.",
          "error"
        );
        setLoadingVideos(false);
        return;
      }

      const vids = await fetchChannelVideos(access_token, chId, 50);
      setVideos(vids || []);
    } catch (err) {
      console.error("Failed to load videos", err);
      showToast(
        "Failed to load channel videos. See console for details.",
        "error"
      );
    } finally {
      setLoadingVideos(false);
    }
  };

  const filteredVideos = videos.filter((v) =>
    (v.title || "").toLowerCase().includes(videoFilter.toLowerCase())
  );

  const handleAssignVideo = async (videoId: string) => {
    if (!id || !selectedChannelId) return;
    setAssigning((s) => ({ ...s, [videoId]: true }));
    try {
      await assignVideoToUser(
        id,
        selectedChannelId,
        videoId,
        UserAuthorization()
      );
      showToast("Video assigned to user.", "success");
    } catch (err) {
      console.error("Failed to assign video", err);
      showToast("Failed to assign video. See console for details.", "error");
    } finally {
      setAssigning((s) => ({ ...s, [videoId]: false }));
    }
  };

  if (!user || user === "null") return null;

  if (user.user.role !== "super_admin") {
    return (
      <div className="p-6">
        <h2 className="text-lg font-semibold">Access denied</h2>
        <p className="text-sm text-gray-600">
          Only super admins can manage users.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto bg-white p-6 rounded-2xl shadow ring-1 ring-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Manage User</h2>
            <p className="text-sm text-gray-500">Assign videos to this user.</p>
          </div>
          <div>
            <button
              onClick={() => navigate(-1)}
              className="text-sm text-gray-600"
            >
              Back
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading…</div>
        ) : (
          <div>
            <div className="mb-6 p-4 rounded-lg bg-gray-50">
              <div className="font-medium text-gray-800">
                {profile?.first_name} {profile?.last_name}
              </div>
              <div className="text-sm text-gray-600">{profile?.email}</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  Channels
                </h4>
                {channels.length === 0 ? (
                  <div className="text-sm text-gray-500">
                    No channels available
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {channels.map((ch) => (
                      <button
                        key={ch.channelId}
                        onClick={() => handleSelectChannel(ch.channelId)}
                        className={`text-left px-3 py-2 rounded-md hover:bg-red-50 transition ${
                          selectedChannelId === ch.channelId
                            ? "bg-red-50 ring-1 ring-red-100"
                            : "bg-white border border-gray-100"
                        }`}
                      >
                        <div className="font-medium text-sm text-gray-800 truncate">
                          {ch.channelTitle}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {ch.channelId}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-700">
                    Videos
                  </h4>
                  <div>
                    <input
                      placeholder="Search videos"
                      value={videoFilter}
                      onChange={(e) => setVideoFilter(e.target.value)}
                      className="px-3 py-2 border rounded-md w-64"
                    />
                  </div>
                </div>

                {loadingVideos ? (
                  <div className="text-center py-8">Loading videos…</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {filteredVideos.map((v) => (
                      <div
                        key={v.id}
                        className="bg-white p-3 rounded-lg shadow-sm flex flex-col"
                      >
                        <div className="flex items-start gap-3">
                          <img
                            src={v.thumbnail || "/icon2.png"}
                            alt={v.title}
                            className="w-24 h-14 rounded object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-800 truncate">
                              {v.title}
                            </div>
                            <div className="text-xs text-gray-500">
                              Views: {v.views ?? 0}
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-end">
                          <button
                            onClick={() => handleAssignVideo(v.id)}
                            disabled={!!assigning[v.id]}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm"
                          >
                            {assigning[v.id] ? "…" : "Assign to user"}
                          </button>
                        </div>
                      </div>
                    ))}

                    {filteredVideos.length === 0 && (
                      <div className="col-span-full text-sm text-gray-500">
                        No videos match your search.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageUserAccount;
