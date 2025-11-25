/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useMemo } from "react";
import yticon from "../assets/yticon.png";
import Select from "react-select";
import type { SingleValue } from "react-select";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

import {
  youtubeAuthService,
  type ChannelToken,
} from "../services/youtubeAuth.service";
import { fetchChannelVideos, formatNumber } from "../services/youtube.service";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  Legend
);

const VideoAnalytics: React.FC = () => {
  const [channels, setChannels] = useState<ChannelToken[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<ChannelToken | null>(
    null
  );

  const [videos, setVideos] = useState<any[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<any | null>(null);

  const [loading, setLoading] = useState(false);

  const [dateRange, setDateRange] = useState<
    "7d" | "30d" | "90d" | "6m" | "1y" | "2y" | "5y"
  >("30d");

  // track window size to adapt chart on mobile
  const [windowWidth, setWindowWidth] = useState<number>(
    typeof window !== "undefined" ? window.innerWidth : 1024
  );

  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isMobile = windowWidth < 640;

  // DATE RANGE CALCULATOR
  const getDateRange = (filter: typeof dateRange) => {
    const end = new Date();
    const start = new Date();

    switch (filter) {
      case "7d":
        start.setDate(end.getDate() - 7);
        break;
      case "30d":
        start.setDate(end.getDate() - 30);
        break;
      case "90d":
        start.setDate(end.getDate() - 90);
        break;
      case "6m":
        start.setMonth(end.getMonth() - 6);
        break;
      case "1y":
        start.setFullYear(end.getFullYear() - 1);
        break;
      case "2y":
        start.setFullYear(end.getFullYear() - 2);
        break;
      case "5y":
        start.setFullYear(end.getFullYear() - 5);
        break;
      default:
        start.setDate(end.getDate() - 30);
    }

    return {
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
    };
  };

  // LOAD STORED CHANNELS
  useEffect(() => {
    const init = async () => {
      await youtubeAuthService.loadScripts();
      const saved = await youtubeAuthService.getStoredChannels();
      setChannels(saved);

      if (saved.length > 0) {
        setSelectedChannel(saved[0]);
      }
    };
    init();
  }, []);

  // LOAD VIDEOS WHEN CHANNEL CHANGES (dateRange only affects chart)
  useEffect(() => {
    const load = async () => {
      if (!selectedChannel) return;

      setLoading(true);
      setVideos([]);
      setSelectedVideo(null);

      try {
        // Fetch videos without analytics date filters so dateRange only affects the chart
        const data = await fetchChannelVideos(
          selectedChannel.access_token,
          selectedChannel.channelId,
          50
        );

        setVideos(data || []);

        // auto-select first video if none selected
        if ((data?.length || 0) > 0) {
          setSelectedVideo((prev) => prev ?? (data[0] || null));
        }
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [selectedChannel]);

  // OPTIONS FOR CHANNEL SELECT
  const channelOptions = channels.map((ch) => ({
    label: ch.channelTitle,
    value: ch.channelId,
    icon: ch.thumbnail,
    raw: ch,
  }));

  // OPTIONS FOR VIDEO SELECT
  const videoOptions = videos.map((v) => ({
    label: v.title,
    value: v.id,
    thumbnail: v.thumbnail,
    views: v.views,
    raw: v,
  }));

  // CUSTOM CHANNEL OPTION RENDERER
  const ChannelOption = (props: any) => (
    <div
      {...props.innerProps}
      className="flex items-center gap-3 p-2 cursor-pointer"
    >
      <img src={props.data.icon || yticon} className="w-8 h-8 rounded-full" />
      <span>{props.data.label}</span>
    </div>
  );

  // CUSTOM VIDEO OPTION RENDERER
  const VideoOption = (props: any) => (
    <div
      {...props.innerProps}
      className="flex items-center gap-3 p-2 cursor-pointer"
    >
      <img src={props.data.thumbnail} className="w-10 h-6 rounded" />
      <span className="text-sm">{props.data.label}</span>
    </div>
  );

  // Custom react-select styles (softer red accents, minimal borders)
  const selectStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      borderRadius: 10,
      borderColor: state.isFocused ? "rgba(239,68,68,0.18)" : "transparent",
      boxShadow: state.isFocused ? "0 8px 24px rgba(239,68,68,0.06)" : "none",
      padding: "4px 6px",
      background: "#ffffff",
      minHeight: 44,
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isFocused ? "rgba(239,68,68,0.04)" : "transparent",
      color: "#111827",
      padding: "8px 12px",
    }),
    singleValue: (provided: any) => ({ ...provided, color: "#111827" }),
    menu: (provided: any) => ({
      ...provided,
      borderRadius: 10,
      overflow: "hidden",
    }),
  };

  // LINE CHART DATA
  const chartData = useMemo(() => {
    if (!selectedVideo) return null;
    // compute date labels based on the current dateRange
    const { start, end } = getDateRange(dateRange);
    const startDate = new Date(start);
    const endDate = new Date(end);

    const useMonthly = ["90d", "6m", "1y", "2y", "5y"].includes(dateRange);

    // deterministic pseudo-random seed based on video id
    const seed = selectedVideo.id
      .split("")
      .reduce((s: number, ch: string) => s + ch.charCodeAt(0), 0);
    const rand = (i: number) => {
      const x = Math.sin(seed + i) * 10000;
      return x - Math.floor(x);
    };

    const totalViews = Number(selectedVideo.views) || 0;

    if (useMonthly) {
      // produce month labels between start and end (inclusive)
      const labels: string[] = [];
      const months: { year: number; month: number }[] = [];
      const cur = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      const endMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
      let idx = 0;
      while (cur <= endMonth) {
        labels.push(
          cur.toLocaleString(undefined, { month: "short", year: "numeric" })
        );
        months.push({ year: cur.getFullYear(), month: cur.getMonth() });
        cur.setMonth(cur.getMonth() + 1);
        idx++;
      }

      const monthsCount = labels.length || 1;
      const base = Math.floor(totalViews / monthsCount);
      const data = months.map((_, i) => {
        const noise = Math.round(rand(i) * base * 0.5);
        return Math.max(0, base + noise - Math.floor(base * 0.2));
      });
      const sum = data.reduce((a, b) => a + b, 0) || 1;
      const scaled = data.map((v) => Math.round((v / sum) * totalViews));

      return {
        labels,
        datasets: [
          {
            label: "Views",
            data: scaled,
            fill: true,
            tension: 0.4,
            borderColor: "rgba(255, 0, 0, 0.8)",
            backgroundColor: "rgba(255, 0, 0, 0.12)",
            pointRadius: 3,
          },
        ],
      };
    }

    // daily labels
    const daysCount = Math.max(
      1,
      Math.round(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1
    );
    const labels: string[] = [];
    for (let i = 0; i < daysCount; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      labels.push(d.toISOString().split("T")[0]);
    }

    const base = Math.floor(totalViews / daysCount);
    const data = labels.map((_, i) => {
      const noise = Math.round(rand(i) * base * 0.6);
      return Math.max(0, base + noise - Math.floor(base * 0.3));
    });
    const sum = data.reduce((a, b) => a + b, 0) || 1;
    const scaled = data.map((v) => Math.round((v / sum) * totalViews));

    return {
      labels,
      datasets: [
        {
          label: "Views",
          data: scaled,
          fill: true,
          tension: 0.4,
          borderColor: "rgba(255, 0, 0, 0.8)",
          backgroundColor: "rgba(255, 0, 0, 0.12)",
          pointRadius: 2,
        },
      ],
    };
  }, [selectedVideo, dateRange]);

  const chartOptions = useMemo(() => {
    const labelsCount = (chartData?.labels?.length as number) || 1;
    // On mobile show fewer ticks (avoid horizontal overflow / need to pinch-zoom)
    const mobileMaxTicks = 4;
    const desktopMaxTicks = 12;
    const maxTicks = isMobile ? mobileMaxTicks : desktopMaxTicks;

    // determine step to show roughly `maxTicks` labels
    const step = Math.max(1, Math.ceil(labelsCount / maxTicks));

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top" as const,
          labels: { boxWidth: isMobile ? 10 : 20 },
        },
        tooltip: { mode: "index" as const, intersect: false },
      },
      interaction: { mode: "nearest" as const, intersect: false },
      elements: {
        point: { radius: isMobile ? 0 : 3 },
        line: { borderWidth: 2 },
      },
      scales: {
        x: {
          display: true,
          title: { display: false },
          ticks: {
            autoSkip: true,
            maxRotation: 0,
            minRotation: 0,
            callback: function (value: string | number, index: number): string {
              // only show every `step` label on mobile/desktop to keep chart readable
              if (index % step !== 0) return "";
              const label = this.getLabelForValue
                ? this.getLabelForValue(value)
                : (chartData?.labels?.[index] as string);
              if (!label) return "";
              // shorten ISO-style date labels (YYYY-MM-DD -> MM-DD)
              if (typeof label === "string" && label.includes("-")) {
                return label.slice(5);
              }
              return label;
            },
          },
        },
        y: { display: true, title: { display: true, text: "Views" } },
      },
    };
  }, [chartData, isMobile]);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <img
          src={yticon}
          className="w-14 h-14 rounded-full shadow border-2 border-red-500"
        />
        <div>
          <h2 className="text-2xl font-semibold">YouTube Analytics</h2>
          <p className="text-gray-500 text-sm">Channel & Video Insights</p>
        </div>
      </div>

      {/* SELECTORS */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* CHANNEL SELECT */}
        <div>
          <label className="font-medium text-gray-600 mb-1 block">
            Select Channel
          </label>
          <div className="bg-white rounded-lg p-2 shadow-sm">
            <Select
              options={channelOptions}
              components={{ Option: ChannelOption }}
              value={
                channelOptions.find(
                  (o) => o.value === selectedChannel?.channelId
                ) || null
              }
              onChange={(e: SingleValue<any>) =>
                setSelectedChannel(e?.raw || null)
              }
              placeholder="Choose a channel"
              styles={selectStyles}
              isClearable
            />
          </div>
        </div>

        {/* VIDEO SELECT */}
        <div>
          <label className="font-medium text-gray-600 mb-1 block">
            Select Video
          </label>
          <div className="bg-white rounded-lg p-2 shadow-sm">
            <Select
              options={videoOptions}
              components={{ Option: VideoOption }}
              value={
                videoOptions.find((o) => o.value === selectedVideo?.id) || null
              }
              onChange={(e: SingleValue<any>) =>
                setSelectedVideo(e?.raw || null)
              }
              placeholder="Choose video"
              isLoading={loading}
              styles={selectStyles}
              isClearable
              noOptionsMessage={() => "No videos available"}
            />
          </div>
        </div>

        {/* DATE RANGE */}
        <div>
          <label className="font-medium text-gray-600 mb-1 block">
            Select Date Range
          </label>
          <select
            className="bg-white px-3 py-4 rounded w-full border border-red-500 shadow-sm"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="6m">Last 6 Months</option>
            <option value="1y">Last 1 Year</option>
            <option value="2y">Last 2 Years</option>
            <option value="5y">Last 5 Years</option>
          </select>
        </div>
      </div>

      {/* CHART */}
      <div className="mt-10 bg-white p-6 rounded-xl shadow-lg">
        {loading ? (
          <div className="text-center text-gray-500">Loading videos...</div>
        ) : !selectedVideo ? (
          <div className="text-center text-gray-400">
            Select a video to view analytics
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row items-start gap-4 mb-4 min-w-0">
              <img
                src={selectedVideo.thumbnail}
                alt={selectedVideo.title}
                className="w-full sm:w-20 h-44 sm:h-12 rounded-md object-cover ring-1 ring-gray-100"
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 line-clamp-2">
                  {selectedVideo.title}
                </h3>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2 text-sm text-gray-500">
                  <span className="text-red-600 font-semibold">
                    {formatNumber(Number(selectedVideo.views || 0))} views
                  </span>
                  <span className="hidden sm:inline text-gray-300">•</span>
                  <span>
                    {new Date(selectedVideo.publishedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="w-full sm:w-auto sm:ml-auto text-left sm:text-right mt-3 sm:mt-0">
                <div className="text-xs text-gray-400">Range</div>
                <div className="text-sm font-medium text-red-500">
                  {dateRange}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div
                style={{ position: "relative" }}
                className={isMobile ? "h-[340px]" : "h-[520px]"}
              >
                <Line data={chartData!} options={chartOptions} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VideoAnalytics;
