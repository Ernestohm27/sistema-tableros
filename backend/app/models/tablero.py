from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


class EstadoTablero(str, Enum):
    en_proceso = "en_proceso"
    terminado = "terminado"
    revision = "revision"
    entregado = "entregado"


class ComponenteTablero(BaseModel):
    nombre: str
    cantidad: int
    especificacion: Optional[str] = None


class TableroBase(BaseModel):
    numero_serie: str
    cliente: str
    descripcion: str
    voltaje: str
    corriente: str
    estado: EstadoTablero = EstadoTablero.en_proceso
    componentes: List[ComponenteTablero] = Field(default_factory=list)
    observaciones: Optional[str] = None


class TableroCreate(TableroBase):
    pass


class TableroUpdate(BaseModel):
    cliente: Optional[str] = None
    descripcion: Optional[str] = None
    voltaje: Optional[str] = None
    corriente: Optional[str] = None
    estado: Optional[EstadoTablero] = None
    componentes: Optional[List[ComponenteTablero]] = None
    observaciones: Optional[str] = None


class TableroResponse(TableroBase):
    id: str
    fecha_creacion: datetime
    creado_por: str