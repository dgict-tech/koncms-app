/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  BACKEND_URL,
  youtubeAuthService,
} from "../services/youtubeAuth.service";
import { Axios_get, Axios_post } from "../services/api";
import { UserAuthorization } from "../services/auth";
import { useAuth } from "../hooks/useAuth";

const ManageAdminAccount: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuth();

  const [admin, setAdmin] = useState<any>(null);
  const [availableChannels, setAvailableChannels] = useState<any[]>([]);
  const [assignedChannelIds, setAssignedChannelIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
        setAdmin(adminResp.data || adminResp);

        // Try to fetch available channels from backend first
        try {
          const { data: chResp } = await Axios_get(
            `${BACKEND_URL}/channels`,
            UserAuthorization()
          );
          setAvailableChannels(chResp.data || chResp || []);
        } catch (err) {
          console.log(err);
          // Fallback to local stored channels via youtubeAuthService
          const local = await youtubeAuthService.getStoredChannels(user);
          setAvailableChannels(local || []);
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
  }, [id, user]);

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

  const toggleChannel = (channelId: string) => {
    setAssignedChannelIds((prev) =>
      prev.includes(channelId)
        ? prev.filter((p) => p !== channelId)
        : [...prev, channelId]
    );
  };

  const save = async () => {
    if (!id) return;
    setSaving(true);
    try {
      // Send assigned channel ids to backend. Adjust endpoint to match your API.
      await Axios_post(
        `${BACKEND_URL}/assign-channels/${id}`,
        { channelIds: assignedChannelIds },
        UserAuthorization()
      );
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
        <div className="flex items-center justify-between mb-6">
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
            <div className="mb-4">
              <h3 className="font-medium text-gray-700">
                {admin?.first_name} {admin?.last_name}
              </h3>
              <div className="text-sm text-gray-500">{admin?.email}</div>
            </div>

            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                Available Channels
              </h4>
              {availableChannels.length === 0 ? (
                <div className="text-sm text-gray-500">
                  No channels available.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {availableChannels.map((ch: any) => {
                    const chId = ch.channelId ?? ch.id ?? ch;
                    const title =
                      ch.channelTitle ??
                      ch.title ??
                      ch.snippet?.title ??
                      ch.channelTitle;
                    return (
                      <label
                        key={chId}
                        className="flex items-center gap-3 p-3 border rounded-md"
                      >
                        <input
                          type="checkbox"
                          checked={assignedChannelIds.includes(chId)}
                          onChange={() => toggleChannel(chId)}
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-800">
                            {title}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {chId}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={save}
                disabled={saving}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
              >
                {saving ? "Saving…" : "Save Assignments"}
              </button>
              <button
                onClick={() => navigate("/account/all-admin")}
                className="text-sm text-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageAdminAccount;
