/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from "react";
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

const AllUserAccount: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState("");

  const fetchUsers = async () => {
    try {
      const { data } = await Axios_get(
        `${BACKEND_URL}/users/all`,
        UserAuthorization()
      );
      setUsers(data.data || []);
    } catch (error) {
      console.error("Failed to load users", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const columnHelper = createColumnHelper<any>();

  const columns = useMemo(
    () => [
      columnHelper.accessor((row) => `${row.first_name} ${row.last_name}`, {
        id: "name",
        header: "Name",
      }),
      columnHelper.accessor("email", {
        header: "Email",
      }),
      columnHelper.display({
        id: "action",
        header: "Action",
        cell: () => (
          <button className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm shadow">
            Manage
          </button>
        ),
      }),
    ],
    []
  );

  const table = useReactTable({
    data: users,
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
        Loading user accounts...
      </div>
    );

  return (
    <div className="p-6 bg-gradient-to-b from-gray-50 to-gray-200 min-h-screen">
      {/* HEADER */}
      <div className="max-w-4xl mx-auto text-center mt-10 mb-8">
        <h1 className="text-4xl font-extrabold text-gray-800">All Users</h1>
        <p className="text-gray-600 text-lg mt-3">
          Search, sort, and manage useristrator accounts.
        </p>
      </div>

      <div className="max-w-7xl mx-auto bg-white p-8 rounded-2xl shadow border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-700">User List</h2>

          {/* SEARCH INPUT */}
          <input
            type="text"
            placeholder="Search..."
            className="px-4 py-2 border rounded-lg shadow-sm focus:ring focus:ring-gray-300 w-64"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
          />
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse rounded-lg overflow-hidden shadow">
            <thead className="bg-gray-100 text-gray-700 text-sm">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="py-3 px-4 text-left cursor-pointer select-none"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}

                      {/* SORT ICONS */}
                      {{
                        asc: " 🔼",
                        desc: " 🔽",
                      }[header.column.getIsSorted() as string] ?? null}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>

            <tbody className="text-sm text-gray-700">
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b hover:bg-gray-50 transition"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="py-3 px-4">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))}

              {users.length === 0 && (
                <tr>
                  <td colSpan={columns.length} className="text-center py-10">
                    No user accounts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AllUserAccount;
