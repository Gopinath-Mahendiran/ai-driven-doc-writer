import { useEffect ,useRef} from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import { notifyAuthChange } from "../utils/Authentication";

const OAuthCallback = ({}) => {
  const navigate = useNavigate();
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return; // Prevent multiple fetches
    hasFetched.current = true;
    const fetchTokens = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      if (!code) {
        console.error("No code found in URL");
        return;
      }

      try {
        const response = await axios.post(`http://localhost:8000/api/auth/callback/?code=${code}`);

        localStorage.setItem(ACCESS_TOKEN, response.data.access);
        localStorage.setItem(REFRESH_TOKEN, response.data.refresh);
        notifyAuthChange();
        navigate("/" );
      } catch (err) {
        console.error("Failed to exchange code for tokens:", err.response?.data || err);
      }
    };

    fetchTokens();
  }, [navigate]);

  return <div className="text-white text-center mt-10">Authenticating...</div>;
};

export default OAuthCallback;