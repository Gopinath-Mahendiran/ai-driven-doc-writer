import { useState,useEffect,useId } from "react";
import { useParams } from "react-router-dom";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import FileTree from "../components/FileTree";
import Editor from "../components/Editor";
import { GoSidebarCollapse ,GoSidebarExpand } from "react-icons/go";
import convertToNestedTree from '../utils/convetToNestedTree';
import api from "../api";
import { set as idbSet, get as idbGet } from 'idb-keyval';
import CustomizationPanel from "../components/CustomizationPAnel";
import { IoIosArrowDropdown } from "react-icons/io";

function Start() {
  const [showSidebar, setShowSidebar] = useState(true);
  const {repoName} = useParams();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [tabList, setTabList] = useState([]);
  const [fileContent, setFileContent] = useState("");
  const [customizationOptions, setCustomizationOptions] = useState({
    docStyle: "PEP257",
    verbosity: "Minimal",
    audience: "Beginner",
    tone: "Neutral (default)",
    purpose: "Beginner",
  });
  const [showcustomizationpanel,setshowcustomizationpanel] = useState(false)

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
            const savedContent = await idbGet(savedFile);
            if (savedContent) {
              setFileContent(savedContent);
              localStorage.setItem('fileContent', savedContent);
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

    fetchFiles();
  }, [repoName]);

  const handleFileSelect = async (filePath) => {
    setSelectedFile(filePath);

    try {
      const response = await api.get(`api/code/get/file-content/${repoName}/${encodeURIComponent(filePath)}/`);
      if (response.status === 200) {
        const fileContent = response.data.content;
        console.log("File content:", fileContent);
        setFileContent(fileContent);
        localStorage.setItem('fileContent', fileContent);
        idbSet(filePath, fileContent);
      } else {
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
          <aside className="h-full flex flex-col bg-transparent backdrop-blur-md rounded-xl p-4 shadow-inner overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
            <FileTree initialData={files} onFileSelect={handleFileSelect} />
          </aside>
        </Panel>
      )}

      <PanelResizeHandle className="w-0.5  bg-[#494c5c] cursor-col-resize" />

      {/* 📝 Code Editor */}
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
                      const cachedContent = await idbGet(file);
                      if (cachedContent) {
                        setFileContent(cachedContent);
                        localStorage.setItem('fileContent', cachedContent);
                      } else {
                        try {
                          const response = await api.get(`api/code/get/file-content/${repoName}/${encodeURIComponent(file)}/`);
                          if (response.status === 200) {
                            setFileContent(response.data.content);
                            localStorage.setItem('fileContent', response.data.content);
                            idbSet(file, response.data.content);
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
                      onClick={e => {
                        e.stopPropagation();
                        const newTabs = tabList.filter(f => f !== file);
                        setTabList(newTabs);
                        localStorage.setItem('tabList', JSON.stringify(newTabs));
                        if (selectedFile === file) {
                          if (newTabs.length > 0) {
                            setSelectedFile(newTabs[0]);
                            localStorage.setItem('selectedFile', newTabs[0]);
                          } else {
                            setSelectedFile(null);
                            setFileContent('');
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
            <div>
              <Editor
                key={selectedFile}
                className="bg-transparent"
                initialCode={`${fileContent}`}
                selectedFile={selectedFile}
                repoName={repoName}
                onCodeChange={(code) => {
                  setFileContent(code);
                  localStorage.setItem('fileContent', code);
                  if (selectedFile) idbSet(selectedFile, code);
                }}
                customizationOptions={customizationOptions}
              />
            </div>
          </div>
        </section>
      </Panel>

      <PanelResizeHandle className="w-0.5 bg-[#494c5c] cursor-col-resize" />

      {/* 📄 Docstring/AI Output */}
      <Panel defaultSize={40} minSize={20}>
        <aside className="h-full bg-transparent rounded-xl p-4 shadow-inner overflow-auto h-4">
          <button className="text-gray-600 hover:text-gray-400" onClick={() => {setshowcustomizationpanel(!showcustomizationpanel)}}>
            <div className="flex justify-between text-white rounded-xl  w-[290px] h-[30px] border border-gray-700">
              <h2 className="px-2 py-1 text-sm font-semibold mb-4 tracking-wide text-blue-400">Customization Options</h2>
              <IoIosArrowDropdown className={`${showcustomizationpanel ? 'rotate-180' : ''} transition-transform duration-200`} />
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
            <p className="text-sm text-gray-400 mb-2">AI-generated docstring output will appear here</p>
            <div className="bg-[#1e293b] rounded-lg p-4 h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
              {/* Placeholder for AI-generated docstring content */}
              <p className="text-gray-300">Your AI-generated docstring will be displayed here...</p>
            </div>
          </div>
        </aside>
      </Panel>
    </PanelGroup>
    </div>
  );
}

export default Start;