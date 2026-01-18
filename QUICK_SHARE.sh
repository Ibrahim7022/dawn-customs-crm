#!/bin/bash

# Quick Share Script - Creates a temporary public link to your CRM

echo "🚀 Starting CRM Dev Server..."
npm run dev &
DEV_PID=$!

echo "⏳ Waiting for server to start..."
sleep 5

echo "🌐 Creating public tunnel..."
echo ""
echo "📋 Copy the HTTPS URL below and share it!"
echo "⚠️  Keep this terminal open - link works as long as server runs"
echo ""

ngrok http 5173

# Cleanup on exit
trap "kill $DEV_PID 2>/dev/null" EXIT
