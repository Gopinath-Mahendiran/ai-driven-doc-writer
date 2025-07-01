import { BrowserRouter, Routes, Route ,Navigate    } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Home from "./pages/Home";
import Signin from "./pages/Login";
import OAuthCallback from "./components/OAuthcallback";
import ProtectedRoute from "./components/ProtectedRoute";
import Sample from "./pages/sample";
import Start from "./pages/Start";
import EditorLayout from "./layouts/editorLayout";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/signin" element={<Signin />} />
          <Route path="/login" element={<Signin />} />
          <Route path="/oauth/callback/" element={<OAuthCallback />} />
          <Route path="/sample" element={<ProtectedRoute><Sample /></ProtectedRoute>} />
        </Route>
        <Route element={<EditorLayout />}>
          <Route path="/start" element={<ProtectedRoute><Start /></ProtectedRoute>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;