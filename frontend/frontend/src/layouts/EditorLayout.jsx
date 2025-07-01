import EditorHeader from "../components/EditorHeader";
import { Outlet } from "react-router-dom";



const EditorLayout = () => {
  return (
   <div className="relative w-full min-h-screen bg-[#101114] text-white">

  <EditorHeader />
  <main className="relative z-15 flex flex-col justify-center h-full">
    <Outlet />
  </main>
</div>
  );
};

export default EditorLayout;
