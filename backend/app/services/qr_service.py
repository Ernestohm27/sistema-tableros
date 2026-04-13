import base64
from datetime import datetime
from io import BytesIO
from typing import Optional

import qrcode
from fpdf import FPDF
from bson import ObjectId
from bson.errors import InvalidId

from app.database import cambios_collection, qr_collection, tableros_collection
from app.services.tablero_service import serializar_tablero


def generar_qr_imagen(data: str) -> str:
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(data)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)

    return base64.b64encode(buffer.getvalue()).decode("utf-8")


def _to_object_id(tablero_id: str) -> Optional[ObjectId]:
    try:
        return ObjectId(tablero_id)
    except InvalidId:
        return None


def crear_qr(tablero_id: str, usuario: dict) -> Optional[dict]:
    oid = _to_object_id(tablero_id)
    if not oid:
        return None

    tablero = tableros_collection.find_one({"_id": oid})
    if not tablero:
        return None

    qr_data = (
        f"TABLERO:{tablero_id}|SERIE:{tablero['numero_serie']}|CLIENTE:{tablero['cliente']}"
    )
    imagen_base64 = generar_qr_imagen(qr_data)

    documento = {
        "tablero_id": tablero_id,
        "numero_serie": tablero["numero_serie"],
        "qr_data": qr_data,
        "imagen_base64": imagen_base64,
        "fecha_generacion": datetime.utcnow(),
        "generado_por": usuario.get("email"),
    }

    qr_existente = qr_collection.find_one({"tablero_id": tablero_id})
    if qr_existente:
        qr_collection.update_one({"tablero_id": tablero_id}, {"$set": documento})
        guardado = qr_collection.find_one({"_id": qr_existente["_id"]})
    else:
        result = qr_collection.insert_one(documento)
        guardado = qr_collection.find_one({"_id": result.inserted_id})

    guardado["id"] = str(guardado["_id"])
    del guardado["_id"]
    return guardado


def obtener_qr_por_tablero(tablero_id: str) -> Optional[dict]:
    qr_doc = qr_collection.find_one({"tablero_id": tablero_id})
    if not qr_doc:
        return None

    qr_doc["id"] = str(qr_doc["_id"])
    del qr_doc["_id"]
    return qr_doc


def escanear_qr(qr_data: str) -> Optional[dict]:
    qr_doc = qr_collection.find_one({"qr_data": qr_data})
    if not qr_doc:
        return None

    oid = _to_object_id(qr_doc["tablero_id"])
    if not oid:
        return None

    tablero = tableros_collection.find_one({"_id": oid})
    if not tablero:
        return None

    historial = list(cambios_collection.find({"tablero_id": qr_doc["tablero_id"]}))
    for cambio in historial:
        cambio["id"] = str(cambio["_id"])
        del cambio["_id"]

    return {
        "tablero": serializar_tablero(tablero),
        "historial_cambios": historial,
        "total_cambios": len(historial),
    }
def obtener_historial_tablero(tablero_id: str) -> Optional[dict]:
    oid = _to_object_id(tablero_id)
    if not oid:
        return None

    tablero = tableros_collection.find_one({"_id": oid})
    if not tablero:
        return None

    historial = list(
        cambios_collection.find({"tablero_id": tablero_id}).sort("fecha", -1)
    )

    for cambio in historial:
        cambio["id"] = str(cambio["_id"])
        del cambio["_id"]

    return {
        "tablero_id": tablero_id,
        "historial": historial,
        "total_cambios": len(historial),
    }


def generar_pdf_tablero(tablero_id: str) -> Optional[bytes]:
    oid = _to_object_id(tablero_id)
    if not oid:
        return None

    tablero = tableros_collection.find_one({"_id": oid})
    if not tablero:
        return None

    historial = list(cambios_collection.find({"tablero_id": tablero_id}).sort("fecha", -1))

    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()

    pdf.set_font("Helvetica", "B", 16)
    pdf.cell(0, 10, "Reporte de Tablero Electrico", ln=True)
    pdf.ln(2)

    pdf.set_font("Helvetica", "", 11)
    pdf.cell(0, 8, f"Serie: {tablero.get('numero_serie', '-')}", ln=True)
    pdf.cell(0, 8, f"Cliente: {tablero.get('cliente', '-')}", ln=True)
    pdf.cell(0, 8, f"Descripcion: {tablero.get('descripcion', '-')}", ln=True)
    pdf.cell(0, 8, f"Voltaje: {tablero.get('voltaje', '-')}", ln=True)
    pdf.cell(0, 8, f"Corriente: {tablero.get('corriente', '-')}", ln=True)
    pdf.cell(0, 8, f"Estado: {tablero.get('estado', '-')}", ln=True)
    pdf.cell(0, 8, f"Observaciones: {tablero.get('observaciones', '-')}", ln=True)

    fecha_creacion = tablero.get("fecha_creacion")
    if isinstance(fecha_creacion, datetime):
        fecha_texto = fecha_creacion.strftime("%Y-%m-%d %H:%M")
    else:
        fecha_texto = str(fecha_creacion or "-")
    pdf.cell(0, 8, f"Fecha de creacion: {fecha_texto}", ln=True)

    pdf.ln(4)
    pdf.set_font("Helvetica", "B", 13)
    pdf.cell(0, 10, "Historial de Cambios", ln=True)
    pdf.set_font("Helvetica", "", 10)

    if not historial:
        pdf.cell(0, 8, "Sin cambios registrados.", ln=True)
    else:
        for idx, cambio in enumerate(historial, start=1):
            fecha = cambio.get("fecha")
            if isinstance(fecha, datetime):
                fecha_cambio = fecha.strftime("%Y-%m-%d %H:%M")
            else:
                fecha_cambio = str(fecha or "-")

            usuario = cambio.get("usuario_nombre") or cambio.get("usuario_email") or "-"
            campo = cambio.get("campo_modificado", "-")
            anterior = str(cambio.get("valor_anterior", "-"))
            nuevo = str(cambio.get("valor_nuevo", "-"))

            pdf.set_font("Helvetica", "B", 10)
            pdf.multi_cell(0, 6, f"{idx}. {fecha_cambio} | {usuario}")
            pdf.set_font("Helvetica", "", 10)
            pdf.multi_cell(0, 6, f"Campo: {campo}")
            pdf.multi_cell(0, 6, f"Anterior: {anterior}")
            pdf.multi_cell(0, 6, f"Nuevo: {nuevo}")
            pdf.ln(1)

    return bytes(pdf.output(dest="S"))