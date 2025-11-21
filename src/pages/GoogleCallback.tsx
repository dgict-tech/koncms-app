import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { youtubeAuthService } from "../services/youtubeAuth.service";

export default function GoogleCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    const code = params.get("code");

    if (!code) {
      navigate("/account/dashboard");
      return;
    }

    const exchangeCode = async () => {
      try {
        const tokenResponse = await youtubeAuthService.exchangeCodeForTokens(code);
        console.log("YouTube tokens received:", tokenResponse);

        if (tokenResponse.access_token) {
          await youtubeAuthService.authenticateToken(tokenResponse.access_token);

          setAlert({
            type: "success",
            message: "Your YouTube account has been successfully connected!",
          });
        } else {
          console.error("No access_token returned:", tokenResponse);
          setAlert({
            type: "error",
            message: "Failed to authenticate YouTube account.",
          });
        }
      } catch (err) {
        console.error("Error exchanging OAuth code:", err);
        setAlert({
          type: "error",
          message: "Failed to connect YouTube account.",
        });
      } finally {
        setTimeout(() => navigate("/account/dashboard"), 2500);
      }
    };

    exchangeCode();
  }, [params, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      {/* Alert */}
      {alert && (
        <div
          className={`fixed top-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl text-white shadow-lg
          animate-fade-in 
          ${alert.type === "success" ? "bg-green-600" : "bg-red-600"}`}
        >
          {alert.message}
        </div>
      )}

      {/* Loader Card */}
      <div className="flex flex-col items-center text-center p-8 bg-white shadow-md rounded-2xl animate-fade-in">
        {/* YouTube Logo */}
        <div className="w-20 h-20 mb-6">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/b/b8/YouTube_Logo_2017.svg"
            alt="YouTube"
            className="w-full h-full animate-pulse"
          />
        </div>

        {/* Spinner */}
        <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4"></div>

        {/* Text */}
        <h2 className="text-xl font-semibold text-gray-700">
          Connecting to your YouTube account...
        </h2>
        <p className="text-gray-500 mt-2 text-sm max-w-xs">
          Please wait while we authenticate your Google account.
        </p>
      </div>

      {/* Tailwind Animations */}
      <style>
        {`
          .animate-fade-in {
            animation: fadeIn 0.6s ease-in-out;
          }

          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
    </div>
  );
}
