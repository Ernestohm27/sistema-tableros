import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import api from "../api/axios";

export default function Dashboard() {
  const [stats, setStats] = useState({
    total: 0,
    en_proceso: 0,
    terminado: 0,
    revision: 0,
    entregado: 0,
  });

  useEffect(() => {
    api.get("/tableros/").then(({ data }) => {
      const total = data.length;
      const en_proceso = data.filter((t) => t.estado === "en_proceso").length;
      const terminado = data.filter((t) => t.estado === "terminado").length;
      const revision = data.filter((t) => t.estado === "revision").length;
      const entregado = data.filter((t) => t.estado === "entregado").length;
      setStats({ total, en_proceso, terminado, revision, entregado });
    });
  }, []);

  const tarjetas = [
    { label: "Total tableros", valor: stats.total, color: "bg-blue-600" },
    { label: "En proceso", valor: stats.en_proceso, color: "bg-yellow-500" },
    { label: "En revisión", valor: stats.revision, color: "bg-orange-500" },
    { label: "Terminados", valor: stats.terminado, color: "bg-green-600" },
    { label: "Entregados", valor: stats.entregado, color: "bg-gray-600" },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Dashboard general
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {tarjetas.map((t) => (
            <div key={t.label} className={`${t.color} text-white rounded-xl p-5 shadow`}>
              <p className="text-3xl font-bold">{t.valor}</p>
              <p className="text-sm mt-1 opacity-90">{t.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}