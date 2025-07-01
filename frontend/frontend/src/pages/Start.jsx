import { useState } from "react";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import FileTree from "../components/FileTree";
import Editor from "../components/Editor";
import Button from "../components/Button";
import { GoSidebarCollapse ,GoSidebarExpand ,GoHome} from "react-icons/go";
import { BsCodeSlash } from "react-icons/bs";
import { IoDocumentTextOutline } from "react-icons/io5";
import { GrDocumentTest } from "react-icons/gr";

function Start() {
  const [showSidebar, setShowSidebar] = useState(true);

function SidebarItem({ icon, children }) {
  return (
    <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-50 transition-colors mb-4" title={children}>
      <span className="text-2xl ">{icon}</span>
      <p className="text-[12px]">{children}</p>
    </button>
  );
}
  return (
    <div className=" h-screen flex justify-between p-1   bg-[#0f1115] text-white">
      <div className="flex-col  justify-start mx-2 my-2 p-2">
        <BsCodeSlash className="text-2xl text-gray-400 mb-4" title="AI Doc Writer" />
        <SidebarItem icon={<GoHome />} children="Home" />
        <SidebarItem icon={<IoDocumentTextOutline />} children="Docs" />
        <SidebarItem icon={<GrDocumentTest />} children="Tests" />
      </div>
      <PanelGroup direction="horizontal">
         
        {/* 📁 File Explorer */}
        {showSidebar && (
          <Panel defaultSize={11} minSize={11} maxSize={20}>
            <aside className="h-full bg-[#181a1e] backdrop-blur-md rounded-xl p-4 shadow-inner overflow-auto">
              <div className="flex items-center justify-between mb-4">
                <Button>+ New project</Button>
                <button
                  className="text-gray-400 hover:text-gray-50 transition-colors"
                  title="Collapse Sidebar"
                  onClick={() => setShowSidebar(!showSidebar)}
                >
                  
                </button>
              </div>
              <FileTree />
            </aside>
          </Panel>
        )}
        
        <PanelResizeHandle className="w-1  cursor-col-resize" />

        {/* 📝 Code Editor */}
        <Panel defaultSize={40} minSize={20}>
          <section className="h-full bg-[#14151a] rounded-xl p-4 shadow-inner overflow-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900 ">
            <button onClick={() => setShowSidebar(!showSidebar)} className=" text-2xl text-gray-400 hover:text-gray-50 transition-colors mb-4" title="Toggle Sidebar">
          {showSidebar ? <GoSidebarExpand /> : <GoSidebarCollapse />}
        </button>
            <Editor initialCode="// Start typing your code here..." onCodeChange={(code) => console.log(code)} />
          </section>
        </Panel>

        <PanelResizeHandle className="w-0.5 bg-[#494c5c] cursor-col-resize" />

        {/* 📄 Docstring/AI Output */}
        <Panel defaultSize={40} minSize={20}>
          <aside className="h-full bg-[#181a1e] rounded-xl p-4 shadow-inner overflow-auto hidden">
            <h2 className="text-lg font-semibold mb-2">📄 AI Doc Preview</h2>
            <p className="text-sm text-gray-300">
              Generated docstrings and file summaries will appear here.
            </p>
          </aside>
        </Panel>

        

        

      </PanelGroup>
    </div>
  );
}

export default Start;