import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { youtubeAuthService } from "../services/youtubeAuth.service";
 

export default function GoogleCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const code = params.get("code");

    if (!code) {
      navigate("/account/dashboard");
      return;
    }

    const exchangeCode = async () => {
      try {
        const res = await youtubeAuthService.exchangeCodeForTokens(code);
        youtubeAuthService.saveChannel(res)
        console.log("YouTube tokens saved:", res);
        alert("YouTube account connected successfully!");
      } catch (err) {
        console.error("Error exchanging OAuth code:", err);
        // alert("Failed to connect YouTube account");
      } finally {
        navigate("/account/dashboard");
      }
    };

    exchangeCode();
  }, [params, navigate]);

  return <p>Connecting your YouTube account...</p>;
}
