import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { fetchUserVideosRevenue } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { UserAuthorization } from "../services/auth";
import {
  ChevronLeft,
  DollarSign,
  TrendingUp,
  Play,
  Calendar,
} from "lucide-react";

const PAGE_SIZE = 10;

const RevenueBreakdown: React.FC = () => {
  const user = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [revenueList, setRevenueList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const period = searchParams.get("period") || "this"; // this | last

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

  const filtered = React.useMemo(() => {
    const now = new Date();
    let m = now.getMonth() + 1;
    let y = now.getFullYear();
    if (period === "last") {
      m = m - 1;
      if (m === 0) {
        m = 12;
        y -= 1;
      }
    }
    return revenueList.filter(
      (r) => Number(r.revenue_month) === m && Number(r.revenue_year) === y,
    );
  }, [period, revenueList]);

  // whenever period or list changes, reset page
  useEffect(() => {
    setPage(1);
  }, [period, revenueList]);

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalPeriodRevenue = filtered.reduce(
    (sum, r) => sum + Number(r.user_revenue ?? 0),
    0,
  );
  const avgRevenue =
    filtered.length > 0 ? totalPeriodRevenue / filtered.length : 0;

  const titleMap: Record<string, string> = {
    this: "This Month",
    last: "Previous Month",
  };

  const periodColorMap: Record<
    string,
    { bg: string; border: string; icon: string }
  > = {
    this: {
      bg: "from-green-50 to-green-100",
      border: "border-green-200",
      icon: "text-green-600",
    },
    last: {
      bg: "from-purple-50 to-purple-100",
      border: "border-purple-200",
      icon: "text-purple-600",
    },
  };

  const currentColor = periodColorMap[period] || periodColorMap.total;

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

          <div
            className={`bg-gradient-to-r ${currentColor.bg} border ${currentColor.border} rounded-2xl p-8 mb-6`}
          >
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                  {titleMap[period] || "Revenue"} Breakdown
                </h1>
                <p className="text-gray-600">
                  Detailed view of your revenue by video
                </p>
              </div>
              <div
                className={`p-3 bg-white rounded-lg shadow-md ${currentColor.icon}`}
              >
                <DollarSign className="w-8 h-8" />
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          {filtered.length > 0 && (
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
                  ${totalPeriodRevenue.toFixed(2)}
                </p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <Play className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-600">
                    Videos
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {filtered.length}
                </p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-600">
                    Average
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  ${avgRevenue.toFixed(2)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 flex flex-col items-center justify-center">
            <div className="w-12 h-12 mb-4 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-gray-600 font-medium">Loading revenue data...</p>
          </div>
        ) : revenueList.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 flex flex-col items-center justify-center border-2 border-dashed border-gray-200">
            <div className="p-4 bg-gray-100 rounded-full mb-4">
              <DollarSign className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              No Revenue Data
            </h3>
            <p className="text-gray-500 text-center max-w-sm">
              Revenue information is not available at this time. Please check
              back later or contact support.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 flex flex-col items-center justify-center border-2 border-dashed border-gray-200">
            <div className="p-4 bg-gray-100 rounded-full mb-4">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              No Entries Found
            </h3>
            <p className="text-gray-500 text-center max-w-sm">
              There are no revenue entries for {titleMap[period].toLowerCase()}.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Video Title
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Video ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Revenue
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paged.map((r, idx) => (
                    <tr
                      key={r.id}
                      className={`transition-colors duration-150 ${
                        idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                      } hover:bg-blue-50`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Play className="w-5 h-5 text-white" />
                          </div>
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {r.video?.title ?? r.title ?? "Untitled"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <code className="text-xs bg-gray-100 text-gray-800 px-3 py-1 rounded font-mono">
                          {r.video?.video_id ?? r.video_id ?? "—"}
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-3 py-1 bg-green-50 text-green-700 rounded-lg font-semibold text-sm">
                          ${Number(r.user_revenue ?? 0).toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pageCount > 1 && (
              <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Showing{" "}
                  <span className="font-semibold text-gray-900">
                    {(page - 1) * PAGE_SIZE + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold text-gray-900">
                    {Math.min(page * PAGE_SIZE, filtered.length)}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-gray-900">
                    {filtered.length}
                  </span>{" "}
                  entries
                </p>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: pageCount }, (_, i) => i + 1).map(
                      (p) => (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`w-10 h-10 rounded-lg font-medium transition-colors duration-200 ${
                            page === p
                              ? "bg-blue-600 text-white"
                              : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {p}
                        </button>
                      ),
                    )}
                  </div>

                  <button
                    onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                    disabled={page >= pageCount}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    Next
                    <ChevronLeft className="w-4 h-4 rotate-180" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RevenueBreakdown;
