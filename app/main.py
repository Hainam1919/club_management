"""
Hệ thống Quản lý Câu lạc bộ Sinh viên - Tích hợp AI
Main Application Entrypoint
"""
import os
import sys
import logging
import structlog
from fastapi import FastAPI, Request, Depends, Response, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.exceptions import RequestValidationError, HTTPException
from contextlib import asynccontextmanager
from datetime import datetime, timezone
import json as json_lib
from collections import defaultdict, deque
import time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.config import settings
from app.database import init_db, ensure_indexes, SessionLocal
from app.seed import seed_data
from app.routers import (
    auth, clubs, events, posts, ai, stats, notification, members, polls,
    extras2, qr, reactions, admin, ai_advanced, final5, upload,
)

# Structured logging
logging.basicConfig(level=settings.LOG_LEVEL, format="%(message)s")
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.dev.ConsoleRenderer() if settings.APP_ENV == "development"
        else structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.stdlib.BoundLogger,
    logger_factory=structlog.stdlib.LoggerFactory(),
)
logger = structlog.get_logger("club_management")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Khởi tạo dữ liệu khi khởi động ứng dụng"""
    logger.info("Khởi động hệ thống CLB Student Hub", env=settings.APP_ENV)
    init_db()
    ensure_indexes()
    await seed_data()
    logger.info("Hệ thống đã sẵn sàng và hoạt động", port=settings.APP_PORT)
    yield
    logger.info("Tắt hệ thống")


app = FastAPI(
    title="CLB Student Hub - Hệ thống Quản lý Câu lạc bộ Tích hợp AI",
    description="API quản lý CLB sinh viên với Cognitive AI Reasoning, Hybrid RAG, Quản lý sự kiện, Chứng chỉ số",
    version="2.5.0",
    lifespan=lifespan,
)

# Compress large JSON responses for faster transfer
app.add_middleware(GZipMiddleware, minimum_size=500)


# Security Headers Middleware
_security_headers = {
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
}


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    for header, value in _security_headers.items():
        response.headers[header] = value
    if settings.APP_ENV == "production":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


# Rate Limiting Middleware
_rate_limit_store: dict[str, deque] = defaultdict(deque)


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    client_ip = request.client.host if request.client else "unknown"
    now = time.time()
    window = 60
    max_requests = 300

    dq = _rate_limit_store[client_ip]
    while dq and dq[0] < now - window:
        dq.popleft()

    if len(dq) >= max_requests:
        return JSONResponse(
            status_code=429,
            content={"detail": "Quá nhiều yêu cầu. Vui lòng thử lại sau."},
            headers={"Retry-After": str(window)},
        )

    dq.append(now)
    response = await call_next(request)
    response.headers["X-RateLimit-Limit"] = str(max_requests)
    response.headers["X-RateLimit-Remaining"] = str(max(0, max_requests - len(dq)))
    return response


# CORS
_origins_raw = settings.BACKEND_CORS_ORIGINS if isinstance(settings.BACKEND_CORS_ORIGINS, list) else [settings.BACKEND_CORS_ORIGINS]
_is_wildcard = _origins_raw == ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins_raw,
    allow_credentials=not _is_wildcard,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-RateLimit-Limit", "X-RateLimit-Remaining"],
)


# Exception Handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"detail": "Dữ liệu không hợp lệ", "errors": exc.errors()}
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )


# Routers
app.include_router(auth.router)
app.include_router(clubs.router)
app.include_router(events.router)
app.include_router(posts.router)
app.include_router(ai.router)
app.include_router(ai_advanced.router)
app.include_router(stats.router)
app.include_router(notification.router)
app.include_router(members.router)
app.include_router(polls.router)
app.include_router(extras2.router)
app.include_router(qr.router)
app.include_router(reactions.router)
app.include_router(admin.router)
app.include_router(final5.router)
app.include_router(upload.router)

# Static & Upload Files
UPLOADS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
if os.path.exists(UPLOADS_DIR):
    app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

FRONTEND_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend")
if os.path.exists(FRONTEND_DIR):
    app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")


@app.get("/manifest.json")
async def serve_manifest():
    return FileResponse(os.path.join(FRONTEND_DIR, "manifest.json"), media_type="application/manifest+json")


@app.get("/service-worker.js")
async def serve_sw():
    return FileResponse(os.path.join(FRONTEND_DIR, "service-worker.js"), media_type="application/javascript")


@app.get("/")
async def root():
    index_path = os.path.join(FRONTEND_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "Hệ thống Quản lý CLB Sinh viên - AI Powered", "docs": "/docs"}


@app.get("/dashboard")
@app.get("/clubs")
@app.get("/events")
@app.get("/ai-assistant")
@app.get("/profile")
@app.get("/login")
@app.get("/register")
async def serve_page():
    index_path = os.path.join(FRONTEND_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "Frontend not built"}


@app.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}


# WebSocket Realtime Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: dict = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: int):
        if user_id in self.active_connections:
            try:
                self.active_connections[user_id].remove(websocket)
            except ValueError:
                pass

    async def send_personal(self, user_id: int, message: dict):
        if user_id in self.active_connections:
            for ws in self.active_connections[user_id]:
                try:
                    await ws.send_json(message)
                except Exception:
                    pass

    async def broadcast(self, message: dict):
        for user_id, connections in self.active_connections.items():
            for ws in connections:
                try:
                    await ws.send_json(message)
                except Exception:
                    pass


manager = ConnectionManager()


@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    await manager.connect(websocket, user_id)
    try:
        await websocket.send_json({
            "type": "connected",
            "user_id": user_id,
            "message": "Connected to CLB Hub real-time"
        })

        while True:
            data = await websocket.receive_text()
            try:
                msg = json_lib.loads(data)
                msg_type = msg.get("type")

                if msg_type == "ping":
                    await websocket.send_json({"type": "pong", "timestamp": datetime.now(timezone.utc).isoformat()})
                elif msg_type == "broadcast":
                    await manager.broadcast({
                        "type": "broadcast",
                        "data": msg.get("data"),
                        "from": user_id,
                        "timestamp": datetime.now(timezone.utc).isoformat()
                    })
            except json_lib.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
    except Exception as e:
        logger.error("Lỗi WebSocket", error=str(e), exc_info=True)
        manager.disconnect(websocket, user_id)


@app.post("/api/realtime/notify")
async def send_realtime_notification(payload: dict):
    user_id = payload.get("user_id")
    message = payload.get("message", "")
    data = payload.get("data", {})

    if user_id:
        await manager.send_personal(user_id, {
            "type": "notification",
            "message": message,
            "data": data,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        return {"sent": True}

    await manager.broadcast({
        "type": "notification",
        "message": message,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    return {"sent": True, "broadcast": True}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=9000, reload=True)
