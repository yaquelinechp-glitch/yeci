"""Elimina los cursos existentes y crea el curso de partners de 5 fases.
Uso: Get-Content seed_partner_course.py | python manage.py shell
"""
from prm.models import Course, Certification

print("Cursos antes:", list(Course.objects.values_list("id", flat=True)))

# 1) Borrar todo (cascada: videos, quizzes, progreso, assignments, ratings, resultados)
deleted, _ = Course.objects.get_queryset().delete()
print("Objetos eliminados en cascada:", deleted)

# Limpiar certificaciones viejas (arranque limpio del nuevo programa)
Certification.objects.all().delete()

# 2) Crear el curso de partners con 5 fases
course = Course.objects.create(
    title={
        "en": "aconso Partner Academy Program",
        "es": "Programa aconso Partner Academy",
        "de": "aconso Partner Academy Programm",
    },
    description={
        "en": (
            "Complete training program for aconso partners in 5 phases. "
            "Each phase combines videos and quizzes; at the end of phase 5 you take the "
            "final certification exam. With a grade above 80 you obtain your Partner certification."
        ),
        "es": (
            "Programa de formación completo para partners de aconso en 5 fases. "
            "Cada fase combina vídeos y quizzes; al terminar la fase 5 rindes el examen "
            "final de certificación. Con nota mayor a 80 obtienes tu certificación Partner."
        ),
        "de": (
            "Vollständiges Schulungsprogramm für aconso-Partner in 5 Phasen. "
            "Jede Phase kombiniert Videos und Quizfragen; am Ende von Phase 5 legst du die "
            "abschließende Zertifizierungsprüfung ab. Mit einer Note über 80 erhältst du deine Partner-Zertifizierung."
        ),
    },
    category="onboarding",
    level="beginner",
    track="todas",
    status="publicado",
    related_products=["dpa", "hr_doc_box", "scan_services", "insights"],
    pass_mark=81,  # requiere nota > 80
    validity_months=12,
    quiz_questions_count=8,
    exam_questions_count=10,
    phase_config=[
        {"phase": 1, "days": 3},
        {"phase": 2, "days": 4},
        {"phase": 3, "days": 5},
        {"phase": 4, "days": 5},
        {"phase": 5, "days": 7},
    ],
)
print("Curso creado:", course.id, "| fases:", len(course.phase_config), "| pass_mark:", course.pass_mark)
