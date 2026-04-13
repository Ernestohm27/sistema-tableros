import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function Login() {
const [form, setForm] = useState({ email: "", password: "" });
const [loading, setLoading] = useState(false);
const { login } = useAuth();
const navigate = useNavigate();

const handleSubmit = async (e) => {
e.preventDefault();
setLoading(true);
try {
const { data } = await api.post("/usuarios/login", form);
login(data);
toast.success("Bienvenido, " + data.nombre);
navigate("/dashboard");
} catch {
toast.error("Credenciales incorrectas");
} finally {
setLoading(false);
}
};

return (
<div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
<div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border-t-4 border-red-600">
<h1 className="text-3xl font-bold text-center text-red-600 mb-1" style={{ fontFamily: 'Arial, sans-serif', letterSpacing: '1px' }}>
Industria SIGRAMA
</h1>
<p className="text-center text-gray-500 mb-6 text-sm">Gestión de Tableros Eléctricos</p>
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="email"
        className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-200"
        placeholder="Email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        required
      />
      <input
        type="password"
        className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-200"
        placeholder="Contraseña"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        required
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium transition"
      >
        {loading ? "Ingresando..." : "Iniciar sesión"}
      </button>
    </form>
  </div>
</div>
);
}