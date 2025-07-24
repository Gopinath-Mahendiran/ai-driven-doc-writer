import Navbar from "../components/Navbar";
import { Outlet } from "react-router-dom";
// import BlobImg from "../assets/background-glow-nav.svg";

const MainLayout = () => {
  return (
   <div className="relative w-full min-h-screen bg-gradient-to-br from-[#0f172a] to-[#1e293b] to-[#1f2730] overflow-hidden">
  {/* Blob */}
  {/* <div className="absolute top-0 left-0 z-10">
    <img 
      src={BlobImg}
      alt="Glow Blob"
      className="w-auto h-auto" />
  </div> */}

  <Navbar />
  <main className="relative z-15 flex flex-col justify-center h-full ">
    <Outlet />
  </main>
</div>
  );
};

export default MainLayout;