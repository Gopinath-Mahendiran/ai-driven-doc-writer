import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import api from "../api"
import { useState,useEffect } from "react";
import { ACCESS_TOKEN,REFRESH_TOKEN } from "../constants";

function ProtectedRoute({ children }) {
      const [isAuthorized, setIsAuthorized] = useState(null);

      useEffect(() => {
            auth().catch(() => setIsAuthorized(false))
      },[])

      const refreshToken = async () => {
            const refresh = localStorage.getItem(REFRESH_TOKEN)
            try{
                  const res = await api.post("/api/token/refresh/",{refresh : refresh}) ;
                  if (res.status == 200 ){
                        localStorage.setItem(ACCESS_TOKEN ,res.data.access )
                  }
            }catch(error){
                  console.log(error);
                  setIsAuthorized(false)
            }
      }
      const auth = async () =>{
            const token = localStorage.getItem(ACCESS_TOKEN);
            if (!token) {
                  setIsAuthorized(false);
                  return;
            }
            const decoded = jwtDecode(token);
            const tokenExpiry = decoded.exp ;
            const now  = Date.now() / 1000;
            if (tokenExpiry < now) {
                  try {
                        await refreshToken();
                        setIsAuthorized(true);
                  } catch (error) {
                        setIsAuthorized(false);
                        return;
                  }
            }
            else {
                  setIsAuthorized(true);
            }

      }

      if (isAuthorized === null) {
        return <div>Loading...</div>;
      }

      return isAuthorized ? children : <Navigate to="/signin" />;
}export default ProtectedRoute;