import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import logo from "../assets/logo.png";

export default function Navbar() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    toast.info("Sesión cerrada");
    navigate("/login");
  };

  const linkClass = (path) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition ${
      location.pathname.startsWith(path)
        ? "bg-red-600 text-white"
        : "text-gray-700 hover:text-red-600"
    }`;

  return (
    <nav className="bg-white text-gray-800 px-4 py-3 md:px-6 md:py-4 shadow-sm border-b border-gray-200">
      <div className="max-w-6xl mx-auto w-full flex flex-col md:flex-row md:items-center md:justify-between gap-3">
      <div className="flex items-center gap-3">
        <img src={logo} alt="Industria SIGRAMA" className="h-10 w-10" />
        <div className="flex flex-col leading-tight">
          <span className="text-xs text-gray-600 font-normal" style={{ fontFamily: 'Arial, sans-serif' }}>industria</span>
          <span className="text-lg font-bold text-black italic" style={{ fontFamily: 'Arial, sans-serif', letterSpacing: '-0.5px' }}>SIGRAMA</span>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-1">
        <Link to="/dashboard" className={linkClass("/dashboard")}>
          Dashboard
        </Link>
        <Link to="/tableros" className={linkClass("/tableros")}>
          Tableros
        </Link>
        <Link to="/escaneo" className={linkClass("/escaneo")}>
          📱 Escanear QR
        </Link>
        {usuario?.rol === "admin" && (
          <Link to="/usuarios" className={linkClass("/usuarios")}>
            Usuarios
          </Link>
        )}
      </div>

      <div className="flex items-center justify-between md:justify-end gap-3">
        <span className="text-xs md:text-sm text-gray-600 truncate">
          {usuario?.nombre} — <span className="capitalize font-medium text-gray-800">{usuario?.rol}</span>
        </span>
        <button
          onClick={handleLogout}
          className="bg-red-600 text-white hover:bg-red-700 px-3 py-1 rounded-lg text-sm transition font-medium"
        >
          Cerrar sesión
        </button>
      </div>
      </div>
    </nav>
  );
}