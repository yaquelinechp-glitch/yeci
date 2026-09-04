import uuid
from django.db import models


def gen_uuid():
    return uuid.uuid4().hex


class Partner(models.Model):
    ROLE_CHOICES = [("admin", "Admin"), ("socio", "Socio")]
    STATUS_CHOICES = [
        ("solicitado", "Solicitado"),
        ("en_revision", "En Revision"),
        ("aprobado", "Aprobado"),
        ("contrato_pendiente", "Contrato Pendiente"),
        ("activo", "Activo"),
        ("inactivo", "Inactivo"),
    ]

    TRACK_CHOICES = [
        ("ventas", "Ventas"),
        ("tecnica", "Técnica"),
        ("cumplimiento", "Cumplimiento"),
        ("", "Sin asignar"),
    ]

    id = models.CharField(max_length=100, primary_key=True, default=gen_uuid)
    company_name = models.CharField(max_length=200)
    email = models.EmailField(unique=True)
    password_hash = models.CharField(max_length=200, blank=True, default="")
    provider = models.CharField(max_length=20, default="local")  # "local" or "google"
    google_id = models.CharField(max_length=100, blank=True, default="")
    phone = models.CharField(max_length=50, default="")
    tax_id = models.CharField(max_length=50, default="")
    country = models.CharField(max_length=100, default="", blank=True)
    contact_name = models.CharField(max_length=200, default="")
    first_name = models.CharField(max_length=200, default="")
    last_name = models.CharField(max_length=200, default="")
    username = models.CharField(max_length=100, default="")
    avatar = models.TextField(blank=True, default="")
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default="socio")
    training_track = models.CharField(max_length=20, choices=TRACK_CHOICES, default="", blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="solicitado")
    certification_date = models.DateTimeField(null=True, blank=True)
    commission_rate = models.FloatField(default=10.0)
    mdf_budget_year = models.FloatField(default=5000.0)
    points_balance = models.IntegerField(default=0)
    points_earned = models.IntegerField(default=0)
    notes = models.TextField(default="")
    why_partner = models.TextField(default="")
    sales_approach = models.TextField(default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]


class Course(models.Model):
    TRACK_CHOICES = [
        ("ventas", "Ventas"),
        ("tecnica", "Técnica"),
        ("cumplimiento", "Cumplimiento"),
        ("todas", "Todas"),
    ]
    STATUS_CHOICES = [
        ("borrador", "Borrador"),
        ("publicado", "Publicado"),
        ("archivado", "Archivado"),
    ]

    id = models.CharField(max_length=100, primary_key=True, default=gen_uuid)
    title = models.JSONField(default=dict)
    description = models.JSONField(default=dict)
    thumbnail_url = models.CharField(max_length=500, default="")
    category = models.CharField(max_length=100, default="")
    level = models.CharField(max_length=50, default="beginner")
    track = models.CharField(max_length=20, choices=TRACK_CHOICES, default="todas")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="publicado")
    related_products = models.JSONField(default=list, blank=True)
    pass_mark = models.IntegerField(default=80)
    validity_months = models.IntegerField(default=12)
    prerequisite_course_id = models.CharField(max_length=100, blank=True, default="")
    max_quiz_attempts = models.IntegerField(default=3)
    quiz_questions_count = models.IntegerField(default=8)
    exam_questions_count = models.IntegerField(default=5)
    max_quiz_attempts = models.IntegerField(default=3)
    materials = models.JSONField(default=list, blank=True)
    phase_config = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]


class CourseVideo(models.Model):
    id = models.CharField(max_length=100, primary_key=True, default=gen_uuid)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="videos")
    title = models.JSONField(default=dict)
    description = models.JSONField(default=dict)
    video_url = models.CharField(max_length=500)
    duration_seconds = models.IntegerField(default=0)
    video_order = models.IntegerField(default=0)
    phase = models.IntegerField(default=1)
    day = models.IntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["phase", "day", "video_order"]


class QuizQuestion(models.Model):
    TYPE_CHOICES = [
        ("single", "Opción única"),
        ("multiple", "Opción múltiple"),
        ("true_false", "Verdadero/Falso"),
        ("fill", "Rellenar"),
    ]

    id = models.CharField(max_length=100, primary_key=True, default=gen_uuid)
    video = models.ForeignKey(CourseVideo, on_delete=models.CASCADE, related_name="quiz_questions")
    question = models.JSONField(default=dict)
    options = models.JSONField(default=list)
    correct_index = models.IntegerField(default=0)
    correct_indices = models.JSONField(default=list, blank=True)
    fill_answer = models.JSONField(default=dict, blank=True)
    question_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default="single")
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order"]


class QuizBankQuestion(models.Model):
    TYPE_CHOICES = QuizQuestion.TYPE_CHOICES

    id = models.CharField(max_length=100, primary_key=True, default=gen_uuid)
    question = models.JSONField(default=dict)
    options = models.JSONField(default=list)
    correct_index = models.IntegerField(default=0)
    correct_indices = models.JSONField(default=list, blank=True)
    fill_answer = models.JSONField(default=dict, blank=True)
    question_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default="single")
    track = models.CharField(max_length=20, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class CourseAssignment(models.Model):
    id = models.CharField(max_length=100, primary_key=True, default=gen_uuid)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="assignments")
    partner = models.ForeignKey(Partner, on_delete=models.CASCADE, related_name="course_assignments")
    deadline = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("course", "partner")


class CourseExamQuestion(models.Model):
    TYPE_CHOICES = QuizQuestion.TYPE_CHOICES

    id = models.CharField(max_length=100, primary_key=True, default=gen_uuid)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="exam_questions_custom")
    question = models.JSONField(default=dict)
    options = models.JSONField(default=list)
    correct_index = models.IntegerField(default=0)
    correct_indices = models.JSONField(default=list, blank=True)
    question_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default="single")
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order"]


class CourseRating(models.Model):
    id = models.CharField(max_length=100, primary_key=True, default=gen_uuid)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="ratings")
    partner = models.ForeignKey(Partner, on_delete=models.CASCADE, related_name="course_ratings")
    stars = models.IntegerField(default=5)
    comment = models.TextField(default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("course", "partner")


class QuizAttempt(models.Model):
    id = models.CharField(max_length=100, primary_key=True, default=gen_uuid)
    partner = models.ForeignKey(Partner, on_delete=models.CASCADE, related_name="quiz_attempts")
    video = models.ForeignKey(CourseVideo, on_delete=models.CASCADE, related_name="quiz_attempts")
    question = models.ForeignKey(QuizQuestion, on_delete=models.CASCADE)
    selected_index = models.IntegerField(default=-1)
    answer_data = models.JSONField(default=dict, blank=True)
    is_correct = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)


class PartnerProgress(models.Model):
    id = models.CharField(max_length=100, primary_key=True, default=gen_uuid)
    partner = models.ForeignKey(Partner, on_delete=models.CASCADE, related_name="progress_entries")
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="progress_entries")
    completed = models.BooleanField(default=False)
    score = models.IntegerField(null=True, blank=True)
    progress_pct = models.IntegerField(default=0)
    completed_videos = models.JSONField(default=list, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("partner", "course")


class Deal(models.Model):
    id = models.CharField(max_length=100, primary_key=True, default=gen_uuid)
    partner = models.ForeignKey(Partner, on_delete=models.CASCADE, related_name="deals")
    client_name = models.CharField(max_length=200)
    client_industry = models.CharField(max_length=100, default="")
    estimated_value = models.FloatField(default=0.0)
    status = models.CharField(max_length=50, default="necesita_acceso")
    notes = models.TextField(default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]


class Commission(models.Model):
    id = models.CharField(max_length=100, primary_key=True, default=gen_uuid)
    partner = models.ForeignKey(Partner, on_delete=models.CASCADE, related_name="commissions")
    deal = models.OneToOneField(Deal, on_delete=models.CASCADE, related_name="commission")
    amount = models.FloatField(default=0.0)
    status = models.CharField(max_length=20, default="pendiente")
    paid_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class TokenBlacklist(models.Model):
    jti = models.CharField(max_length=255, unique=True)
    user = models.ForeignKey(Partner, on_delete=models.CASCADE, related_name="blacklisted_tokens")
    created_at = models.DateTimeField(auto_now_add=True)


class LoginAttempt(models.Model):
    ip_address = models.CharField(max_length=45, db_index=True)
    attempted_at = models.DateTimeField(auto_now_add=True)
    success = models.BooleanField(default=False)


class Opportunity(models.Model):
    STAGE_CHOICES = [
        ("registrada", "Registrada"),
        ("cualificada", "Cualificada"),
        ("propuesta_enviada", "Propuesta enviada"),
        ("negociacion", "Negociación"),
        ("ganada", "Ganada"),
        ("perdida", "Perdida"),
    ]
    STAGE_PROBABILITY = {
        "registrada": 10,
        "cualificada": 30,
        "propuesta_enviada": 55,
        "negociacion": 75,
        "ganada": 100,
        "perdida": 0,
    }
    STAGE_ORDER = {
        "registrada": 0,
        "cualificada": 1,
        "propuesta_enviada": 2,
        "negociacion": 3,
        "ganada": 4,
        "perdida": 5,
    }
    COMPANY_SIZE_CHOICES = [
        ("<250", "Menos de 250"),
        ("250-1000", "250 - 1.000"),
        ("1000-5000", "1.000 - 5.000"),
        (">5000", "Más de 5.000"),
    ]
    PRODUCT_CHOICES = [
        ("dpa", "Digitale Personalakte"),
        ("hr_doc_box", "HR Document Box"),
        ("scan_services", "Scan Services"),
        ("insights", "aconso Insights"),
    ]
    OPERATION_MODE_CHOICES = [
        ("cloud", "Cloud"),
        ("on_premises", "On-Premises"),
    ]
    OPPORTUNITY_TYPE_CHOICES = [
        ("nuevo", "Nuevo negocio"),
        ("ampliacion", "Ampliación"),
        ("cross_sell", "Cross-Sell"),
    ]
    FORECAST_CHOICES = [
        ("commit", "Commit"),
        ("best_case", "Best Case"),
        ("pipeline", "Pipeline"),
        ("omitted", "Omitted"),
    ]
    LEAD_SOURCE_CHOICES = [
        ("generada_partner", "Generada por el partner"),
        ("asignada_aconso", "Asignada por aconso"),
        ("recomendacion_cliente", "Recomendación de cliente"),
    ]
    LOSS_REASON_CHOICES = [
        ("precio", "Precio"),
        ("competencia", "Competencia"),
        ("sin_presupuesto", "Sin presupuesto"),
        ("proyecto_aplazado", "Proyecto aplazado"),
        ("otro", "Otro"),
    ]
    CURRENCY_CHOICES = [
        ("usd", "Dólar (USD)"),
        ("eur", "Euro (EUR)"),
        ("chf", "Franco suizo (CHF)"),
        ("otro", "Otra moneda"),
    ]

    id = models.CharField(max_length=100, primary_key=True, default=gen_uuid)
    partner = models.ForeignKey(Partner, on_delete=models.CASCADE, related_name="opportunities")
    name = models.CharField(max_length=300, default="")
    company_name = models.CharField(max_length=200, default="")
    company_size = models.CharField(max_length=30, default="<250")
    products = models.JSONField(default=list, blank=True)
    operation_mode = models.CharField(max_length=20, choices=OPERATION_MODE_CHOICES, default="cloud")
    stage = models.CharField(max_length=30, choices=STAGE_CHOICES, default="registrada")
    probability = models.IntegerField(default=10)
    amount = models.FloatField(default=0.0)
    scan_one_time_fee = models.FloatField(default=0.0)
    currency = models.CharField(max_length=10, choices=CURRENCY_CHOICES, default="usd")
    custom_currency = models.CharField(max_length=20, blank=True, default="", help_text="Nombre de la moneda cuando currency='otro'")
    delivery_quarter = models.CharField(max_length=10, blank=True, default="")
    close_date = models.DateField(null=True, blank=True)
    deal_owner = models.CharField(max_length=200, default="")
    channel_manager = models.CharField(max_length=200, default="")
    opportunity_type = models.CharField(max_length=20, choices=OPPORTUNITY_TYPE_CHOICES, default="nuevo")
    forecast_category = models.CharField(max_length=20, choices=FORECAST_CHOICES, blank=True, null=True)
    lead_source = models.CharField(max_length=30, choices=LEAD_SOURCE_CHOICES, default="generada_partner")
    conflict_indicator = models.BooleanField(default=False)
    protection_end_date = models.DateField(null=True, blank=True)
    next_steps = models.TextField(default="")
    loss_reason = models.CharField(max_length=30, choices=LOSS_REASON_CHOICES, blank=True, default="")
    notes = models.TextField(default="")
    last_activity = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def save(self, *args, **kwargs):
        if not self.name:
            product = " · ".join(self._product_label(p) for p in (self.products or [])[:2]) or "Producto"
            self.name = f"{self.company_name} – {product} – {self.delivery_quarter or 'TBD'}"
        super().save(*args, **kwargs)

    def _product_label(self, key):
        try:
            p = Product.objects.get(key=key)
            nm = p.name or {}
            if isinstance(nm, dict):
                return nm.get("en") or nm.get("es") or nm.get("de") or key
            return nm or key
        except Product.DoesNotExist:
            return dict(self.PRODUCT_CHOICES).get(key, key)


class Product(models.Model):
    """Product catalog managed by admins; referenced by Opportunity.products keys."""
    key = models.CharField(max_length=60, primary_key=True, help_text="Identificador único (slug), ej. dpa")
    name = models.JSONField(default=dict, blank=True, help_text="Traducciones { en, es, de }")
    description = models.JSONField(default=dict, blank=True, help_text="Traducciones { en, es, de }")
    price_usd = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    price_eur = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    price_chf = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    price_otro = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    custom_currency = models.CharField(max_length=20, blank=True, default="", help_text="Nombre de la moneda para price_otro")
    category = models.CharField(max_length=60, default="core")
    active = models.BooleanField(default=True)
    sort_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["sort_order", "key"]

    def __str__(self):
        nm = self.name or {}
        return self.key if not isinstance(nm, dict) else (nm.get("en") or self.key)


class OpportunityEvent(models.Model):
    id = models.CharField(max_length=100, primary_key=True, default=gen_uuid)
    opportunity = models.ForeignKey(Opportunity, on_delete=models.CASCADE, related_name="events")
    from_stage = models.CharField(max_length=30, blank=True, default="")
    to_stage = models.CharField(max_length=30)
    field_changes = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class TrainingResult(models.Model):
    id = models.CharField(max_length=100, primary_key=True, default=gen_uuid)
    partner = models.ForeignKey(Partner, on_delete=models.CASCADE, related_name="training_results")
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="training_results")
    attempt_number = models.IntegerField(default=1)
    score = models.IntegerField(default=0)
    passed = models.BooleanField(default=False)
    certificate_url = models.CharField(max_length=500, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class Certification(models.Model):
    LEVEL_CHOICES = [
        ("associate", "Associate"),
        ("professional", "Professional"),
        ("expert", "Expert"),
    ]
    STATUS_CHOICES = [
        ("valid", "Válido"),
        ("pending_update", "Válido, actualización pendiente"),
        ("expired", "Caducado"),
    ]

    id = models.CharField(max_length=100, primary_key=True, default=gen_uuid)
    partner = models.ForeignKey(Partner, on_delete=models.CASCADE, related_name="certifications")
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="valid")
    certified_at = models.DateTimeField(auto_now_add=True)
    valid_until = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-certified_at"]


class PartnerOnboarding(models.Model):
    id = models.CharField(max_length=100, primary_key=True, default=gen_uuid)
    partner = models.OneToOneField(Partner, on_delete=models.CASCADE, related_name="onboarding")
    manual_steps = models.JSONField(default=list, blank=True)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)


class PartnerUser(models.Model):
    ROLE_CHOICES = [
        ("owner", "Owner"),
        ("admin", "User Admin"),
        ("member", "Member"),
    ]
    STATUS_CHOICES = [
        ("invitado", "Invitado"),
        ("activo", "Activo"),
        ("desactivado", "Desactivado"),
    ]

    id = models.CharField(max_length=100, primary_key=True, default=gen_uuid)
    partner = models.ForeignKey(Partner, on_delete=models.CASCADE, related_name="users")
    email = models.EmailField(unique=True)
    password_hash = models.CharField(max_length=200, blank=True, default="")
    contact_name = models.CharField(max_length=200, default="")
    first_name = models.CharField(max_length=200, default="")
    last_name = models.CharField(max_length=200, default="")
    username = models.CharField(max_length=100, default="")
    avatar = models.TextField(blank=True, default="")
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default="member")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="invitado")
    invite_token = models.CharField(max_length=100, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]


class MdfRequest(models.Model):
    CAMPAIGN_TYPES = [
        ("evento", "Evento"),
        ("campaña_online", "Campaña online"),
        ("trade_show", "Trade show / Feria"),
        ("contenido", "Creación de contenido"),
        ("otro", "Otro"),
    ]
    STATUS_CHOICES = [
        ("solicitado", "Solicitado"),
        ("en_revision", "En revisión"),
        ("aprobado", "Aprobado"),
        ("rechazado", "Rechazado"),
        ("reportado", "Reportado"),
        ("cerrado", "Cerrado"),
    ]

    id = models.CharField(max_length=100, primary_key=True, default=gen_uuid)
    partner = models.ForeignKey(Partner, on_delete=models.CASCADE, related_name="mdf_requests")
    title = models.CharField(max_length=300)
    campaign_type = models.CharField(max_length=30, choices=CAMPAIGN_TYPES, default="evento")
    description = models.TextField(default="")
    requested_amount = models.FloatField(default=0.0)
    approved_amount = models.FloatField(null=True, blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="solicitado")
    approval_notes = models.TextField(default="")
    actual_spend = models.FloatField(null=True, blank=True)
    report_notes = models.TextField(default="")
    reported_at = models.DateTimeField(null=True, blank=True)
    closed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]


class Reward(models.Model):
    CATEGORY_CHOICES = [
        ("merchandising", "Merchandising"),
        ("evento", "Evento"),
        ("formacion", "Formación"),
        ("descuento", "Descuento"),
        ("otro", "Otro"),
    ]

    id = models.CharField(max_length=100, primary_key=True, default=gen_uuid)
    name = models.JSONField(default=dict)
    description = models.JSONField(default=dict)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default="merchandising")
    points_cost = models.IntegerField(default=100)
    stock = models.IntegerField(null=True, blank=True)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["points_cost", "created_at"]


class RewardRedemption(models.Model):
    STATUS_CHOICES = [
        ("solicitado", "Solicitado"),
        ("entregado", "Entregado"),
        ("rechazado", "Rechazado"),
    ]

    id = models.CharField(max_length=100, primary_key=True, default=gen_uuid)
    partner = models.ForeignKey(Partner, on_delete=models.CASCADE, related_name="reward_redemptions")
    reward = models.ForeignKey(Reward, on_delete=models.PROTECT, related_name="redemptions")
    points_spent = models.IntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="solicitado")
    admin_notes = models.TextField(default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]


class PointTransaction(models.Model):
    REASON_CHOICES = [
        ("onboarding", "Onboarding completado"),
        ("deal_ganado", "Oportunidad ganada"),
        ("certificacion", "Certificación conseguida"),
        ("mdf_reportado", "MDF reportado"),
        ("manual", "Ajuste manual"),
        ("canje", "Canje de recompensa"),
    ]

    id = models.CharField(max_length=100, primary_key=True, default=gen_uuid)
    partner = models.ForeignKey(Partner, on_delete=models.CASCADE, related_name="point_transactions")
    amount = models.IntegerField(default=0)
    reason = models.CharField(max_length=30, choices=REASON_CHOICES, default="manual")
    note = models.TextField(default="")
    source_type = models.CharField(max_length=30, blank=True, default="")
    source_id = models.CharField(max_length=100, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class ChannelConflict(models.Model):
    STATUS_CHOICES = [
        ("abierto", "Abierto"),
        ("en_resolucion", "En resolución"),
        ("resuelto", "Resuelto"),
        ("cerrado", "Cerrado sin resolución"),
    ]

    id = models.CharField(max_length=100, primary_key=True, default=gen_uuid)
    company_name = models.CharField(max_length=200, db_index=True)
    opportunity = models.ForeignKey(
        Opportunity, on_delete=models.CASCADE, related_name="conflicts_primary", null=True, blank=True
    )
    conflicting_opportunity = models.ForeignKey(
        Opportunity, on_delete=models.CASCADE, related_name="conflicts_secondary", null=True, blank=True
    )
    reporter = models.ForeignKey(Partner, on_delete=models.CASCADE, related_name="reported_conflicts")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="abierto")
    notes = models.TextField(default="")
    resolution = models.TextField(default="")
    winner_opportunity = models.ForeignKey(
        Opportunity, on_delete=models.SET_NULL, related_name="conflicts_won", null=True, blank=True
    )
    resolved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]


class Communication(models.Model):
    CHANNEL_CHOICES = [
        ("in_app", "In app"),
        ("email", "Email"),
    ]
    AUDIENCE_CHOICES = [
        ("todos", "Todos los partners"),
        ("seleccion", "Partners seleccionados"),
    ]

    id = models.CharField(max_length=100, primary_key=True, default=gen_uuid)
    subject = models.CharField(max_length=200)
    body = models.TextField()
    channel = models.CharField(max_length=20, choices=CHANNEL_CHOICES, default="in_app")
    audience = models.CharField(max_length=20, choices=AUDIENCE_CHOICES, default="todos")
    target_partners = models.ManyToManyField(Partner, related_name="targeted_communications", blank=True)
    sent_by = models.ForeignKey(Partner, null=True, blank=True, on_delete=models.SET_NULL, related_name="sent_communications")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]


class CommunicationRecipient(models.Model):
    id = models.CharField(max_length=100, primary_key=True, default=gen_uuid)
    communication = models.ForeignKey(Communication, on_delete=models.CASCADE, related_name="recipients")
    partner = models.ForeignKey(Partner, on_delete=models.CASCADE, related_name="communications")
    read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("communication", "partner")
        ordering = ["-created_at"]


class Notification(models.Model):
    TYPE_CHOICES = [
        ("anuncio", "Anuncio"),
        ("curso_nuevo", "Curso nuevo"),
        ("curso_asignado", "Curso asignado"),
        ("plan_negocio", "Plan de negocio"),
        ("conflicto", "Conflicto"),
        ("cuenta", "Cuenta"),
        ("deal", "Deal"),
        ("comunicacion", "Comunicación"),
    ]

    id = models.CharField(max_length=100, primary_key=True, default=gen_uuid)
    partner = models.ForeignKey(Partner, on_delete=models.CASCADE, related_name="notifications")
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default="anuncio")
    title = models.JSONField(default=dict, blank=True, help_text="Traducciones { en, es, de }")
    message = models.JSONField(default=dict, blank=True, help_text="Traducciones { en, es, de }")
    link = models.CharField(max_length=200, default="", blank=True)
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["partner", "read"]),
        ]

    def __str__(self):
        return f"{self.partner_id} {self.type} {self.id}"


class VideoWatchEvent(models.Model):
    id = models.CharField(max_length=100, primary_key=True, default=gen_uuid)
    partner = models.ForeignKey(Partner, on_delete=models.CASCADE, related_name="watch_events")
    video = models.ForeignKey(CourseVideo, on_delete=models.CASCADE, related_name="watch_events")
    watch_seconds = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("partner", "video")


class CostExportSetting(models.Model):
    """Admin-configurable fixed texts for the partner cost-exporter (Excel export of the ARR calculator)."""

    title = models.JSONField(default=dict, blank=True, help_text="Traducciones { en, es, de } - Document title")
    subtitle = models.JSONField(default=dict, blank=True, help_text="Traducciones { en, es, de } - Subtitle / intro")
    footer = models.JSONField(default=dict, blank=True, help_text="Traducciones { en, es, de } - Footer / notes")
    product_col = models.JSONField(default=dict, blank=True, help_text="Traducciones { en, es, de } - Products column header")
    annual_col = models.JSONField(default=dict, blank=True, help_text="Traducciones { en, es, de } - Annual license column header")
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return "CostExportSetting"


class VideoWatchEvent(models.Model):
    id = models.CharField(max_length=100, primary_key=True, default=gen_uuid)
    partner = models.ForeignKey(Partner, on_delete=models.CASCADE, related_name="watch_events")
    video = models.ForeignKey(CourseVideo, on_delete=models.CASCADE, related_name="watch_events")
    watch_seconds = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("partner", "video")
