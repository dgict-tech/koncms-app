/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { VideoIcon, DollarSignIcon } from "lucide-react";
import computeRevenueShare from "../utils/revenueShare";
import { useAuth } from "../hooks/useAuth";
import { fetchUserAssignedVideos } from "../services/api";
import { UserAuthorization } from "../services/auth";

const VideoRevenue: React.FC = () => {
  const user = useAuth();
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!user || user === "null") return;
      const userId = user.user?.id;
      if (!userId) return;

      setLoading(true);
      try {
        const res = await fetchUserAssignedVideos(userId, UserAuthorization());
        const raw = res.data?.data || res.data || [];
        console.log("Fetched assigned videos:", raw);
        const normalized = (raw || []).map((item: any) => ({
          id:
            item.video_id ??
            item.id ??
            item.videoId ??
            item._id ??
            item.video?.id,
          youtubeId:
            item.video?.video_id ??
            item.video_id ??
            item.videoId ??
            item.video?.videoId ??
            null,
          title: item.title ?? item.video?.title ?? "Untitled",
          thumbnail:
            item.thumbnail ??
            item.thumb ??
            item.video?.thumbnail ??
            "/icon2.png",
          publishedAt:
            item.publishedAt ?? item.published_at ?? item.created_at ?? null,
          description: item.description ?? item.video?.description ?? "",
          revenue:
            Number(item.video.revenue ?? item.estimatedRevenue ?? 0) || 0,
          views: Number(item.video.views ?? item.viewCount ?? 0) || 0,
          channelTitle:
            item.channel?.channelTitle ??
            item.channelTitle ??
            item.channel?.channelTitle ??
            "",
        }));
        setVideos(normalized);
      } catch (err) {
        console.error("Failed to load assigned videos", err);
        setVideos([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user?.user?.id]);

  if (!user || user === "null") return null;

  const totalVideos = videos.length;

  const totalSiteShare = videos.reduce(
    (sum, v) =>
      sum + computeRevenueShare(Number(v.revenue || 0), user?.user?.role),
    0
  );

  return (
    <div className="p-4 bg-white rounded shadow">
      <h3 className="text-lg font-semibold mb-4">Video Revenue</h3>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-white to-gray-50 rounded-lg shadow-sm">
          <div className="p-3 bg-red-50 text-red-600 rounded-lg">
            <VideoIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-gray-500">Total Videos</div>
            <div className="text-2xl font-semibold text-gray-800">
              {totalVideos}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-white to-gray-50 rounded-lg shadow-sm">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <DollarSignIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-gray-500">Site Share</div>
            <div className="text-2xl font-semibold text-gray-800">
              ${totalSiteShare.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">Loading…</div>
      ) : videos.length === 0 ? (
        <div className="text-sm text-gray-500">No assigned videos.</div>
      ) : (
        <div className="space-y-3">
          {videos.map((v) => {
            const href = v.youtubeId
              ? `https://www.youtube.com/watch?v=${v.youtubeId}`
              : undefined;
            return (
              <a
                key={v.id}
                href={href}
                target={href ? "_blank" : undefined}
                rel={href ? "noreferrer" : undefined}
                className={`flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100 ${
                  href ? "cursor-pointer" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={v.thumbnail}
                    alt={v.title}
                    className="w-20 h-12 object-cover rounded"
                  />
                  <div>
                    <div className="font-medium text-sm line-clamp-2">
                      {v.title}
                    </div>
                    <div className="text-xs text-gray-500">
                      {v.channelTitle} •{" "}
                      {v.publishedAt
                        ? new Date(v.publishedAt).toLocaleDateString()
                        : ""}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-green-600 font-semibold">
                    ${" "}
                    {computeRevenueShare(
                      Number(v.revenue || 0),
                      user?.user?.role
                    ).toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500">Views: {v.views}</div>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default VideoRevenue;
