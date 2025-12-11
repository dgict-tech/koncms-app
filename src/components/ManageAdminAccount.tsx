/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  BACKEND_URL,
  youtubeAuthService,
} from "../services/youtubeAuth.service";
import {
  assignChannelToAdmin,
  removeChannelFromAdmin,
  Axios_get,
} from "../services/api";
import { UserAuthorization } from "../services/auth";
import { useAuth } from "../hooks/useAuth";

const ManageAdminAccount: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuth();
  const authUserId = user?.user?.id ?? null;

  const [admin, setAdmin] = useState<any>(null);
  const [availableChannels, setAvailableChannels] = useState<any[]>([]);
  const [assignedChannelIds, setAssignedChannelIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [itemLoading, setItemLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      try {
        // Fetch admin details (adjust endpoint if your API differs)
        const { data: adminResp } = await Axios_get(
          `${BACKEND_URL}/${id}`,
          UserAuthorization()
        );

        // Normalize backend profile shape — some APIs return `data` with fields like `full_name`.
        const rawProfile = adminResp.data || adminResp;
        const fullName: string =
          rawProfile?.full_name ?? rawProfile?.fullName ?? "";
        const [firstFromFull, ...rest] = fullName ? fullName.split(" ") : [""];
        const normalizedAdmin = {
          id: rawProfile?.id ?? rawProfile?._id ?? id,
          first_name:
            rawProfile?.first_name ?? rawProfile?.firstName ?? firstFromFull,
          last_name:
            rawProfile?.last_name ?? rawProfile?.lastName ?? rest.join(" "),
          email: rawProfile?.email ?? rawProfile?.user?.email ?? "",
          role: rawProfile?.role ?? rawProfile?.user?.role ?? "admin",
          raw: rawProfile,
        };

        setAdmin(normalizedAdmin);

        // Try to fetch available channels from backend first
        try {
          const { data: chResp } = await Axios_get(
            `${BACKEND_URL}/get-auth-channel/${authUserId}`,
            UserAuthorization()
          );

          const raw = chResp.data || chResp || [];
          // normalize channel objects to { channelId, channelTitle, thumbnail }
          const normalized = raw.map((c: any) => ({
            channelId: c.channelId ?? c.id ?? c._id ?? c,
            channelTitle:
              c.channelTitle ??
              c.title ??
              c.snippet?.title ??
              c.name ??
              "Untitled",
            thumbnail:
              c.thumbnail ??
              c.snippet?.thumbnails?.default?.url ??
              c.thumbnail_url ??
              "",
            raw: c,
          }));
          setAvailableChannels(normalized);
        } catch (err) {
          console.log(err);
          // Fallback to local stored channels via youtubeAuthService
          const local = await youtubeAuthService.getStoredChannels();
          const normalized = (local || []).map((c: any) => ({
            channelId: c.channelId ?? c.id ?? c,
            channelTitle:
              c.channelTitle ?? c.title ?? c.channelTitle ?? "Untitled",
            thumbnail: c.thumbnail ?? "",
            raw: c,
          }));
          setAvailableChannels(normalized || []);
        }

        // Get assigned channels for this admin if endpoint exists
        try {
          const { data: assigned } = await Axios_get(
            `${BACKEND_URL}/channels/${id}`,
            UserAuthorization()
          );
          const ids = (assigned.data || assigned || []).map(
            (c: any) => c.channelId || c.id || c
          );
          setAssignedChannelIds(ids);
        } catch (err) {
          console.log(err);
          // no assigned list available; leave empty
        }
      } catch (err) {
        console.error("Failed to load admin or channels", err);
      } finally {
        setLoading(false);
      }
    };

    load();
    // Depend on `id` and the primitive user id so the effect doesn't rerun
    // when the `user` object identity changes on every render.
  }, [id, authUserId]);

  if (!user || user === "null") return null;

  if (user.user.role !== "super_admin") {
    return (
      <div className="p-6">
        <h2 className="text-lg font-semibold">Access denied</h2>
        <p className="text-sm text-gray-600">
          Only super admins can manage other admins.
        </p>
      </div>
    );
  }

  // NOTE: per-channel add/remove is handled via API calls in the UI below.

  const save = async () => {
    if (!id) return;
    setSaving(true);
    try {
      // Send assigned channel ids to backend. Adjust endpoint to match your API.
      // await Axios_post(
      //   `${BACKEND_URL}/assign-channels/${id}`,
      //   { channelIds: assignedChannelIds },
      //   UserAuthorization()
      // );
      // Optionally navigate back to list
      navigate("/account/all-admin");
    } catch (err) {
      console.error("Failed to assign channels", err);
      alert("Failed to save channel assignments. Check console for details.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-2xl shadow ring-1 ring-gray-100">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Manage Admin
            </h2>
            <p className="text-sm text-gray-500">
              Assign channels and permissions to this admin.
            </p>
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
            <div className="mb-6 mt-8 bg-gray-100 p-4 rounded-2xl flex items-center gap-6 border border-gray-100 shadow-sm">
              <div className="shrink-0 w-20 h-20 border border-gray-300 bg-red-50 rounded-full flex items-center justify-center text-2xl font-semibold text-red-600">
                {admin?.first_name?.[0] ?? admin?.firstName?.[0] ?? "A"}
              </div>

              <div className="mb-4">
                <h3 className="font-medium text-2xl text-gray-800">
                  {admin?.first_name ?? admin?.firstName ?? "Unknown"}{" "}
                  {admin?.last_name ?? admin?.lastName ?? ""}
                </h3>
                <div className="text-sm text-gray-600">{admin?.email}</div>
                <div className="mt-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                    Role: {admin?.role ?? admin?.user?.role ?? "admin"}
                  </span>
                </div>
              </div>
            </div>

            <div className="mb-4 mt-10">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                Available Channels
              </h4>
              {availableChannels.length === 0 ? (
                <div className="text-sm text-gray-500">
                  No channels available.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {availableChannels.map((ch: any) => {
                    const chId = ch.channelId;
                    const title = ch.channelTitle ?? ch.title ?? "Untitled";
                    const thumb =
                      ch.thumbnail ||
                      ch.raw?.snippet?.thumbnails?.default?.url ||
                      "";

                    const isAssigned = assignedChannelIds.includes(chId);

                    const handleAssignToggle = async () => {
                      if (!id) return;
                      setItemLoading((s) => ({ ...s, [chId]: true }));
                      try {
                        if (!isAssigned) {
                          await assignChannelToAdmin(
                            id,
                            chId,
                            UserAuthorization()
                          );
                          setAssignedChannelIds((prev) =>
                            Array.from(new Set([...prev, chId]))
                          );
                        } else {
                          await removeChannelFromAdmin(
                            id,
                            chId,
                            UserAuthorization()
                          );
                          setAssignedChannelIds((prev) =>
                            prev.filter((c) => c !== chId)
                          );
                        }
                      } catch (err) {
                        console.error("Failed to update assignment", err);
                        alert(
                          "Failed to update assignment. See console for details."
                        );
                      } finally {
                        setItemLoading((s) => ({ ...s, [chId]: false }));
                      }
                    };

                    return (
                      <div
                        key={chId}
                        className="bg-white rounded-lg p-3 shadow-md flex flex-col ring-1 ring-gray-100"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <img
                            src={thumb || "/icon2.png"}
                            alt={title}
                            className="w-14 h-14 rounded-md object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-800 truncate">
                              {title}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {chId}
                            </div>
                          </div>
                        </div>

                        <div className="mt-auto flex items-center justify-between gap-2">
                          <div>
                            {isAssigned ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Assigned
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                Not assigned
                              </span>
                            )}
                          </div>
                          <button
                            onClick={handleAssignToggle}
                            disabled={!!itemLoading[chId]}
                            className={`px-3 py-1 rounded-md text-sm font-medium ${
                              isAssigned
                                ? "bg-white border border-red-200 text-red-600 hover:bg-red-50"
                                : "bg-red-600 text-white hover:bg-red-700"
                            }`}
                          >
                            {itemLoading[chId]
                              ? "…"
                              : isAssigned
                              ? "Remove"
                              : "Add"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6 mb-6">
              <button
                onClick={save}
                disabled={saving}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
              >
                {saving ? "Saving…" : "Save Assignments"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageAdminAccount;
