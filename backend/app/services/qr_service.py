import base64
from datetime import datetime
from io import BytesIO
from typing import Optional

import qrcode
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