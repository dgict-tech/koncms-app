/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { fetchUserVideosRevenue } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { UserAuthorization } from "../services/auth";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  Legend,
  Decimation,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { ChevronLeft, DollarSign, TrendingUp, BarChart3 } from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  Legend,
  Decimation,
);

const RevenueChart: React.FC = () => {
  const user = useAuth();
  const navigate = useNavigate();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [revenueList, setRevenueList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || user === "null") return;
    const userId = user.user?.id;
    if (!userId) return;

    const load = async () => {
      setLoading(true);
      try {
        const revRes = await fetchUserVideosRevenue(
          userId,
          UserAuthorization(),
        );
        const fullData = revRes.data ?? {};
        const list = fullData.revenueList || fullData.data?.revenueList || [];
        setRevenueList(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error("Failed to fetch revenues", err);
        setRevenueList([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.user?.id]);

  // Group revenue by month-year and calculate totals
  const chartData = useMemo(() => {
    if (!revenueList.length) return null;

    // Create a map of month-year to total revenue
    const monthMap = new Map<
      string,
      { month: number; year: number; revenue: number }
    >();

    revenueList.forEach((r) => {
      const month = Number(r.revenue_month);
      const year = Number(r.revenue_year);
      const revenue = Number(r.user_revenue ?? 0);
      const key = `${month}-${year}`;

      if (monthMap.has(key)) {
        const existing = monthMap.get(key)!;
        existing.revenue += revenue;
      } else {
        monthMap.set(key, { month, year, revenue });
      }
    });

    // Sort chronologically and format for chart
    const sortedData = Array.from(monthMap.values())
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
      })
      .map((item) => ({
        ...item,
        label: new Date(item.year, item.month - 1).toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        }),
      }));

    const labels = sortedData.map((d) => d.label);
    const revenues = sortedData.map((d) => d.revenue);

    return {
      labels,
      datasets: [
        {
          label: "Revenue",
          data: revenues,
          borderColor: "#2563eb",
          backgroundColor: "rgba(37, 99, 235, 0.05)",
          fill: true,
          tension: 0.4,
          pointRadius: 6,
          pointHoverRadius: 8,
          pointBackgroundColor: "#2563eb",
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
        },
      ],
    };
  }, [revenueList]);

  const stats = useMemo(() => {
    if (!revenueList.length) return null;

    const totalRevenue = revenueList.reduce(
      (sum, r) => sum + Number(r.user_revenue ?? 0),
      0,
    );
    const avgRevenue = totalRevenue / revenueList.length;

    // Get current month stats
    const now = new Date();
    const curMonth = now.getMonth() + 1;
    const curYear = now.getFullYear();
    const thisMonthTotal = revenueList
      .filter(
        (r) =>
          Number(r.revenue_month) === curMonth &&
          Number(r.revenue_year) === curYear,
      )
      .reduce((sum, r) => sum + Number(r.user_revenue ?? 0), 0);

    return { totalRevenue, avgRevenue, thisMonthTotal };
  }, [revenueList]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors duration-200 group"
          >
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Back</span>
          </button>

          <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-8 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                  Revenue Overview
                </h1>
                <p className="text-gray-600">
                  Track your revenue trends across months
                </p>
              </div>
              <div className="p-3 bg-white rounded-lg shadow-md text-blue-600">
                <BarChart3 className="w-8 h-8" />
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          {stats && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-600">
                    Total Revenue
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  ${stats.totalRevenue.toFixed(2)}
                </p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-600">
                    This Month
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  ${stats.thisMonthTotal.toFixed(2)}
                </p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-600">
                    Monthly Average
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  ${stats.avgRevenue.toFixed(2)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Chart Section */}
        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 flex flex-col items-center justify-center">
            <div className="w-12 h-12 mb-4 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-gray-600 font-medium">Loading revenue data...</p>
          </div>
        ) : !revenueList.length ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 flex flex-col items-center justify-center border-2 border-dashed border-gray-200">
            <div className="p-4 bg-gray-100 rounded-full mb-4">
              <BarChart3 className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              No Revenue Data
            </h3>
            <p className="text-gray-500 text-center max-w-sm">
              Revenue information is not available at this time. Please check
              back later or contact support.
            </p>
          </div>
        ) : !chartData ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 flex flex-col items-center justify-center border-2 border-dashed border-gray-200">
            <div className="p-4 bg-gray-100 rounded-full mb-4">
              <BarChart3 className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Unable to Load Chart
            </h3>
            <p className="text-gray-500 text-center max-w-sm">
              There was an issue processing your revenue data.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Revenue Trend
            </h2>
            <div className="w-full h-96">
              <Line
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: true,
                      position: "top",
                      labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: { size: 14, weight: "500" },
                        color: "#6b7280",
                      },
                    },
                    tooltip: {
                      backgroundColor: "rgba(0, 0, 0, 0.8)",
                      padding: 12,
                      cornerRadius: 8,
                      titleFont: { size: 14, weight: "bold" },
                      bodyFont: { size: 13 },
                      callbacks: {
                        label: (context: any) => {
                          return `$${context.parsed.y.toFixed(2)}`;
                        },
                      },
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      border: { display: false },
                      grid: { color: "rgba(0, 0, 0, 0.05)" },
                      ticks: {
                        font: { size: 12 },
                        color: "#9ca3af",
                        callback: (value: any) => `$${value.toFixed(0)}`,
                      },
                    },
                    x: {
                      border: { display: false },
                      grid: { display: false },
                      ticks: {
                        font: { size: 12 },
                        color: "#9ca3af",
                      },
                    },
                  },
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RevenueChart;
