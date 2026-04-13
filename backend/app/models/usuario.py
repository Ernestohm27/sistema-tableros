from enum import Enum

from pydantic import BaseModel, EmailStr


class RolUsuario(str, Enum):
    admin = "admin"
    operador = "operador"


class UsuarioBase(BaseModel):
    nombre: str
    email: EmailStr
    rol: RolUsuario = RolUsuario.operador


class UsuarioCreate(UsuarioBase):
    password: str


class UsuarioResponse(UsuarioBase):
    id: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str
    rol: str
    nombre: str