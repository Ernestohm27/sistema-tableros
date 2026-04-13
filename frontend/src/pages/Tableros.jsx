import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api/axios";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";

const ESTADOS = {
  en_proceso: { label: "En proceso", color: "bg-yellow-100 text-yellow-800" },
  revision: { label: "En revisión", color: "bg-orange-100 text-orange-800" },
  terminado: { label: "Terminado", color: "bg-green-100 text-green-800" },
  entregado: { label: "Entregado", color: "bg-gray-100 text-gray-800" },
};

export default function Tableros() {
  const [tableros, setTableros] = useState([]);
  const [filtro, setFiltro] = useState("");
  const [mostrarForm, setMostrarForm] = useState(false);
  const { usuario } = useAuth();
  const [form, setForm] = useState({
    numero_serie: "",
    cliente: "",
    descripcion: "",
    voltaje: "",
    corriente: "",
    estado: "en_proceso",
    observaciones: "",
  });
  const navigate = useNavigate();

  const cargar = () => {
    api.get("/tableros/").then(({ data }) => setTableros(data));
  };

  useEffect(() => {
    cargar();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/tableros/", { ...form, componentes: [] });
      toast.success("Tablero creado correctamente");
      setMostrarForm(false);
      setForm({
        numero_serie: "",
        cliente: "",
        descripcion: "",
        voltaje: "",
        corriente: "",
        estado: "en_proceso",
        observaciones: "",
      });
      cargar();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Error al crear tablero");
    }
  };

  const tablerosFiltrados = tableros.filter(
    (t) =>
      t.numero_serie.toLowerCase().includes(filtro.toLowerCase()) ||
      t.cliente.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Tableros eléctricos</h1>
          {usuario?.rol === "admin" && (
            <button
              onClick={() => setMostrarForm(!mostrarForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              {mostrarForm ? "Cancelar" : "+ Nuevo tablero"}
            </button>
          )}
        </div>

        {usuario?.rol === "admin" && mostrarForm && (
          <div className="bg-white rounded-xl shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-700">Nuevo tablero</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: "Número de serie", key: "numero_serie" },
                { label: "Cliente", key: "cliente" },
                { label: "Voltaje", key: "voltaje" },
                { label: "Corriente", key: "corriente" },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    {label}
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    required
                  />
                </div>
              ))}

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Descripción
                </label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Estado
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.estado}
                  onChange={(e) => setForm({ ...form, estado: e.target.value })}
                >
                  {Object.entries(ESTADOS).map(([val, { label }]) => (
                    <option key={val} value={val}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Observaciones
                </label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.observaciones}
                  onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                />
              </div>

              <div className="md:col-span-2 flex justify-end">
                <button
                  type="submit"
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
                >
                  Guardar tablero
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="mb-4">
          <input
            placeholder="Buscar por serie o cliente..."
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          />
        </div>

        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {["Serie", "Cliente", "Descripción", "Voltaje", "Corriente", "Estado", "Acciones"].map(
                  (h) => (
                    <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600">
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {tablerosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-400">
                    No hay tableros registrados
                  </td>
                </tr>
              ) : (
                tablerosFiltrados.map((t) => (
                  <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-mono font-medium">{t.numero_serie}</td>
                    <td className="px-4 py-3">{t.cliente}</td>
                    <td className="px-4 py-3 text-gray-600">{t.descripcion}</td>
                    <td className="px-4 py-3">{t.voltaje}</td>
                    <td className="px-4 py-3">{t.corriente}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          ESTADOS[t.estado]?.color
                        }`}
                      >
                        {ESTADOS[t.estado]?.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => navigate(`/tableros/${t.id}`)}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        Ver detalle
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </div>
  );
}