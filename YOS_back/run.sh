#!/bin/sh
set -e

python manage.py collectstatic --noinput
python manage.py makemigrations
python manage.py migrate

# Use gunicorn instead of runserver
gunicorn backend_YOS.wsgi:application --bind 0.0.0.0:8000