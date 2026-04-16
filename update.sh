#!/bin/bash
set -e

echo "🔄 Starte Update-Prozess..."

echo "📥 Lade neueste Änderungen von Git herunter..."
git pull origin main

echo "🏗️ Baue und starte Docker-Container neu..."
docker compose up -d --build

echo "🧹 Räume alte Docker-Images auf..."
docker image prune -f

echo "✅ Update erfolgreich abgeschlossen!"
