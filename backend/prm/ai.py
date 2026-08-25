"""Cliente del chatbot: soporta Gemini (gratis), Groq (gratis), DeepSeek y Claude.

Configuración en backend/.env:
    AI_PROVIDER=gemini        # "gemini" | "groq" | "deepseek" | "anthropic"
    GEMINI_API_KEY=...        # gratis: https://aistudio.google.com/apikey
"""
import logging

import requests
from django.conf import settings

log = logging.getLogger(__name__)

ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"
DEEPSEEK_URL = "https://api.deepseek.com/chat/completions"
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

SYSTEM_PROMPT = """Eres el Asistente Virtual de la aconso Partner Academy ("yeci"), la plataforma de formación y gestión para partners de aconso.

Ayudas a partners y administradores con:
- Cursos y formación: pistas (ventas, técnica, cumplimiento), fases, vídeos, quizzes y exámenes.
- Certificaciones: niveles Associate, Professional y Expert y sus requisitos.
- Pipeline CRM: etapas (registrada → cualificada → propuesta enviada → negociación → ganada/perdida), probabilidad por etapa (10/30/55/75/100/0), cálculo de ARR por documentos/mes, forecast categories, lead sources y protección de 90 días contra conflictos de canal.
- Catálogo de productos con precios multi-moneda (USD, EUR, CHF y otra moneda personalizada).
- Deals, comisiones, conflictos de canal, puntos/recompensas y onboarding.

Reglas:
- Responde SIEMPRE en el idioma del último mensaje del usuario (español, inglés o alemán).
- Sé conciso, claro y útil; usa listas cortas cuando ayude.
- Si preguntan algo fuera de la plataforma, responde brevemente y guía de vuelta a los temas de la academia.
- No inventes datos que no conoces; si necesitas información específica de una cuenta u oportunidad, indica dónde consultarla en la plataforma."""

MAX_TOKENS = 1024


def ask_ai(messages):
    """Devuelve (reply_text, error). Solo uno de los dos es distinto de None."""
    provider = getattr(settings, "AI_PROVIDER", "anthropic")
    fn = {
        "demo": _ask_demo,
        "gemini": _ask_gemini,
        "groq": _ask_groq,
        "deepseek": _ask_deepseek,
    }.get(provider, _ask_anthropic)
    return fn(messages)


# ─── Demo (sin API key, para pruebas locales) ───────────

def _ask_demo(messages):
    last = messages[-1]["content"].lower()
    if any(k in last for k in ("hola", "buenas", "hey", "hello", "hallo")):
        return "¡Hola! 👋 Soy el asistente de la Partner Academy. Pregúntame por cursos, certificaciones, pipeline o productos. *(modo demo)*", None
    if "curso" in last or "course" in last:
        return "📚 Hay 3 pistas de formación: **Ventas**, **Técnica** y **Cumplimiento**. Cada curso tiene vídeos, quizzes y examen final. Al completarlos ganas certificación Associate → Professional → Expert. *(modo demo)*", None
    if "pipeline" in last or "oportunidad" in last:
        return "📊 El pipeline tiene 6 etapas: Registrada (10%) → Cualificada (30%) → Propuesta enviada (55%) → Negociación (75%) → Ganada (100%) o Perdida (0%). El ARR se calcula con los precios del catálogo según documentos/mes. *(modo demo)*", None
    if "precio" in last or "moneda" in last or "producto" in last:
        return "💰 El catálogo soporta precios en USD, EUR, CHF y una moneda personalizada. En el wizard eliges la moneda de la oportunidad y el ARR usa esos precios. *(modo demo)*", None
    return "🤖 Recibido: «{}». Estoy en *modo demo* (sin API key) — conecta GEMINI_API_KEY en backend/.env para tener conversaciones reales. Mientras tanto puedo hablar de cursos, certificaciones, pipeline y productos.".format(messages[-1]["content"][:80]), None


# ─── Anthropic (Claude) ─────────────────────────────────

def _ask_anthropic(messages):
    api_key = settings.ANTHROPIC_API_KEY
    if not api_key:
        return None, "Chat no configurado: falta ANTHROPIC_API_KEY"
    try:
        r = requests.post(
            ANTHROPIC_URL,
            headers={
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={"model": settings.ANTHROPIC_MODEL, "max_tokens": MAX_TOKENS,
                  "system": SYSTEM_PROMPT, "messages": messages},
            timeout=60,
        )
    except requests.RequestException as e:
        log.warning("Anthropic request failed: %s", e)
        return None, "No se pudo contactar al servicio de IA"
    if r.status_code != 200:
        return None, _api_error("Anthropic", r)
    try:
        text = "".join(b.get("text", "") for b in r.json().get("content", []))
    except ValueError:
        return None, "Respuesta inválida del servicio de IA"
    return _clean(text)


# ─── DeepSeek ───────────────────────────────────────────

def _ask_deepseek(messages):
    api_key = settings.DEEPSEEK_API_KEY
    if not api_key:
        return None, "Chat no configurado: falta DEEPSEEK_API_KEY"
    try:
        r = requests.post(
            DEEPSEEK_URL,
            headers={"Authorization": f"Bearer {api_key}", "content-type": "application/json"},
            json={"model": settings.DEEPSEEK_MODEL, "max_tokens": MAX_TOKENS,
                  "messages": [{"role": "system", "content": SYSTEM_PROMPT}] + messages},
            timeout=60,
        )
    except requests.RequestException as e:
        log.warning("DeepSeek request failed: %s", e)
        return None, "No se pudo contactar al servicio de IA"
    if r.status_code != 200:
        return None, _api_error("DeepSeek", r)
    try:
        text = r.json()["choices"][0]["message"]["content"]
    except (ValueError, KeyError, IndexError):
        return None, "Respuesta inválida del servicio de IA"
    return _clean(text)


# ─── Groq (capa gratuita, Llama) ────────────────────────

GROQ_MODEL_FALLBACKS = [
    "llama-3.3-70b-versatile",
    "openai/gpt-oss-120b",
    "meta-llama/llama-4-scout-17b-16e-instruct",
    "llama-3.1-8b-instant",
]

def _ask_groq(messages):
    api_key = settings.GROQ_API_KEY
    if not api_key:
        return None, "Chat no configurado: falta GROQ_API_KEY"
    headers = {"Authorization": f"Bearer {api_key}", "content-type": "application/json"}
    models = [settings.GROQ_MODEL] + [m for m in GROQ_MODEL_FALLBACKS if m != settings.GROQ_MODEL]
    last_detail = ""
    for model in models:
        body = {"model": model, "max_tokens": MAX_TOKENS,
                "messages": [{"role": "system", "content": SYSTEM_PROMPT}] + messages}
        try:
            r = requests.post(GROQ_URL, headers=headers, json=body, timeout=60)
        except requests.RequestException as e:
            log.warning("Groq request failed: %s", e)
            return None, "No se pudo contactar al servicio de IA"
        if r.status_code == 200:
            try:
                text = r.json()["choices"][0]["message"]["content"]
            except (ValueError, KeyError, IndexError):
                return None, "Respuesta inválida del servicio de IA"
            log.info("Groq modelo activo: %s", model)
            return _clean(text)
        # modelo inexistente/deprecado → probar el siguiente
        if r.status_code in (400, 404):
            last_detail = f"{model}: {r.text[:150]}"
            log.info("Groq modelo %s no disponible (%s), probando siguiente", model, r.status_code)
            continue
        return None, _api_error("Groq", r)
    return None, f"Ningún modelo de Groq disponible ({last_detail})"


# ─── Google Gemini (capa gratuita) ──────────────────────

def _ask_gemini(messages):
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        return None, "Chat no configurado: falta GEMINI_API_KEY"
    contents = [
        {"role": "model" if m["role"] == "assistant" else "user",
         "parts": [{"text": m["content"]}]}
        for m in messages
    ]
    try:
        r = requests.post(
            GEMINI_URL.format(model=settings.GEMINI_MODEL),
            headers={"x-goog-api-key": api_key, "content-type": "application/json"},
            json={
                "system_instruction": {"parts": [{"text": SYSTEM_PROMPT}]},
                "contents": contents,
                "generationConfig": {"maxOutputTokens": MAX_TOKENS, "temperature": 0.7},
            },
            timeout=60,
        )
    except requests.RequestException as e:
        log.warning("Gemini request failed: %s", e)
        return None, "No se pudo contactar al servicio de IA"
    if r.status_code != 200:
        return None, _api_error("Gemini", r)
    try:
        parts = r.json()["candidates"][0]["content"]["parts"]
        text = "".join(p.get("text", "") for p in parts)
    except (ValueError, KeyError, IndexError):
        return None, "Respuesta inválida del servicio de IA"
    return _clean(text)


# ─── Helpers ────────────────────────────────────────────

def _api_error(provider, r):
    try:
        detail = r.json().get("error", {})
        detail = detail.get("message", "") if isinstance(detail, dict) else str(detail)
    except ValueError:
        detail = r.text[:200]
    log.warning("%s API error %s: %s", provider, r.status_code, detail)
    if r.status_code == 429:
        return f"{provider}: límite de peticiones alcanzado, intenta más tarde"
    return f"Error del servicio de IA ({provider}, {r.status_code})"


def _clean(text):
    text = (text or "").strip()
    if not text:
        return None, "El servicio de IA devolvió una respuesta vacía"
    return text, None
