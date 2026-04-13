from pymongo import MongoClient
from app.config import MONGODB_URL, DATABASE_NAME

client = MongoClient(MONGODB_URL)
db = client[DATABASE_NAME]

# Colecciones
tableros_collection = db["tableros"]
cambios_collection = db["cambios"]
usuarios_collection = db["usuarios"]
qr_collection = db["qr_codes"]
reportes_collection = db["reportes"]