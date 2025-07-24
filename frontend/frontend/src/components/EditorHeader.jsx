import Button from "./Button";
import { FaSearch } from "react-icons/fa";
import ai from "../assets/icons8-ai-48.png";
import { profile } from "./OAuthcallback";


export default function EditorHeader() {
  return (
    <header className="w-full flex items-center justify-between bg-[#101114] px-4 py-1 shadow-md border-b border-slate-700">


      {/* Center Navigation */}
      <nav className="flex gap-6 text-slate-300 text-sm">
        <button className="flex items-center px-3 py-1.5 text-sm text-white bg-[#2c3e50] hover:bg-[#34495e] rounded-md shadow-sm backdrop-blur-md border border-slate-600 transition-all">File</button>
        <button className="hover:text-white transition">Edit</button>
        <button className="hover:text-white transition">Run</button>
        <button className="hover:text-white transition">Format</button>
        <button className="hover:text-white transition">Settings</button>
      </nav>

      <div className="flex items-center gap-3">
      <button className="text-white p-2 hover:bg-slate-700 rounded-md">
              <FaSearch className="w-4 h-4" />
      </button>
        <Button  icon ={ai} className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-md text-white text-sm font-medium">
          Generate
        </Button>
        <img
          src={profile.profilePic || "https://via.placeholder.com/150"}
          alt="Profile"
          className="w-7 h-7 rounded-full border border-slate-400"
        />
      </div>
    </header>
  );
}