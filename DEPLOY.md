# Despliegue

App Django + React desplegada en Render (`render.yaml`) usando PostgreSQL.

## Arquitectura

- `backend/` — Django 6 + DRF, sirve la API (`/api/`), el admin (`/admin/`) y el build del frontend.
- `frontend/` — React/Vite; Render ejecuta `npm run build:prod` y Django sirve `frontend/dist`.
- `DATABASE_URL` — si está definida, se usa PostgreSQL; si no, SQLite local (`backend/db.sqlite3`).

## Variables de entorno

| Variable | Obligatoria | Descripción |
| --- | --- | --- |
| `SECRET_KEY` | Sí (prod) | Render la genera automáticamente. |
| `DEBUG` | Sí | `False` en producción. |
| `ALLOWED_HOSTS` | Sí | Dominios separados por coma (`.onrender.com,...`). |
| `DATABASE_URL` | Recomendada | Cadena `postgresql://usuario:clave@host:puerto/base`. |
| `AI_PROVIDER` | No | `demo`, `gemini`, `groq`, `deepseek` o `anthropic`. |
| `GEMINI_API_KEY` / `GROQ_API_KEY` / `DEEPSEEK_API_KEY` / `ANTHROPIC_API_KEY` | Según proveedor | Claves de los proveedores de IA. |

En local no hace falta nada: sin `DATABASE_URL` se usa SQLite.

## Base de datos

`render.yaml` define una base Render Postgres llamada `yeci-db` y conecta
`DATABASE_URL` automáticamente.

> ⚠️ El plan `free` de Render Postgres **caduca a los 30 días**. Antes de eso:
> - cambia `plan: free` por `plan: 0.5c-1g` en `render.yaml` (de pago), o
> - crea una base en Neon/Supabase y define `DATABASE_URL` a mano en el dashboard
>   (elimina el bloque `databases:` y la referencia `fromDatabase`).

Las migraciones se aplican al inicio (`python manage.py migrate --noinput`).

### Datos de ejemplo

`python manage.py seed_data` **solo siembra si la base está vacía**; ya no borra
datos existentes. Para reiniciar los datos demo de forma explícita:

```bash
python manage.py seed_data --reset
```

Al cambiar de SQLite a PostgreSQL la base arranca vacía y se siembra sola en el
primer arranque.

## Archivos subidos (videos, materiales)

Se guardan en `backend/uploads/` y se sirven en `/uploads/...` (también con
`DEBUG=False`). En el plan free de Render el disco es efímero: **se pierden en
cada deploy/reinicio**. Para conservarlos hace falta:

- un disco persistente de Render (solo planes de pago), o
- almacenamiento externo (S3/R2/Supabase Storage).

## Verificar el despliegue

```bash
curl -I https://yeci.onrender.com/          # 200 + index.html
curl -s https://yeci.onrender.com/api/...   # API
```

Panel de administración: `https://yeci.onrender.com/admin/` (usuario demo
`admin@aconso.com` / `admin123`; cámbialo en producción).
