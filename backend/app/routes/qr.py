from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response

from app.models.qr import EscaneoQR
from app.routes.usuarios import get_current_user
from app.services.qr_service import (
    crear_qr,
    escanear_qr,
    generar_pdf_tablero,
    obtener_historial_tablero,
    obtener_qr_por_tablero,
)

router = APIRouter(prefix="/qr", tags=["Codigos QR"])


def require_auth(current_user: Optional[dict] = Depends(get_current_user)) -> dict:
    if not current_user:
        raise HTTPException(status_code=401, detail="No autenticado")
    return current_user


@router.post("/generar/{tablero_id}")
def generar(tablero_id: str, current_user: dict = Depends(require_auth)):
    resultado = crear_qr(tablero_id, current_user)
    if not resultado:
        raise HTTPException(status_code=404, detail="Tablero no encontrado")

    return {
        "mensaje": "QR generado correctamente",
        "id": resultado["id"],
        "qr_data": resultado["qr_data"],
        "imagen_base64": resultado["imagen_base64"],
        "fecha_generacion": resultado["fecha_generacion"],
    }


@router.get("/tablero/{tablero_id}")
def obtener_qr(tablero_id: str, current_user: dict = Depends(require_auth)):
    qr_doc = obtener_qr_por_tablero(tablero_id)
    if not qr_doc:
        raise HTTPException(status_code=404, detail="QR no encontrado para este tablero")
    return qr_doc


@router.post("/escanear")
def escanear(datos: EscaneoQR, current_user: dict = Depends(require_auth)):
    resultado = escanear_qr(datos.qr_data)
    if not resultado:
        raise HTTPException(status_code=404, detail="QR no reconocido en el sistema")
    return resultado


@router.get("/reporte/{tablero_id}")
def reporte_pdf(tablero_id: str, current_user: dict = Depends(require_auth)):
    contenido = generar_pdf_tablero(tablero_id)
    if not contenido:
        raise HTTPException(status_code=404, detail="Tablero no encontrado")

    headers = {
        "Content-Disposition": f'inline; filename="reporte-tablero-{tablero_id}.pdf"'
    }
    return Response(content=contenido, media_type="application/pdf", headers=headers)


@router.get("/historial/{tablero_id}")
def obtener_historial(tablero_id: str, current_user: dict = Depends(require_auth)):
    resultado = obtener_historial_tablero(tablero_id)
    if not resultado:
        raise HTTPException(status_code=404, detail="Tablero no encontrado")
    return resultado