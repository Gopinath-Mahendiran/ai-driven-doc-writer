import { Outlet } from "react-router-dom";
import { BsCodeSlash } from "react-icons/bs";
import { GoHome, GoGear } from "react-icons/go";
import { IoDocumentTextOutline } from "react-icons/io5";
import { GrDocumentTest } from "react-icons/gr";


function SidebarItem({ icon, children ,containerClassName}) {
  return (
    <button className={`flex flex-col items-center gap-1 text-gray-400 hover:text-gray-50 transition-colors mb-6 ${containerClassName}`} title={children}>
      <span className="text-2xl">{icon}</span>
      <p className="text-[10px]  ">{children}</p>
    </button>
  );
}

const EditorLayout = () => {
  return (
    <div className="h-screen w-screen bg-[#11111b] text-white flex overflow-hidden">
      <div className="flex flex-col justify-start mx-2 my-2 p-2">
        <BsCodeSlash className="text-2xl text-gray-400 mb-4 hover:text-gray-50 transition-colors" title="AI Doc Writer" />
        <a href="/githome"><SidebarItem icon={<GoHome />} children="Home" /></a>
        <a href="/start"><SidebarItem icon={<IoDocumentTextOutline />} children="Docs" /></a>
        <a href="/tests"><SidebarItem icon={<GrDocumentTest />} children="Tests" /></a>
        <a href="/settings"><SidebarItem icon={<GoGear />} children="Settings" containerClassName="-mx-1" /></a>
      </div>
      <main className="flex-1 flex justify-center h-screen w-full overflow-y-auto overscroll-y-none">
        <Outlet />
      </main>
    </div>
  );
};

export default EditorLayout;
