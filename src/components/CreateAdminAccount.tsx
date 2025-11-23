/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import type { AccountSetUpProps } from "../pages/admin/Dashboard";
import { BACKEND_URL } from "../services/youtubeAuth.service";
import { UserAuthorization } from "../services/auth";
import { Axios_post } from "../services/api";

const CreateAdminAccount: React.FC<AccountSetUpProps> = ({ user }) => {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    role: "admin",
    phone_number: "",
    email: "",
    password: "",
    cpassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  if (user == "null" || user == null) return <></>;

  const showAlert = (type: "success" | "error", text: string) => {
    setAlert({ type, text });
    setTimeout(() => setAlert(null), 4000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.cpassword !== form.password) {
      showAlert("error", "Password Not The Same!");
      return;
    }

    setLoading(true);
    setAlert(null);

    try {
      await Axios_post(`${BACKEND_URL}/register`, form, UserAuthorization());

      showAlert("success", "Admin account created successfully!");

      setForm({
        first_name: "",
        last_name: "",
        phone_number: "",
        role: "admin",
        email: "",
        password: "",
        cpassword: "",
      });
    } catch (err: any) {
      showAlert(
        "error",
        err.response?.data?.message || "Something went wrong!"
      );
    }

    setLoading(false);
  };

  return (
    <div className="p-6 bg-gradient-to-b from-gray-50 to-gray-200 min-h-screen">
      {/* BEAUTIFUL INTRO TEXT */}
      <div className="max-w-3xl px-3  mx-auto text-center  mt-10 mb-8 animate-fade-in">
        <h1 className="text-2xl font-extrabold text-red-500 tracking-tight">
          Admin Account Setup
        </h1>
        <p className="text-gray-600 mt-3 text-md">
          You can create an admin account here to manage your connected YouTube
          channels, monitor performance, and customize platform settings
          effortlessly.
        </p>
      </div>

      {/* ALERT */}
      {alert && (
        <div
          className={`fixed top-6 right-6 shadow-xl rounded-lg px-5 py-4 text-white text-sm animate-fade-in-up backdrop-blur-md
          ${alert.type === "success" ? "bg-green-600" : "bg-red-600"}`}
        >
          {alert.text}
        </div>
      )}

      {/* FORM CARD */}
      <div className="max-w-3xl mx-auto mt-6 bg-white p-10 rounded-2xl shadow-xl border border-gray-100">
        <h2 className="text-3xl font-bold mb-8 text-gray-800  text-center racking-tight">
          Create Admin Account
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {[
            { name: "first_name", label: "First Name" },
            { name: "last_name", label: "Last Name" },
            {
              name: "phone_number",
              label: "Phone Number",
              placeholder: "+2348012345678",
            },
            { name: "email", label: "Email", type: "email" },
            { name: "password", label: "Password", type: "password" },
            { name: "cpassword", label: "Confirm Password", type: "password" },
          ].map((input) => (
            <div className="relative group" key={input.name}>
              <input
                type={input.type || "text"}
                name={input.name}
                value={(form as any)[input.name]}
                onChange={handleChange}
                placeholder={input.placeholder || ""}
                required
                className="
                  w-full border border-gray-300 rounded-lg p-4 text-sm
                  transition-all duration-300 bg-white shadow-sm
                  focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400
                  group-hover:border-red-300
                "
              />
              <label
                className="
                  absolute -top-3 left-3 bg-white px-2 text-xs font-medium text-gray-600
                "
              >
                {input.label}
              </label>
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="
              w-full py-4 rounded-lg bg-red-600 text-white font-semibold text-lg
              transition-transform duration-200 hover:bg-red-700 active:scale-95
              disabled:bg-gray-400 shadow-md
            "
          >
            {loading ? "Creating..." : "Create Admin"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateAdminAccount;
