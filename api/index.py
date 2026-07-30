import sys
import os
import traceback

root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

try:
    from app.main import app
except Exception as e:
    from fastapi import FastAPI
    from fastapi.responses import HTMLResponse
    
    app = FastAPI()
    error_trace = traceback.format_exc()
    
    @app.api_route("/{full_path:path}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"])
    def catch_all(full_path: str):
        return HTMLResponse(
            content=f"<h2>Backend Import Error on Vercel</h2><pre style='background:#f4f4f4;padding:15px;border-radius:8px;'>{error_trace}</pre>",
            status_code=500
        )
