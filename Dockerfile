######################################
# Dockerfile for CLB Student Hub Backend
# Build & runtime image (Python 3.11-slim)
######################################
FROM python:3.11-slim AS base

# Metadata
LABEL org.opencontainers.image.title="CLB Student Hub"
LABEL org.opencontainers.image.description="Hệ thống Quản lý Câu lạc bộ Sinh viên - Tích hợp AI"
LABEL org.opencontainers.image.source="https://github.com/ictu/club-management"

# Set working directory
WORKDIR /app

# Install system dependencies for qrcode[pil], Pillow, psycopg2, etc.
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc default-libpq-dev && \
    rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt gunicorn

# Create data directory for SQLite (if used)
RUN mkdir -p /app/data /app/uploads /app/frontend

# Copy application code
COPY app/ /app/app/
COPY frontend/ /app/frontend/
COPY run.sh /app/run.sh
COPY .env.example /app/.env.example

# Make data and uploads writable
RUN chmod +x /app/run.sh && \
    chmod -R 777 /app/data /app/uploads /app/frontend

# Expose port
EXPOSE 9000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD python -c "import urllib.request,json; r=urllib.request.urlopen('http://localhost:9000/health'); print(r.read()[:200]) if r.status==200 else exit(1)" || exit 1

# Use gunicorn for production, with Uvicorn workers
CMD ["sh", "-c", "if [ \"$APP_ENV\" = \"development\" ]; then exec uvicorn app.main:app --host $APP_HOST --port $APP_PORT --reload; else exec gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app --bind $APP_HOST:$APP_PORT; fi"]
