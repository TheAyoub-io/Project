from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .routers import auth, applications, admin, rooms, notifications, chat, payment, tickets
from .models.database import engine, Base

import sys
import os

# Create tables and auto-seed admin automatically on startup (unless running tests)
if "pytest" not in sys.modules:
    Base.metadata.create_all(bind=engine)
    try:
        from .models.database import SessionLocal
        from .models.models import User, UserRole
        from .auth.security import get_password_hash

        db = SessionLocal()
        admin_email = os.getenv("ADMIN_EMAIL", "tarikkhalfaoui4@gmail.com")
        admin_pass = os.getenv("ADMIN_PASSWORD", "spark_sql")
        existing_admin = db.query(User).filter(User.email == admin_email).first()
        if not existing_admin:
            new_admin = User(
                email=admin_email,
                hashed_password=get_password_hash(admin_pass),
                role=UserRole.ADMIN
            )
            db.add(new_admin)
            print(f"[INFO] Admin user {admin_email} created automatically.")
        else:
            existing_admin.hashed_password = get_password_hash(admin_pass)
            existing_admin.role = UserRole.ADMIN

        # Compte admin de secours
        fallback_email = "admin@internat.com"
        fallback_pass = "admin123"
        existing_fallback = db.query(User).filter(User.email == fallback_email).first()
        if not existing_fallback:
            db.add(User(
                email=fallback_email,
                hashed_password=get_password_hash(fallback_pass),
                role=UserRole.ADMIN
            ))
        else:
            existing_fallback.hashed_password = get_password_hash(fallback_pass)
            existing_fallback.role = UserRole.ADMIN

        db.commit()
        db.close()
    except Exception as e:
        print(f"[WARNING] Auto-seed admin error: {e}")

app = FastAPI(
    title="Internat Admission System API",
    description="Backend API for managing internat admissions with JWT authentication.",
    version="1.0.0"
)

# CORS Middleware setup
origins = [
    "http://localhost:3000",      # CRA default port
    "http://127.0.0.1:3000",
    "http://localhost:5173",      # Vite default port
    "http://127.0.0.1:5173",
    "http://localhost:5174",    
    "http://127.0.0.1:5174",
    "http://localhost",           # Capacitor default Android origin
    "capacitor://localhost",      # Capacitor default iOS origin
    "ionic://localhost",          # Alternative mobile origin
]

frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(applications.router)
app.include_router(admin.router)
app.include_router(rooms.router)
app.include_router(notifications.router)
app.include_router(chat.router)
app.include_router(payment.router)
app.include_router(tickets.router)

from fastapi import WebSocket, WebSocketDisconnect, Depends
from .websockets import manager
from .auth.dependencies import get_user_from_token
from .models.database import get_db
from sqlalchemy.orm import Session

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str, db: Session = Depends(get_db)):
    user = await get_user_from_token(token, db)
    if not user:
        await websocket.close(code=1008)
        return
        
    await manager.connect(websocket, user.id)
    try:
        while True:
            data = await websocket.receive_text()
            # Handle incoming WS messages if needed
    except WebSocketDisconnect:
        manager.disconnect(websocket, user.id)

from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError
import logging

logger = logging.getLogger(__name__)

@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(request, exc):
    logger.error(f"Database error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Une erreur de base de données est survenue. Veuillez réessayer plus tard."}
    )

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Global error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Une erreur inattendue est survenue."}
    )



# Serve uploaded documents
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/")
def read_root():
    return {"message": "Welcome to the Internat Admission System API"}
