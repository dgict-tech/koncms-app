/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import {
  youtubeAuthService,
  type ChannelToken,
} from "../services/youtubeAuth.service";
import { fetchVideosByChannel } from "../services/api";
import { UserAuthorization } from "../services/auth";
import yticon from "../assets/yticon.png";
import { ArrowRight, PlayCircle } from "lucide-react";
import computeRevenueShare from "../utils/revenueShare";

const Videos: React.FC<{ user: any }> = ({ user }) => {
  const [channels, setChannels] = useState<ChannelToken[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<ChannelToken | null>(
    null,
  );
  const [videos, setVideos] = useState<any[]>([]);
  const [loadingModal, setLoadingModal] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(30);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);

  // Revenue state
  const [videoRevenues, setVideoRevenues] = useState<{ [id: string]: number }>(
    {},
  );

  /** ------------------------------------------------------
   *  Load YouTube scripts + stored channels from localStorage,
   *  fallback to backend when user is available
   * ------------------------------------------------------ */
  useEffect(() => {
    const init = async () => {
      await youtubeAuthService.loadScripts();

      const savedChannels = await youtubeAuthService.getStoredChannels(
        user ?? null,
      );

      console.log("Loaded channels:", savedChannels);
      setChannels(savedChannels || []);

      setSelectedChannel(
        (prev) =>
          prev ??
          (savedChannels && savedChannels.length > 0 ? savedChannels[0] : null),
      );
    };
    init();
  }, [user]);

  /** ------------------------------------------------------
   *  Fetch videos + start revenue fetching IMMEDIATELY
   * ------------------------------------------------------ */
  useEffect(() => {
    const loadVideos = async () => {
      if (!selectedChannel) {
        setVideos([]);
        setTotalItems(0);
        setTotalPages(0);
        return;
      }

      setVideos([]);
      setVideoRevenues({});
      setLoadingModal(true);

      try {
        // Fetch videos from backend with pagination
        const resp = await fetchVideosByChannel(
          selectedChannel.channelId,
          UserAuthorization(),
          currentPage,
          limit,
        );

        // Extract data and pagination from response
        const items = resp.data?.data || [];
        const paginationData = resp.data?.pagination || {};
        const total_revenue = resp.data?.totalRevenue || 0;

        // Set pagination state from backend metadata
        setTotalItems(paginationData.totalItems || 0);
        setTotalPages(paginationData.totalPages || 0);
        setTotalRevenue(total_revenue);

        // normalize backend video shape to what UI expects
        const normalized = (items || []).map((item: any) => ({
          id:
            item.video_id ??
            item.id ??
            item.videoId ??
            item._id ??
            item.video?.id,
          title:
            item.title ?? item.videoTitle ?? item.video?.title ?? "Untitled",
          thumbnail:
            item.thumbnail ??
            item.thumb ??
            item.video?.thumbnail ??
            "/icon2.png",
          publishedAt:
            item.publishedAt ?? item.published_at ?? item.created_at ?? null,
          description: item.description ?? item.video?.description ?? "",
          revenue: Number(item.revenue ?? item.estimatedRevenue ?? 0) || 0,
          views: Number(item.views ?? item.viewCount ?? 0) || 0,
          duration: item.duration ?? item.video?.duration ?? 0,
          likes: Number(item.likes ?? item.likeCount ?? 0) || 0,
          comments: Number(item.comments ?? item.commentCount ?? 0) || 0,
          status: item.status ?? item.video?.status ?? "published",
        }));

        setVideos(normalized || []);

        // Initialize revenue state from backend values
        const initialRevs: { [id: string]: number } = {};
        for (const v of normalized) {
          initialRevs[v.id] = v.revenue ?? 0;
        }
        setVideoRevenues(initialRevs);
      } catch (err) {
        console.error(err);
        setVideos([]);
        setTotalItems(0);
        setTotalPages(0);
      } finally {
        setLoadingModal(false);
      }
    };

    loadVideos();
  }, [selectedChannel, currentPage, limit]);

  /** ------------------------------------------------------
   *  Debug: log when channels change
   * ------------------------------------------------------ */
  useEffect(() => {
    console.log("Channels updated:", channels);
  }, [channels]);

  const revenueShare = totalRevenue - totalRevenue * 0.1; // Example: 10% tax
  const taxReven = totalRevenue * 0.1;

  return (
    <div className="p-6 bg-gray-50 min-h-screen relative">
      {/* Custom animation */}
      <style>
        {`
          @keyframes moveLeftRight {
            0%, 100% { transform: translateX(0); }
            50% { transform: translateX(20px); }
          }
          .animate-move-left-right {
            animation: moveLeftRight 1.5s ease-in-out infinite;
          }
        `}
      </style>

      {/* --- Channel Selection --- */}
      <div className="max-full mx-auto mt-10 max-w-7xl">
        <div className="pb-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative">
            {/* Left Section */}
            <div className="flex items-center gap-4">
              <img
                src={yticon}
                alt="YouTube"
                className="w-16 h-16 rounded-full border-4 border-red-500 shadow"
              />
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  YouTube Videos
                </h2>
                <p className="text-gray-500 text-sm">
                  Select a connected channel to view its videos.
                </p>
              </div>
            </div>

            {/* Animated Arrow */}
            <div className="hidden lg:flex absolute left-1/2 transform -translate-x-1/2 items-center justify-center text-red-600">
              <ArrowRight
                className="w-8 h-8 animate-move-left-right"
                strokeWidth={2.5}
              />
            </div>

            {/* Dropdown */}
            <div className="flex items-center gap-4 w-full md:w-1/3">
              <select
                className="flex-1 border-2 border-red-500 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                value={selectedChannel?.channelId || ""}
                onChange={(e) => {
                  const selected = channels.find(
                    (c) => c.channelId === e.target.value,
                  );
                  setSelectedChannel(selected || null);
                  setCurrentPage(1);
                  setTotalItems(0);
                  setTotalPages(0);
                }}
              >
                <option value="">-- Select a Channel --</option>
                {channels.map((channel) => (
                  <option key={channel.channelId} value={channel.channelId}>
                    {channel.channelTitle}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* --- Videos Grid --- */}
      {selectedChannel && (
        <div className="max-w-7xl mx-auto mt-10">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Videos from {selectedChannel.channelTitle}
          </h3>

          {/* Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-16">
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-white to-gray-50 rounded-lg shadow-sm">
              <div className="p-3 bg-red-50 text-red-600 rounded-lg">
                <svg
                  className="w-6 h-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path d="M3 7h18M3 12h18M3 17h18" />
                </svg>
              </div>
              <div>
                <div className="text-xs text-gray-500">Total Videos</div>
                <div className="text-2xl font-semibold text-gray-800">
                  <span className="font-semibold">{totalItems}</span> videos
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-white to-gray-50 rounded-lg shadow-sm">
              <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                <svg
                  className="w-6 h-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path d="M12 1v22M7 5h10" />
                </svg>
              </div>
              <div>
                <div className="text-xs text-gray-500">Total Revenue (90%)</div>
                <div className="text-2xl font-semibold text-gray-800">
                  ${revenueShare.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-white to-gray-50 rounded-lg shadow-sm">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                <svg
                  className="w-6 h-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path d="M12 1v22M17 5H7" />
                </svg>
              </div>
              <div>
                <div className="text-xs text-gray-500">Total Tax (10%)</div>
                <div className="text-2xl font-semibold text-gray-800">
                  ${taxReven.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {!loadingModal && videos.length === 0 ? (
            <div className="text-center text-gray-500 py-10 bg-white rounded-xl shadow-sm">
              No videos found for this channel.
            </div>
          ) : (
            <>
              {!loadingModal && (
                <div>
                  <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <p className="text-gray-500 text-sm md:text-left">
                      Showing videos{" "}
                      <span className="font-semibold">
                        {(currentPage - 1) * limit + 1}
                      </span>{" "}
                      to{" "}
                      <span className="font-semibold">
                        {Math.min(currentPage * limit, totalItems)}
                      </span>{" "}
                      of <span className="font-semibold">{totalItems}</span>
                    </p>

                    <div className="flex items-center gap-3 justify-end w-full md:w-auto">
                      <button
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                      >
                        Previous
                      </button>

                      <div className="flex items-center gap-2">
                        {Array.from({ length: Math.min(5, totalPages) }).map(
                          (_, idx) => {
                            const pageNum = currentPage - 2 + idx;
                            if (pageNum < 1 || pageNum > totalPages)
                              return null;

                            return (
                              <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`px-3 py-2 rounded-md transition ${
                                  pageNum === currentPage
                                    ? "bg-red-500 text-white font-semibold"
                                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          },
                        )}
                      </div>

                      <button
                        onClick={() =>
                          setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={
                          currentPage === totalPages || totalPages === 0
                        }
                        className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                      >
                        Next
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <label
                        htmlFor="limit-select-top"
                        className="text-sm font-medium text-gray-700"
                      >
                        Videos per page:
                      </label>
                      <select
                        id="limit-select-top"
                        value={limit}
                        onChange={(e) => {
                          setLimit(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={30}>30</option>
                        <option value={50}>50</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {videos.map((video) => (
                      <div
                        key={video.id}
                        className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition transform hover:-translate-y-1 relative group"
                      >
                        {/* Thumbnail */}
                        <div className="relative">
                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            className="w-full h-44 object-cover"
                          />
                          <button
                            onClick={() =>
                              window.open(
                                `https://www.youtube.com/watch?v=${video.id}`,
                                "_blank",
                              )
                            }
                            className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition"
                          >
                            <PlayCircle className="w-14 h-14 text-white drop-shadow-lg" />
                          </button>
                        </div>

                        {/* Video Info */}
                        <div className="p-4">
                          <h4 className="text-sm font-medium text-gray-800 line-clamp-2">
                            {video.title}
                          </h4>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(video.publishedAt).toLocaleDateString()}
                          </p>

                          {/* Video Stats */}
                          <div className="mt-2 space-y-1 text-xs text-gray-600">
                            <p>Views: {(video.views || 0).toLocaleString()}</p>
                            <p>Likes: {(video.likes || 0).toLocaleString()}</p>
                            {video.comments > 0 && (
                              <p>Comments: {video.comments.toLocaleString()}</p>
                            )}
                          </div>

                          {/* Revenue */}
                          {videoRevenues[video.id] === undefined ? (
                            <p className="text-sm mt-2 text-gray-400">
                              Loading revenue...
                            </p>
                          ) : (
                            <p className="text-sm mt-2 text-green-600 font-medium">
                              Revenue: ${videoRevenues[video.id].toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pagination Controls */}
              {!loadingModal && videos.length > 0 && (
                <div className="mt-12 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  {/* Pagination Info */}
                  <div className="text-center text-sm text-gray-600 md:text-left">
                    <p>
                      Showing {(currentPage - 1) * limit + 1} to{" "}
                      {Math.min(currentPage * limit, totalItems)} of{" "}
                      <span className="font-semibold">{totalItems}</span> videos
                    </p>
                  </div>

                  {/* Page Controls */}
                  <div className="flex items-center gap-3 justify-end w-full md:w-auto">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                    >
                      Previous
                    </button>

                    <div className="flex items-center gap-2">
                      {Array.from({ length: Math.min(5, totalPages) }).map(
                        (_, idx) => {
                          const pageNum = currentPage - 2 + idx;
                          if (pageNum < 1 || pageNum > totalPages) return null;

                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`px-3 py-2 rounded-md transition ${
                                pageNum === currentPage
                                  ? "bg-red-500 text-white font-semibold"
                                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        },
                      )}
                    </div>

                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages || totalPages === 0}
                      className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                    >
                      Next
                    </button>
                  </div>

                  {/* Limit Selector */}
                  <div className="flex items-center gap-3">
                    <label
                      htmlFor="limit-select"
                      className="text-sm font-medium text-gray-700"
                    >
                      Videos per page:
                    </label>
                    <select
                      id="limit-select"
                      value={limit}
                      onChange={(e) => {
                        setLimit(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={30}>30</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Loading Modal */}
      {loadingModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-72 text-center shadow-lg">
            <div className="animate-spin border-4 border-red-600 border-t-transparent rounded-full w-10 h-10 mx-auto mb-4"></div>
            <h2 className="text-gray-700 font-medium">Loading videos...</h2>
            <p className="text-sm text-gray-500 mt-1">Please wait a moment.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Videos;
