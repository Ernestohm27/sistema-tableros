import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
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

export default function DetalleTablero() {
	const { id } = useParams();
	const navigate = useNavigate();
	const { usuario } = useAuth();

	const [tablero, setTablero] = useState(null);
	const [historial, setHistorial] = useState([]);
	const [qrData, setQrData] = useState(null);
	const [editando, setEditando] = useState(false);
	const [form, setForm] = useState({});
	const [tab, setTab] = useState("info");

	const cargarTablero = async () => {
		try {
			const { data } = await api.get("/tableros/" + id);
			setTablero(data);
			setForm({
				cliente: data.cliente,
				descripcion: data.descripcion,
				voltaje: data.voltaje,
				corriente: data.corriente,
				estado: data.estado,
				observaciones: data.observaciones || "",
			});
		} catch {
			toast.error("Error al cargar tablero");
			navigate("/tableros");
		}
	};

	const cargarHistorial = async () => {
		try {
			const { data } = await api.get("/qr/historial/" + id);
			setHistorial(data.historial || []);
		} catch {
			setHistorial([]);
		}
	};

	const cargarQR = async () => {
		try {
			const { data } = await api.get("/qr/tablero/" + id);
			setQrData(data.qr_data);
		} catch {
			setQrData(null);
		}
	};

	useEffect(() => {
		cargarTablero();
		cargarHistorial();
		cargarQR();
	}, [id]);

	const handleGuardar = async () => {
		try {
			await api.put("/tableros/" + id, form);
			toast.success("Tablero actualizado");
			setEditando(false);
			cargarTablero();
			cargarHistorial();
		} catch {
			toast.error("Error al actualizar tablero");
		}
	};

	const handleGenerarQR = async () => {
		try {
			const { data } = await api.post("/qr/generar/" + id);
			setQrData(data.qr_data);
			toast.success("QR generado correctamente");
		} catch {
			toast.error("Error al generar QR");
		}
	};

	const handleEliminar = async () => {
		if (!window.confirm("¿Estás seguro de eliminar este tablero?")) return;
		try {
			await api.delete("/tableros/" + id);
			toast.success("Tablero eliminado");
			navigate("/tableros");
		} catch {
			toast.error("Error al eliminar tablero");
		}
	};

	const descargarQR = () => {
		const canvas = document.getElementById("qr-canvas");
		if (!canvas || !tablero) return;
		const url = canvas.toDataURL("image/png");
		const a = document.createElement("a");
		a.href = url;
		a.download = "QR-" + tablero.numero_serie + ".png";
		a.click();
	};

	if (!tablero) {
		return (
			<div className="min-h-screen bg-gray-100">
				<Navbar />
				<div className="flex items-center justify-center h-64">
					<p className="text-gray-500">Cargando tablero...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-100">
			<Navbar />
			<div className="max-w-6xl mx-auto p-4 md:p-6">
				<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
					<div>
						<button
							onClick={() => navigate("/tableros")}
							className="text-blue-600 hover:underline text-sm mb-1 block"
						>
							Volver a tableros
						</button>
						<h1 className="text-2xl font-bold text-gray-800">
							Tablero {tablero.numero_serie}
						</h1>
						<p className="text-gray-500 text-sm">{tablero.cliente}</p>
					</div>

					<div className="flex flex-wrap gap-2">
						{!editando ? (
							<button
								onClick={() => setEditando(true)}
								className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
							>
								Editar
							</button>
						) : (
							<>
								<button
									onClick={handleGuardar}
									className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm"
								>
									Guardar cambios
								</button>
								<button
									onClick={() => setEditando(false)}
									className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500 transition text-sm"
								>
									Cancelar
								</button>
							</>
						)}

						{usuario?.rol === "admin" && (
							<button
								onClick={handleEliminar}
								className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition text-sm"
							>
								Eliminar
							</button>
						)}
					</div>
				</div>

				<div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto whitespace-nowrap">
					{[
						{ key: "info", label: "Información" },
						{ key: "qr", label: "Código QR" },
						{ key: "historial", label: "Historial (" + historial.length + ")" },
					].map((item) => (
						<button
							key={item.key}
							onClick={() => setTab(item.key)}
							className={
								"px-4 py-2 text-sm font-medium border-b-2 transition " +
								(tab === item.key
									? "border-blue-600 text-blue-600"
									: "border-transparent text-gray-500 hover:text-gray-700")
							}
						>
							{item.label}
						</button>
					))}
				</div>

				{tab === "info" && (
					<div className="bg-white rounded-xl shadow p-6">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							{[
								{ label: "Cliente", key: "cliente" },
								{ label: "Voltaje", key: "voltaje" },
								{ label: "Corriente", key: "corriente" },
								{ label: "Descripción", key: "descripcion" },
								{ label: "Observaciones", key: "observaciones" },
							].map((item) => (
								<div key={item.key}>
									<label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
										{item.label}
									</label>
									{editando ? (
										<input
											className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
											value={form[item.key] || ""}
											onChange={(e) =>
												setForm({ ...form, [item.key]: e.target.value })
											}
										/>
									) : (
										<p className="text-gray-800">{tablero[item.key] || "—"}</p>
									)}
								</div>
							))}

							<div>
								<label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
									Estado
								</label>
								{editando ? (
									<select
										className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
										value={form.estado}
										onChange={(e) => setForm({ ...form, estado: e.target.value })}
									>
										{Object.entries(ESTADOS).map(([val, cfg]) => (
											<option key={val} value={val}>
												{cfg.label}
											</option>
										))}
									</select>
								) : (
									<span
										className={
											"px-2 py-1 rounded-full text-xs font-medium " +
											(ESTADOS[tablero.estado]?.color || "bg-gray-100 text-gray-800")
										}
									>
										{ESTADOS[tablero.estado]?.label || tablero.estado}
									</span>
								)}
							</div>

							<div>
								<label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
									Fecha de creación
								</label>
								<p className="text-gray-800">
									{new Date(tablero.fecha_creacion).toLocaleDateString("es-MX", {
										year: "numeric",
										month: "long",
										day: "numeric",
									})}
								</p>
							</div>
						</div>
					</div>
				)}

				{tab === "qr" && (
					<div className="bg-white rounded-xl shadow p-6 flex flex-col items-center gap-6">
						{qrData ? (
							<>
								<p className="text-gray-500 text-sm">
									Código QR del tablero {tablero.numero_serie}
								</p>
								<QRCodeCanvas
									id="qr-canvas"
									value={qrData}
									size={220}
									bgColor="#ffffff"
									fgColor="#1e3a5f"
									level="H"
									includeMargin={true}
								/>
								<p className="text-xs text-gray-400 font-mono text-center max-w-sm break-all">
									{qrData}
								</p>
								<div className="flex gap-3">
									<button
										onClick={handleGenerarQR}
										className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
									>
										Regenerar QR
									</button>
									<button
										onClick={descargarQR}
										className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm"
									>
										Descargar PNG
									</button>
								</div>
							</>
						) : (
							<div className="text-center py-10">
								<p className="text-gray-400 mb-4">
									Este tablero aún no tiene código QR generado
								</p>
								<button
									onClick={handleGenerarQR}
									className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
								>
									Generar código QR
								</button>
							</div>
						)}
					</div>
				)}

				{tab === "historial" && (
					<div className="bg-white rounded-xl shadow overflow-hidden">
						{historial.length === 0 ? (
							<div className="text-center py-12 text-gray-400">
								No hay cambios registrados para este tablero
							</div>
						) : (
							<div className="overflow-x-auto">
							<table className="w-full min-w-[760px] text-sm">
								<thead className="bg-gray-50 border-b border-gray-200">
									<tr>
										{["Fecha", "Usuario", "Campo", "Valor anterior", "Valor nuevo"].map(
											(h) => (
												<th key={h} className="text-left px-4 py-3 font-semibold text-gray-600">
													{h}
												</th>
											)
										)}
									</tr>
								</thead>
								<tbody>
									{historial.map((c) => (
										<tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
											<td className="px-4 py-3 text-gray-500 whitespace-nowrap">
												{new Date(c.fecha).toLocaleDateString("es-MX", {
													day: "2-digit",
													month: "short",
													year: "numeric",
													hour: "2-digit",
													minute: "2-digit",
												})}
											</td>
											<td className="px-4 py-3">{c.usuario_nombre}</td>
											<td className="px-4 py-3 font-mono text-blue-600">{c.campo_modificado}</td>
											<td className="px-4 py-3 text-red-500">{c.valor_anterior}</td>
											<td className="px-4 py-3 text-green-600">{c.valor_nuevo}</td>
										</tr>
									))}
								</tbody>
							</table>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}