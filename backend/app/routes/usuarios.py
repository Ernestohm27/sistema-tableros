from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm

from app.database import usuarios_collection
from app.models.usuario import LoginRequest, Token, UsuarioCreate, UsuarioResponse
from app.services.auth_service import (
    create_access_token,
    decode_token,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/usuarios/login/token", auto_error=False)


def get_current_user(token: Optional[str] = Depends(oauth2_scheme)) -> Optional[dict]:
    if not token:
        return None
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token invalido o expirado")
    return payload


def require_admin(current_user: Optional[dict] = Depends(get_current_user)) -> dict:
    if not current_user or current_user.get("rol") != "admin":
        raise HTTPException(status_code=403, detail="Se requiere rol de administrador")
    return current_user


@router.post("/register", response_model=UsuarioResponse)
def register(usuario: UsuarioCreate, current_user: Optional[dict] = Depends(get_current_user)):
    if usuarios_collection.find_one({"email": usuario.email}):
        raise HTTPException(status_code=400, detail="El email ya esta registrado")

    total_users = usuarios_collection.count_documents({})
    if total_users == 0:
        if usuario.rol != "admin":
            raise HTTPException(
                status_code=400,
                detail="El primer usuario del sistema debe ser admin",
            )
    else:
        require_admin(current_user)

    data = usuario.model_dump(mode="json")
    data["password"] = hash_password(data["password"])
    result = usuarios_collection.insert_one(data)

    return UsuarioResponse(
        id=str(result.inserted_id),
        nombre=usuario.nombre,
        email=usuario.email,
        rol=usuario.rol,
    )


@router.post("/login", response_model=Token)
def login(request: LoginRequest):
    user = usuarios_collection.find_one({"email": request.email})
    if not user or not verify_password(request.password, user["password"]):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    token = create_access_token(
        {
            "sub": str(user["_id"]),
            "email": user["email"],
            "rol": user["rol"],
            "nombre": user["nombre"],
        }
    )
    return Token(
        access_token=token,
        token_type="bearer",
        rol=user["rol"],
        nombre=user["nombre"],
    )


@router.post("/login/token", response_model=Token)
def login_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = usuarios_collection.find_one({"email": form_data.username})
    if not user or not verify_password(form_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    token = create_access_token(
        {
            "sub": str(user["_id"]),
            "email": user["email"],
            "rol": user["rol"],
            "nombre": user["nombre"],
        }
    )
    return Token(
        access_token=token,
        token_type="bearer",
        rol=user["rol"],
        nombre=user["nombre"],
    )


@router.get("/me")
def get_me(current_user: Optional[dict] = Depends(get_current_user)):
    if not current_user:
        raise HTTPException(status_code=401, detail="No autenticado")
    return current_user
@router.get("/lista")
def listar_usuarios(current_user: dict = Depends(require_admin)):
    usuarios = list(usuarios_collection.find())
    return [
        {
            "id": str(usuario["_id"]),
            "nombre": usuario["nombre"],
            "email": usuario["email"],
            "rol": usuario["rol"],
        }
        for usuario in usuarios
    ]