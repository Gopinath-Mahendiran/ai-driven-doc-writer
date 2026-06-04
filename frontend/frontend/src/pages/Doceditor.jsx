import { useState,useEffect,useId, useRef } from "react";
import { useParams } from "react-router-dom";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import FileTree from "../components/FileTree";
import Editor from "../components/Editor";
import { GoSidebarCollapse ,GoSidebarExpand } from "react-icons/go";
import convertToNestedTree from '../utils/convetToNestedTree';
import api from "../api";
import { set as idbSet, get as idbGet, clear as idbClear, set } from 'idb-keyval';
import CustomizationPanel from "../components/CustomizationPAnel";
import SymbolSheet from "../components/SymbolSheet";
import { IoIosArrowDown } from "react-icons/io";
import Button from "../components/Button";
import { SiGooglegemini } from "react-icons/si";
import { FiGitBranch } from "react-icons/fi";
import CodeLoader from "../components/CodeLoader";

function Start() {
  const [showSidebar, setShowSidebar] = useState(true);
  const {repoName} = useParams();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [tabList, setTabList] = useState([]);
  const [fileContent, setFileContent] = useState("");
  const [symbols, setSymbols] = useState();
  const [showLoader, setShowLoader] = useState(true);
  const [showcustomizationpanel,setshowcustomizationpanel] = useState(false)
  const [generatedCode, setGeneratedCode] = useState("");
  const [isCommitting, setIsCommitting] = useState(false);
  const [commitMessage, setCommitMessage] = useState("");
  const [customizationOptions, setCustomizationOptions] = useState({
    docStyle: "PEP257",
    verbosity: "Minimal",
    audience: "Beginner",
    tone: "Neutral (default)",
    purpose: "Beginner",
  });
  const [goToLineNumber, setGoToLineNumber] = useState();


  // For scrolling FileTree aside to bottom when files change
  const fileTreeRef = useRef(null);
  useEffect(() => {
    if (fileTreeRef.current) {
      fileTreeRef.current.scrollTop = fileTreeRef.current.scrollHeight;
    }
  }, [files]);

  // Callback to receive selected options from CustomizationPanel
  const Handle_DocStyle = (value) => {
    setCustomizationOptions(pre => ({ ...pre, docStyle: value }));  
  };
  const Handle_Verbosity = (value) => {
    setCustomizationOptions(pre => ({ ...pre, verbosity: value }));
  };
  const Handle_Audience = (value) => {
    setCustomizationOptions(pre => ({ ...pre, audience: value }));
  };
  const Handle_Tone = (value) => {
    setCustomizationOptions(pre => ({ ...pre, tone: value }));
  };
  const Handle_Purpose = (value) => {
    setCustomizationOptions(pre => ({ ...pre, purpose: value }));
  };

  const handleSymbolClick = (symbol) => { 
    console.log("Symbol clicked:", symbol);
    
    if (symbol) {
      setGoToLineNumber(symbol.line);
      console.log("Go to line number:", symbol.line);
    }
  }

  const handleCommitToGitHub = async () => {
    if (!selectedFile || !generatedCode) {
      alert("Please generate docstrings first before committing.");
      return;
    }

    // Get commit message from user
    const userMessage = prompt(
      "Enter a commit message:",
      "docs: Add AI-generated docstrings"
    );

    if (!userMessage) {
      alert("Commit cancelled.");
      return;
    }

    setIsCommitting(true);
    try {
      const response = await api.post("api/code/commit/", {
        repo_name: repoName,
        file_path: selectedFile,
        content: generatedCode,
        commit_message: userMessage,
        branch: "main"
      });

      if (response.data.success) {
        alert(
          `✅ Committed successfully!\n\nFile: ${selectedFile}\nCommit: ${response.data.commit.sha.substring(0, 7)}\n\nView on GitHub: ${response.data.commit.file_url}`
        );
        // Update the file content with the generated code
        setFileContent(generatedCode);
        localStorage.setItem('fileContent', generatedCode);
        if (selectedFile) idbSet('file-content-' + selectedFile, generatedCode);
        setGeneratedCode(""); // Clear generated code after successful commit
      } else {
        alert(`❌ Commit failed: ${response.data.error}`);
      }
    } catch (error) {
      console.error("Error during commit:", error);
      alert(`❌ Error during commit: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsCommitting(false);
    }
  };


  useEffect(() => {
    const fetchFiles = async () => {
      setLoading(true);
      try {
        const response = await api.get(`api/code/get/repository-files/${repoName}/`);
        console.log("Fetched files:", response.data);
        if (response.status === 200) {
          const nestedTree = convertToNestedTree(response.data.file_tree);

          setFiles(nestedTree);

          const savedFile = localStorage.getItem('selectedFile');
          const savedTabs = JSON.parse(localStorage.getItem('tabList')) || [];
          if (savedFile) {
            setSelectedFile(savedFile);
            const savedContent = await idbGet('file-content-' + savedFile);
            const savedSymbols = await idbGet('symbols-' + savedFile);
            setSymbols(savedSymbols);
            if (savedContent) {
              setFileContent(savedContent);
              localStorage.setItem('fileContent', savedContent);
              localStorage.setItem('symbol',savedSymbols)
            }
          }
          if (savedTabs.length) setTabList(savedTabs);
        } else {
          throw new Error("Failed to fetch files");
        }
      } catch (error) {
        console.error("Error fetching files:", error);
      } finally {
        setLoading(false);
      }
    };

    // Clear all IndexedDB entries before fetching files
    (async () => {
      await idbClear();
      await fetchFiles();
    })();
  }, [repoName]);

  

  const handleFileSelect = async (filePath) => {
    setSelectedFile(filePath);

    try {
      setShowLoader(true);
      const response = await api.get(`api/code/get/file-content/${repoName}/${encodeURIComponent(filePath)}/`);
      if (response.status === 200) {
        const fileContent = response.data.content;
        console.log("File content:", fileContent);
        setFileContent(fileContent);
        setSymbols(response.data.symbols);
        setShowLoader(false);
        localStorage.setItem('fileContent', fileContent);
        idbSet('file-content-' + filePath, fileContent);
        idbSet('symbols-' + filePath, response.data.symbols);
        console.log(response.data.symbols)
      } else {
        localStorage.removeItem('fileContent','');
        localStorage.removeItem('symbol','');
        throw new Error("Failed to fetch file content");
      }
    } catch (error) {
      console.error("Error fetching file content:", error); 
    }

    if (!tabList.includes(filePath)) {
      setTabList(prev => {
        const newTabs = [...prev, filePath];
        localStorage.setItem('tabList', JSON.stringify(newTabs));
        return newTabs;
      });
    }
    localStorage.setItem('selectedFile', filePath);
  };

  return (
    <div className="bg-gradient-to-br from-[#0f172a] to-[#1e293b] to-[#1f2730] text-white h-screen w-screen overflow-hidden flex-row">
      <div className="flex justify-start py-2 bg-[#11111b]">
        <p className="text-sm font-semibold inline-block backdrop-blur-sm px-4 py-2 border border-gray-700 rounded-full mx-auto w-fit">{localStorage.getItem('repoName')}</p>
      </div>
    <PanelGroup direction="horizontal" className="h-full bg-gradient-to-br from-[#0f172a] to-[#1e293b] to-[#1f2730] text-white">
      {showSidebar && (
        <Panel defaultSize={13} minSize={13} maxSize={13} className="h-full">
          <div>
            <p className="text-sm font-semibold text-center mb-2 justify-start">Files</p>
            <input
              type="search"
              placeholder="  Search files..."
              className="bg-transparent border border-gray-700 rounded-sm px-1 py-1 outline-[#1f2730] focus:outline-none focus:ring-0 focus:border-gray-700 text-xs w-28 hover:bg-gray-800 transition-colors duration-200 "
              style={{ fontSize: "0.75rem", height: "1.5rem", width: "13rem" }}
            />
          </div>
          <aside
            ref={fileTreeRef}
            className="h-full flex flex-col bg-transparent backdrop-blur-md rounded-xl p-4 shadow-inner scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900"
          >
            <div className="">
              <FileTree initialData={files} onFileSelect={handleFileSelect} />
            </div>
          </aside>
        </Panel>
      )}

      <PanelResizeHandle className="w-0.5  bg-[#494c5c] cursor-col-resize" />

      <Panel defaultSize={40} minSize={20}>
        <section className="h-full bg-transparent rounded-xl p-4 shadow-inner overflow-y-auto overflow-x-hidden scrollbar scrollbar-thumb-gray-700 scrollbar-track-gray-900 flex flex-col">
          <div className="flex flex-col h-full">
            {/* VS Code-like Tab Bar */}
            <div className="flex items-center border-b border-gray-700 px-0 py-0 bg-transparent rounded-t-ls">
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="text-lg text-gray-400 hover:text-gray-50 transition-colors px-2"
                title="Toggle Sidebar"
              >
                {showSidebar ? <GoSidebarExpand /> : <GoSidebarCollapse />}
              </button>
              <div
                className=" bg-transparent flex-1 flex overflow-x-auto flex-nowrap scrollbar-hide h-8"
              >
                {tabList.map((file, index) => (
                  <div
                    key={index}
                    className={`group flex mt-1 justify-between px-4 py-0 h-10 w-33 min-w-[7rem] max-w-[12rem] cursor-pointer border-r border-gray-800 transition-all duration-200 ease-in-out
                      ${file === selectedFile
                        ? 'bg-transparent text-white font-semibold'
                        : 'hover:bg-blur-md text-gray-300'
                      }`}
                    style={{
                      userSelect: "none",
                      flex: "0 0 auto",
                    }}
                    onClick={async () => {
                      setSelectedFile(file);
                      const cachedContent = await idbGet('file-content-' + file);
                      const cachedSymbols = await idbGet('symbols-' + file);
                      if (cachedContent) {
                        setFileContent(cachedContent);
                        setSymbols(cachedSymbols);
                        localStorage.setItem('fileContent', cachedContent);
                      } else {
                        try {
                          setShowLoader(true);
                          const response = await api.get(`api/code/get/file-content/${repoName}/${encodeURIComponent(file)}/`);
                          if (response.status === 200) {
                            setFileContent(response.data.content);
                            setSymbols(response.data.symbols);
                            setShowLoader(false);
                            localStorage.setItem('fileContent', response.data.content);
                            idbSet('file-content-' + file, response.data.content);
                            idbSet('symbols-' + file, response.data.symbols);

                          }
                        } catch (error) {
                          console.error("Error fetching file content:", error);
                        }
                      }
                    }}
                  >
                    <span className="mr-1 text-sm truncate max-w-[7rem]">{file.split('/').pop()}</span>
                    <span
                      className="text-sm text-gray-400 group-hover:text-red-400 ml-1 px-1 rounded hover:bg-gray-700"
                      onClick={async e => {
                        e.stopPropagation();
                        const newTabs = tabList.filter(f => f !== file);
                        setTabList(newTabs);
                        localStorage.setItem('tabList', JSON.stringify(newTabs));
                        if (selectedFile === file) {
                          if (newTabs.length > 0) {
                            const newActive = newTabs[0];
                            setSelectedFile(newActive);
                            localStorage.setItem('selectedFile', newActive);
                            const cachedContent = await idbGet('file-content-' + newActive);
                            const cachedSymbols = await idbGet('symbols-' + newActive);
                            setFileContent(cachedContent || '');
                            setSymbols(cachedSymbols || []);
                          } else {
                            setSelectedFile(null);
                            setFileContent('');
                            setSymbols([]);
                            localStorage.removeItem('selectedFile');
                          }
                        }
                      }}
                      title="Close"
                    >
                      ×
                    </span>
                  </div>
                ))} 
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              {showLoader ? (<CodeLoader />

              ) : (
                <Editor
                  key={selectedFile}
                  className="bg-transparent h-full"
                  initialCode={`${fileContent}`}
                  selectedFile={selectedFile}
                  repoName={repoName}
                  onCodeChange={(code) => {
                    setFileContent(code);
                    localStorage.setItem('fileContent', code);
                    if (selectedFile) idbSet('file-content-' + selectedFile, code);
                  }}
                  customizationOptions={customizationOptions}
                  goToLineNumber={goToLineNumber}
                />
              )}
            </div>
            
            <div className="flex justify-end mt-2">
              <Button
              onClick={async () => {
                if (!selectedFile) {
                  alert("Please select a file first.");
                  return;
                }

                try {
                  setShowLoader(true);
                  const response = await api.post('api/code/generate-docstring/', {
                    code: fileContent,
                    repo_name: repoName,
                    file_path: selectedFile,
                    customizationOptions: {
                      style: customizationOptions.docStyle,
                      verbosity: customizationOptions.verbosity,
                      audience: customizationOptions.audience,
                      tone: customizationOptions.tone,
                      purpose: customizationOptions.purpose,
                    }
                  });

                  if (response.status === 200) {
                    setGeneratedCode(response.data.docstring);
                    setShowLoader(false);
                  }
                } catch (error) {
                  console.error("Error generating docstring:", error);
                  alert("Failed to generate docstring. Please try again.");
                  setShowLoader(false);
                }
              }}>
                <SiGooglegemini className="inline-block mr-1" />
                Generate Doc
              </Button>
              {generatedCode && (
                <Button
                  onClick={handleCommitToGitHub}
                  disabled={isCommitting}
                  className="ml-2"
                >
                  <FiGitBranch className="inline-block mr-1" />
                  {isCommitting ? "Committing..." : "Commit"}
                </Button>
              )}
          </div>
          <div>
              {fileContent && (
                <div className="text-xs text-gray-400">
                  <p>{selectedFile} - Lines: {fileContent.split('\n').length}</p>
                </div>
              )}
            </div>
          </div>
          </section>
        </Panel>

      <PanelResizeHandle className="w-0.5 bg-[#494c5c] cursor-col-resize" />

      {/* 📄 Docstring/AI Output */}
      <Panel defaultSize={20} minSize={20} maxSize={20} className="h-full"  >
        <aside className="h-full bg-transparent rounded-xl p-4 shadow-inner overflow-auto h-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900 flex flex-col">
          <button className="text-gray-600 hover:text-gray-400" onClick={() => {setshowcustomizationpanel(!showcustomizationpanel)}}>
            <div className="flex items-center justify-between text-white h-[35px] border-color-gray-600 rounded-xl bg-[#1e293b]">
              <h2 className="px-2 py-1 text-sm font-semibold  tracking-wide text-gray-550 hover:text-gray-400">Customization Options</h2>
              <IoIosArrowDown
                className={`ml-2 align-middle transition-transform duration-200 text-gray-400`}
                style={{
                  transform: showcustomizationpanel ? 'rotate(180deg)' : 'rotate(0deg)',
                  fontSize: '1.1em',
                  verticalAlign: 'middle',
                  display: 'inline-block',
                  lineHeight: '1',
                  paddingright : '0.5rem',
                }}
              />
            </div>
          </button>
          {showcustomizationpanel && <CustomizationPanel
              _docStyle={Handle_DocStyle}
              _verbosity={Handle_Verbosity}
              _audience={Handle_Audience}
              _tone={Handle_Tone}
              _purpose={Handle_Purpose}
            />
          }
          <div>
            <br />
            <div className="bg-[#1e293b] rounded-lg p-4 h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
              <SymbolSheet symbols={symbols || []} callback={handleSymbolClick} />
              <p className="text-gray-300">symbol sheet will be displayed here ,on selecting the file</p>
            </div>
          </div>
        </aside>
      </Panel>
    </PanelGroup>
    </div>
  );
}

export default Start;