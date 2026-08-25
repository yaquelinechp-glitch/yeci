"""Onboarding checklist (RQ-13): 30/60/90 day partner journey.

Phase 1 "arranque"  (days 0-30):   perfil, compliance track, welcome webinar
Phase 2 "venta"     (days 31-60):  first sales course, certificate, first lead
Phase 3 "expansion" (days 61-90):  first won opportunity, associate level
"""

from django.utils import timezone
from datetime import timedelta

from .models import PartnerOnboarding, PartnerProgress, TrainingResult, Opportunity, Certification, Course


def _award_onboarding_points(partner):
    from .rewards import award_points
    award_points(partner, "onboarding", note="30/60/90 journey completed", source_type="onboarding", source_id=partner.id)

ONBOARDING_PHASES = [
    {
        "key": "arranque",
        "days": 30,
        "steps": [
            {"key": "perfil", "auto": True, "label": {"es": "Completar el perfil de la empresa", "en": "Complete the company profile", "de": "Unternehmensprofil vervollständigen"}},
            {"key": "compliance", "auto": True, "label": {"es": "Aprobar el Compliance Track", "en": "Pass the Compliance Track", "de": "Compliance-Track bestehen"}},
            {"key": "bienvenida", "auto": False, "label": {"es": "Asistir al webinario de bienvenida", "en": "Attend the welcome webinar", "de": "Willkommens-Webinar besuchen"}},
        ],
    },
    {
        "key": "venta",
        "days": 60,
        "steps": [
            {"key": "ventas_track", "auto": True, "label": {"es": "Aprobar el primer curso de ventas", "en": "Pass the first sales course", "de": "Ersten Vertriebskurs bestehen"}},
            {"key": "certificado", "auto": True, "label": {"es": "Descargar el primer certificado", "en": "Download the first certificate", "de": "Erstes Zertifikat herunterladen"}},
            {"key": "lead", "auto": True, "label": {"es": "Registrar la primera oportunidad", "en": "Register the first opportunity", "de": "Erste Opportunity registrieren"}},
        ],
    },
    {
        "key": "expansion",
        "days": 90,
        "steps": [
            {"key": "oportunidad_ganada", "auto": True, "label": {"es": "Ganar la primera oportunidad", "en": "Win the first opportunity", "de": "Erste Opportunity gewinnen"}},
            {"key": "associate", "auto": True, "label": {"es": "Alcanzar el nivel Associate", "en": "Reach Associate level", "de": "Associate-Level erreichen"}},
        ],
    },
]

STEP_ORDER = [s["key"] for p in ONBOARDING_PHASES for s in p["steps"]]


def _auto_step_done(partner, key):
    if key == "perfil":
        return bool((partner.contact_name or "").strip()) and bool((partner.phone or "").strip()) and bool((partner.tax_id or "").strip())
    if key == "compliance":
        ids = list(Course.objects.filter(track="cumplimiento").values_list("id", flat=True))
        if not ids:
            return False
        done = set(PartnerProgress.objects.filter(partner=partner, completed=True).values_list("course_id", flat=True))
        return all(i in done for i in ids)
    if key == "ventas_track":
        done = set(PartnerProgress.objects.filter(partner=partner, completed=True).values_list("course_id", flat=True))
        return Course.objects.filter(id__in=done, track="ventas").exists()
    if key == "certificado":
        return TrainingResult.objects.filter(partner=partner, passed=True).exclude(certificate_url="").exists()
    if key == "lead":
        return Opportunity.objects.filter(partner=partner).exists()
    if key == "oportunidad_ganada":
        return Opportunity.objects.filter(partner=partner, stage="ganada").exists()
    if key == "associate":
        return Certification.objects.filter(partner=partner, level__in=["associate", "professional", "expert"]).exists()
    return False


def onboarding_snapshot(partner, lang="en"):
    try:
        ob = partner.onboarding
    except PartnerOnboarding.DoesNotExist:
        ob = None

    manual = set(ob.manual_steps if ob else [])
    now = timezone.now()
    started_at = ob.started_at if ob else None
    days_in = (now - started_at).days if started_at else 0

    phases = []
    total_steps = 0
    done_steps = 0
    reminders = []
    next_milestone = None

    for phase in ONBOARDING_PHASES:
        phase_steps = []
        phase_done = 0
        for step in phase["steps"]:
            done = step["key"] in manual or _auto_step_done(partner, step["key"])
            days_left = None
            if started_at and not done:
                days_left = max(0, phase["days"] - days_in)
            overdue = False
            if started_at and not done:
                overdue = days_in > phase["days"]
            phase_steps.append({
                "key": step["key"],
                "label": step["label"].get(lang) or step["label"].get("en") or step["key"],
                "auto": step["auto"],
                "done": done,
                "overdue": overdue,
                "days_left": days_left,
            })
            total_steps += 1
            if done:
                done_steps += 1
                phase_done += 1
            elif overdue:
                reminders.append(step["label"].get(lang) or step["label"].get("en") or step["key"])
        phases.append({
            "key": phase["key"],
            "days": phase["days"],
            "steps": phase_steps,
            "done": phase_done,
            "total": len(phase["steps"]),
        })
        if next_milestone is None and phase_done < len(phase["steps"]) and started_at:
            pending = phase["days"] - days_in
            next_milestone = {
                "phase": phase["key"],
                "days_left": max(0, pending),
            }

    all_done = total_steps > 0 and done_steps == total_steps
    if ob and all_done and not ob.completed_at:
        ob.completed_at = now
        ob.save(update_fields=["completed_at"])
        _award_onboarding_points(partner)

    return {
        "started": ob is not None,
        "started_at": started_at.isoformat() if started_at else None,
        "days_in": days_in,
        "progress_pct": round(done_steps / total_steps * 100) if total_steps else 0,
        "completed": all_done,
        "completed_at": ob.completed_at.isoformat() if (ob and ob.completed_at) else None,
        "phases": phases,
        "reminders": reminders,
        "next_milestone": next_milestone,
    }
