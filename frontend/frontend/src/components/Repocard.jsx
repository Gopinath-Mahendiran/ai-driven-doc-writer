import { MdStar } from "react-icons/md";
import { GoRepoForked } from "react-icons/go";
import { HiOutlineExternalLink } from "react-icons/hi";
import { Link } from "react-router-dom";

function RepoCard({ repo }) {
  return (
    <Link to={`/editor/${repo.name}`} className="no-underline text-white" onClick={() => {
      localStorage.removeItem('tabList');
      localStorage.setItem('selectedFile', null);
      localStorage.setItem('repoName', repo.name);
    }}>
      <div className="border border-slate-700  rounded-xl p-4 bg-[#1e293b] hover:bg-[#334155] transition-colors duration-200 shadow-lg">
        <h3 className="relative text-lg font-semibold mt-2 py-1">{repo.name}</h3>
        <p className="relative text-sm text-slate-300">{repo.description || "No description"}</p>
        <div>
          <div className="flex flex-row justify-between items-center mt-2">
                  <div className="flex flex-row gap-2">
                  <span className="text-sm text-slate-300">
                        <MdStar className="inline mr-1" />
                        {repo.stars} 
                  </span>
                  <span className="text-sm text-slate-300">
                        <GoRepoForked className="inline mr-1" />
                        {repo.forks} 
                  </span>
                  </div>
                 
            </div>
      </div>
    </div>
</Link>
  );
}


export default RepoCard;