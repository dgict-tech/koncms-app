/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { BACKEND_URL } from "../services/youtubeAuth.service";
import {
  Axios_get,
  assignVideoToUser,
  fetchAllVideos,
  fetchUserAssignedVideos,
  removeUserAssignedVideo,
} from "../services/api";
import { UserAuthorization } from "../services/auth";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "./ToastProvider";

const ManageUserAccount: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuth();
  const authUserId = user?.user?.id ?? null;
  const { showToast } = useToast();

  const [profile, setProfile] = useState<any>(null);
  // const [serverVideos, setServerVideos] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [assignedVideos, setAssignedVideos] = useState<any[]>([]);
  const [videoFilter, setVideoFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [loadingAssignedVideos, setLoadingAssignedVideos] = useState(false);
  const [removing, setRemoving] = useState<Record<string, boolean>>({});
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
        console.log("Fetched user profile", raw);
        setProfile(raw);

        // fetch available channels (same approach as ManageAdmin)
        try {
          handleLoadAllVideos();
          // also load videos assigned to this user from the explicit endpoint
          handleLoadAssignedVideos();
        } catch (err) {
          console.log(err);
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

  const handleLoadAllVideos = async () => {
    setLoadingVideos(true);
    setVideos([]);
    try {
      const res = await fetchAllVideos(UserAuthorization());
      console.log("Fetched all videos", res);
      // alert("Fetched all videos from server.");
      const list = res.data?.data || res.data || [];
      // setServerVideos(list || []);
      // normalize to expected video shape if backend stores different keys
      const normalized = (list || []).map((v: any) => ({
        id: v.videoId ?? v.id ?? v._id ?? v.id,
        channelId: v.channelId ?? v.channel?.id ?? v.channel_id ?? null,
        title: v.title ?? v.name ?? v.videoTitle ?? "Untitled",
        thumbnail: v.thumbnail ?? v.thumb ?? v.thumbnail_url ?? "/icon2.png",
        views: v.views ?? v.viewCount ?? 0,
        revenue: v.revenue ?? v.estimatedRevenue ?? 0,
        raw: v,
      }));
      setVideos(normalized || []);
    } catch (err) {
      console.error("Failed to load server videos", err);
      showToast("Failed to load server videos.", "error");
    } finally {
      setLoadingVideos(false);
    }
  };

  const handleLoadAssignedVideos = async () => {
    if (!id) return;
    setLoadingAssignedVideos(true);
    setAssignedVideos([]);
    try {
      const res = await fetchUserAssignedVideos(id, UserAuthorization());
      const list = res.data?.data || res.data || [];
      console.log("Fetched assigned videos for user", res);
      const normalized = (list || []).map((v: any) => ({
        id: v.id ?? v.video_id ?? v._id,
        channelId:
          v.channel_id ?? v.channel ?? v.channelId ?? v.channel?.id ?? null,
        title:
          v.title ?? v.name ?? v.videoTitle ?? v.video?.title ?? "Untitled",
        thumbnail:
          v.thumbnail ??
          v.thumb ??
          v.thumbnail_url ??
          v.video?.thumbnail ??
          "/icon2.png",
        views: v.views ?? v.viewCount ?? v.video?.views ?? 0,
        revenue: v.revenue ?? v.estimatedRevenue ?? v.video?.revenue ?? 0,
        raw: v,
      }));
      setAssignedVideos(normalized || []);
    } catch (err) {
      console.error("Failed to load assigned videos", err);
      showToast("Failed to load assigned videos.", "error");
    } finally {
      setLoadingAssignedVideos(false);
      console.log("Finished loading assigned videos", loadingAssignedVideos);
    }
  };

  const filteredVideos = videos.filter((v) =>
    (v.title || "").toLowerCase().includes(videoFilter.toLowerCase())
  );

  const handleAssignVideo = async (video: any) => {
    console.log("Assigning video", video);
    const videoId = video?.id;
    const chId = video?.raw.channel.channelId ?? null;

    if (!id || !videoId || !chId) {
      showToast("Missing video or channel id for assignment.", "error");
      return;
    }
    setAssigning((s) => ({ ...s, [videoId]: true }));
    try {
      await assignVideoToUser(id, chId, videoId, UserAuthorization());
      showToast("Video assigned to user.", "success");
      // Optionally refresh profile to show assignment
      try {
        const { data: userResp } = await Axios_get(
          `${BACKEND_URL}/${id}`,
          UserAuthorization()
        );
        const raw = userResp.data || userResp || {};
        setProfile(raw);
      } catch (e) {
        // ignore
        console.error("Failed to refresh user profile", e);
      }
    } catch (err) {
      console.error("Failed to assign video", err);
      showToast("Failed to assign video. See console for details.", "error");
    } finally {
      setAssigning((s) => ({ ...s, [videoId]: false }));
    }
  };

  if (!user || user === "null") return null;

  // if (user.user.role !== "super_admin") {
  //   return (
  //     <div className="p-6">
  //       <h2 className="text-lg font-semibold">Access denied</h2>
  //       <p className="text-sm text-gray-600">
  //         Only super admins can manage users.
  //       </p>
  //     </div>
  //   );
  // }

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
            <div>
              <div className="flex items-center gap-6 mb-10 border-b border-gray-100 mt-10">
                <div className=" ">
                  <div className="w-20 h-20 ">
                    <img
                      src={
                        profile?.profile_picture ||
                        profile?.avatar ||
                        "https://cdn-icons-png.flaticon.com/512/5045/5045878.png"
                      }
                      alt="User Profile"
                      className="w-16 h-16 rounded-full object-cover border-4 border-red-500 shadow"
                    />
                  </div>
                </div>

                <div className="mb-6 p-4 rounded-lg">
                  <div className="font-medium text-gray-800">
                    {profile?.full_name}
                  </div>
                  <div className="text-sm text-gray-600">{profile?.email}</div>
                </div>
              </div>{" "}
            </div>

            {/* Assigned videos for this user */}
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                Assigned Videos
              </h4>
              <div className="space-y-3">
                {(function getAssigned() {
                  const raw = profile || {};
                  const fallbackCandidates =
                    raw.videos ||
                    raw.userVideos ||
                    raw.assignedVideos ||
                    raw.videoAssignments ||
                    raw.user_videos ||
                    [];

                  const candidates =
                    Array.isArray(assignedVideos) && assignedVideos.length > 0
                      ? assignedVideos
                      : fallbackCandidates;

                  if (!Array.isArray(candidates) || candidates.length === 0) {
                    return (
                      <div className="text-sm text-gray-500">
                        No videos assigned
                      </div>
                    );
                  }

                  return candidates.map((item: any) => {
                    const vid =
                      item.videoId ??
                      item.id ??
                      item._id ??
                      item.video?.id ??
                      item.video_id ??
                      item;
                    const chid =
                      item.channelId ??
                      item.channel_id ??
                      item.channel?.id ??
                      item.channel ??
                      null;
                    const title =
                      item.title ??
                      item.videoTitle ??
                      item.video?.title ??
                      (item.raw && (item.raw.title || item.raw.videoTitle)) ??
                      "Untitled";
                    const revenue =
                      item.revenue ??
                      item.estimatedRevenue ??
                      item.video?.revenue ??
                      null;

                    return (
                      <div
                        key={vid}
                        className="flex items-center justify-between bg-white p-3 rounded shadow-sm"
                      >
                        <div>
                          <div className="font-medium text-sm text-gray-800 truncate">
                            {title} -
                            <span className="text-green-400">
                              {" $"}
                              {typeof revenue === "number"
                                ? `$${revenue.toFixed(2)}`
                                : "0"}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            Video: {vid} — Channel: {chid}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={async () => {
                              const videoId =
                                item.videoId ??
                                item.id ??
                                item._id ??
                                item.video?.id ??
                                item.video_id ??
                                item;
                              const channelId =
                                item.channelId ??
                                item.channel_id ??
                                item.channel?.id ??
                                item.channel ??
                                item.raw?.channelId ??
                                item.raw?.channel?.id ??
                                null;
                              if (!id || !videoId || !channelId) {
                                showToast("Missing ids for removal.", "error");
                                return;
                              }
                              setRemoving((s) => ({ ...s, [videoId]: true }));
                              try {
                                await removeUserAssignedVideo(
                                  id,
                                  videoId,
                                  UserAuthorization()
                                );
                                showToast("Removed assigned video.", "success");
                                // refresh assigned videos and profile
                                try {
                                  await handleLoadAssignedVideos();
                                } catch (e) {
                                  console.error(
                                    "Failed to refresh assigned videos",
                                    e
                                  );
                                }
                                try {
                                  const { data: userResp } = await Axios_get(
                                    `${BACKEND_URL}/${id}`,
                                    UserAuthorization()
                                  );
                                  const raw = userResp.data || userResp || {};
                                  setProfile(raw);
                                } catch (e) {
                                  console.error(
                                    "Failed to refresh user profile",
                                    e
                                  );
                                }
                              } catch (err) {
                                console.error(
                                  "Failed to remove assigned video",
                                  err
                                );
                                showToast(
                                  "Failed to remove assigned video.",
                                  "error"
                                );
                              } finally {
                                setRemoving((s) => ({
                                  ...s,
                                  [videoId]: false,
                                }));
                              }
                            }}
                            disabled={!!removing[vid]}
                            className="text-red-600 hover:text-red-800 text-sm"
                            aria-label="Remove assigned video"
                          >
                            {removing[vid] ? "…" : "✖️"}
                          </button>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            <div className="mt-10 p-4 bg-gray-100 rounded-lg">
              <div className="grid grid-cols-3 items-center my-10 gap-4">
                <h4 className="col-span-1 text-md font-semibold text-gray-700">
                  All Available Videos:
                </h4>
                <div className="col-span-1 flex items-center justify-center">
                  <input
                    placeholder="Search videos"
                    value={videoFilter}
                    onChange={(e) => setVideoFilter(e.target.value)}
                    className="px-3 py-2 border rounded-md w-full border-gray-300 focus:border-gray-400 focus:outline-none"
                  />
                </div>
                <div className="col-span-1" />
              </div>

              <div className="md:col-span-2">
                {loadingVideos ? (
                  <div className="text-center py-8">Loading videos…</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 ">
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
                            onClick={() => handleAssignVideo(v)}
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
