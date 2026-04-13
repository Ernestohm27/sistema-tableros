from typing import Optional

from fastapi import APIRouter, Depends, HTTPException

from app.models.tablero import TableroCreate, TableroResponse, TableroUpdate
from app.routes.usuarios import get_current_user, require_admin
from app.services.tablero_service import (
    actualizar_tablero,
    crear_tablero,
    eliminar_tablero,
    existe_numero_serie,
    obtener_tablero_por_id,
    obtener_tableros,
)

router = APIRouter(prefix="/tableros", tags=["Tableros"])


def require_auth(current_user: Optional[dict] = Depends(get_current_user)) -> dict:
    if not current_user:
        raise HTTPException(status_code=401, detail="No autenticado")
    return current_user


@router.post("/", response_model=TableroResponse)
def crear(tablero: TableroCreate, current_user: dict = Depends(require_admin)):
    if existe_numero_serie(tablero.numero_serie):
        raise HTTPException(status_code=400, detail="Numero de serie ya existe")
    return crear_tablero(tablero.model_dump(mode="json"), current_user)


@router.get("/", response_model=list[TableroResponse])
def listar(current_user: dict = Depends(require_auth)):
    return obtener_tableros()


@router.get("/{tablero_id}", response_model=TableroResponse)
def obtener(tablero_id: str, current_user: dict = Depends(require_auth)):
    tablero = obtener_tablero_por_id(tablero_id)
    if not tablero:
        raise HTTPException(status_code=404, detail="Tablero no encontrado")
    return tablero


@router.put("/{tablero_id}", response_model=TableroResponse)
def actualizar(tablero_id: str, data: TableroUpdate, current_user: dict = Depends(require_auth)):
    payload = {k: v for k, v in data.model_dump(mode="json").items() if v is not None}
    actualizado = actualizar_tablero(tablero_id, payload, current_user)
    if not actualizado:
        raise HTTPException(status_code=404, detail="Tablero no encontrado")
    return actualizado


@router.delete("/{tablero_id}")
def eliminar(tablero_id: str, current_user: dict = Depends(require_admin)):
    if not eliminar_tablero(tablero_id):
        raise HTTPException(status_code=404, detail="Tablero no encontrado")
    return {"mensaje": "Tablero eliminado correctamente"}