import { BrowserRouter, Routes, Route ,Navigate    } from "react-router-dom";
import 'react-tooltip/dist/react-tooltip.css'
import MainLayout from "./layouts/MainLayout";
import Home from "./pages/Home";
import Signin from "./pages/Login";
import OAuthCallback from "./components/OAuthCallback";
import ProtectedRoute from "./components/ProtectedRoute";
import Sample from "./pages/sample";
import Start from "./pages/Doceditor";
import EditorLayout from "./layouts/editorLayout";
import Githome from "./pages/githome";
import GitOAuth from "./pages/Git-OAuth";

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
        <Route path="/oauth/github/callback/" element={<GitOAuth />} />
        <Route element={<EditorLayout />}>
          <Route path='/githome' element={<ProtectedRoute><Githome /></ProtectedRoute>} />
          <Route path="/editor/:repoName" element={<ProtectedRoute><Start /></ProtectedRoute>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;