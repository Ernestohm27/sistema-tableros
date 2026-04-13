from datetime import datetime
from typing import Optional

from bson import ObjectId
from bson.errors import InvalidId

from app.database import cambios_collection, tableros_collection


def serializar_tablero(tablero: dict) -> dict:
    tablero["id"] = str(tablero["_id"])
    del tablero["_id"]
    return tablero


def registrar_cambio(
    tablero_id: str,
    usuario: dict,
    campo: str,
    valor_anterior,
    valor_nuevo,
) -> None:
    cambios_collection.insert_one(
        {
            "tablero_id": tablero_id,
            "usuario_email": usuario.get("email"),
            "usuario_nombre": usuario.get("nombre"),
            "campo_modificado": campo,
            "valor_anterior": str(valor_anterior),
            "valor_nuevo": str(valor_nuevo),
            "fecha": datetime.utcnow(),
        }
    )


def existe_numero_serie(numero_serie: str) -> bool:
    return tableros_collection.find_one({"numero_serie": numero_serie}) is not None


def crear_tablero(data: dict, usuario: dict) -> dict:
    now = datetime.utcnow()
    data["fecha_creacion"] = now
    data["creado_por"] = usuario.get("email")
    data["creado_por_nombre"] = usuario.get("nombre")
    result = tableros_collection.insert_one(data)

    tablero = tableros_collection.find_one({"_id": result.inserted_id})
    return serializar_tablero(tablero)


def obtener_tableros() -> list:
    return [serializar_tablero(t) for t in tableros_collection.find().sort("fecha_creacion", -1)]


def _to_object_id(tablero_id: str) -> Optional[ObjectId]:
    try:
        return ObjectId(tablero_id)
    except InvalidId:
        return None


def obtener_tablero_por_id(tablero_id: str) -> Optional[dict]:
    oid = _to_object_id(tablero_id)
    if not oid:
        return None

    tablero = tableros_collection.find_one({"_id": oid})
    if not tablero:
        return None
    return serializar_tablero(tablero)


def actualizar_tablero(tablero_id: str, data: dict, usuario: dict) -> Optional[dict]:
    oid = _to_object_id(tablero_id)
    if not oid:
        return None

    tablero_actual = tableros_collection.find_one({"_id": oid})
    if not tablero_actual:
        return None

    for campo, valor_nuevo in data.items():
        valor_anterior = tablero_actual.get(campo)
        if valor_anterior != valor_nuevo:
            registrar_cambio(tablero_id, usuario, campo, valor_anterior, valor_nuevo)

    tableros_collection.update_one({"_id": oid}, {"$set": data})
    tablero_actualizado = tableros_collection.find_one({"_id": oid})
    return serializar_tablero(tablero_actualizado)


def eliminar_tablero(tablero_id: str) -> bool:
    oid = _to_object_id(tablero_id)
    if not oid:
        return False

    result = tableros_collection.delete_one({"_id": oid})
    return result.deleted_count > 0