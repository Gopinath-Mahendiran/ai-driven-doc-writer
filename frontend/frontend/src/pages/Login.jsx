import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { notifyAuthChange } from "../utils/Authentication";
import Button from "../components/Button";
import { ACCESS_TOKEN,REFRESH_TOKEN } from "../constants";
import { FcGoogle } from "react-icons/fc";



const Signin = () => {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [token, setToken] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
  `client_id=${import.meta.env.VITE_GOOGLE_CLIENT_ID}` +
  `&redirect_uri=${import.meta.env.VITE_GOOGLE_REDIRECT_URI}` +
  `&response_type=code` +
  `&scope=openid%20email%20profile` +
  `&access_type=offline`;

  
  // Remove automatic redirect, only trigger on button click
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const response = await api.post("api/token/", form);
      setToken(response.data.access);
      localStorage.setItem(ACCESS_TOKEN, response.data.access);
      localStorage.setItem(REFRESH_TOKEN, response.data.refresh);
      notifyAuthChange();
      navigate("/");
    } catch (err) {
      const msg = err.response?.data?.detail || "Login failed. Try again.";
      setError(msg);
    }
  };


  return (
    <div className="item-center max-w-md mx-auto mt-30 bg-gray-900 text-white p-12 rounded-xl shadow-lg">
      <div>
      <h2 className="text-2xl font-bold mb-4  primary-font">Sign In</h2>
      {/* Inserted line below */}
      <div className="mb-4 text-gray-400 text-sm">Please enter your credentials to continue</div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="username"
          value={form.username}
          onChange={handleChange} 
          placeholder="   Username"
          className="w-full p-2 bg-gray-800 rounded-full primary-font"
        />
        <input
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          placeholder="   Password"
          className="w-full p-2 bg-gray-800 rounded-full primary-font"
        />
        <div className="flex justify-center">
        <Button
          onClick={handleSubmit}
          children={"Sign in"}>
        
        </Button>
        </div>
        <div className="flex items-center my-4">
          <hr className="flex-grow border-gray-700" />
          <span className="mx-2 text-gray-400 text-xs">or</span>
          <hr className="flex-grow border-gray-700" />
        </div>
      </form>
      </div>
      <div>
        <button onClick={() => window.location.href = googleAuthUrl} className="w-full mt-4">
          <div className="rounded-full flex justify-center border-2 border-gray-600 p-2 px-5 py-5 hover:bg-gray-800 transition-colors duration-300">
            <FcGoogle className="w-6 h-6" />
            <span className="ml-2 py-0">Sign in with Google</span>
          </div>
        </button>
      </div>


      {error && <div className="mt-4 text-red-400">{error}</div>}
      {token && (
        <div className="mt-4 p-2 bg-black rounded text-green-400 break-all">
          ✅ Access token: <br /> {token}
        </div>
      )}
    </div>
  );
};

export default Signin;