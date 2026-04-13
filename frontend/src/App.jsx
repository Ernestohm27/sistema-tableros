import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { AuthProvider, useAuth } from "./context/AuthContext";
import Dashboard from "./pages/Dashboard";
import DetalleTablero from "./pages/DetalleTablero";
import EscaneoQR from "./pages/EscaneoQR";
import Login from "./pages/Login";
import Tableros from "./pages/Tableros";
import Usuarios from "./pages/Usuarios";

function PrivateRoute({ children }) {
const { usuario } = useAuth();
return usuario ? children : <Navigate to="/login" />;
}

function AdminRoute({ children }) {
const { usuario } = useAuth();
if (!usuario) return <Navigate to="/login" />;
if (usuario.rol !== "admin") return <Navigate to="/dashboard" />;
return children;
}

export default function App() {
return (
<AuthProvider>
<BrowserRouter>
<Routes>
<Route path="/login" element={<Login />} />
<Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
<Route path="/tableros" element={<PrivateRoute><Tableros /></PrivateRoute>} />
<Route path="/tableros/:id" element={<PrivateRoute><DetalleTablero /></PrivateRoute>} />
<Route path="/escaneo" element={<PrivateRoute><EscaneoQR /></PrivateRoute>} />
<Route path="/usuarios" element={<AdminRoute><Usuarios /></AdminRoute>} />
<Route path="*" element={<Navigate to="/dashboard" />} />
</Routes>
</BrowserRouter>
<ToastContainer position="top-right" autoClose={3000} />
</AuthProvider>
);
}