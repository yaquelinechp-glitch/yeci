#!/usr/bin/env bash
set -e

cd backend

# Migraciones de base de datos
python manage.py migrate --noinput || echo "migrate fallo (continua)"

# Recopilar estáticos (whitenoise)
python manage.py collectstatic --noinput || echo "collectstatic fallo (continua)"

# Iniciar servidor
exec gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 2
