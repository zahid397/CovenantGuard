#!/usr/bin/env bash
set -o errexit

echo "🔹 Installing dependencies..."
pip install -r requirements.txt

echo "🔹 Running migrations..."
python manage.py migrate --noinput

echo "🔹 Seeding demo data..."
python manage.py seed_db || echo "Seed already exists, skipping."

echo "✅ Build completed successfully."
