import sys
import os

root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from fastapi import FastAPI
from fastapi.responses import JSONResponse

app = FastAPI()

@app.get("/")
def root():
    return {"message": "Welcome to the Internat Admission System API", "status": "ok"}

@app.get("/health")
def health():
    errors = []
    try:
        import sqlalchemy
    except Exception as e:
        errors.append(f"sqlalchemy: {e}")
    try:
        import psycopg2
    except Exception as e:
        errors.append(f"psycopg2: {e}")
    try:
        import pg8000
    except Exception as e:
        errors.append(f"pg8000: {e}")
    try:
        import passlib
    except Exception as e:
        errors.append(f"passlib: {e}")
    try:
        from app.main import app as real_app
        return {"status": "full_app_loaded", "errors": errors}
    except Exception as e:
        errors.append(f"app.main: {str(e)}")
    return {"status": "minimal_only", "import_errors": errors}
