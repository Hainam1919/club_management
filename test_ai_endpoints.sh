#!/bin/bash

# Test AI Pages Endpoints

BASE_URL="http://localhost:8000/api"
HEADERS="Content-Type: application/json"

echo "========== Testing AI Pages Endpoints =========="
echo ""

# 1. Test AI Chat Stream
echo "1. Testing POST /ai/chat/stream"
curl -X POST "$BASE_URL/ai/chat/stream" \
  -H "$HEADERS" \
  -d '{"message": "Xin chào", "session_id": "test-1", "context": "general"}' \
  -w "\nStatus: %{http_code}\n\n"

# 2. Test Mentor Chat
echo "2. Testing POST /ai/mentor-chat"
curl -X POST "$BASE_URL/ai/mentor-chat" \
  -H "$HEADERS" \
  -d '{"message": "Tôi muốn phát triển kỹ năng gì?", "club_id": 1, "session_id": "test-1"}' \
  -w "\nStatus: %{http_code}\n\n"

# 3. Test Strategy Advice
echo "3. Testing POST /ai/strategy-advice"
curl -X POST "$BASE_URL/ai/strategy-advice" \
  -H "$HEADERS" \
  -d '{"club_data": {"club_id": 1, "goals": "Tăng thành viên từ 20 lên 50"}, "session_id": "test-1"}' \
  -w "\nStatus: %{http_code}\n\n"

# 4. Test Event Planning
echo "4. Testing POST /ai/event-planning"
curl -X POST "$BASE_URL/ai/event-planning" \
  -H "$HEADERS" \
  -d '{"club_id": 1, "event_data": {"type": "workshop", "description": "Workshop về AI"}, "session_id": "test-1"}' \
  -w "\nStatus: %{http_code}\n\n"

# 5. Test Media Content
echo "5. Testing POST /ai/media-content"
curl -X POST "$BASE_URL/ai/media-content" \
  -H "$HEADERS" \
  -d '{"club_id": 1, "content_type": "post", "topics": "Tuyên bố tuyển thành viên", "session_id": "test-1"}' \
  -w "\nStatus: %{http_code}\n\n"

# 6. Test Predictions
echo "6. Testing GET /ai/predictions"
curl -X GET "$BASE_URL/ai/predictions" \
  -H "$HEADERS" \
  -w "\nStatus: %{http_code}\n\n"

# 7. Test Analytics
echo "7. Testing GET /ai/analytics"
curl -X GET "$BASE_URL/ai/analytics" \
  -H "$HEADERS" \
  -w "\nStatus: %{http_code}\n\n"

# 8. Test Trends
echo "8. Testing GET /ai/trends"
curl -X GET "$BASE_URL/ai/trends" \
  -H "$HEADERS" \
  -w "\nStatus: %{http_code}\n\n"

# 9. Test Leaderboard
echo "9. Testing GET /stats/leaderboard"
curl -X GET "$BASE_URL/stats/leaderboard?period=month" \
  -H "$HEADERS" \
  -w "\nStatus: %{http_code}\n\n"

# 10. Test My Rank (requires auth token)
echo "10. Testing GET /stats/leaderboard/my-rank"
echo "Note: This requires authentication token"
echo "curl -X GET \"$BASE_URL/stats/leaderboard/my-rank\" \\"
echo "  -H \"$HEADERS\" \\"
echo "  -H \"Authorization: Bearer YOUR_TOKEN\" \\"
echo "  -w \"\\nStatus: %{http_code}\\n\\n\""

echo ""
echo "========== All endpoint tests completed =========="
