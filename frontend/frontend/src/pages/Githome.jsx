// src/pages/Home.jsx
import { FaGithub } from 'react-icons/fa';
import Giticon from '../assets/giticon.png';
import RepoCard from '../components/Repocard';
import api from '../api';
import { useEffect, useState } from 'react';
import { OrbitProgress } from 'react-loading-indicators';


const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID;

const Githome = () => {

  const [gitauth,setGitauth] = useState(false);
  const [repos, setRepos] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const handleGitHubLogin = () => {
    const redirectUri = 'http://localhost:5173/oauth/github/callback/';
    const scope = 'repo read:user';
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${redirectUri}&scope=${scope}`;
  };
  

  useEffect(() => {
    const is_authenticated = () => {
      setGitauth(localStorage.getItem('github_authenticated') === 'true');
    };
    is_authenticated();
  }, []);

  useEffect(() => {
    if (!gitauth) return;

    const fetchRepositories = async () => {
      setLoading(true);
      try {
        const response = await api.get('api/code/get/repositories/');
        if (response.status === 200) {
          setRepos(response.data);
          if (import.meta.env.DEV) {
            console.log(response.data);
          }
        } else {
          throw new Error("Failed to fetch repositories");
        }
      } catch (error) {
        console.error("Error fetching repositories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRepositories();
  }, [gitauth]);




  const filteredRepos = Object.values(repos).filter(repo =>
    repo.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repo.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    !gitauth ? (
      <div className='min-h-screen flex items-center justify-center text-white font-sans' style={{ overflowY: 'auto' }}>
        <div className="max-w-md space-y-6 flex flex-col items-center justify-center">
          <h1 className="text-5xl font-bold leading-tight text-center">
              AI-Driven Docstring Magic ✨
          </h1> 
          <p className="text-gray-400 text-lg text-center">
            Connect your GitHub repo and let our AI document your legacy code like poetry.
          </p>
          <button
            onClick={handleGitHubLogin}
            className="flex items-center gap-3 bg-white text-black px-6 py-3 rounded-full shadow-lg hover:scale-105 transition-transform duration-200"
          >
          <FaGithub className="text-xl" />
          <span>Login with GitHub</span>
          </button>
        </div>
        <div className="w-[40%] flex items-center justify-center">
          <img
          src={Giticon}
          alt="AI Doc Writer Illustration"
          className="w-full opacity-90 mix-blend-lighten drop-shadow-[0_0_1rem_#3b82f6] transform transition-transform duration-500 backdrop-blur-lg"
        /></div>
      </div>
    ) : (
      <div className="w-full flex flex-col mx-26 items-center justify-top" style={{ minHeight: '100vh', overflowY: 'auto' }}>
        <div className="flex items-center mt-10 mb-4 space-x-4">
          <img src={Giticon} alt="GitHub Icon" className="w-16 h-16 mb-1" />
          <h1 className="text-6xl font-bold item-center text-white ">GitHub Repositories</h1>
        </div>
        <p className="text-lg text-slate-300 mt-2">Explore your connected repositories and insights</p>
        <div className="mt-10 mb-4 flex-row space-y-6 sm:gap-4 justify-between items-center">
          <input 
            type="text"
            placeholder="Search by repo name or description..."
            className="w-[290px] sm:w-[100%] bg-[#1e293b] text-white placeholder-slate-400 border border-slate-600 rounded-xl px-4 py-4"
            onChange={(e) => setSearchTerm(e.target.value)}
            value={searchTerm}
          />
        </div>
        <div className="w-full flex items-center  sm:grid-cols-2 justify-center mt-4">
          <div className="w-full grid sm:w-[90%] sm:grid-cols-4 gap-6 mt-8 px-4">
            {loading ? (
              <OrbitProgress dense color="gray" size="small" text="" textColor="" />
            ) : filteredRepos.length > 0 ? (
              filteredRepos.map((repo, index) => (
                <RepoCard key={index} repo={repo} />
              ))
            ) : (
              <div className="border border-slate-700  rounded-xl p-4 bg-[#1e293b] hover:bg-[#334155] transition-colors duration-200 shadow-lg">
              <p className="text-white text-center ">No repositories found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  );
};

export default Githome;