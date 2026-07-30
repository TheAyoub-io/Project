from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
import ssl
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    # Normalize prefix
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

    # Remove sslmode from URL (handled separately via connect_args)
    if "sslmode=" in DATABASE_URL:
        import re
        DATABASE_URL = re.sub(r'[?&]sslmode=[^&]*', '', DATABASE_URL)
        # Clean trailing ? or &
        DATABASE_URL = DATABASE_URL.rstrip('?').rstrip('&')

    # Use pg8000 driver (pure Python, works on Vercel Lambda)
    if "pg8000" not in DATABASE_URL:
        DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+pg8000://", 1)

    # Configure SSL context for Neon.tech
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE

    engine = create_engine(
        DATABASE_URL,
        connect_args={"ssl_context": ssl_context},
        pool_pre_ping=True,
    )
else:
    # Safe fallback for serverless environment without env variables
    DATABASE_URL = "sqlite:////tmp/app_fallback.db"
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
