from datetime import datetime

from pydantic import BaseModel


class QRBase(BaseModel):
    tablero_id: str
    numero_serie: str


class QRResponse(BaseModel):
    id: str
    tablero_id: str
    numero_serie: str
    qr_data: str
    imagen_base64: str
    fecha_generacion: datetime
    generado_por: str


class EscaneoQR(BaseModel):
    qr_data: str