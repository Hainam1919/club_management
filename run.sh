#!/bin/bash
# Script khởi động nhanh - CLB Student Hub
cd "$(dirname "$0")"
source venv/bin/activate 2>/dev/null || venv\Scripts\activate

ENV_FILE=".env"
if [ ! -f "$ENV_FILE" ]; then
    echo "📄 Tạo .env từ mẫu..."
    cp .env.example .env
fi

echo "📥 Cài đặt dependencies..."
pip install -q -r requirements.txt

PORT=$(grep "^APP_PORT=" "$ENV_FILE" | cut -d= -f2 2>/dev/null || echo 9000)
echo "✅ Khởi động server tại http://localhost:$PORT"
echo "📖 API Docs: http://localhost:$PORT/docs"
echo ""

python -m uvicorn app.main:app --reload --port "$PORT" --host 0.0.0.0
