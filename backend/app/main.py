from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from app.routes import qr, tableros, usuarios

app = FastAPI(title="Sistema de Gestion de Tableros Electricos")

frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
extra_origins = os.getenv("FRONTEND_URLS", "")
allow_origins = [frontend_url]
if extra_origins.strip():
    allow_origins.extend(
        origin.strip() for origin in extra_origins.split(",") if origin.strip()
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(usuarios.router)
app.include_router(tableros.router)
app.include_router(qr.router)


@app.get("/")
def root():
    return {"mensaje": "API funcionando correctamente"}