import { useState, useEffect } from 'react';
import Button from '../Button';
import { FaGithub } from "react-icons/fa";
import { IoIosGitBranch } from "react-icons/io";
import { TbFileDescription } from "react-icons/tb";

function parseGithubUrl(url) {
  // Extract owner and repo from GitHub URL
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)(\.git)?/);
  if (match) {
    return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
  }
  return null;
}

export default function PopupForm({onClick}) {
  const [showForm, setShowForm] = useState(false);
  const [gitLink, setGitLink] = useState('');
  const [branch, setBranch] = useState('');
  const [description, setDescription] = useState('');
  const [requestStatus, setRequestStatus] = useState(null); // null = untouched, true = valid, false = invalid
  const [validating, setValidating] = useState(false);

  // Validate repo when gitLink changes
  useEffect(() => {
    if (!gitLink) {
      setRequestStatus(null);
      return;
    }
    const validateRepo = async () => {
      setValidating(true);
      const parsed = parseGithubUrl(gitLink);
      if (!parsed) {
        setRequestStatus(false);
        setValidating(false);
        return;
      }
      const { owner, repo } = parsed;
      try {
        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
        setRequestStatus(response.status === 200);
      } catch (error) {
        setRequestStatus(false);
      } finally {
        setValidating(false);
      }
    };
    validateRepo();
  }, [gitLink]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!requestStatus) return; // Prevent submit if repo is invalid
    // Use gitLink, branch, description as needed (e.g., send to API)
    setShowForm(false);
  };

  return (
    <div className="relative z-10">
      <div className="flex justify-center">
        <Button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700"
        >
          + New Project
        </Button>
      </div>

      {showForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-10">
          <div className="bg-white dark:bg-gray-900 text-black dark:text-white p-6 rounded-xl max-w-md w-full shadow-lg relative">
            <button
              onClick={() => setShowForm(false)}
              className="absolute top-2 right-3 text-lg text-gray-600 dark:text-gray-300 hover:text-red-500"
            >
              &times;
            </button>
            <h2 className="text-xl font-semibold mb-4">Popup Form</h2>

            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <label className='p-1 text-sm flex items-center'><FaGithub />GitHub Repository Link:</label>
              <input
                type="text"
                placeholder="e.g., https://github.com/user/repo"
                value={gitLink}
                onChange={e => setGitLink(e.target.value)}
                className="p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
                required
              />
              {gitLink && (
                validating ? (
                  <p className='text-blue-500 text-sm'>Validating...</p>
                ) : requestStatus === true ? (
                  <p className='text-green-500 text-sm'>Valid Repository</p>
                ) : requestStatus === false ? (
                  <p className='text-red-500 text-sm'>Invalid Repository</p>
                ) : null
              )}

              <label className='p-x-2 text-sm flex items-center'><IoIosGitBranch />Branch:</label>
              <input
                type='text'
                placeholder='e.g., main or master'
                value={branch}
                onChange={e => setBranch(e.target.value)}
                className='p-2 border rounded dark:bg-gray-800 dark:border-gray-700'
                required
              />
              <label className='p-1 text-sm flex items-center'><TbFileDescription /> Description:</label>
              <textarea
                placeholder="About the project"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
                required
              />
              <Button
                containerClassName="self-center disabled:bg-gray-400"
                type="submit"
                disabled={
                  !requestStatus ||
                  validating ||
                  !gitLink ||
                  !branch ||
                  !description
                }
                onClick={onClick}
              >
                Submit
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}