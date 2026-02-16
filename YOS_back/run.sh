#!/bin/sh
# Exit on error
set -e

echo "Applying database migrations..."
python manage.py migrate --noinput

echo "Starting Gunicorn..."
gunicorn backend_YOS.wsgi:application --bind 0.0.0.0:10000