from datetime import timedelta

import bcrypt
from django.core.management.base import BaseCommand
from django.db.models import Sum
from django.utils import timezone
from prm.models import (
    Partner, PartnerType, Course, CourseVideo, QuizQuestion, QuizBankQuestion,
    CourseAssignment, CourseRating, Deal, Commission, Opportunity, Product,
    TokenBlacklist, LoginAttempt, OpportunityEvent, TrainingResult, Certification,
    PartnerProgress, PartnerOnboarding, PartnerUser, MdfRequest, Reward,
    RewardRedemption, PointTransaction, ChannelConflict,
    Communication, CommunicationRecipient, Notification,
)


class Command(BaseCommand):
    help = "Seed database with realistic demo data (idempotent: wipes and recreates)"

    def handle(self, *args, **options):
        # Wipe in dependency order
        Certification.objects.all().delete()
        TrainingResult.objects.all().delete()
        OpportunityEvent.objects.all().delete()
        Opportunity.objects.all().delete()
        Commission.objects.all().delete()
        Deal.objects.all().delete()
        CourseAssignment.objects.all().delete()
        CourseRating.objects.all().delete()
        QuizBankQuestion.objects.all().delete()
        QuizQuestion.objects.all().delete()
        CourseVideo.objects.all().delete()
        Course.objects.all().delete()
        ChannelConflict.objects.all().delete()
        MdfRequest.objects.all().delete()
        RewardRedemption.objects.all().delete()
        Reward.objects.all().delete()
        PointTransaction.objects.all().delete()
        Notification.objects.all().delete()
        Communication.objects.all().delete()
        PartnerOnboarding.objects.all().delete()
        PartnerUser.objects.all().delete()
        PartnerProgress.objects.all().delete()
        TokenBlacklist.objects.all().delete()
        LoginAttempt.objects.all().delete()
        Product.objects.all().delete()
        PartnerType.objects.all().delete()
        Partner.objects.all().delete()

        def hpw(p):
            return bcrypt.hashpw(p.encode(), bcrypt.gensalt()).decode()

        # Admin
        Partner.objects.create(
            id="admin-001", company_name="aconso AG", email="admin@aconso.com",
            password_hash=hpw("admin123"), contact_name="Administrador aconso",
            role="admin", status="activo", commission_rate=0, training_track="",
            country="de", partner_type="agente",
        )

        # Partner types (catálogo de tipos de partner con comisión por defecto)
        for key, label, rate, order in [
            ("agente", "Agente comercial", 10.0, 1),
            ("consultora", "Consultora de RRHH", 12.0, 2),
            ("integrador", "Integrador técnico", 15.0, 3),
            ("distribuidor", "Distribuidor regional", 18.0, 4),
        ]:
            PartnerType.objects.create(
                key=key, label=label, default_commission_rate=rate, sort_order=order
            )

        # Product catalog (precio por empleado y mes, en cada divisa)
        products_data = [
            ("dpa", {"en": "Digitale Personalakte (DPA)", "es": "Digitale Personalakte (DPA)", "de": "Digitale Personalakte (DPA)"},
             {"en": "Digital personnel file with role-based access and retention rules",
              "es": "Expediente digital de personal con acceso por roles y plazos de conservación",
              "de": "Digitale Personalakte mit rollenbasiertem Zugriff und Aufbewahrungsfristen"},
             2.40, 2.10, 2.60, "core", 1),
            ("hr_doc_box", {"en": "HR Document Box", "es": "HR Document Box", "de": "HR Document Box"},
             {"en": "Templates and automated workflows for HR document generation",
              "es": "Plantillas y flujos automatizados para generar documentos de RRHH",
              "de": "Vorlagen und automatisierte Workflows für die HR-Dokumenterstellung"},
             1.20, 1.05, 1.30, "core", 2),
            ("insights", {"en": "aconso Insights", "es": "aconso Insights", "de": "aconso Insights"},
             {"en": "Analytics and dashboards for HR document processes",
              "es": "Analítica y dashboards para procesos documentales de RRHH",
              "de": "Analytik und Dashboards für HR-Dokumentenprozesse"},
             0.90, 0.80, 1.00, "addon", 3),
            ("scan_services", {"en": "Scan Services", "es": "Servicios de digitalización", "de": "Scan-Services"},
             {"en": "Digitization of paper archives with certified quality controls",
              "es": "Digitalización de archivos en papel con controles de calidad certificados",
              "de": "Digitalisierung von Papierarchiven mit zertifizierten Qualitätskontrollen"},
             0, 0, 0, "service", 4),
        ]
        for key, name, desc, price_eur, price_chf, price_usd, category, order in products_data:
            Product.objects.create(
                key=key, name=name, description=desc,
                price_eur=price_eur, price_chf=price_chf, price_usd=price_usd,
                category=category, sort_order=order,
            )

        # Partners (empresas ficticias verosímiles del ecosistema DACH)
        partners_data = [
            {
                "id": "partner-001", "company_name": "Hanseatic HR Solutions GmbH",
                "email": "l.brandt@hanseatic-hr.de", "contact_name": "Lena Brandt",
                "first_name": "Lena", "last_name": "Brandt", "username": "lbrandt",
                "phone": "+49 40 2286 4170", "tax_id": "DE815472963", "country": "de",
                "status": "activo", "commission_rate": 12.0, "training_track": "ventas",
                "partner_type": "consultora", "mdf_budget_year": 6000.0,
                "why_partner": "Consultoría especializada en transformación de RRHH para el norte de Alemania.",
                "sales_approach": "Ventas consultivas a dirección de RRHH en logística, sanidad y sector público.",
                "certification_date": timezone.now() - timedelta(days=25),
            },
            {
                "id": "partner-002", "company_name": "Alpenblick Consulting AG",
                "email": "m.kessler@alpenblick-consulting.ch", "contact_name": "Martin Kessler",
                "first_name": "Martin", "last_name": "Kessler", "username": "mkessler",
                "phone": "+41 44 512 38 90", "tax_id": "CHE-114.873.652 MWST", "country": "ch",
                "status": "activo", "commission_rate": 15.0, "training_track": "tecnica",
                "partner_type": "integrador", "mdf_budget_year": 8000.0,
                "why_partner": "Integrador SAP HCM con práctica propia de digitalización documental.",
                "sales_approach": "Proyectos llave en mano para banca, seguros y sector sanitario en Suiza.",
                "certification_date": timezone.now() - timedelta(days=68),
            },
            {
                "id": "partner-003", "company_name": "Rheinwerk Digital GmbH",
                "email": "s.vogt@rheinwerk-digital.de", "contact_name": "Sabine Vogt",
                "first_name": "Sabine", "last_name": "Vogt", "username": "svogt",
                "phone": "+49 221 4703 8820", "tax_id": "DE276438915", "country": "de",
                "status": "activo", "commission_rate": 10.0, "training_track": "tecnica",
                "partner_type": "consultora", "mdf_budget_year": 5000.0,
                "why_partner": "Consultora regional con foco en administraciones públicas y educación.",
                "sales_approach": "Licitaciones públicas y proyectos de digitalización de expedientes.",
            },
            {
                "id": "partner-004", "company_name": "Nordlicht Process Automation GmbH",
                "email": "j.petersen@nordlicht-pa.de", "contact_name": "Jonas Petersen",
                "first_name": "Jonas", "last_name": "Petersen", "username": "jpetersen",
                "phone": "+49 421 9605 4420", "tax_id": "DE193846275", "country": "de",
                "status": "activo", "commission_rate": 11.0, "training_track": "ventas",
                "partner_type": "distribuidor", "mdf_budget_year": 5000.0,
                "why_partner": "Especialista en automatización de procesos para industria y retail.",
                "sales_approach": "Venta directa a COO y dirección de operaciones en el norte de Alemania.",
            },
            {
                "id": "partner-005", "company_name": "Campus HR Services GmbH",
                "email": "t.reinhardt@campus-hr.de", "contact_name": "Tobias Reinhardt",
                "first_name": "Tobias", "last_name": "Reinhardt", "username": "treinhardt",
                "phone": "+49 89 4521 7780", "tax_id": "DE329184756", "country": "de",
                "status": "en_revision", "commission_rate": 10.0, "training_track": "ventas",
                "partner_type": "agente", "mdf_budget_year": 0.0,
                "why_partner": "Servicios de RRHH para universidades y centros de formación.",
                "sales_approach": "Red de contactos en universidades públicas del sur de Alemania.",
            },
            {
                "id": "partner-006", "company_name": "Atlas Cloud Partners BV",
                "email": "femke@atlascloud.nl", "contact_name": "Femke de Vries",
                "first_name": "Femke", "last_name": "de Vries", "username": "fdevries",
                "phone": "+31 20 808 4512", "tax_id": "", "country": "nl",
                "status": "solicitado", "commission_rate": 10.0, "training_track": "",
                "partner_type": "agente", "mdf_budget_year": 0.0,
                "why_partner": "Partner cloud con cartera de PYMES en Países Bajos.",
                "sales_approach": "Modelo de suscripción gestionada para PYMES.",
            },
            {
                "id": "partner-007", "company_name": "Helvetia People Solutions AG",
                "email": "c.gerber@helvetia-people.ch", "contact_name": "Claudia Gerber",
                "first_name": "Claudia", "last_name": "Gerber", "username": "cgerber",
                "phone": "+41 31 508 22 40", "tax_id": "CHE-289.451.037", "country": "ch",
                "status": "activo", "commission_rate": 10.0, "training_track": "cumplimiento",
                "partner_type": "consultora", "mdf_budget_year": 4000.0,
                "why_partner": "Consultora de compliance y protección de datos para el sector financiero suizo.",
                "sales_approach": "Proyectos de cumplimiento normativo y auditoría documental.",
                "certification_date": timezone.now() - timedelta(days=10),
            },
        ]
        for data in partners_data:
            Partner.objects.create(password_hash=hpw("admin123"), role="socio", **data)

        # Courses (multi-language JSONField + LMS fields)
        courses_data = [
            ("course-001",
             {"en": "aconso Fundamentals", "es": "Fundamentos aconso", "de": "aconso Grundlagen"},
             {"en": "Introduction to the platform and HR document management", "es": "Introducción a la plataforma y gestión documental HR", "de": "Einführung in die Plattform und das HR-Dokumentenmanagement"},
             "Fundamentos", "beginner", "todas", [], 80, 12, "", 8,
             [{"phase": 1, "days": 2}, {"phase": 2, "days": 3}, {"phase": 3, "days": 2}]),
            ("course-002",
             {"en": "Digital Personnel File", "es": "Expediente Digital de Personal", "de": "Digital Personnel File"},
             {"en": "Digitale Personalakte setup and archiving processes", "es": "Configuración de la Digital Personnel File y procesos de archivado", "de": "Einrichtung der Digital Personnel File und Archivierungsprozesse"},
             "Producto", "intermediate", "tecnica", ["dpa"], 80, 12, "course-001", 8,
             [{"phase": 1, "days": 3}, {"phase": 2, "days": 4}]),
            ("course-003",
             {"en": "SAP SuccessFactors Integration", "es": "Integración SAP SuccessFactors", "de": "SAP SuccessFactors Integration"},
             {"en": "Configuration and implementation with SAP Fiori", "es": "Configuración e implementación con SAP Fiori", "de": "Konfiguration und Implementierung mit SAP Fiori"},
             "Integraciones", "intermediate", "tecnica", ["dpa"], 80, 12, "course-002", 8,
             [{"phase": 1, "days": 2}, {"phase": 2, "days": 3}, {"phase": 3, "days": 3}]),
            ("course-004",
             {"en": "HR Document Box", "es": "HR Document Box", "de": "HR Document Box"},
             {"en": "Document creation and automated workflows", "es": "Creación de documentos y flujos automatizados", "de": "Dokumentenerstellung und automatisierte Workflows"},
             "Producto", "advanced", "tecnica", ["hr_doc_box"], 80, 12, "course-001", 8,
             [{"phase": 1, "days": 4}, {"phase": 2, "days": 3}]),
            ("course-005",
             {"en": "Advanced Use Cases", "es": "Casos de Uso Avanzados", "de": "Fortgeschrittene Anwendungsfälle"},
             {"en": "Complex scenarios and best practices", "es": "Escenarios complejos y mejores prácticas", "de": "Komplexe Szenarien und bewährte Verfahren"},
             "Avanzado", "advanced", "ventas", ["dpa", "hr_doc_box"], 80, 12, "", 8,
             [{"phase": 1, "days": 3}, {"phase": 2, "days": 3}, {"phase": 3, "days": 2}, {"phase": 4, "days": 2}]),
            ("course-006",
             {"en": "Compliance & Data Protection", "es": "Cumplimiento y Protección de Datos", "de": "Compliance & Datenschutz"},
             {"en": "GDPR and data protection requirements for HR software", "es": "RGPD y requisitos de protección de datos para software HR", "de": "DSGVO und Datenschutzanforderungen für HR-Software"},
             "Cumplimiento", "beginner", "cumplimiento", [], 80, 12, "", 8,
             [{"phase": 1, "days": 3}]),
            ("course-007",
             {"en": "Sales Positioning & Demo", "es": "Posicionamiento de Ventas y Demo", "de": "Vertriebspositionierung & Demo"},
             {"en": "How to position aconso and run an effective demo", "es": "Cómo posicionar aconso y realizar una demo efectiva", "de": "Wie man aconso positioniert und eine effektive Demo durchführt"},
             "Ventas", "beginner", "ventas", [], 80, 12, "", 8,
             [{"phase": 1, "days": 2}, {"phase": 2, "days": 2}]),
            ("course-008",
             {"en": "aconso Insights", "es": "aconso Insights", "de": "aconso Insights"},
             {"en": "Analytics module: reports, dashboards and decision support", "es": "Módulo de analítica: reportes, dashboards y soporte a decisiones", "de": "Analytik-Modul: Berichte, Dashboards und Entscheidungsunterstützung"},
             "Producto", "intermediate", "ventas", ["insights"], 80, 12, "course-007", 8,
             [{"phase": 1, "days": 2}, {"phase": 2, "days": 3}]),
            ("course-009",
             {"en": "Scan Services", "es": "Scan Services", "de": "Scan Services"},
             {"en": "Scanning and digitization services onboarding", "es": "Servicios de digitalización y escaneo", "de": "Scan- und Digitalisierungsservices"},
             "Producto", "intermediate", "tecnica", ["scan_services"], 80, 12, "course-002", 8,
             [{"phase": 1, "days": 2}, {"phase": 2, "days": 2}]),
        ]
        for cid, title, desc, cat, level, track, products, pm, vm, prereq, qcount, phase_config in courses_data:
            Course.objects.create(
                id=cid, title=title, description=desc, category=cat, level=level,
                track=track, related_products=products, pass_mark=pm, validity_months=vm,
                prerequisite_course_id=prereq, quiz_questions_count=qcount, phase_config=phase_config,
            )

        # Videos (existing files on disk referenced; new courses reuse files)
        videos_data = [
            ("vid-001", "course-001", {"en": "Welcome to aconso", "es": "Bienvenido a aconso", "de": "Willkommen bei aconso"},
             {"en": "Overview of the aconso platform", "es": "Resumen de la plataforma aconso", "de": "Überblick über die aconso-Plattform"},
             "/uploads/videos/408620320e264b779214bf8ff871e040.mp4", 600, 1, 1, 1),
            ("vid-002", "course-001", {"en": "HR Document Basics", "es": "Fundamentos de documentos HR", "de": "HR-Dokument-Grundlagen"},
             {"en": "Understanding HR document types", "es": "Tipos de documentos HR", "de": "HR-Dokumenttypen verstehen"},
             "/uploads/videos/46d35c417d254833beda6b210b5c28bc.mp4", 900, 2, 1, 2),
            ("vid-003", "course-001", {"en": "Platform Navigation", "es": "Navegación en la plataforma", "de": "Plattform-Navigation"},
             {"en": "How to navigate the aconso interface", "es": "Cómo navegar la interfaz", "de": "Navigation in der aconso-Oberfläche"},
             "/uploads/videos/51d960300dbd49c9ac7489db6b18fc80.mp4", 720, 1, 2, 1),
            ("vid-004", "course-001", {"en": "User Settings", "es": "Configuración de usuario", "de": "Benutzereinstellungen"},
             {"en": "Setting up your profile and preferences", "es": "Configurar tu perfil y preferencias", "de": "Profil und Einstellungen konfigurieren"},
             "/uploads/videos/5b5d8a9f7e7e40b699c301676e74e501.mp4", 480, 2, 2, 1),
            ("vid-005", "course-001", {"en": "Dashboard Overview", "es": "Vista del dashboard", "de": "Dashboard-Überblick"},
             {"en": "Using the main dashboard effectively", "es": "Uso efectivo del dashboard principal", "de": "Effektive Nutzung des Hauptdashboards"},
             "/uploads/videos/630fbc36101b420686283930ca5018e2.mp4", 540, 3, 2, 2),
            ("vid-006", "course-001", {"en": "Reporting Basics", "es": "Reportes básicos", "de": "Berichtswesen-Grundlagen"},
             {"en": "Creating your first report", "es": "Crear tu primer reporte", "de": "Erstellen Sie Ihren ersten Bericht"},
             "/uploads/videos/6b609c076e2a45278f789c6642a6bc64.mp4", 840, 4, 3, 1),
            ("vid-007", "course-002", {"en": "Digital Personnel File Setup", "es": "Configuración del Expediente Digital", "de": "Digital Personnel File Einrichtung"},
             {"en": "Setting up the Digital Personnel File", "es": "Configurar el Expediente Digital de Personal", "de": "Einrichtung der Digital Personnel File"},
             "/uploads/videos/7598465cf5a54c24997b164f8c100c2c.mp4", 900, 1, 1, 1),
            ("vid-008", "course-002", {"en": "Document Upload & Classification", "es": "Subir y Clasificar Documentos", "de": "Dokument-Upload & Klassifizierung"},
             {"en": "How to upload and classify HR documents", "es": "Cómo subir y clasificar documentos HR", "de": "HR-Dokumente hochladen und klassifizieren"},
             "/uploads/videos/92f12fb7ff934102ab2fe24f5f5ac9d3.mp4", 780, 2, 1, 2),
            ("vid-009", "course-002", {"en": "Archiving Rules", "es": "Reglas de Archivado", "de": "Archivierungsregeln"},
             {"en": "Configuring automatic archiving", "es": "Configurar archivado automático", "de": "Automatische Archivierung konfigurieren"},
             "/uploads/videos/a35881dbb4c74eaa92a5c94a42f1073f.mp4", 660, 3, 1, 3),
            ("vid-010", "course-003", {"en": "SAP Fiori Overview", "es": "Resumen de SAP Fiori", "de": "SAP Fiori Überblick"},
             {"en": "Introduction to SAP Fiori integration", "es": "Introducción a la integración SAP Fiori", "de": "Einführung in die SAP Fiori-Integration"},
             "/uploads/videos/af5af8028f1543bfb0acfa08003459a1.mp4", 720, 1, 1, 1),
            ("vid-011", "course-004", {"en": "Document Creation Workflows", "es": "Flujos de Creación de Documentos", "de": "Dokumentenerstellungs-Workflows"},
             {"en": "Automating document creation processes", "es": "Automatizar procesos de creación", "de": "Automatisierung von Dokumentenerstellungsprozessen"},
             "/uploads/videos/c9cea2bba57043d88a38da6d54281f9e.mp4", 840, 1, 1, 1),
            ("vid-012", "course-005", {"en": "Complex Scenarios", "es": "Escenarios Complejos", "de": "Komplexe Szenarien"},
             {"en": "Handling complex HR document scenarios", "es": "Manejar escenarios complejos de documentos HR", "de": "Komplexe HR-Dokument-Szenarien behandeln"},
             "/uploads/videos/d7c5a76ff532416ba1684f4345660854.mp4", 960, 1, 1, 1),
            ("vid-013", "course-005", {"en": "Best Practices", "es": "Mejores Prácticas", "de": "Bewährte Verfahren"},
             {"en": "Industry best practices for aconso", "es": "Mejores prácticas de la industria para aconso", "de": "Bewährte Verfahren für aconso"},
             "/uploads/videos/f081cd43fe7e4943a5ad5be04c9ee517.mp4", 780, 1, 1, 2),
            # course-006 Compliance (mandatory)
            ("vid-014", "course-006", {"en": "GDPR Basics for HR Software", "es": "Fundamentos de RGPD para software HR", "de": "DSGVO-Grundlagen für HR-Software"},
             {"en": "Key GDPR obligations when processing HR data", "es": "Obligaciones clave del RGPD al tratar datos HR", "de": "Wichtige DSGVO-Pflichten bei der Verarbeitung von HR-Daten"},
             "/uploads/videos/408620320e264b779214bf8ff871e040.mp4", 600, 1, 1, 1),
            ("vid-015", "course-006", {"en": "Data Protection by Design", "es": "Protección de datos desde el diseño", "de": "Datenschutz durch Technikgestaltung"},
             {"en": "Privacy principles applied to aconso deployments", "es": "Principios de privacidad aplicados a despliegues aconso", "de": "Datenschutzprinzipien für aconso-Installationen"},
             "/uploads/videos/51d960300dbd49c9ac7489db6b18fc80.mp4", 720, 2, 1, 2),
            # course-007 Sales
            ("vid-016", "course-007", {"en": "Value Proposition", "es": "Propuesta de valor", "de": "Nutzenversprechen"},
             {"en": "Positioning aconso against alternatives", "es": "Posicionar aconso frente a alternativas", "de": "aconso gegenüber Alternativen positionieren"},
             "/uploads/videos/630fbc36101b420686283930ca5018e2.mp4", 540, 1, 1, 1),
            ("vid-017", "course-007", {"en": "Delivering a Great Demo", "es": "Realizar una gran demo", "de": "Eine großartige Demo liefern"},
             {"en": "Demo structure and objection handling", "es": "Estructura de demo y manejo de objeciones", "de": "Demo-Struktur und Umgang mit Einwänden"},
             "/uploads/videos/46d35c417d254833beda6b210b5c28bc.mp4", 900, 2, 1, 2),
            # course-008 aconso Insights
            ("vid-018", "course-008", {"en": "Insights Dashboards", "es": "Dashboards de Insights", "de": "Insights-Dashboards"},
             {"en": "Building analytics dashboards for HR teams", "es": "Crear dashboards analíticos para equipos HR", "de": "Analytik-Dashboards für HR-Teams erstellen"},
             "/uploads/videos/6b609c076e2a45278f789c6642a6bc64.mp4", 840, 1, 1, 1),
            ("vid-019", "course-008", {"en": "Reports & KPIs", "es": "Reportes y KPIs", "de": "Berichte & KPIs"},
             {"en": "Preparing management reports and KPIs", "es": "Preparar reportes y KPIs para dirección", "de": "Management-Berichte und KPIs erstellen"},
             "/uploads/videos/7598465cf5a54c24997b164f8c100c2c.mp4", 900, 2, 1, 2),
            # course-009 Scan Services
            ("vid-020", "course-009", {"en": "Scanning Workflows", "es": "Flujos de escaneo", "de": "Scan-Workflows"},
             {"en": "Onboarding paper archives with Scan Services", "es": "Digitalizar archivos en papel con Scan Services", "de": "Papierarchive mit Scan Services digitalisieren"},
             "/uploads/videos/92f12fb7ff934102ab2fe24f5f5ac9d3.mp4", 780, 1, 1, 1),
            ("vid-021", "course-009", {"en": "Quality & SLAs", "es": "Calidad y SLA", "de": "Qualität & SLAs"},
             {"en": "Scan quality controls and service levels", "es": "Controles de calidad de escaneo y niveles de servicio", "de": "Scan-Qualitätskontrollen und Service-Level"},
             "/uploads/videos/a35881dbb4c74eaa92a5c94a42f1073f.mp4", 660, 2, 1, 2),
        ]
        all_videos = []
        for vid, cid, title, desc, url, dur, order, phase, day in videos_data:
            v = CourseVideo(id=vid, course_id=cid, title=title, description=desc,
                            video_url=url, duration_seconds=dur, video_order=order,
                            phase=phase, day=day)
            v.save()
            all_videos.append(v)

        # Quiz Questions — 8 questions per video (spec: 8-12, min pass 80%)
        QUESTION_BANK = [
            ({"en": "What is the main topic of this module?", "es": "¿Cuál es el tema principal de este módulo?", "de": "Was ist das Hauptthema dieses Moduls?"},
             [{"en": "aconso HR platform", "es": "Plataforma HR de aconso", "de": "aconso-HR-Plattform"},
              {"en": "Financial reporting", "es": "Reportes financieros", "de": "Finanzberichte"},
              {"en": "Office furniture", "es": "Mobiliario de oficina", "de": "Büromöbel"},
              {"en": "Recruitment ads", "es": "Anuncios de contratación", "de": "Stellenanzeigen"}], 0),
            ({"en": "Which step comes first when using this feature?", "es": "¿Qué paso viene primero al usar esta funcionalidad?", "de": "Welcher Schritt kommt bei dieser Funktion zuerst?"},
             [{"en": "Login and navigate", "es": "Iniciar sesión y navegar", "de": "Anmelden und navigieren"},
              {"en": "Create a report", "es": "Crear un reporte", "de": "Einen Bericht erstellen"},
              {"en": "Upload documents", "es": "Subir documentos", "de": "Dokumente hochladen"},
              {"en": "Contact support", "es": "Contactar soporte", "de": "Support kontaktieren"}], 0),
            ({"en": "True or False: This feature is only available for admins.", "es": "Verdadero o Falso: Esta función solo está disponible para admins.", "de": "Richtig oder Falsch: Diese Funktion ist nur für Administratoren verfügbar."},
             [{"en": "True", "es": "Verdadero", "de": "Richtig"},
              {"en": "False", "es": "Falso", "de": "Falsch"}], 1),
            ({"en": "Which best describes the correct workflow?", "es": "¿Cuál describe mejor el flujo de trabajo correcto?", "de": "Welcher Arbeitsablauf ist der richtige?"},
             [{"en": "Capture, classify, archive", "es": "Capturar, clasificar, archivar", "de": "Erfassen, klassifizieren, archivieren"},
              {"en": "Archive, delete, classify", "es": "Archivar, eliminar, clasificar", "de": "Archivieren, löschen, klassifizieren"},
              {"en": "Classify, print, delete", "es": "Clasificar, imprimir, eliminar", "de": "Klassifizieren, drucken, löschen"},
              {"en": "Print, scan, discard", "es": "Imprimir, escanear, descartar", "de": "Drucken, scannen, verwerfen"}], 0),
            ({"en": "Where are completed documents stored by default?", "es": "¿Dónde se almacenan los documentos completados por defecto?", "de": "Wo werden abgeschlossene Dokumente standardmäßig gespeichert?"},
             [{"en": "In the Digital Personnel File", "es": "En el Expediente Digital de Personal", "de": "In der Digital Personnel File"},
              {"en": "In a local folder", "es": "En una carpeta local", "de": "In einem lokalen Ordner"},
              {"en": "In the recycle bin", "es": "En la papelera", "de": "Im Papierkorb"},
              {"en": "Via email", "es": "Por correo", "de": "Per E-Mail"}], 0),
            ({"en": "Which principle is essential for data protection?", "es": "¿Qué principio es esencial para la protección de datos?", "de": "Welches Prinzip ist für den Datenschutz unerlässlich?"},
             [{"en": "Least privilege access", "es": "Acceso con privilegios mínimos", "de": "Minimalrechte"},
              {"en": "Open access for all", "es": "Acceso abierto para todos", "de": "Offener Zugang für alle"},
              {"en": "Public sharing", "es": "Compartir públicamente", "de": "Öffentliches Teilen"},
              {"en": "No passwords", "es": "Sin contraseñas", "de": "Keine Passwörter"}], 0),
            ({"en": "How can a partner improve its pipeline forecast?", "es": "¿Cómo puede un partner mejorar su previsión de pipeline?", "de": "Wie kann ein Partner seine Pipeline-Prognose verbessern?"},
             [{"en": "Updating stages and amounts regularly", "es": "Actualizando etapas e importes regularmente", "de": "Regelmäßiges Aktualisieren von Phasen und Beträgen"},
              {"en": "Ignoring the pipeline", "es": "Ignorando el pipeline", "de": "Ignorieren der Pipeline"},
              {"en": "Deleting opportunities", "es": "Eliminando oportunidades", "de": "Löschen von Gelegenheiten"},
              {"en": "Setting all probabilities to 100", "es": "Poniendo todas las probabilidades a 100", "de": "Alle Wahrscheinlichkeiten auf 100 setzen"}], 0),
            ({"en": "When should the loss reason be recorded?", "es": "¿Cuándo se debe registrar el motivo de pérdida?", "de": "Wann soll der Verlustgrund erfasst werden?"},
             [{"en": "When an opportunity is marked as lost", "es": "Cuando una oportunidad se marca como perdida", "de": "Wenn eine Gelegenheit als verloren markiert wird"},
              {"en": "Never", "es": "Nunca", "de": "Nie"},
              {"en": "Only for won deals", "es": "Solo para acuerdos ganados", "de": "Nur bei gewonnenen Geschäften"},
              {"en": "At registration", "es": "En el registro", "de": "Bei der Registrierung"}], 0),
        ]
        for v in all_videos:
            qid_base = v.id.replace("vid-", "quiz-")
            for i, (question, options, correct) in enumerate(QUESTION_BANK, start=1):
                QuizQuestion(
                    id=f"{qid_base}-q{i}", video=v, question=question,
                    options=options, correct_index=correct, order=i,
                ).save()

        # Question bank (reusable across courses, mixed types)
        BANK_DATA = [
            ("bank-q1", "single", {"en": "Which aconso product stores digital HR documents?", "es": "¿Qué producto de aconso almacena documentos HR digitales?", "de": "Welches aconso-Produkt speichert digitale HR-Dokumente?"},
             [{"en": "Digital Personnel File", "es": "Expediente Digital de Personal", "de": "Digital Personnel File"},
              {"en": "Scan Services", "es": "Scan Services", "de": "Scan Services"},
              {"en": "Insights", "es": "Insights", "de": "Insights"},
              {"en": "None of them", "es": "Ninguno", "de": "Keines davon"}], 0, [], {}, "tecnica"),
            ("bank-q2", "single", {"en": "What does GDPR stand for?", "es": "¿Qué significa RGPD?", "de": "Wofür steht DSGVO?"},
             [{"en": "General Data Protection Regulation", "es": "Reglamento General de Protección de Datos", "de": "Datenschutz-Grundverordnung"},
              {"en": "Global Data Processing Rules", "es": "Reglas globales de procesamiento de datos", "de": "Globale Datenverarbeitungsregeln"},
              {"en": "General Digital Privacy Reform", "es": "Reforma general de privacidad digital", "de": "Allgemeine digitale Datenschutzreform"},
              {"en": "Guaranteed Data Public Registry", "es": "Registro público de datos garantizado", "de": "Garantiertes öffentliches Datenregister"}], 0, [], {}, "cumplimiento"),
            ("bank-q3", "multiple", {"en": "Select all benefits of the aconso Cloud deployment.", "es": "Selecciona todos los beneficios del despliegue en la nube aconso.", "de": "Wählen Sie alle Vorteile des aconso-Cloud-Betriebs."},
             [{"en": "Automatic updates", "es": "Actualizaciones automáticas", "de": "Automatische Updates"},
              {"en": "On-premise servers only", "es": "Solo servidores on-premise", "de": "Nur lokale Server"},
              {"en": "Lower infrastructure cost", "es": "Menor coste de infraestructura", "de": "Geringere Infrastrukturkosten"},
              {"en": "Built-in security", "es": "Seguridad integrada", "de": "Integrierte Sicherheit"}], -1, [0, 2, 3], {}, "tecnica"),
            ("bank-q4", "true_false", {"en": "HR documents should be archived in the personnel file with role-based access.", "es": "Los documentos HR deben archivarse en el expediente con acceso basado en roles.", "de": "HR-Dokumente sollten mit rollenbasiertem Zugriff in der Personalakte archiviert werden."},
             [{"en": "True", "es": "Verdadero", "de": "Richtig"},
              {"en": "False", "es": "Falso", "de": "Falsch"}], 0, [], {}, "cumplimiento"),
            ("bank-q5", "fill", {"en": "Complete the sentence: aconso is an expert in ___ management.", "es": "Completa la frase: aconso es un experto en gestión ___ .", "de": "Ergänzen Sie den Satz: aconso ist ein Experte für ___ -Management."},
             [], -1, [], {"en": "HR document", "es": "documental HR", "de": "HR-Dokument"}, "ventas"),
            ("bank-q6", "single", {"en": "Which stage means the proposal has been sent to the customer?", "es": "¿Qué etapa significa que la propuesta se ha enviado al cliente?", "de": "Welche Phase bedeutet, dass das Angebot an den Kunden gesendet wurde?"},
             [{"en": "Proposal sent", "es": "Propuesta enviada", "de": "Angebot gesendet"},
              {"en": "Registered", "es": "Registrada", "de": "Registriert"},
              {"en": "Won", "es": "Ganada", "de": "Gewonnen"},
              {"en": "Lost", "es": "Perdida", "de": "Verloren"}], 0, [], {}, "ventas"),
            ("bank-q7", "single", {"en": "Scan Services help customers to...", "es": "Scan Services ayudan a los clientes a...", "de": "Scan Services helfen Kunden dabei..."},
             [{"en": "Digitize paper archives", "es": "Digitalizar archivos en papel", "de": "Papierarchive zu digitalisieren"},
              {"en": "Create invoices", "es": "Crear facturas", "de": "Rechnungen zu erstellen"},
              {"en": "Manage payroll", "es": "Gestionar nóminas", "de": "Gehaltsabrechnungen zu verwalten"},
              {"en": "Send emails", "es": "Enviar correos", "de": "E-Mails zu senden"}], 0, [], {}, "tecnica"),
            ("bank-q8", "true_false", {"en": "The pipeline probability of a Won opportunity is 100%.", "es": "La probabilidad de una oportunidad Ganada es del 100%.", "de": "Die Wahrscheinlichkeit einer gewonnenen Gelegenheit beträgt 100%."},
             [{"en": "True", "es": "Verdadero", "de": "Richtig"},
              {"en": "False", "es": "Falso", "de": "Falsch"}], 0, [], {}, "ventas"),
        ]
        for bqid, qtype, question, options, correct, correct_indices, fill, track in BANK_DATA:
            QuizBankQuestion.objects.create(
                id=bqid, question=question, options=options,
                correct_index=correct, correct_indices=correct_indices,
                fill_answer=fill, question_type=qtype, track=track,
            )

        # Assignments: course-006 (compliance) assigned to Campus HR with deadline
        CourseAssignment.objects.create(id="asg-001", course_id="course-006", partner_id="partner-005", deadline="2027-01-31")

        # Ratings
        CourseRating.objects.create(id="rate-001", course_id="course-001", partner_id="partner-001", stars=5,
                                    comment="Contenido muy claro y bien estructurado; útil desde el primer día.")
        CourseRating.objects.create(id="rate-002", course_id="course-001", partner_id="partner-002", stars=4,
                                    comment="Buen material; echamos de menos más ejemplos de integración con SAP.")

        # Deals (registro comercial: acceso al entorno, implementación y cierre)
        deals_data = [
            ("deal-001", "partner-001", "Elbe Logistics GmbH", "Transporte y logística", 78000, "acceso_otorgado",
             "Pedido confirmado; alta en el entorno de pruebas completada."),
            ("deal-002", "partner-001", "Norddeutsche Krankenkasse", "Seguros de salud", 187000, "necesita_acceso",
             "Oportunidad cualificada; pendiente de alta en el portal de partners."),
            ("deal-003", "partner-003", "Domstadt Stadtwerke GmbH", "Energía y utilities", 26000, "en_revision",
             "Propuesta enviada; en revisión por el comité de empresa."),
            ("deal-004", "partner-002", "Helveta Bank AG", "Banca", 181000, "completado",
             "Implementación cerrada en tres olas; aceptación final firmada."),
            ("deal-005", "partner-002", "Bergquell Versicherung AG", "Seguros", 167000, "necesita_acceso",
             "Propuesta en revisión legal; pendiente de aprobación del comité."),
            ("deal-006", "partner-003", "Kölner Bildungscampus gGmbH", "Educación", 26000, "en_implementacion",
             "Migración de expedientes en curso; segunda sede prevista para enero."),
            ("deal-007", "partner-004", "Weser Marine Systems GmbH", "Industria naval", 104000, "completado",
             "Implementación y digitalización de archivo finalizadas."),
            ("deal-008", "partner-004", "Nordwind Retail GmbH", "Retail", 89000, "acceso_otorgado",
             "Acceso concedido; configuración inicial en curso."),
            ("deal-009", "partner-007", "Aare Versicherungen AG", "Seguros", 55000, "en_revision",
             "Negociación de contrato en curso."),
        ]
        deals = {}
        for did, pid, client, ind, val, st, notes in deals_data:
            d = Deal(id=did, partner_id=pid, client_name=client, client_industry=ind,
                     estimated_value=val, status=st, notes=notes)
            d.save()
            deals[did] = d

        # Commissions (coherentes con el % de cada partner)
        Commission.objects.create(id="comm-001", partner_id="partner-002", deal=deals["deal-004"], amount=27150, status="pagada")
        Commission.objects.create(id="comm-002", partner_id="partner-004", deal=deals["deal-007"], amount=11440, status="pagada")
        Commission.objects.create(id="comm-003", partner_id="partner-001", deal=deals["deal-001"], amount=9360, status="pendiente")
        Commission.objects.create(id="comm-004", partner_id="partner-004", deal=deals["deal-008"], amount=9790, status="pendiente")
        Commission.objects.create(id="comm-005", partner_id="partner-003", deal=deals["deal-006"], amount=2600, status="pendiente")

        # Opportunities (pipeline coherente con tamaño, producto y divisa)
        # Importes ARR calculados como empleados × precio del producto × 12 meses.
        opps_data = [
            {
                "id": "opp-001", "partner_id": "partner-001", "company_name": "Elbe Logistics GmbH",
                "company_size": "1000-5000", "products": ["dpa", "hr_doc_box"], "operation_mode": "cloud",
                "stage": "negociacion", "probability": 75, "amount": 78000, "scan_one_time_fee": 0,
                "currency": "eur", "delivery_quarter": "T1/2027", "close_date": "2027-01-29",
                "deal_owner": "Lena Brandt", "channel_manager": "Anke Weber", "opportunity_type": "nuevo",
                "forecast_category": "commit", "lead_source": "generada_partner",
                "next_steps": "Cierre de condiciones con dirección de RRHH y firma del contrato marco.",
                "notes": "Piloto con 300 empleados validado; se amplía al grupo completo (1.800 empleados).",
                "loss_reason": "", "protection_end_date": "2027-03-31",
            },
            {
                "id": "opp-002", "partner_id": "partner-001", "company_name": "Norddeutsche Krankenkasse",
                "company_size": ">5000", "products": ["dpa"], "operation_mode": "cloud",
                "stage": "cualificada", "probability": 30, "amount": 187000, "scan_one_time_fee": 0,
                "currency": "eur", "delivery_quarter": "T2/2027", "close_date": "2027-04-16",
                "deal_owner": "Lena Brandt", "channel_manager": "Anke Weber", "opportunity_type": "nuevo",
                "forecast_category": "pipeline", "lead_source": "asignada_aconso",
                "next_steps": "Demo técnica con el comité de arquitectura y validación de la integración SAP HCM.",
                "notes": "6.500 empleados; requisito de retención documental de 30 años.",
                "loss_reason": "", "protection_end_date": "2027-04-30",
            },
            {
                "id": "opp-003", "partner_id": "partner-002", "company_name": "Bergquell Versicherung AG",
                "company_size": ">5000", "products": ["dpa", "scan_services"], "operation_mode": "on_premises",
                "stage": "propuesta_enviada", "probability": 55, "amount": 167000, "scan_one_time_fee": 24000,
                "currency": "chf", "delivery_quarter": "T1/2027", "close_date": "2027-02-12",
                "deal_owner": "Martin Kessler", "channel_manager": "Anke Weber", "opportunity_type": "nuevo",
                "forecast_category": "best_case", "lead_source": "recomendacion_cliente",
                "next_steps": "Revisión legal de la propuesta y plan de digitalización del archivo histórico.",
                "notes": "Digitalización de 1,8 millones de documentos incluida en el alcance.",
                "loss_reason": "", "protection_end_date": "2027-03-15",
            },
            {
                "id": "opp-004", "partner_id": "partner-002", "company_name": "Swissmed Kliniken AG",
                "company_size": "1000-5000", "products": ["hr_doc_box"], "operation_mode": "cloud",
                "stage": "registrada", "probability": 10, "amount": 28000, "scan_one_time_fee": 0,
                "currency": "chf", "delivery_quarter": "T2/2027", "close_date": "2027-05-28",
                "deal_owner": "Martin Kessler", "channel_manager": "Anke Weber", "opportunity_type": "nuevo",
                "forecast_category": "pipeline", "lead_source": "generada_partner",
                "next_steps": "Llamada de descubrimiento con la dirección de RRHH de las tres clínicas.",
                "notes": "Contacto inicial en la feria Swiss HR Expo (octubre 2026).",
                "loss_reason": "", "protection_end_date": "2027-05-31",
            },
            {
                "id": "opp-005", "partner_id": "partner-003", "company_name": "Domstadt Stadtwerke GmbH",
                "company_size": "250-1000", "products": ["dpa"], "operation_mode": "cloud",
                "stage": "propuesta_enviada", "probability": 55, "amount": 26000, "scan_one_time_fee": 0,
                "currency": "eur", "delivery_quarter": "T1/2027", "close_date": "2027-02-26",
                "deal_owner": "Sabine Vogt", "channel_manager": "Markus Hensel", "opportunity_type": "nuevo",
                "forecast_category": "best_case", "lead_source": "generada_partner",
                "next_steps": "Aclarar requisitos de protección de datos con el comité de empresa.",
                "notes": "Propuesta para 900 empleados enviada el 6 de noviembre.",
                "loss_reason": "", "protection_end_date": "2027-02-28",
            },
            {
                "id": "opp-006", "partner_id": "partner-003", "company_name": "Kölner Bildungscampus gGmbH",
                "company_size": "250-1000", "products": ["dpa", "insights"], "operation_mode": "cloud",
                "stage": "negociacion", "probability": 75, "amount": 26000, "scan_one_time_fee": 0,
                "currency": "eur", "delivery_quarter": "T4/2026", "close_date": "2026-12-18",
                "deal_owner": "Sabine Vogt", "channel_manager": "Markus Hensel", "opportunity_type": "ampliacion",
                "forecast_category": "commit", "lead_source": "recomendacion_cliente",
                "next_steps": "Firma del contrato antes del cierre de año.",
                "notes": "Ampliación del expediente digital a dos sedes adicionales (650 empleados).",
                "loss_reason": "", "protection_end_date": "2027-01-15",
            },
            {
                "id": "opp-007", "partner_id": "partner-004", "company_name": "Weser Marine Systems GmbH",
                "company_size": "1000-5000", "products": ["dpa", "hr_doc_box", "scan_services"], "operation_mode": "cloud",
                "stage": "ganada", "probability": 100, "amount": 104000, "scan_one_time_fee": 18000,
                "currency": "eur", "delivery_quarter": "T4/2026", "close_date": "2026-10-30",
                "deal_owner": "Jonas Petersen", "channel_manager": "Markus Hensel", "opportunity_type": "nuevo",
                "forecast_category": "commit", "lead_source": "generada_partner",
                "next_steps": "Kick-off de implementación el 18 de noviembre.",
                "notes": "Contrato firmado el 30 de octubre; digitalización de archivo incluida.",
                "loss_reason": "", "protection_end_date": None,
            },
            {
                "id": "opp-008", "partner_id": "partner-004", "company_name": "Nordwind Retail GmbH",
                "company_size": "1000-5000", "products": ["dpa"], "operation_mode": "cloud",
                "stage": "cualificada", "probability": 30, "amount": 89000, "scan_one_time_fee": 0,
                "currency": "eur", "delivery_quarter": "T1/2027", "close_date": "2027-03-05",
                "deal_owner": "Jonas Petersen", "channel_manager": "Markus Hensel", "opportunity_type": "nuevo",
                "forecast_category": "pipeline", "lead_source": "asignada_aconso",
                "next_steps": "Validar número de empleados y alcance por país (Alemania y Países Bajos).",
                "notes": "3.100 empleados en 140 tiendas; interés en acceso por roles.",
                "loss_reason": "", "protection_end_date": "2027-03-31",
            },
            {
                "id": "opp-009", "partner_id": "partner-007", "company_name": "Aare Versicherungen AG",
                "company_size": "1000-5000", "products": ["dpa", "insights"], "operation_mode": "on_premises",
                "stage": "negociacion", "probability": 75, "amount": 55000, "scan_one_time_fee": 0,
                "currency": "chf", "delivery_quarter": "T1/2027", "close_date": "2027-01-22",
                "deal_owner": "Claudia Gerber", "channel_manager": "Anke Weber", "opportunity_type": "nuevo",
                "forecast_category": "commit", "lead_source": "generada_partner",
                "next_steps": "Negociación final de condiciones y calendario de migración.",
                "notes": "Sustitución de una solución legacy de gestión documental.",
                "loss_reason": "", "protection_end_date": "2027-02-15",
            },
            {
                "id": "opp-010", "partner_id": "partner-001", "company_name": "Hamburg Port Services GmbH",
                "company_size": "250-1000", "products": ["scan_services"], "operation_mode": "cloud",
                "stage": "perdida", "probability": 0, "amount": 12000, "scan_one_time_fee": 12000,
                "currency": "eur", "delivery_quarter": "T4/2026", "close_date": "2026-10-09",
                "deal_owner": "Lena Brandt", "channel_manager": "Anke Weber", "opportunity_type": "nuevo",
                "forecast_category": "omitted", "lead_source": "generada_partner",
                "next_steps": "",
                "notes": "El cliente pospone la digitalización del archivo a 2028.",
                "loss_reason": "proyecto_aplazado", "protection_end_date": None,
            },
            {
                "id": "opp-011", "partner_id": "partner-002", "company_name": "Helveta Bank AG",
                "company_size": ">5000", "products": ["dpa", "insights"], "operation_mode": "on_premises",
                "stage": "ganada", "probability": 100, "amount": 181000, "scan_one_time_fee": 0,
                "currency": "chf", "delivery_quarter": "T3/2026", "close_date": "2026-09-25",
                "deal_owner": "Martin Kessler", "channel_manager": "Anke Weber", "opportunity_type": "nuevo",
                "forecast_category": "commit", "lead_source": "recomendacion_cliente",
                "next_steps": "Comité de proyecto mensual; despliegue en tres olas hasta junio de 2027.",
                "notes": "Proyecto adjudicado tras un piloto con 600 empleados.",
                "loss_reason": "", "protection_end_date": None,
            },
            {
                "id": "opp-012", "partner_id": "partner-003", "company_name": "Rheinische Kliniken gGmbH",
                "company_size": "1000-5000", "products": ["dpa", "hr_doc_box"], "operation_mode": "cloud",
                "stage": "registrada", "probability": 10, "amount": 86000, "scan_one_time_fee": 8000,
                "currency": "eur", "delivery_quarter": "T2/2027", "close_date": "2027-06-11",
                "deal_owner": "Sabine Vogt", "channel_manager": "Markus Hensel", "opportunity_type": "nuevo",
                "forecast_category": "pipeline", "lead_source": "asignada_aconso",
                "next_steps": "Primera reunión con el director de RRHH del grupo hospitalario.",
                "notes": "Contacto facilitado por aconso tras una licitación pública.",
                "loss_reason": "", "protection_end_date": "2027-06-30",
            },
        ]
        for data in opps_data:
            Opportunity(**data).save()

        now = timezone.now()

        # ─── Partner Progress (LMS) ───────────────────────
        PartnerProgress.objects.create(id="prog-001", partner_id="partner-001", course_id="course-001",
                                       completed=True, score=92, progress_pct=100, completed_at=now)
        PartnerProgress.objects.create(id="prog-002", partner_id="partner-001", course_id="course-007",
                                       completed=True, score=85, progress_pct=100, completed_at=now)
        PartnerProgress.objects.create(id="prog-003", partner_id="partner-002", course_id="course-001",
                                       completed=True, score=88, progress_pct=100, completed_at=now)
        PartnerProgress.objects.create(id="prog-004", partner_id="partner-003", course_id="course-001",
                                       completed=False, score=None, progress_pct=40, completed_videos=["vid-001"])
        PartnerProgress.objects.create(id="prog-005", partner_id="partner-007", course_id="course-006",
                                       completed=True, score=90, progress_pct=100, completed_at=now)

        # ─── Training results & certifications ────────────
        TrainingResult.objects.create(id="tr-001", partner_id="partner-001", course_id="course-001",
                                      attempt_number=1, score=92, passed=True)
        TrainingResult.objects.create(id="tr-002", partner_id="partner-001", course_id="course-007",
                                      attempt_number=1, score=85, passed=True)
        TrainingResult.objects.create(id="tr-003", partner_id="partner-002", course_id="course-001",
                                      attempt_number=1, score=88, passed=True)
        TrainingResult.objects.create(id="tr-004", partner_id="partner-007", course_id="course-006",
                                      attempt_number=1, score=90, passed=True)
        Certification.objects.create(id="cert-001", partner_id="partner-001", level="associate",
                                     status="valid", valid_until=now + timedelta(days=340))
        Certification.objects.create(id="cert-002", partner_id="partner-002", level="associate",
                                     status="valid", valid_until=now + timedelta(days=297))
        Certification.objects.create(id="cert-003", partner_id="partner-007", level="associate",
                                     status="valid", valid_until=now + timedelta(days=355))

        # ─── Team members (PartnerUser) ───────────────────
        PartnerUser.objects.create(id="pu-001", partner_id="partner-001", email="l.brandt@hanseatic-hr.de",
                                   password_hash=hpw("admin123"), contact_name="Lena Brandt",
                                   first_name="Lena", last_name="Brandt", username="lbrandt",
                                   role="owner", status="activo")
        PartnerUser.objects.create(id="pu-002", partner_id="partner-001", email="t.wohlt@hanseatic-hr.de",
                                   password_hash=hpw("admin123"), contact_name="Tim Wohlt",
                                   first_name="Tim", last_name="Wohlt", username="twohlt",
                                   role="member", status="activo")
        PartnerUser.objects.create(id="pu-003", partner_id="partner-002", email="m.kessler@alpenblick-consulting.ch",
                                   password_hash=hpw("admin123"), contact_name="Martin Kessler",
                                   first_name="Martin", last_name="Kessler", username="mkessler",
                                   role="owner", status="activo")
        PartnerUser.objects.create(id="pu-004", partner_id="partner-003", email="s.vogt@rheinwerk-digital.de",
                                   password_hash=hpw("admin123"), contact_name="Sabine Vogt",
                                   first_name="Sabine", last_name="Vogt", username="svogt",
                                   role="owner", status="activo")
        PartnerUser.objects.create(id="pu-005", partner_id="partner-004", email="j.petersen@nordlicht-pa.de",
                                   password_hash=hpw("admin123"), contact_name="Jonas Petersen",
                                   first_name="Jonas", last_name="Petersen", username="jpetersen",
                                   role="owner", status="activo")
        PartnerUser.objects.create(id="pu-006", partner_id="partner-007", email="c.gerber@helvetia-people.ch",
                                   password_hash=hpw("admin123"), contact_name="Claudia Gerber",
                                   first_name="Claudia", last_name="Gerber", username="cgerber",
                                   role="owner", status="activo")

        # ─── Rewards catalog ──────────────────────────────
        rewards_data = [
            ("reward-001", {"en": "aconso Hoodie", "es": "Sudadera aconso", "de": "aconso Hoodie"},
             {"en": "Official aconso hoodie, black with logo", "es": "Sudadera oficial de aconso, negra con logo", "de": "Offizieller aconso-Hoodie, schwarz mit Logo"},
             "merchandising", 150, 20),
            ("reward-002", {"en": "aconso Backpack", "es": "Mochila aconso", "de": "aconso Rucksack"},
             {"en": "Travel backpack with aconso branding", "es": "Mochila de viaje con la marca aconso", "de": "Reiserucksack mit aconso-Branding"},
             "merchandising", 250, 10),
            ("reward-003", {"en": "Ticket to aconso Summit", "es": "Entrada al aconso Summit", "de": "Ticket zum aconso Summit"},
             {"en": "Full access to the annual aconso Summit event", "es": "Acceso completo al evento anual aconso Summit", "de": "Voller Zugang zum jährlichen aconso Summit"},
             "evento", 500, 5),
            ("reward-004", {"en": "Free Certification", "es": "Certificación gratuita", "de": "Kostenlose Zertifizierung"},
             {"en": "One free additional certification course", "es": "Un curso de certificación adicional gratuito", "de": "Ein kostenloser zusätzlicher Zertifizierungskurs"},
             "formacion", 400, None),
            ("reward-005", {"en": "10% Partner Discount", "es": "10% de descuento partner", "de": "10% Partner-Rabatt"},
             {"en": "10% discount on next aconso purchase", "es": "10% de descuento en la próxima compra aconso", "de": "10% Rabatt auf den nächsten aconso-Einkauf"},
             "descuento", 600, 3),
        ]
        for rid, name, desc, cat, cost, stock in rewards_data:
            Reward.objects.create(id=rid, name=name, description=desc, category=cat,
                                  points_cost=cost, stock=stock)

        # ─── Reward redemptions ───────────────────────────
        RewardRedemption.objects.create(id="red-001", partner_id="partner-001", reward_id="reward-001",
                                        points_spent=150, status="entregado",
                                        admin_notes="Enviada por mensajería el 4 de noviembre.")
        RewardRedemption.objects.create(id="red-002", partner_id="partner-002", reward_id="reward-003",
                                        points_spent=500, status="solicitado")

        # ─── Points & transactions ────────────────────────
        PointTransaction.objects.create(id="pt-001", partner_id="partner-001", amount=100,
                                        reason="onboarding", note="Onboarding completado")
        PointTransaction.objects.create(id="pt-002", partner_id="partner-001", amount=250,
                                        reason="deal_ganado", note="Oportunidad Elbe Logistics ganada",
                                        source_type="opportunity", source_id="opp-001")
        PointTransaction.objects.create(id="pt-003", partner_id="partner-001", amount=150,
                                        reason="certificacion", note="Certificación aconso Fundamentals")
        PointTransaction.objects.create(id="pt-004", partner_id="partner-001", amount=-150,
                                        reason="canje", note="Canje: sudadera aconso")
        PointTransaction.objects.create(id="pt-005", partner_id="partner-002", amount=100,
                                        reason="onboarding", note="Onboarding completado")
        PointTransaction.objects.create(id="pt-006", partner_id="partner-002", amount=250,
                                        reason="deal_ganado", note="Oportunidad Helveta Bank ganada",
                                        source_type="opportunity", source_id="opp-011")
        PointTransaction.objects.create(id="pt-007", partner_id="partner-002", amount=150,
                                        reason="certificacion", note="Certificación aconso Fundamentals")
        PointTransaction.objects.create(id="pt-008", partner_id="partner-002", amount=-500,
                                        reason="canje", note="Canje: entrada aconso Summit")
        PointTransaction.objects.create(id="pt-009", partner_id="partner-004", amount=100,
                                        reason="onboarding", note="Onboarding completado")
        PointTransaction.objects.create(id="pt-010", partner_id="partner-004", amount=250,
                                        reason="deal_ganado", note="Oportunidad Weser Marine ganada",
                                        source_type="opportunity", source_id="opp-007")
        PointTransaction.objects.create(id="pt-011", partner_id="partner-007", amount=100,
                                        reason="onboarding", note="Onboarding completado")
        PointTransaction.objects.create(id="pt-012", partner_id="partner-007", amount=150,
                                        reason="certificacion", note="Certificación Compliance & Datenschutz")

        # ─── MDF requests ─────────────────────────────────
        MdfRequest.objects.create(id="mdf-001", partner_id="partner-001",
                                  title="Webinar: Digitale Personalakte für Logistikunternehmen",
                                  campaign_type="campaña_online",
                                  description="Webinar de 45 minutos para 80 responsables de RRHH del sector logístico.",
                                  requested_amount=2000, approved_amount=1800, status="aprobado",
                                  start_date="2027-02-01", end_date="2027-02-28")
        MdfRequest.objects.create(id="mdf-002", partner_id="partner-001",
                                  title="Stand en Norddeutsche HR-Tage 2026",
                                  campaign_type="trade_show",
                                  description="Stand compartido con aconso en el congreso de RRHH del norte de Alemania.",
                                  requested_amount=4500, approved_amount=4500, status="reportado",
                                  start_date="2026-09-16", end_date="2026-09-17",
                                  actual_spend=4380, report_notes="El stand generó 27 contactos y 12 oportunidades cualificadas.",
                                  reported_at=now)
        MdfRequest.objects.create(id="mdf-003", partner_id="partner-002",
                                  title="Campaña LinkedIn Q1 2027",
                                  campaign_type="campaña_online",
                                  description="Campaña de contenidos dirigida a dirección de RRHH en banca y seguros.",
                                  requested_amount=1800, status="en_revision", start_date="2027-01-15")
        MdfRequest.objects.create(id="mdf-004", partner_id="partner-004",
                                  title="Kundenworkshop Bremen",
                                  campaign_type="evento",
                                  description="Workshop presencial sobre digitalización de expedientes para 25 clientes.",
                                  requested_amount=1200, status="solicitado", start_date="2027-03-10")

        # ─── Channel conflicts ────────────────────────────
        ChannelConflict.objects.create(
            id="conflict-001", company_name="Nordwind Retail GmbH", opportunity_id="opp-008",
            conflicting_opportunity_id=None, reporter_id="partner-002", status="abierto",
            notes="Alpenblick reporta un contacto previo con el mismo cliente; se revisa la protección de oportunidad.")
        ChannelConflict.objects.create(
            id="conflict-002", company_name="Aare Versicherungen AG", opportunity_id="opp-009",
            conflicting_opportunity_id=None, reporter_id="partner-001", status="resuelto",
            notes="Hanseatic reporta cobertura del mismo cliente.",
            resolution="Se asigna a Helvetia People Solutions por registro previo (opp-009).",
            winner_opportunity_id="opp-009", resolved_at=now)

        # ─── Communications ───────────────────────────────
        comm = Communication.objects.create(
            id="comm-001", subject="Actualización del programa de partners – Q4 2026",
            body="Revisa las novedades del trimestre: nuevos precios del catálogo, el calendario de formación 2027 "
                 "y el catálogo de recompensas actualizado. El equipo de Channel estará disponible en la sesión "
                 "de preguntas del 3 de diciembre.",
            channel="in_app", audience="todos", sent_by_id="admin-001")
        for p in Partner.objects.filter(status="activo"):
            CommunicationRecipient.objects.create(
                id=f"rec-{p.id}", communication=comm, partner=p,
                read=p.id in ("partner-001", "partner-002"),
                read_at=now if p.id in ("partner-001", "partner-002") else None)

        # ─── Notifications ────────────────────────────────
        Notification.objects.create(
            id="notif-001", partner_id="partner-001", type="curso_nuevo",
            title={"en": "New course available", "es": "Nuevo curso disponible", "de": "Neuer Kurs verfügbar"},
            message={"en": "The Advanced Use Cases course is now available in your academy.",
                     "es": "El curso de Casos de Uso Avanzados ya está disponible en tu academia.",
                     "de": "Der Kurs „Fortgeschrittene Anwendungsfälle“ ist jetzt in Ihrer Academy verfügbar."},
            link="/partner/courses")
        Notification.objects.create(
            id="notif-002", partner_id="partner-005", type="curso_asignado",
            title={"en": "Mandatory training assigned", "es": "Formación obligatoria asignada", "de": "Pflichtschulung zugewiesen"},
            message={"en": "Complete Compliance & Data Protection before 31 January 2027.",
                     "es": "Completa Cumplimiento y Protección de Datos antes del 31 de enero de 2027.",
                     "de": "Schließen Sie Compliance & Datenschutz bis zum 31. Januar 2027 ab."},
            link="/partner/training")
        Notification.objects.create(
            id="notif-003", partner_id="partner-002", type="comunicacion",
            title={"en": "Q4 partner update", "es": "Actualización de partners Q4", "de": "Partner-Update Q4"},
            message={"en": "Read the latest program update from the aconso channel team.",
                     "es": "Lee la última actualización del equipo de channel de aconso.",
                     "de": "Lesen Sie das neueste Update des aconso-Channel-Teams."},
            link="/partner/notifications")

        # ─── Points balance (after seeding transactions) ──
        for p in Partner.objects.filter(role="socio"):
            earned = p.point_transactions.filter(amount__gt=0).aggregate(s=Sum("amount"))["s"] or 0
            spent = p.point_transactions.filter(amount__lt=0).aggregate(s=Sum("amount"))["s"] or 0
            p.points_earned = earned
            p.points_balance = earned + spent
            p.save(update_fields=["points_earned", "points_balance"])

        self.stdout.write(self.style.SUCCESS("Database seeded successfully!"))