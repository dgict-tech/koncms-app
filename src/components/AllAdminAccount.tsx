/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BACKEND_URL } from "../services/youtubeAuth.service";
import { UserAuthorization } from "../services/auth";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { Axios_get } from "../services/api";

const AllAdminAccount: React.FC = () => {
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState("");

  const fetchAdmins = async () => {
    try {
      const { data } = await Axios_get(
        `${BACKEND_URL}/all`,
        UserAuthorization()
      );
      setAdmins(data.data || []);
    } catch (error) {
      console.error("Failed to load admins", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const columnHelper = createColumnHelper<any>();

  const navigate = useNavigate();

  const columns = useMemo(
    () => [
      columnHelper.accessor((row) => `${row.first_name} ${row.last_name}`, {
        id: "name",
        header: "Name",
        cell: (info) => {
          const row = info.row.original as any;
          const name = info.getValue() as string;
          const initials = `${(row.first_name || "").charAt(0)}${(
            row.last_name || ""
          ).charAt(0)}`.toUpperCase();
          return (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center font-semibold text-sm">
                {initials || "A"}
              </div>
              <div className="min-w-0">
                <div className="font-medium text-gray-800 truncate">{name}</div>
                <div className="text-xs text-gray-500 truncate">
                  {row.email}
                </div>
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor("email", {
        header: "Email",
        cell: (info) => (
          <div className="text-sm text-gray-600 truncate">
            {info.getValue()}
          </div>
        ),
      }),
      columnHelper.accessor("role", {
        header: "Role",
        cell: (info) => (
          <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-md bg-red-50 text-red-600">
            {String(info.getValue()).replace("_", " ")}
          </span>
        ),
      }),
      columnHelper.display({
        id: "action",
        header: "Action",
        cell: (info) => {
          const row = info.row.original as any;
          if (row.role === "super_admin")
            return <span className="text-xs text-gray-400">—</span>;
          return (
            <button className="inline-flex items-center gap-2 border border-red-100 text-red-600 px-3 py-1 rounded-md text-sm hover:bg-red-50 transition">
              Manage
            </button>
          );
        },
      }),
    ],
    [columnHelper]
  );

  const table = useReactTable({
    data: admins,
    columns,
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (loading)
    return (
      <div className="text-center py-10 text-gray-600 animate-pulse">
        Loading admin accounts...
      </div>
    );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* HEADER */}
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-10 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-800">
            All Admins
          </h1>
          <p className="text-gray-600 text-sm sm:text-base mt-1">
            Search, sort, and manage administrator accounts.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
          <div className="relative w-full sm:w-auto">
            <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search admins by name or email"
              className="pl-10 pr-4 py-2 rounded-full border border-gray-200 bg-white shadow-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-red-200"
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
            />
          </div>

          <button
            type="button"
            onClick={() => navigate("/account/new-admin")}
            className="inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow w-full sm:w-auto"
          >
            Add Admin
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto bg-white p-6 sm:p-8 rounded-2xl shadow-md ring-1 ring-gray-100">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-700">Admin List</h2>
        </div>

        {/* DESKTOP TABLE */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full w-full table-auto">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="bg-gray-50">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider select-none cursor-pointer"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-2">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        <span className="text-gray-400 text-xs">
                          {{ asc: "▲", desc: "▼" }[
                            header.column.getIsSorted() as string
                          ] ?? ""}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>

            <tbody className="bg-white divide-y divide-gray-100 text-sm text-gray-700">
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="bg-white hover:bg-red-50 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="py-3 px-4 align-top">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))}

              {admins.length === 0 && (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="text-center py-10 text-gray-500"
                  >
                    No admin accounts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* MOBILE CARDS */}
        <div className="md:hidden grid grid-cols-1 gap-4">
          {table.getRowModel().rows.map((row) => {
            const original = row.original as any;
            return (
              <div
                key={row.id}
                className="bg-white p-4 rounded-lg shadow-sm ring-1 ring-gray-100"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center font-semibold text-base">
                    {(
                      (original.first_name || "").charAt(0) +
                      (original.last_name || "").charAt(0)
                    ).toUpperCase() || "A"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium text-gray-800 truncate">
                        {original.first_name} {original.last_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {original.role?.replace("_", " ")}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 truncate mt-1">
                      {original.email}
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      {original.role !== "super_admin" && (
                        <button className="inline-flex items-center gap-2 border border-red-100 text-red-600 px-3 py-1 rounded-md text-sm hover:bg-red-50 transition">
                          Manage
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {admins.length === 0 && (
            <div className="text-center py-10 text-gray-500">
              No admin accounts found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AllAdminAccount;
