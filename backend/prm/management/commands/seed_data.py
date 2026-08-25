import bcrypt
from django.core.management.base import BaseCommand
from django.db.models import Sum
from django.utils import timezone
from prm.models import (
    Partner, Course, CourseVideo, QuizQuestion, QuizBankQuestion, CourseAssignment,
    CourseRating, Deal, Commission, Opportunity,
    TokenBlacklist, LoginAttempt, OpportunityEvent, TrainingResult, Certification,
    PartnerProgress, PartnerOnboarding, PartnerUser, MdfRequest, Reward,
    RewardRedemption, PointTransaction, ChannelConflict,
    Communication, CommunicationRecipient,
)


class Command(BaseCommand):
    help = "Seed database with demo data (idempotent: wipes and recreates)"

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
        PointTransaction.objects.all().delete()
        RewardRedemption.objects.all().delete()
        Reward.objects.all().delete()
        Communication.objects.all().delete()
        PartnerOnboarding.objects.all().delete()
        PartnerUser.objects.all().delete()
        PartnerProgress.objects.all().delete()
        TokenBlacklist.objects.all().delete()
        LoginAttempt.objects.all().delete()
        Partner.objects.all().delete()

        def hpw(p):
            return bcrypt.hashpw(p.encode(), bcrypt.gensalt()).decode()

        # Admin
        Partner.objects.create(
            id="admin-001", company_name="aconso", email="admin@aconso.com",
            password_hash=hpw("admin123"), contact_name="Jessy Admin",
            role="admin", status="activo", commission_rate=0, training_track="",
        )

        # Partners (id, name, email, contact, status, rate, track, why, sales)
        partners_data = [
            ("partner-001", "Flexso", "flexso@demo.com", "contacto@flexso.com", "activo", 12.0, "ventas",
             "Revendedores especializados en integraciones SAP", "Red de clientes enterprise en sector financiero y manufacturero"),
            ("partner-002", "Deloitte Belgium", "deloitte@demo.com", "partner@deloitte.be", "activo", 15.0, "tecnica",
             "Consultora global con práctica de RRHH digital", "Proyectos de transformación digital HR en grandes empresas"),
            ("partner-003", "Entago AG", "entago@demo.com", "info@entago.ch", "activo", 10.0, "tecnica",
             "Especialistas en implementación de software HR", "Clientes en sector salud y educación en Suiza"),
            ("partner-004", "smahrt", "smahrt@demo.com", "hello@smahrt.de", "activo", 11.0, "ventas",
             "Fintech con enfoque en automatización de procesos", "Startups y PYMES en Alemania"),
            ("partner-005", "p78 (projekt0708)", "p78@demo.com", "p78@projekt0708.de", "en_revision", 10.0, "ventas", "", ""),
            ("partner-006", "CloudBase Partners", "cloudbase@demo.com", "sales@cloudbase.io", "solicitado", 10.0, "", "", ""),
        ]
        for pid, name, email, contact, st, rate, track, why, sales in partners_data:
            Partner.objects.create(
                id=pid, company_name=name, email=email, password_hash=hpw("admin123"),
                contact_name=contact, role="socio", status=st, commission_rate=rate,
                training_track=track, phone="+49 89 123456", tax_id=f"DE{pid[-3:]}",
                why_partner=why, sales_approach=sales,
            )

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

        # Assignments: course-006 (compliance) assigned to smahrt with deadline
        CourseAssignment.objects.create(id="asg-001", course_id="course-006", partner_id="partner-004", deadline="2026-09-30")

        # Ratings
        CourseRating.objects.create(id="rate-001", course_id="course-001", partner_id="partner-001", stars=5, comment="Excellent introduction")
        CourseRating.objects.create(id="rate-002", course_id="course-001", partner_id="partner-002", stars=4, comment="Very clear material")

        # Deals
        deals_data = [
            ("deal-001", "partner-001", "Deutsche Bank AG", "FinTech", 50000, "necesita_acceso", "Contacto con CTO, interesados en Digital Personnel File"),
            ("deal-002", "partner-001", "Continental AG", "Manufacturing", 35000, "en_implementacion", "Ya tienen SAP, quieren integrar aconso"),
            ("deal-003", "partner-001", "Siemens Healthineers", "Healthcare", 75000, "acceso_otorgado", "Proyecto piloto aprobado"),
            ("deal-004", "partner-002", "BMW Group", "Automotive", 120000, "completado", "Implementación completa exitosa"),
            ("deal-005", "partner-002", "Allianz SE", "Insurance", 95000, "necesita_acceso", "Reunión programada para demo"),
            ("deal-006", "partner-003", "Nokia Networks", "Telecom", 40000, "en_revision", "En espera de aprobación interna"),
            ("deal-007", "partner-004", "dm-drogerie markt", "Retail", 28000, "completado", "Contrato firmado, implementación completada"),
            ("deal-008", "partner-004", "Lufthansa Systems", "Aviation", 62000, "acceso_otorgado", "En proceso de implementación"),
        ]
        deals = {}
        for did, pid, client, ind, val, st, notes in deals_data:
            d = Deal(id=did, partner_id=pid, client_name=client, client_industry=ind,
                     estimated_value=val, status=st, notes=notes)
            d.save()
            deals[did] = d

        # Commissions
        Commission.objects.create(id="comm-001", partner_id="partner-002", deal=deals["deal-004"], amount=18000, status="pagada")
        Commission.objects.create(id="comm-002", partner_id="partner-004", deal=deals["deal-007"], amount=3080, status="pagada")
        Commission.objects.create(id="comm-003", partner_id="partner-001", deal=deals["deal-003"], amount=7500, status="pendiente")
        Commission.objects.create(id="comm-004", partner_id="partner-004", deal=deals["deal-008"], amount=6820, status="pendiente")

        # Opportunities (Pipeline — HubSpot-aligned fields)
        # (id, partner, company, size, products, mode, stage, prob, amount, one_time, quarter, close, owner, cm, type, forecast, source, next_steps, notes, loss)
        opps_data = [
            ("opp-001", "partner-001", "Banco Santander", ">5000", ["dpa"], "cloud", "negociacion", 75, 85000, 0, "T3/2026", "2026-08-15", "Carlos Ruiz", "Jessy Admin", "ampliacion", "best_case", "generada_partner", "Revisar propuesta con procurement", "Negociando renovación", ""),
            ("opp-002", "partner-001", "Telefonica España", ">5000", ["dpa", "hr_doc_box"], "cloud", "cualificada", 30, 42000, 5000, "T4/2026", "2026-09-01", "Carlos Ruiz", "Jessy Admin", "nuevo", "pipeline", "asignada_aconso", "Programar demo con RRHH", "Reunión inicial agendada", ""),
            ("opp-003", "partner-001", "BBVA Digital", ">5000", ["insights"], "cloud", "propuesta_enviada", 55, 120000, 0, "T3/2026", "2026-07-30", "Carlos Ruiz", "Jessy Admin", "cross_sell", "commit", "generada_partner", "Seguimiento con CFO", "Propuesta enviada, en revisión", ""),
            ("opp-004", "partner-002", "ING Belgium", ">5000", ["dpa"], "on_premises", "propuesta_enviada", 55, 95000, 12000, "T3/2026", "2026-07-28", "Sofie Vandenberg", "Jessy Admin", "nuevo", "best_case", "recomendacion_cliente", "Esperando aprobación legal", "Propuesta enviada", ""),
            ("opp-005", "partner-002", "KBC Group", ">5000", ["scan_services"], "cloud", "registrada", 10, 68000, 15000, "T4/2026", "2026-10-15", "Sofie Vandenberg", "Jessy Admin", "nuevo", "pipeline", "generada_partner", "Primera llamada de descubrimiento", "Contacto inicial via LinkedIn", ""),
            ("opp-006", "partner-002", "Belfius Bank", ">5000", ["hr_doc_box"], "cloud", "cualificada", 30, 110000, 0, "T3/2026", "2026-08-20", "Sofie Vandenberg", "Jessy Admin", "nuevo", "best_case", "asignada_aconso", "Preparar demo técnica", "Demo programada", ""),
            ("opp-007", "partner-004", "Allianz Germany", ">5000", ["dpa", "insights"], "cloud", "negociacion", 75, 75000, 0, "T4/2026", "2026-08-05", "Markus Schmidt", "Jessy Admin", "ampliacion", "commit", "generada_partner", "Cerrar términos de contrato", "Negociando términos", ""),
            ("opp-008", "partner-004", "Deutsche Bank", ">5000", ["dpa"], "cloud", "cualificada", 30, 55000, 0, "T4/2026", "2026-09-10", "Markus Schmidt", "Jessy Admin", "nuevo", "pipeline", "generada_partner", "Calificar requisitos de seguridad", "Calificando requisitos", ""),
            ("opp-009", "partner-001", "Repsol", "1000-5000", ["dpa", "hr_doc_box", "scan_services"], "cloud", "ganada", 100, 38000, 8000, "T3/2026", "2026-07-15", "Carlos Ruiz", "Jessy Admin", "nuevo", "commit", "recomendacion_cliente", "Onboarding del proyecto", "Contrato firmado", ""),
            ("opp-010", "partner-002", "Ageas Insurance", "1000-5000", ["dpa"], "cloud", "perdida", 0, 45000, 0, "T3/2026", "2026-07-10", "Sofie Vandenberg", "Jessy Admin", "nuevo", "omitted", "asignada_aconso", "", "Eligió otra solución", "competencia"),
        ]
        for oid, pid, company, size, products, mode, stage, prob, amount, one_time, qtr, cd, owner, cm, otype, forecast, source, next_steps, notes, loss in opps_data:
            o = Opportunity(
                id=oid, partner_id=pid, company_name=company, company_size=size,
                products=products, operation_mode=mode, stage=stage, probability=prob,
                amount=amount, scan_one_time_fee=one_time, delivery_quarter=qtr,
                close_date=cd, deal_owner=owner, channel_manager=cm,
                opportunity_type=otype, forecast_category=forecast, lead_source=source,
                next_steps=next_steps, notes=notes, loss_reason=loss,
                protection_end_date="2026-12-31",
            )
            o.save()

        now = timezone.now()

        # ─── Partner Progress (LMS demo data) ─────────────
        PartnerProgress.objects.create(id="prog-001", partner_id="partner-001", course_id="course-001",
                                       completed=True, score=92, progress_pct=100, completed_at=now)
        PartnerProgress.objects.create(id="prog-002", partner_id="partner-001", course_id="course-007",
                                       completed=True, score=85, progress_pct=100, completed_at=now)
        PartnerProgress.objects.create(id="prog-003", partner_id="partner-002", course_id="course-001",
                                       completed=True, score=88, progress_pct=100, completed_at=now)
        PartnerProgress.objects.create(id="prog-004", partner_id="partner-003", course_id="course-001",
                                       completed=False, score=None, progress_pct=40, completed_videos=["vid-001"])

        # ─── Team members (PartnerUser) ───────────────────
        PartnerUser.objects.create(id="pu-001", partner_id="partner-001", email="carlos@flexso.com",
                                   password_hash=hpw("admin123"), contact_name="Carlos Ruiz", role="owner", status="activo")
        PartnerUser.objects.create(id="pu-002", partner_id="partner-001", email="lucia@flexso.com",
                                   password_hash=hpw("admin123"), contact_name="Lucia Gomez", role="member", status="activo")
        PartnerUser.objects.create(id="pu-003", partner_id="partner-002", email="sofie@deloitte.be",
                                   password_hash=hpw("admin123"), contact_name="Sofie Vandenberg", role="admin", status="activo")

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

        # ─── Points & transactions ────────────────────────
        PointTransaction.objects.create(id="pt-001", partner_id="partner-001", amount=100,
                                        reason="onboarding", note="Onboarding completado", created_at=now)
        PointTransaction.objects.create(id="pt-002", partner_id="partner-001", amount=250,
                                        reason="deal_ganado", note="Oportunidad Repsol ganada",
                                        source_type="opportunity", source_id="opp-009", created_at=now)
        PointTransaction.objects.create(id="pt-003", partner_id="partner-001", amount=150,
                                        reason="certificacion", note="Certificación aconso Fundamentals",
                                        created_at=now)
        PointTransaction.objects.create(id="pt-004", partner_id="partner-002", amount=100,
                                        reason="onboarding", note="Onboarding completado", created_at=now)
        PointTransaction.objects.create(id="pt-005", partner_id="partner-002", amount=250,
                                        reason="deal_ganado", note="Oportunidad BMW ganada",
                                        source_type="opportunity", source_id="opp-004", created_at=now)

        # ─── MDF requests (demo) ──────────────────────────
        MdfRequest.objects.create(id="mdf-001", partner_id="partner-001", title="Webinar sobre Digital Personnel File",
                                  campaign_type="campaña_online", description="Webinar de 45 minutos para el sector financiero",
                                  requested_amount=2000, approved_amount=1500, status="aprobado",
                                  start_date="2026-09-01", end_date="2026-09-30")
        MdfRequest.objects.create(id="mdf-002", partner_id="partner-001", title="Stand en HR Summit Madrid",
                                  campaign_type="trade_show", description="Stand conjunto en el HR Summit",
                                  requested_amount=4500, approved_amount=4500, status="reportado",
                                  start_date="2026-06-10", end_date="2026-06-12",
                                  actual_spend=4380, report_notes="Lead stand generó 12 oportunidades",
                                  reported_at=now)
        MdfRequest.objects.create(id="mdf-003", partner_id="partner-002", title="Campaña LinkedIn Q3",
                                  campaign_type="campaña_online", description="Campaña de contenidos en LinkedIn",
                                  requested_amount=1800, status="en_revision", start_date="2026-08-01")

        # ─── Channel conflicts (demo) ─────────────────────
        ChannelConflict.objects.create(
            id="conflict-001", company_name="Telefonica España", opportunity_id="opp-002",
            conflicting_opportunity_id=None, reporter_id="partner-002", status="abierto",
            notes="Deloitte reporta cobertura del mismo cliente", created_at=now)
        ChannelConflict.objects.create(
            id="conflict-002", company_name="KBC Group", opportunity_id="opp-005",
            conflicting_opportunity_id=None, reporter_id="partner-001", status="resuelto",
            notes="Smahrt reporta cobertura del mismo cliente",
            resolution="Se asigna a Deloitte por registro previo",
            winner_opportunity_id="opp-005", resolved_at=now, created_at=now)

        # ─── Communications (demo) ────────────────────────
        comm = Communication.objects.create(
            id="comm-001", subject="Bienvenido al programa de partners 2026",
            body="Estamos encantados de empezar un nuevo año juntos. Revisa el nuevo catálogo de recompensas, "
                 "tu plan de negocio y el calendario de formaciones.",
            channel="in_app", audience="todos", sent_by_id="admin-001", created_at=now)
        for p in Partner.objects.filter(status="activo"):
            CommunicationRecipient.objects.create(
                id=f"rec-{p.id}", communication=comm, partner=p,
                read=p.id in ("partner-001", "partner-002"), read_at=now if p.id in ("partner-001", "partner-002") else None)

        # ─── Points balance (after seeding transactions) ──
        for p in Partner.objects.filter(role="socio"):
            earned = p.point_transactions.filter(amount__gt=0).aggregate(s=Sum("amount"))["s"] or 0
            spent = p.point_transactions.filter(amount__lt=0).aggregate(s=Sum("amount"))["s"] or 0
            p.points_earned = earned
            p.points_balance = earned + spent
            p.save(update_fields=["points_earned", "points_balance"])

        self.stdout.write(self.style.SUCCESS("Database seeded successfully!"))