/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { VideoIcon, DollarSignIcon } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import {
  fetchUserAssignedVideos,
  fetchUserVideosRevenue,
} from "../services/api";
import { UserAuthorization } from "../services/auth";

const VideoRevenue: React.FC = () => {
  const user = useAuth();
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [thisMonthRevenue, setThisMonthRevenue] = useState<number>(0);
  const [lastMonthRevenue, setLastMonthRevenue] = useState<number>(0);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      if (!user || user === "null") return;
      const userId = user.user?.id;
      if (!userId) return;

      setLoading(true);
      try {
        const res = await fetchUserAssignedVideos(userId, UserAuthorization());
        const rawAssigned = res.data?.data || res.data || [];
        console.log("Fetched assigned videos:", rawAssigned);

        // Fetch per-period revenue totals (do NOT replace the video list).
        try {
          const revRes = await fetchUserVideosRevenue(
            userId,
            UserAuthorization(),
          );
          const revData = revRes.data ?? {};
          const total = Number(revData.totalRevenue ?? 0) || 0;
          const thisMonth = Number(revData.thisMonthRevenue ?? 0) || 0;
          const lastMonth = Number(revData.lastMonthRevenue ?? 0) || 0;
          setTotalRevenue(total);
          setThisMonthRevenue(thisMonth);
          setLastMonthRevenue(lastMonth);
        } catch (err) {
          console.warn("Failed to fetch user videos revenue totals", err);
        }

        const normalized = (rawAssigned || []).map((item: any) => ({
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
            Number(
              item.revenue ?? item.video?.revenue ?? item.estimatedRevenue ?? 0,
            ) || 0,
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
  // Use totals fetched from the revenue endpoint instead of per-video share
  // const totalSiteShare = totalRevenue; // kept variable name for backwards compatibility

  return (
    <div className="p-4 bg-white rounded shadow">
      <h3 className="text-lg font-semibold mb-4">Video Revenue</h3>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="flex items-center gap-4 p-4 bg-linear-to-r from-white to-gray-50 rounded-lg shadow-sm">
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

        <div className="flex items-center gap-4 p-4 bg-linear-to-r from-white to-gray-50 rounded-lg shadow-sm">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <DollarSignIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-gray-500">Total Revenue</div>
            <div className="text-2xl font-semibold text-gray-800">
              ${totalRevenue.toFixed(2)}
            </div>
            <div className="mt-2">
              <button
                className="text-sm text-blue-600 hover:underline"
                onClick={() => navigate("/account/revenue-chart")}
              >
                View chart
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 p-4 bg-linear-to-r from-white to-gray-50 rounded-lg shadow-sm">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg">
            <DollarSignIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-gray-500">This Month</div>
            <div className="text-2xl font-semibold text-gray-800">
              ${thisMonthRevenue.toFixed(2)}
            </div>
            <div className="mt-2">
              <button
                className="text-sm text-blue-600 hover:underline"
                onClick={() =>
                  navigate("/account/revenue-breakdown?period=this")
                }
              >
                View breakdown
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 p-4 bg-linear-to-r from-white to-gray-50 rounded-lg shadow-sm">
          <div className="p-3 bg-yellow-50 text-yellow-600 rounded-lg">
            <DollarSignIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-gray-500">Previous Month</div>
            <div className="text-2xl font-semibold text-gray-800">
              ${lastMonthRevenue.toFixed(2)}
            </div>
            <div className="mt-2">
              <button
                className="text-sm text-blue-600 hover:underline"
                onClick={() =>
                  navigate("/account/revenue-breakdown?period=last")
                }
              >
                View breakdown
              </button>
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
                <div className="text-right"></div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default VideoRevenue;
