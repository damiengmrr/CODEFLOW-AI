import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import Login from "./pages/Login.jsx";
import Profil from "./pages/Profil.jsx";
import ParamTres from "./pages/ParamTres.jsx";
export default function App() {
  return (
    <Layout>
      <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/profil" element={<Profil />} />
          <Route path="/parametres" element={<ParamTres />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Layout>
  );
}
