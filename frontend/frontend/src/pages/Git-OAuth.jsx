import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { notifyAuthChange } from "../utils/Authentication";
import api from "../api"

function GitOAuth() {
      const navigate = useNavigate();
      console.log("GitOAuth component mounted");
      useEffect(() => {
            const params = new URLSearchParams(window.location.search);
            const code = params.get("code");
            console.log("GitHub OAuth code:", code);
            let ignore = false;
            if (code) {
                  if (!ignore) { // Prevent multiple fetches
                        async function fetchData() {
                              try {
                                    const response = await api.post("api/github/callback/", { code });
                                    localStorage.setItem('github_authenticated', response.data.is_github_connected);
                                    navigate("/githome");
                              } catch (error) {
                              console.error("GitHub OAuth error:", error);
                              notifyAuthChange(false);
                              }
                  }
                  fetchData();
            }
            return () => {
                  ignore = true; // Cleanup function to prevent state updates on unmounted component
            };
            }
      }, []);

      return <div className="text-white text-center mt-10">Authenticating...</div>;
}; 


export default GitOAuth;