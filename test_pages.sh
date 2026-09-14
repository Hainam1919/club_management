#!/bin/bash

echo "=== TESTING AI ENDPOINTS ==="
echo ""

# Test 1: AI Chat
echo "1. Testing AI Chat..."
curl -s -X POST http://localhost:9000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Test","context":"general"}' | jq . 2>/dev/null || echo "❌ AI Chat failed"

echo ""
echo "2. Testing Predictions..."
curl -s http://localhost:9000/api/ai/predictions | jq . 2>/dev/null || echo "❌ Predictions failed"

echo ""
echo "3. Testing Leaderboard..."
curl -s http://localhost:9000/api/stats/leaderboard | jq '.[] | {id, full_name, total_points}' 2>/dev/null | head -10 || echo "❌ Leaderboard failed"

echo ""
echo "4. Testing Mentor Chat..."
curl -s -X POST http://localhost:9000/api/ai/mentor-chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Help me","user_id":1}' | jq . 2>/dev/null || echo "❌ Mentor failed"

echo ""
echo "=== Test Complete ==="
